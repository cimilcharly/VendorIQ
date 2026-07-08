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
        """AHP - Analytic Hierarchy Process (real pairwise comparison using eigenvector approximation)"""
        import sys
        # 1. Identify unique criteria
        criteria_set = set()
        for c1, c2 in criteria_pairs.keys():
            criteria_set.add(c1)
            criteria_set.add(c2)
        criteria = sorted(list(criteria_set))
        n = len(criteria)
        if n == 0:
            return {}

        # 2. Build pairwise comparison matrix
        matrix = np.ones((n, n))
        criteria_idx = {c: i for i, c in enumerate(criteria)}

        for (c1, c2), value in criteria_pairs.items():
            i = criteria_idx[c1]
            j = criteria_idx[c2]
            matrix[i, j] = value
            if value != 0:
                matrix[j, i] = 1.0 / value
            else:
                matrix[j, i] = 1.0

        # 3. Approximate weights using column normalization and row averaging
        col_sums = matrix.sum(axis=0)
        # Avoid division by zero
        col_sums[col_sums == 0] = 1.0
        norm_matrix = matrix / col_sums
        weights_arr = norm_matrix.mean(axis=1)

        # 4. Consistency Ratio check
        lambda_max = sum(col_sums * weights_arr)
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0.0

        # Random Index values for n=1 to 10
        ri_dict = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
        ri = ri_dict.get(n, 1.49)
        cr = ci / ri if ri > 0 else 0.0

        # 5. Return weights as percentages
        weights = {}
        for idx, criterion in enumerate(criteria):
            weights[criterion] = float(weights_arr[idx]) * 100

        if cr > 0.10:
            print(f"WARNING: Consistency Ratio {cr:.4f} exceeds 0.10. Judgments may be inconsistent.", file=sys.stderr)

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
