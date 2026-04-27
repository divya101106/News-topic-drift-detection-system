import numpy as np
import os
from sklearn.metrics.pairwise import cosine_similarity
from typing import Tuple

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
TFIDF_BASELINE_PATH = os.path.join(MODEL_DIR, 'tfidf_baseline_centroid.npy')

BASELINE_TFIDF_CENTROID = None

def get_baseline_tfidf_centroid(features_dim: int) -> np.ndarray:
    """Load the TF-IDF baseline centroid from disk."""
    global BASELINE_TFIDF_CENTROID
    if BASELINE_TFIDF_CENTROID is None:
        try:
            if os.path.exists(TFIDF_BASELINE_PATH):
                BASELINE_TFIDF_CENTROID = np.load(TFIDF_BASELINE_PATH)
                print(f"Loaded TF-IDF baseline centroid from {TFIDF_BASELINE_PATH}, shape: {BASELINE_TFIDF_CENTROID.shape}")
            else:
                BASELINE_TFIDF_CENTROID = np.zeros((1, features_dim))
                print("TF-IDF baseline file not found, using zero vector.")
        except Exception as e:
            print(f"Error loading baseline: {e}")
            BASELINE_TFIDF_CENTROID = np.zeros((1, features_dim))

    # Ensure dimension match
    if BASELINE_TFIDF_CENTROID.shape[-1] != features_dim:
        print(f"Warning: Baseline dim {BASELINE_TFIDF_CENTROID.shape[-1]} != batch dim {features_dim}. Reinitializing.")
        BASELINE_TFIDF_CENTROID = np.zeros((1, features_dim))

    return BASELINE_TFIDF_CENTROID

def calculate_centroid(matrix) -> np.ndarray:
    """Calculate mean centroid. Handles both sparse and dense matrices."""
    if hasattr(matrix, 'toarray'):
        return np.mean(matrix.toarray(), axis=0, keepdims=True)
    return np.mean(matrix, axis=0, keepdims=True)

def detect_drift(tfidf_matrix, pca_vectors: np.ndarray, threshold: float = 0.75) -> Tuple[bool, float, np.ndarray]:
    """
    Detect drift by comparing TF-IDF centroids using cosine similarity.

    WHY TF-IDF space and NOT PCA space:
    - TF-IDF values are always >= 0 (term frequencies can't be negative)
    - Cosine similarity of non-negative vectors is guaranteed to be in [0, 1]
    - PCA centers data (subtracts mean), creating negative components
    - Cosine similarity in PCA space can range [-1, 1], giving misleading negative scores

    Args:
        tfidf_matrix: Sparse TF-IDF matrix from the vectorizer
        pca_vectors: PCA-reduced vectors (only used for visualization centroid)
        threshold: Similarity below this = drift detected

    Returns:
        Tuple of (is_drifted, similarity_score, batch_pca_centroid)
    """
    if tfidf_matrix.shape[0] == 0:
        return False, 1.0, np.zeros((1, pca_vectors.shape[1] if len(pca_vectors.shape) > 1 else 2))

    # Calculate batch centroid in TF-IDF space (non-negative, high-dimensional)
    batch_tfidf_centroid = calculate_centroid(tfidf_matrix)

    # Calculate batch centroid in PCA space (only for frontend scatter chart)
    batch_pca_centroid = calculate_centroid(pca_vectors)

    # Load the pre-saved TF-IDF baseline centroid
    baseline_tfidf = get_baseline_tfidf_centroid(tfidf_matrix.shape[1])

    # If baseline is all zeros (no saved file), initialize with first batch
    if np.all(baseline_tfidf == 0):
        global BASELINE_TFIDF_CENTROID
        BASELINE_TFIDF_CENTROID = batch_tfidf_centroid.copy()
        baseline_tfidf = batch_tfidf_centroid.copy()
        try:
            np.save(TFIDF_BASELINE_PATH, batch_tfidf_centroid)
            print(f"Initialized and saved TF-IDF baseline to {TFIDF_BASELINE_PATH}")
        except Exception as e:
            print(f"Could not save baseline: {e}")

    # Cosine similarity in TF-IDF space: ALWAYS in [0, 1] because all values are >= 0
    similarity = cosine_similarity(baseline_tfidf, batch_tfidf_centroid)[0][0]
    similarity = float(np.clip(similarity, 0.0, 1.0))  # Clamp to [0, 1] as a safety net

    # Drift detected when similarity drops below threshold
    is_drifted = similarity < threshold

    return is_drifted, similarity, batch_pca_centroid
