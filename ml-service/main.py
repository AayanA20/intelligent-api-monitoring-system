import sys
import re
import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
import traceback

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

# ── Step 5: Attack pattern overrides ──
# These guarantee detection regardless of ML model score
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

# ── Step 6: FastAPI app ──
app = FastAPI()

class RequestData(BaseModel):
    method: str = "GET"
    url: str = "/"
    headers: dict = {}
    body: str = ""
    status_code: int = 200
    response_body: str = ""

@app.post("/predict")
def predict(req: RequestData):
    try:
        from urllib.parse import unquote
        attack_surface = unquote(f"{req.url} {req.body} {req.response_body}")
        ua = req.headers.get('User-Agent', '') or req.headers.get('user-agent', '')

        print(f"[predict] attack_surface: {attack_surface[:200]}")
        print(f"[predict] ua: {ua[:100]}")

        # ── Override: check explicit patterns FIRST ──
        for pattern in PATTERN_OVERRIDES['BLOCK']:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[predict] BLOCK override triggered: {pattern.pattern[:50]}")
                return {"score": 0.95, "label": "BLOCK"}

        for pattern in PATTERN_OVERRIDES['WARN']:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[predict] WARN override triggered: {pattern.pattern[:50]}")
                return {"score": 0.65, "label": "WARN"}

        # ── Fall back to ML model score ──
        features = utils.extract_features(req.dict())
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)

        print(f"[predict] input tensor shape: {tensor.shape}")
        print(f"[predict] model type: {type(model)}")

        with torch.no_grad():
            output = model(tensor)
            print(f"[predict] raw output shape: {output.shape}")
            score = torch.sigmoid(output).mean().item()

        label = (
            "BLOCK" if score > 0.8 else
            "WARN"  if score > 0.5 else
            "ALLOW"
        )
        print(f"[predict] ml score={score:.4f} label={label}")
        return {"score": round(score, 4), "label": label}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e), "label": "ALLOW"}

@app.get("/health")
def health():
    return {"status": "ok"}