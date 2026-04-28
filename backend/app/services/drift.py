import numpy as np
import os
import logging
from sklearn.metrics.pairwise import cosine_similarity
from typing import Tuple

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
TFIDF_BASELINE_PATH = os.path.join(MODEL_DIR, 'tfidf_baseline_centroid.npy')

BASELINE_TFIDF_CENTROID = None


def get_baseline_tfidf_centroid(features_dim: int) -> np.ndarray:
    """
    Load the TF-IDF baseline centroid from disk.
    This centroid was pre-computed from a specific set of news categories
    (politics/religion) during model training. Uploaded batches are compared
    against this to detect topic drift.
    """
    global BASELINE_TFIDF_CENTROID
    if BASELINE_TFIDF_CENTROID is None:
        try:
            if os.path.exists(TFIDF_BASELINE_PATH):
                BASELINE_TFIDF_CENTROID = np.load(TFIDF_BASELINE_PATH)
                logger.info(
                    f"Loaded TF-IDF baseline centroid: shape={BASELINE_TFIDF_CENTROID.shape}, "
                    f"sum={BASELINE_TFIDF_CENTROID.sum():.4f}"
                )
                # Reshape if needed (handle 1D arrays)
                if BASELINE_TFIDF_CENTROID.ndim == 1:
                    BASELINE_TFIDF_CENTROID = BASELINE_TFIDF_CENTROID.reshape(1, -1)
            else:
                logger.warning("TF-IDF baseline file not found at %s", TFIDF_BASELINE_PATH)
                BASELINE_TFIDF_CENTROID = None
                return np.zeros((1, features_dim))
        except Exception as e:
            logger.error(f"Error loading baseline: {e}")
            BASELINE_TFIDF_CENTROID = None
            return np.zeros((1, features_dim))

    # Verify dimension match
    if BASELINE_TFIDF_CENTROID.shape[-1] != features_dim:
        logger.error(
            f"Baseline dim mismatch: baseline={BASELINE_TFIDF_CENTROID.shape[-1]}, "
            f"batch={features_dim}. Cannot compare."
        )
        return np.zeros((1, features_dim))

    return BASELINE_TFIDF_CENTROID


def calculate_tfidf_centroid(tfidf_matrix) -> np.ndarray:
    """
    Calculate the mean centroid of a TF-IDF matrix.
    
    TF-IDF values are ALWAYS >= 0, so the centroid is also >= 0.
    This guarantees cosine similarity will be in [0, 1].
    """
    if hasattr(tfidf_matrix, 'toarray'):
        dense = tfidf_matrix.toarray()
    else:
        dense = np.asarray(tfidf_matrix)
    
    centroid = np.mean(dense, axis=0, keepdims=True)
    
    # Safety: TF-IDF values should never be negative
    assert np.all(centroid >= 0), "BUG: TF-IDF centroid has negative values!"
    
    return centroid


def get_topic_drift_breakdown(
    vectorizer,
    baseline_centroid: np.ndarray,
    batch_centroid: np.ndarray,
    top_n: int = 10
) -> list:
    """
    Identifies which terms have the largest difference in importance between
    the baseline and the current batch.
    """
    feature_names = vectorizer.get_feature_names_out()
    
    # Calculate absolute difference for all terms
    diffs = (batch_centroid - baseline_centroid).flatten()
    
    # Get indices of terms with largest absolute changes
    indices = np.argsort(np.abs(diffs))[-top_n:][::-1]
    
    breakdown = []
    for i in indices:
        breakdown.append({
            "term": feature_names[i],
            "baseline_score": float(baseline_centroid[0, i]),
            "batch_score": float(batch_centroid[0, i]),
            "diff": float(diffs[i])
        })
    
    return breakdown


def compare_two_matrices(
    matrix_a,
    matrix_b
) -> float:
    """
    Compares two TF-IDF matrices directly.
    Used for the 'Compare 2 Batches' feature.
    """
    centroid_a = calculate_tfidf_centroid(matrix_a)
    centroid_b = calculate_tfidf_centroid(matrix_b)
    
    raw_sim = float(cosine_similarity(centroid_a, centroid_b)[0][0])
    
    # Use the same rescaling for consistency
    sim_min = 0.15
    sim_max = 0.75
    scaled = (raw_sim - sim_min) / (sim_max - sim_min)
    
    return float(np.clip(scaled, 0.0, 1.0))


def detect_drift(
    tfidf_matrix,
    pca_vectors: np.ndarray,
    vectorizer, # Added vectorizer to get topic breakdown
    threshold: float = 0.75
) -> Tuple[bool, float, np.ndarray, list]:
    """
    Detect topic drift by comparing batch TF-IDF centroid against baseline.
    """
    n_docs = tfidf_matrix.shape[0]
    pca_dim = pca_vectors.shape[1] if len(pca_vectors.shape) > 1 else 2

    if n_docs == 0:
        return False, 1.0, np.zeros((1, pca_dim)), []

    # 1. Compute batch centroid in TF-IDF space
    batch_centroid = calculate_tfidf_centroid(tfidf_matrix)

    # 2. Compute PCA centroid
    batch_pca_centroid = np.mean(pca_vectors, axis=0, keepdims=True)

    # 3. Load pre-saved baseline centroid
    baseline = get_baseline_tfidf_centroid(tfidf_matrix.shape[1])

    # 4. Check for degenerate cases
    baseline_norm = np.linalg.norm(baseline)
    batch_norm = np.linalg.norm(batch_centroid)

    if baseline_norm == 0:
        return False, 0.5, batch_pca_centroid, []

    if batch_norm == 0:
        return True, 0.0, batch_pca_centroid, []

    # 5. Compute cosine similarity
    raw_similarity = float(cosine_similarity(baseline, batch_centroid)[0][0])

    # 6. Rescale
    sim_min = 0.15
    sim_max = 0.75
    scaled_similarity = (raw_similarity - sim_min) / (sim_max - sim_min)
    final_similarity = float(np.clip(scaled_similarity, 0.0, 1.0))

    # 7. Get topic drift breakdown
    topic_drift = get_topic_drift_breakdown(vectorizer, baseline, batch_centroid)

    is_drifted = final_similarity < threshold

    return is_drifted, final_similarity, batch_pca_centroid, topic_drift
