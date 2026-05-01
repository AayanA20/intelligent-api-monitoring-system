import sys
import re
import traceback
from urllib.parse import unquote

import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel

# ─────────────────────────────────────────────
# Step 1: Define APITransformer placeholder
# (needed so torch.load can deserialize model)
# ─────────────────────────────────────────────
class APITransformer(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x):
        return self.input_proj(x)


# Inject into __main__
import __main__ as _real_main
_real_main.APITransformer = APITransformer
sys.modules["__main__"].APITransformer = APITransformer


# ─────────────────────────────────────────────
# Step 2: Load ML Model
# ─────────────────────────────────────────────
MODEL_PATH = "model.pt"

try:
    model = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    model.eval()
    print("✅ Model loaded successfully:", type(model))
except Exception as e:
    print("❌ Model loading failed:", e)
    raise


# ─────────────────────────────────────────────
# Step 3: Load Feature Extractor
# ─────────────────────────────────────────────
from minor_ml_models2 import ModelUtils
utils = ModelUtils()


# ─────────────────────────────────────────────
# Step 4: Strong Hybrid Detection Rules
# ─────────────────────────────────────────────
PATTERN_OVERRIDES = {
    "BLOCK": [
        # SQL Injection
        re.compile(
            r"(\bselect\b.*\bfrom\b|\bunion\b.*\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|--|#|sleep\s*\(|or\s+1=1)",
            re.IGNORECASE,
        ),

        # Path Traversal
        re.compile(
            r"(\.\./|\.\.\\|%2e%2e|etc/passwd|windows\.ini|/proc/self/environ)",
            re.IGNORECASE,
        ),

        # XSS
        re.compile(
            r"(<script|javascript:|onerror=|onload=|alert\s*\(|<iframe|document\.cookie)",
            re.IGNORECASE,
        ),

        # Command Injection
        re.compile(
            r"(;|\||&&|\$\()?\s*(ls|cat|rm|wget|curl|bash|sh|python|nc)\b",
            re.IGNORECASE,
        ),

        # Log4j / RCE
        re.compile(
            r"(\$\{jndi:|ldap://|rmi://|exec\(|system\(|passthru|/bin/sh)",
            re.IGNORECASE,
        ),
    ],

    "WARN": [
        # Security scanners
        re.compile(
            r"(sqlmap|nikto|nmap|burpsuite|masscan|dirbuster|acunetix)",
            re.IGNORECASE,
        ),

        # Suspicious encoded payloads
        re.compile(
            r"(%27|%22|%3c|%3e|%3d|%2f|base64|char\()",
            re.IGNORECASE,
        ),
    ],
}


# ─────────────────────────────────────────────
# Step 5: FastAPI App
# ─────────────────────────────────────────────
app = FastAPI()


class RequestData(BaseModel):
    method: str = "GET"
    url: str = "/"
    headers: dict = {}
    body: str = ""
    status_code: int = 200
    response_body: str = ""
    user: str = "anonymous"


# ─────────────────────────────────────────────
# Step 6: Prediction Endpoint
# ─────────────────────────────────────────────
@app.post("/predict")
def predict(req: RequestData):
    try:
        # Build attack surface
        attack_surface = unquote(
            f"{req.method} {req.url} {req.body} {req.response_body}"
        )

        ua = req.headers.get("User-Agent", "") or req.headers.get("user-agent", "")

        print(f"[predict] payload = {attack_surface[:250]}")

        # ─────────────────────────────
        # Rule Engine First (Guaranteed Detection)
        # ─────────────────────────────
        for pattern in PATTERN_OVERRIDES["BLOCK"]:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[BLOCK RULE] {pattern.pattern[:70]}")
                return {
                    "score": 0.95,
                    "label": "BLOCK",
                    "reason": "rule_match"
                }

        for pattern in PATTERN_OVERRIDES["WARN"]:
            if pattern.search(attack_surface) or pattern.search(ua):
                print(f"[WARN RULE] {pattern.pattern[:70]}")
                return {
                    "score": 0.65,
                    "label": "WARN",
                    "reason": "rule_match"
                }

        # ─────────────────────────────
        # ML Detection
        # ─────────────────────────────
        features = utils.extract_features(req.dict())
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            output = model(tensor)
            score = torch.sigmoid(output).mean().item()

        # Threshold tuning
        if score >= 0.80:
            label = "BLOCK"
        elif score >= 0.50:
            label = "WARN"
        else:
            label = "ALLOW"

        print(f"[ML] score={score:.4f} label={label}")

        return {
            "score": round(score, 4),
            "label": label,
            "reason": "ml_model"
        }

    except Exception as e:
        traceback.print_exc()
        return {
            "score": 0.0,
            "label": "ALLOW",
            "reason": str(e)
        }


# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "mode": "Hybrid AI + Rule Engine"
    }