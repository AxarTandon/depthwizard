from app.services.disaster_classifier import classify


def test_classify_flags_flood_risk():
    flood = {"submerged_percent": 40, "water_level": 5}
    labels = classify(flood, [], [], mean_slope=5.0)
    assert any(l["label"] == "Flood risk" for l in labels)


def test_classify_no_risk_when_nothing_triggers():
    labels = classify(None, [], [], mean_slope=2.0)
    assert labels[0]["label"] == "No elevated risk detected"
