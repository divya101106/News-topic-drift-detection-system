import joblib
import numpy as np
import os
import re
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.datasets import fetch_20newsgroups
from sklearn.preprocessing import normalize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

# Initialize preprocessing tools
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# Ensure the models directory exists
models_dir = os.path.dirname(os.path.abspath(__file__))

def clean_text(text: str) -> str:
    """Clean text using the SAME logic as the API preprocessing."""
    if not isinstance(text, str):
        return ""

    # lowercase
    text = text.lower()
    # remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # remove emails
    text = re.sub(r'\S+@\S+', '', text)
    # remove special characters and numbers (keep only letters and spaces)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # tokenize (simple split)
    tokens = text.split()
    # remove stopwords and lemmatize (same as notebook and API)
    cleaned_tokens = [
        lemmatizer.lemmatize(word) for word in tokens
        if word not in stop_words and len(word) > 2  # Also filter short words like notebook
    ]

    return " ".join(cleaned_tokens)

print("Fetching 20 newsgroups dataset (ALL categories, subset='all' like notebook)...")
# Use ALL 20 categories like the notebook, not just 4
dataset = fetch_20newsgroups(
    subset='all',  # Use 'all' like the notebook (not 'train')
    remove=('headers', 'footers', 'quotes')  # Remove metadata
)
texts = dataset.data
print(f"Loaded {len(texts)} documents from {len(dataset.target_names)} categories")

# Clean texts using the SAME preprocessing as the API
print("Cleaning texts...")
cleaned_texts = [clean_text(text) for text in texts]
# Remove empty documents
cleaned_texts = [text for text in cleaned_texts if text.strip()]
print(f"After cleaning: {len(cleaned_texts)} documents")

print(f"Training TF-IDF on {len(cleaned_texts)} cleaned documents...")
# Use SAME parameters as the notebook
vectorizer = TfidfVectorizer(
    max_features=10000,  # 10k like notebook (not 5k)
    stop_words='english',
    min_df=5,  # Same as notebook
    max_df=0.8  # Same as notebook
)
tfidf_matrix = vectorizer.fit_transform(cleaned_texts)
print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")

print("Training PCA (using subset for speed, retaining 70% variance)...")
# Use a stratified subset for PCA fitting to speed up training while keeping representativeness
from sklearn.model_selection import train_test_split
# Use 5000 documents for PCA fitting (should be enough to capture variance structure)
subset_size = min(5000, len(cleaned_texts))
_, tfidf_subset, _, _ = train_test_split(
    tfidf_matrix, dataset.target[:len(cleaned_texts)],
    train_size=subset_size,
    random_state=42,
    stratify=dataset.target[:len(cleaned_texts)]
)
# Fit PCA on subset
pca = PCA(n_components=0.70)
pca.fit(tfidf_subset.toarray())
print(f"PCA components: {pca.n_components_} (explains {pca.explained_variance_ratio_.sum():.2%} variance)")

# Save the models
joblib.dump(vectorizer, os.path.join(models_dir, 'tfidf_vectorizer.pkl'))
joblib.dump(pca, os.path.join(models_dir, 'pca_model.pkl'))

# Generate baseline centroids using the FULL cleaned dataset
tfidf_matrix_full = vectorizer.transform(cleaned_texts)
pca_transformed_full = pca.transform(tfidf_matrix_full.toarray())

# TF-IDF centroid (mean of training data)
tfidf_centroid = np.mean(tfidf_matrix_full.toarray(), axis=0, keepdims=True)
np.save(os.path.join(models_dir, 'tfidf_baseline_centroid.npy'), tfidf_centroid)

# PCA centroid (mean of training data in PCA space) - this is what drift detection uses
baseline_centroid = pca_transformed_full.mean(axis=0, keepdims=True)
np.save(os.path.join(models_dir, 'baseline_centroid.npy'), baseline_centroid)

print(f"Models saved successfully!")
print(f"  TF-IDF vectorizer: {tfidf_matrix.shape[1]} features")
print(f"  PCA: {pca.n_components_} components")
print(f"  Baseline centroid shape: {baseline_centroid.shape}")

# Test: verify self-similarity should be ~1.0
from sklearn.metrics.pairwise import cosine_similarity
# Normalize centroids for cosine similarity
baseline_norm = normalize(baseline_centroid)
test_batch_centroid = normalize(baseline_centroid.copy())
self_similarity = cosine_similarity(baseline_norm, test_batch_centroid)[0][0]
print(f"\nVerification: Self-similarity = {self_similarity:.4f} (should be ~1.0)")
