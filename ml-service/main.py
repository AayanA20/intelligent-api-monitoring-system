import sys
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

# ── Step 5: FastAPI app ──
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
        features = utils.extract_features(req.dict())
        tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0)

        print(f"[predict] input tensor shape: {tensor.shape}")
        print(f"[predict] model type: {type(model)}")

        with torch.no_grad():
            output = model(tensor)
            print(f"[predict] raw output shape: {output.shape}")
            # Model outputs 256 features — apply sigmoid + mean to get a single score
            score = torch.sigmoid(output).mean().item()

        label = (
            "BLOCK" if score > 0.8 else
            "WARN"  if score > 0.5 else
            "ALLOW"
        )
        print(f"[predict] score={score:.4f} label={label}")
        return {"score": round(score, 4), "label": label}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e), "label": "ALLOW"}

@app.get("/health")
def health():
    return {"status": "ok"}