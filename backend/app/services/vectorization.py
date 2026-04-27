import joblib
import os
import numpy as np
from typing import List, Tuple

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
TFIDF_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl')
PCA_PATH = os.path.join(MODEL_DIR, 'pca_model.pkl')

class VectorizationService:
    def __init__(self):
        self.vectorizer = None
        self.pca = None
        self.load_models()

    def load_models(self):
        try:
            self.vectorizer = joblib.load(TFIDF_PATH)
            self.pca = joblib.load(PCA_PATH)
            print("Models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def transform(self, cleaned_texts: List[str]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        if not self.vectorizer or not self.pca:
            raise ValueError("Models not loaded properly.")
            
        tfidf_matrix = self.vectorizer.transform(cleaned_texts)
        pca_vectors = self.pca.transform(tfidf_matrix.toarray() if hasattr(tfidf_matrix, 'toarray') else tfidf_matrix)
        
        # Get top terms for the batch
        # Sum the tfidf scores for each term across all documents in the batch
        sum_tfidf = tfidf_matrix.sum(axis=0)
        # Handle sparse matrix sum result shape
        if hasattr(sum_tfidf, 'A1'):
            scores = sum_tfidf.A1
        else:
            scores = sum_tfidf.flatten()
            
        feature_names = self.vectorizer.get_feature_names_out()
        
        # Get top 15 terms
        top_indices = scores.argsort()[-15:][::-1]
        top_terms = [feature_names[i] for i in top_indices]

        return tfidf_matrix, pca_vectors, top_terms

vectorization_service = VectorizationService()
