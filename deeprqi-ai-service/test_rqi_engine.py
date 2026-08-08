"""
Standalone sanity check for the RQI engine -- no FastAPI server, no model,
no image needed. Run with: python test_rqi_engine.py

This is the fastest way to confirm the scoring math itself is correct before
you ever touch a real image or a trained model.
"""
from app.rqi_engine import compute_rqi


def test_no_damage_is_perfect_score():
    result = compute_rqi([])
    assert result["score"] == 100.0
    assert result["category"] == "Good"
    print("PASS: empty detections -> RQI 100")


def test_single_low_severity_crack():
    detections = [
        {"damage_type": "D00_longitudinal_crack", "severity": "low"},
    ]
    result = compute_rqi(detections)
    # weight 6 * multiplier 1 = penalty 6 -> score 94
    assert result["score"] == 94.0
    print(f"PASS: single low-severity crack -> RQI {result['score']}")


def test_multiple_potholes_high_severity():
    detections = [
        {"damage_type": "D40_pothole", "severity": "critical"},
        {"damage_type": "D40_pothole", "severity": "high"},
    ]
    result = compute_rqi(detections)
    # (10*5) + (10*3) = 80 penalty -> score 20
    assert result["score"] == 20.0
    assert result["category"] == "Critical"
    print(f"PASS: two severe potholes -> RQI {result['score']} ({result['category']})")


def test_score_never_goes_negative():
    detections = [{"damage_type": "D40_pothole", "severity": "critical"} for _ in range(20)]
    result = compute_rqi(detections)
    assert result["score"] == 0.0
    print(f"PASS: heavy damage clamps at RQI {result['score']}, not negative")


if __name__ == "__main__":
    test_no_damage_is_perfect_score()
    test_single_low_severity_crack()
    test_multiple_potholes_high_severity()
    test_score_never_goes_negative()
    print("\nAll RQI engine checks passed.")
