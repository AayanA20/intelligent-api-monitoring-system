import sys
import re
import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
import traceback
from collections import defaultdict
from threading import Lock

# ── Step 1: Define APITransformer ──
class APITransformer(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x):
        return self.input_proj(x)

# ── Step 2: Inject into __main__ so pickle/torch.load can find it ──
import __main__ as _real_main
_real_main.APITransformer = APITransformer
sys.modules['__main__'].APITransformer = APITransformer

# ── Step 3: Load model ──
MODEL_PATH = "model.pt"

try:
    model = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    model.eval()
    print("✅ Model loaded successfully:", type(model))
    print(model)
except Exception as e:
    print(f"❌ Model loading failed: {e}")
    raise

# ── Step 4: Load feature extractor ──
from minor_ml_models2 import ModelUtils
utils = ModelUtils()

# ── Step 5: Per-user request counter ──────────────────────────────────────────
# Tracks how many requests each user has made so we don't score behaviorally
# until there's enough history. Prevents false positives on new users.
_user_request_counts = defaultdict(int)
_counter_lock = Lock()

MIN_REQUESTS_FOR_ML_SCORE = 10  # don't run ML model until user has 10+ requests

def increment_and_get(user: str) -> int:
    with _counter_lock:
        _user_request_counts[user] += 1
        return _user_request_counts[user]

def reset_all_counters():
    with _counter_lock:
        _user_request_counts.clear()

# ── Step 6: Attack pattern overrides ─────────────────────────────────────────
PATTERN_OVERRIDES = {
    'BLOCK': [
        re.compile(r'(;|\||\`|\$\()\s*(ls|cat|rm|wget|curl|bash|sh|python|nc)\b', re.IGNORECASE),
        re.compile(r'\.\.\/|\.\.\\|%2e%2e|etc\/passwd|windows\.ini', re.IGNORECASE),
        re.compile(r'eval\(|exec\(|system\(|\/bin\/sh|passthru', re.IGNORECASE),
        re.compile(r'\$\{|jndi:|ldap://|rmi://', re.IGNORECASE),
    ],
    'WARN': [
        re.compile(r"select\b|union\b|insert\b|drop\b|delete\b|--|sleep\(|1=1", re.IGNORECASE),
        re.compile(r'<script|javascript:|onerror=|onload=|alert\(|<iframe', re.IGNORECASE),
        re.compile(r'sqlmap|nikto|nmap|burpsuite|masscan|dirbuster', re.IGNORECASE),
    ],
}

# ── Step 7: FastAPI app ───────────────────────────────────────────────────────
app = FastAPI()

class RequestData(BaseModel):
    method:        str  = "GET"
    url:           str  = "/"
    headers:       dict = {}
    body:          str  = ""
    status_code:   int  = 200
    response_body: str  = ""
    user:          str  = "anonymous"   # ← per-user tracking

@app.post("/predict")
def predict(req: RequestData):
    try:
        from urllib.parse import unquote
        attack_surface = unquote(f"{req.url} {req.body} {req.response_body}")
        ua = req.headers.get('User-Agent', '') or req.headers.get('user-agent', '')

        print(f"[predict] user={req.user} attack_surface: {attack_surface[:200]}")

        # ── Content patterns — fire immediately on ANY request ──
        for pattern in PATTERN_OVERRIDES['BLOCK']:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[predict] BLOCK override: {pattern.pattern[:50]}")
                return {"score": 0.95, "label": "BLOCK", "reason": "content_pattern"}

        for pattern in PATTERN_OVERRIDES['WARN']:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[predict] WARN override: {pattern.pattern[:50]}")
                return {"score": 0.65, "label": "WARN", "reason": "content_pattern"}

        # ── Per-user request count ──
        count = increment_and_get(req.user)

        # Not enough history — return ALLOW immediately
        if count < MIN_REQUESTS_FOR_ML_SCORE:
            print(f"[predict] user={req.user} count={count} "
                  f"(need {MIN_REQUESTS_FOR_ML_SCORE}) → ALLOW (insufficient history)")
            return {"score": 0.0, "label": "ALLOW", "reason": "insufficient_history"}

        # ── ML model score ──
        features = utils.extract_features(req.dict())
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            output = model(tensor)
            score = torch.sigmoid(output).mean().item()

        label = (
            "BLOCK" if score > 0.8 else
            "WARN"  if score > 0.5 else
            "ALLOW"
        )
        print(f"[predict] user={req.user} count={count} ml_score={score:.4f} label={label}")
        return {"score": round(score, 4), "label": label, "reason": "ml_model"}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e), "label": "ALLOW"}

@app.get("/health")
def health():
    with _counter_lock:
        sessions = len(_user_request_counts)
    return {
        "status":       "ok",
        "user_sessions": sessions,
        "min_requests": MIN_REQUESTS_FOR_ML_SCORE,
    }

@app.post("/reset")
def reset():
    """Called when Spring Boot resets counters — clears per-user ML history too."""
    reset_all_counters()
    print("[reset] All user ML request counters cleared.")
    return {"status": "reset", "message": "All user ML sessions cleared"}