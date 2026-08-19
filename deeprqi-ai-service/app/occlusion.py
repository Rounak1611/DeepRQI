"""
Occlusion sensitivity mapping -- a second, deliberately different
explainability method from EigenCAM (see explainability.py).

EigenCAM is activation-based: it reads the model's internal feature maps.
This is black-box / perturbation-based: it never looks inside the model at
all. It blanks out one region of the image at a time, re-runs prediction,
and measures how much a specific detection's confidence drops. A region the
model actually needed to make a confident detection shows a big drop when
blanked out; an irrelevant region barely moves the needle.

Why bother with a second method when EigenCAM already exists: two
independently-derived explanations agreeing on the same region is much
stronger evidence than either one alone -- and if they disagree, that's
worth surfacing, not hiding. This is the auditability angle the rest of the
project's explainability work (the RQI breakdown, the plain-English
XAI summary) already leans on.

Cost, stated plainly: this needs one full model forward pass per grid cell
(grid_size=6 -> 36 forward passes for one explanation), against EigenCAM's
single forward pass. It's meant to be triggered on demand for one
inspection a person is actually looking at, not run automatically on every
upload the way EigenCAM's heatmap is.
"""
import cv2
import numpy as np


def compute_occlusion_map(model, img_bgr, target_bbox, grid_size=6, occlusion_value=114, iou_threshold=0.3):
    """
    img_bgr: BGR numpy array (as loaded by cv2.imread/imdecode)
    target_bbox: [x1, y1, x2, y2] of the detection to explain, in the same
        pixel coordinates as img_bgr
    grid_size: NxN grid of occlusion patches -- higher is more precise, and
        linearly more expensive (grid_size**2 forward passes)
    occlusion_value: fill value for occluded patches. 114 matches the gray
        YOLO commonly uses for letterbox padding, so an occluded patch
        doesn't look like an unusual out-of-distribution input to the model
    iou_threshold: minimum overlap for a post-occlusion detection to still
        count as "the same detection" rather than "lost"

    Returns a (grid_size, grid_size) numpy array of confidence-drop values
    normalized to [0, 1], where 1 = occluding that patch destroyed the
    detection entirely and 0 = no effect. All-zero if the model never
    detected target_bbox in the first place (baseline confidence 0).
    """
    h, w = img_bgr.shape[:2]
    baseline_conf = _best_matching_confidence(model, img_bgr, target_bbox, iou_threshold)

    patch_h, patch_w = h // grid_size, w // grid_size
    drops = np.zeros((grid_size, grid_size), dtype=np.float32)

    if baseline_conf <= 0:
        # Nothing to explain -- the model doesn't currently detect this box
        # at all (e.g. stale bbox from a re-run with a different model).
        return drops

    for row in range(grid_size):
        for col in range(grid_size):
            occluded = img_bgr.copy()
            y0 = row * patch_h
            y1 = (row + 1) * patch_h if row < grid_size - 1 else h
            x0 = col * patch_w
            x1 = (col + 1) * patch_w if col < grid_size - 1 else w
            occluded[y0:y1, x0:x1] = occlusion_value

            occluded_conf = _best_matching_confidence(model, occluded, target_bbox, iou_threshold)
            drops[row, col] = max(0.0, baseline_conf - occluded_conf)

    max_drop = drops.max()
    if max_drop > 0:
        drops = drops / max_drop
    return drops


def occlusion_map_to_overlay(img_bgr, occlusion_map):
    """
    Upsamples the coarse occlusion_map to the image's resolution and
    overlays it as a heatmap -- same visual language (JET colormap, 50/50
    blend) as EigenCAM's overlay, so the two are easy to eyeball side by
    side rather than needing to mentally translate between color schemes.
    """
    h, w = img_bgr.shape[:2]
    upsampled = cv2.resize(occlusion_map, (w, h), interpolation=cv2.INTER_CUBIC)
    upsampled = np.clip(upsampled, 0, 1)
    heatmap_color = cv2.applyColorMap((upsampled * 255).astype(np.uint8), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_bgr, 0.5, heatmap_color, 0.5, 0)
    return overlay


def _best_matching_confidence(model, img_bgr, target_bbox, iou_threshold):
    """
    Runs the model on img_bgr and returns the confidence of whichever
    detected box best overlaps target_bbox (by IoU), or 0.0 if nothing
    clears iou_threshold -- i.e. the detection was "lost" by whatever
    just changed about the image.
    """
    results = model.predict(img_bgr, verbose=False)[0]
    best_conf = 0.0
    best_iou = iou_threshold
    for box in results.boxes:
        xyxy = [float(v) for v in box.xyxy[0].tolist()]
        iou = _iou(xyxy, target_bbox)
        if iou > best_iou:
            best_iou = iou
            best_conf = float(box.conf[0])
    return best_conf


def _iou(box_a, box_b):
    xa1, ya1, xa2, ya2 = box_a
    xb1, yb1, xb2, yb2 = box_b
    inter_x1, inter_y1 = max(xa1, xb1), max(ya1, yb1)
    inter_x2, inter_y2 = min(xa2, xb2), min(ya2, yb2)
    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h
    area_a = max(0.0, xa2 - xa1) * max(0.0, ya2 - ya1)
    area_b = max(0.0, xb2 - xb1) * max(0.0, yb2 - yb1)
    union = area_a + area_b - inter_area
    return inter_area / union if union > 0 else 0.0
