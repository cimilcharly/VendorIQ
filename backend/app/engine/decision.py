import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class VendorData:
    vendor_id: int
    vendor_name: str
    metrics: Dict[str, float]

class DecisionEngine:
    CRITERIA = ["cost", "quality", "delivery_time", "reliability", "compliance", "rating", "financial_stability"]

    # Criteria that should be minimized (lower is better)
    MINIMIZE_CRITERIA = {"cost", "delivery_time"}

    # Criteria that should be maximized (higher is better)
    MAXIMIZE_CRITERIA = {"quality", "reliability", "compliance", "rating", "financial_stability"}

    @staticmethod
    def weighted_sum_model(vendors: List[VendorData], weights: Dict[str, float]) -> List[Tuple[int, float]]:
        """Simple weighted sum scoring"""
        scores = []
        for vendor in vendors:
            score = sum(weights.get(criterion, 0) * vendor.metrics.get(criterion, 0)
                       for criterion in DecisionEngine.CRITERIA)
            scores.append((vendor.vendor_id, score))
        return sorted(scores, key=lambda x: x[1], reverse=True)

    @staticmethod
    def normalize_data(data: np.ndarray, criterion: str) -> np.ndarray:
        """Normalize data using vector normalization"""
        norm = np.sqrt(np.sum(data ** 2))
        if norm == 0:
            return data
        return data / norm

    @staticmethod
    def topsis(vendors: List[VendorData], weights: Dict[str, float]) -> List[Tuple[int, float]]:
        """TOPSIS - Technique for Order Preference by Similarity to Ideal Solution"""
        # Step 1: Build decision matrix
        criteria_to_use = [c for c in DecisionEngine.CRITERIA if c in weights]
        decision_matrix = np.array([
            [vendor.metrics.get(criterion, 0) for criterion in criteria_to_use]
            for vendor in vendors
        ])

        # Step 2: Normalize decision matrix
        normalized_matrix = np.zeros_like(decision_matrix, dtype=float)
        for i, criterion in enumerate(criteria_to_use):
            normalized_matrix[:, i] = DecisionEngine.normalize_data(decision_matrix[:, i], criterion)

        # Step 3: Apply weights
        weighted_matrix = normalized_matrix.copy()
        for i, criterion in enumerate(criteria_to_use):
            weighted_matrix[:, i] *= weights.get(criterion, 0) / 100

        # Step 4: Determine ideal and anti-ideal solutions
        ideal_solution = np.zeros(len(criteria_to_use))
        anti_ideal_solution = np.zeros(len(criteria_to_use))

        for i, criterion in enumerate(criteria_to_use):
            if criterion in DecisionEngine.MAXIMIZE_CRITERIA:
                ideal_solution[i] = np.max(weighted_matrix[:, i])
                anti_ideal_solution[i] = np.min(weighted_matrix[:, i])
            else:
                ideal_solution[i] = np.min(weighted_matrix[:, i])
                anti_ideal_solution[i] = np.max(weighted_matrix[:, i])

        # Step 5: Calculate distances
        separation_ideal = np.sqrt(np.sum((weighted_matrix - ideal_solution) ** 2, axis=1))
        separation_anti_ideal = np.sqrt(np.sum((weighted_matrix - anti_ideal_solution) ** 2, axis=1))

        # Step 6: Calculate TOPSIS scores
        topsis_scores = separation_anti_ideal / (separation_ideal + separation_anti_ideal + 1e-10)

        # Step 7: Return ranked results
        scores = [(vendors[i].vendor_id, float(topsis_scores[i]) * 100) for i in range(len(vendors))]
        return sorted(scores, key=lambda x: x[1], reverse=True)

    @staticmethod
    def ahp_pairwise_comparison(criteria_pairs: Dict[Tuple[str, str], float]) -> Dict[str, float]:
        """AHP - Analytic Hierarchy Process (simplified pairwise comparison)"""
        # This is a simplified implementation
        # In production, this would involve complex matrix calculations
        weights = {}
        total = sum(criteria_pairs.values())
        for pair, value in criteria_pairs.items():
            weights[pair] = (value / total) * 100
        return weights

    @staticmethod
    def sensitivity_analysis(vendors: List[VendorData], base_weights: Dict[str, float],
                            criterion: str, variance_range: float = 0.1) -> Dict[str, List[Tuple[int, float]]]:
        """Analyze how rankings change with different weights"""
        results = {}

        for variance in [-variance_range, 0, variance_range]:
            adjusted_weights = base_weights.copy()
            adjusted_weights[criterion] = max(0, min(100, adjusted_weights.get(criterion, 0) + (variance * 100)))

            # Adjust other weights proportionally
            total_other = sum(v for k, v in adjusted_weights.items() if k != criterion)
            if total_other > 0:
                factor = (100 - adjusted_weights[criterion]) / total_other
                for k in adjusted_weights:
                    if k != criterion:
                        adjusted_weights[k] *= factor

            scores = DecisionEngine.topsis(vendors, adjusted_weights)
            results[f"{criterion}_{variance:+.1f}"] = scores

        return results
