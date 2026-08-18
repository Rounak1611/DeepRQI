import json
import os
from dotenv import load_dotenv

load_dotenv()

# ---- Model registry ----
# MODEL_PATH remains the single env var for the *default* model -- existing
# single-model setups (Milestones 1-11) are unaffected. Additional named
# models can be added via MODEL_REGISTRY_JSON, a JSON object mapping a short
# name to a checkpoint path, e.g. once more than one model is trained:
#   MODEL_REGISTRY_JSON={"yolo26s_v1": "runs/yolo26s_rdd2022/weights/best.pt", "yolo26m_v1": "runs/yolo26m_rdd2022/weights/best.pt"}
# Every registered model is loaded at startup so /predict?model=<name> can
# switch between them per-request, and POST /api/images/:id/compare (Node
# backend) can run the same photo through several at once.
MODEL_PATH = os.getenv("MODEL_PATH", "yolo26s.pt")
DEFAULT_MODEL_NAME = os.getenv("DEFAULT_MODEL_NAME", "default")

_registry_json = os.getenv("MODEL_REGISTRY_JSON", "")
try:
    MODEL_REGISTRY = json.loads(_registry_json) if _registry_json else {}
except json.JSONDecodeError:
    MODEL_REGISTRY = {}
# Always include the default model, so there's always at least one valid
# `model` name even with zero extra models configured -- this is what keeps
# a fresh, single-model setup working with no config changes at all.
MODEL_REGISTRY.setdefault(DEFAULT_MODEL_NAME, MODEL_PATH)

# ---- Class names, in the exact index order used during training ----
CLASS_NAMES = [
    "D00_longitudinal_crack",
    "D10_transverse_crack",
    "D20_alligator_crack",
    "D40_pothole",
]

# ---- RQI damage weights ----
# Mirrors the original spec's weight table. Note: "Patch Repair" has a defined
# weight but no corresponding trained class yet (RDD2022 doesn't include a
# patch-repair label) -- it's kept here so the formula/schema doesn't need to
# change if that class is added in Phase 3, but it will never fire today.
DAMAGE_WEIGHTS = {
    "D40_pothole": 10,
    "D00_longitudinal_crack": 6,
    "D10_transverse_crack": 5,
    "D20_alligator_crack": 12,
    "patch_repair": 3,  # reserved, not currently detected
}

# ---- Severity multipliers ----
SEVERITY_MULTIPLIERS = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 5,
}

# ---- Severity thresholds, as % of image area the bbox covers ----
# Heuristic starting points (as flagged in the original spec, calibratable
# later against real inspection outcomes). A large box relative to the frame
# reads as more severe damage.
SEVERITY_AREA_THRESHOLDS = {
    "low": 0.02,       # < 2% of image area
    "medium": 0.05,    # 2-5%
    "high": 0.10,      # 5-10%
    # anything >= 0.10 -> "critical"
}

# ---- RQI category bands (for display) ----
RQI_BANDS = [
    (85, 100, "Good"),
    (60, 85, "Fair"),
    (40, 60, "Poor"),
    (25, 40, "Very Poor"),
    (0, 25, "Critical"),
]
