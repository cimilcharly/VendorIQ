import pytest
import numpy as np
from app.engine.decision import DecisionEngine, VendorData

def test_normalize_data():
    data = np.array([3.0, 4.0])
    norm = DecisionEngine.normalize_data(data, "cost")
    assert np.allclose(norm, np.array([0.6, 0.8]))

def test_topsis_rankings():
    vendors = [
        VendorData(vendor_id=1, vendor_name="Vendor A", metrics={
            "cost": 100.0, "quality": 90.0, "delivery_time": 5.0,
            "reliability": 85.0, "compliance": 90.0, "rating": 4.0, "financial_stability": 80.0
        }),
        VendorData(vendor_id=2, vendor_name="Vendor B", metrics={
            "cost": 50.0, "quality": 80.0, "delivery_time": 10.0,
            "reliability": 90.0, "compliance": 85.0, "rating": 4.5, "financial_stability": 75.0
        }),
    ]
    weights = {
        "cost": 25,
        "quality": 20,
        "reliability": 15,
        "delivery_time": 15,
        "compliance": 10,
        "rating": 10,
        "financial_stability": 5,
    }
    
    rankings = DecisionEngine.topsis(vendors, weights)
    assert len(rankings) == 2
    assert all(0 <= score <= 100 for _, score in rankings)
    assert rankings[0][1] >= rankings[1][1]

def test_ahp_pairwise_comparison():
    criteria_pairs = {
        ("cost", "quality"): 3.0,
        ("cost", "delivery"): 2.0,
        ("quality", "delivery"): 0.5,
    }
    weights = DecisionEngine.ahp_pairwise_comparison(criteria_pairs)
    assert weights["cost"] > weights["delivery"]
    assert weights["delivery"] > weights["quality"]
    assert abs(sum(weights.values()) - 100.0) < 0.01

def test_weighted_sum_model():
    vendors = [
        VendorData(vendor_id=1, vendor_name="Vendor A", metrics={"cost": 0.8, "quality": 0.9}),
        VendorData(vendor_id=2, vendor_name="Vendor B", metrics={"cost": 0.9, "quality": 0.7}),
    ]
    weights = {"cost": 0.5, "quality": 0.5}
    scores = DecisionEngine.weighted_sum_model(vendors, weights)
    assert scores[0][0] == 1
    assert scores[0][1] == pytest.approx(0.85)
    assert scores[1][0] == 2
    assert scores[1][1] == pytest.approx(0.80)
