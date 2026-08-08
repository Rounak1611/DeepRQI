from .config import SEVERITY_AREA_THRESHOLDS


def compute_severity(bbox: list[float], img_w: int, img_h: int) -> str:
    """
    Rule-based severity from how much of the frame the damage occupies.
    bbox: [xmin, ymin, xmax, ymax] in pixel coordinates.
    """
    xmin, ymin, xmax, ymax = bbox
    box_area = max(0.0, (xmax - xmin)) * max(0.0, (ymax - ymin))
    img_area = float(img_w * img_h)
    if img_area <= 0:
        return "low"

    relative_area = box_area / img_area

    if relative_area < SEVERITY_AREA_THRESHOLDS["low"]:
        return "low"
    elif relative_area < SEVERITY_AREA_THRESHOLDS["medium"]:
        return "medium"
    elif relative_area < SEVERITY_AREA_THRESHOLDS["high"]:
        return "high"
    else:
        return "critical"
