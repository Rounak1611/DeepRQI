import os
from dotenv import load_dotenv

load_dotenv()

# ---- Model ----
# Point this at your trained checkpoint once GPU training is done, e.g.:
#   MODEL_PATH=/path/to/DeepRQI/runs/yolo26s_rdd2022/weights/best.pt
# Until then, it defaults to the stock COCO-pretrained checkpoint just so the
# pipeline runs end-to-end (predictions won't be meaningful road-damage classes
# yet, but every other piece of the service can be built/tested against it).
MODEL_PATH = os.getenv("MODEL_PATH", "yolo26s.pt")

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
