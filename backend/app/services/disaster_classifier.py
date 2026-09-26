"""Rule-based disaster-type classifier over already-computed signals -
transparent evidence, not a black-box model."""


def classify(flood: dict | None, buildings: list[dict], craters: list[dict], mean_slope: float | None) -> list[dict]:
    labels = []

    if flood and flood.get("submerged_percent", 0) > 15:
        labels.append({
            "label": "Flood risk",
            "confidence": "high" if flood["submerged_percent"] > 30 else "medium",
            "evidence": f"{flood['submerged_percent']}% of the scene submerged at the current water level.",
        })

    high_risk_buildings = [b for b in buildings if b["risk_level"] == "high"]
    if high_risk_buildings:
        labels.append({
            "label": "Structural collapse risk",
            "confidence": "high" if len(high_risk_buildings) >= 2 else "medium",
            "evidence": f"{len(high_risk_buildings)} building(s) with high collapse-damage radius overlap.",
        })

    sharp_craters = [c for c in craters if c["circularity"] > 0.7]
    if sharp_craters:
        labels.append({
            "label": "Impact / blast damage",
            "confidence": "medium",
            "evidence": f"{len(sharp_craters)} circular depression(s) consistent with impact damage.",
        })

    if mean_slope is not None and mean_slope > 25:
        labels.append({
            "label": "Landslide risk",
            "confidence": "medium",
            "evidence": f"Mean terrain slope of {mean_slope:.1f}\u00b0 exceeds the landslide-prone threshold.",
        })

    if not labels:
        labels.append({
            "label": "No elevated risk detected",
            "confidence": "medium",
            "evidence": "None of the configured flood/building/crater/slope thresholds were exceeded.",
        })
    return labels
