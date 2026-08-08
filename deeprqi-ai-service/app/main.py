import base64
import logging

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

from .config import CLASS_NAMES, MODEL_PATH
from .explainability import EigenCAM, get_target_layer
from .rqi_engine import compute_rqi
from .schemas import PredictResponse
from .severity import compute_severity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deeprqi-ai-service")

app = FastAPI(title="DeepRQI AI Service", version="0.1.0")

# Loosened for local dev with the Node backend on a different port.
# Tighten this to your actual frontend/backend origins before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"Loading model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
cam = EigenCAM(model, get_target_layer(model))

# If MODEL_PATH is still the stock COCO checkpoint (not yet fine-tuned on
# RDD2022), class indices won't match CLASS_NAMES. Warn loudly rather than
# silently mislabeling detections.
_is_placeholder_model = model.model.nc != len(CLASS_NAMES)
if _is_placeholder_model:
    logger.warning(
        "Loaded model's class count (%s) doesn't match DeepRQI's %s trained "
        "classes -- this looks like a placeholder/COCO checkpoint, not your "
        "fine-tuned RDD2022 model. Predictions will run but damage_type "
        "labels will be meaningless until you point MODEL_PATH at your real "
        "trained weights.",
        model.model.nc, len(CLASS_NAMES),
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_path": MODEL_PATH,
        "is_placeholder_model": _is_placeholder_model,
        "num_classes_loaded": model.model.nc,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    img_h, img_w = img.shape[:2]

    results = model.predict(img, verbose=False)[0]

    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        xyxy = [float(v) for v in box.xyxy[0].tolist()]

        damage_type = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"unknown_class_{cls_id}"
        severity = compute_severity(xyxy, img_w, img_h)

        detections.append({
            "damage_type": damage_type,
            "confidence": round(conf, 4),
            "bbox": [round(v, 1) for v in xyxy],
            "severity": severity,
        })

    rqi_result = compute_rqi(detections)

    heatmap_img = cam.generate(img)
    success, buf = cv2.imencode(".png", heatmap_img)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode heatmap image.")
    heatmap_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    return {
        "detections": detections,
        "rqi": rqi_result,
        "heatmap_base64": heatmap_b64,
        "image_width": img_w,
        "image_height": img_h,
    }
