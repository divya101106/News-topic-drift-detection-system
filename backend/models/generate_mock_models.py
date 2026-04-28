import joblib
import numpy as np
import os
import re
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
from sklearn.datasets import fetch_20newsgroups
from sklearn.metrics.pairwise import cosine_similarity
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Synchronize NLTK data path with the API service
nltk_data_dir = os.path.join(os.path.dirname(__file__), '..', 'nltk_data')
os.makedirs(nltk_data_dir, exist_ok=True)
if nltk_data_dir not in nltk.data.path:
    nltk.data.path.append(nltk_data_dir)

# Download NLTK data to the shared directory
nltk.download('stopwords', download_dir=nltk_data_dir, quiet=True)
nltk.download('wordnet', download_dir=nltk_data_dir, quiet=True)
nltk.download('omw-1.4', download_dir=nltk_data_dir, quiet=True)

lemmatizer = WordNetLemmatizer()
try:
    stop_words = set(stopwords.words('english'))
except:
    stop_words = set()
models_dir = os.path.dirname(os.path.abspath(__file__))

def clean_text(text: str) -> str:
    """Clean text using the EXACT SAME logic as the API preprocessing."""
    if not isinstance(text, str):
        return ""
    
    # lowercase
    text = text.lower()
    # remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # remove emails
    text = re.sub(r'\S+@\S+', '', text)
    # remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # tokenize (simple split)
    tokens = text.split()
    # remove stopwords and lemmatize - IDENTICAL TO preprocessing.py
    cleaned_tokens = [
        lemmatizer.lemmatize(word) for word in tokens 
        if word not in stop_words and len(word) > 2
    ]
    
    return " ".join(cleaned_tokens)

# ============================================================
# BASELINE CATEGORIES — these represent "normal" news topics
# The system detects drift AWAY from these topics
# ============================================================
BASELINE_CATEGORIES = [
    'talk.politics.misc',
    'talk.politics.guns',
    'talk.politics.mideast',
    'talk.religion.misc',
    'soc.religion.christian',
]

# These are "drifted" categories — used for verification only
DRIFT_TEST_CATEGORIES = [
    'sci.space',
    'sci.med',
    'comp.graphics',
    'rec.sport.baseball',
]

print("=" * 60)
print("NEWS TOPIC DRIFT - MODEL GENERATOR")
print("=" * 60)

# Step 1: Fetch ALL data for vocabulary building
print("\n[1/5] Fetching 20 Newsgroups dataset (all categories for vocabulary)...")
all_data = fetch_20newsgroups(subset='all', remove=('headers', 'footers', 'quotes'))
all_texts = [clean_text(t) for t in all_data.data]
all_texts = [t for t in all_texts if t.strip()]
print(f"  Total cleaned documents: {len(all_texts)}")

# Step 2: Train TF-IDF on ALL categories (so vocabulary covers everything)
print("\n[2/5] Training TF-IDF vectorizer on full dataset...")
vectorizer = TfidfVectorizer(
    max_features=5000,
    stop_words='english',
    min_df=3,
    max_df=0.85,
    sublinear_tf=True,  # Apply log normalization to TF — more discriminative
)
tfidf_all = vectorizer.fit_transform(all_texts)
print(f"  TF-IDF matrix: {tfidf_all.shape}")

# Step 3: Train PCA on all data (for visualization)
print("\n[3/5] Training PCA for visualization...")
pca = PCA(n_components=2)  # Just 2 components for the scatter chart
pca.fit(tfidf_all.toarray())
print(f"  PCA components: {pca.n_components_}")

# Step 4: Compute BASELINE centroid from ONLY the baseline categories
print(f"\n[4/5] Computing baseline centroid from categories: {BASELINE_CATEGORIES}")
baseline_data = fetch_20newsgroups(
    subset='all',
    categories=BASELINE_CATEGORIES,
    remove=('headers', 'footers', 'quotes')
)
baseline_texts = [clean_text(t) for t in baseline_data.data]
baseline_texts = [t for t in baseline_texts if t.strip()]
print(f"  Baseline documents: {len(baseline_texts)}")

# Transform baseline texts through the SAME vectorizer
baseline_tfidf = vectorizer.transform(baseline_texts)
baseline_centroid = np.mean(baseline_tfidf.toarray(), axis=0, keepdims=True)

# Verify baseline centroid is non-negative and non-zero
assert np.all(baseline_centroid >= 0), "ERROR: Baseline centroid has negative values!"
assert np.sum(baseline_centroid) > 0, "ERROR: Baseline centroid is all zeros!"
print(f"  Baseline centroid: min={baseline_centroid.min():.6f}, max={baseline_centroid.max():.6f}, sum={baseline_centroid.sum():.4f}")

# Calculate PCA baseline based on these focused texts
baseline_pca = pca.transform(baseline_tfidf.toarray())
baseline_pca_centroid = baseline_pca.mean(axis=0, keepdims=True)

# Step 5: Save everything
print("\n[5/5] Saving models...")
joblib.dump(vectorizer, os.path.join(models_dir, 'tfidf_vectorizer.pkl'))
joblib.dump(pca, os.path.join(models_dir, 'pca_model.pkl'))

# IMPORTANT: Save the FOCUSED baseline centroid, not the full dataset mean!
np.save(os.path.join(models_dir, 'tfidf_baseline_centroid.npy'), baseline_centroid)
np.save(os.path.join(models_dir, 'baseline_centroid.npy'), baseline_pca_centroid)

print(f"  ✓ tfidf_vectorizer.pkl ({tfidf_all.shape[1]} features)")
print(f"  ✓ pca_model.pkl ({pca.n_components_} components)")
print(f"  ✓ tfidf_baseline_centroid.npy {baseline_centroid.shape}")
print(f"  ✓ baseline_centroid.npy {baseline_pca_centroid.shape}")

# ============================================================
# VERIFICATION — test with same-topic and different-topic data
# ============================================================
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

# Test 1: Same-topic batch (should be HIGH similarity)
same_topic_data = fetch_20newsgroups(
    subset='all',
    categories=['talk.politics.misc'],
    remove=('headers', 'footers', 'quotes')
)
same_texts = [clean_text(t) for t in same_topic_data.data[:50]]
same_texts = [t for t in same_texts if t.strip()]
same_tfidf = vectorizer.transform(same_texts)
same_centroid = np.mean(same_tfidf.toarray(), axis=0, keepdims=True)
same_sim = cosine_similarity(baseline_centroid, same_centroid)[0][0]
print(f"\n  Same-topic (politics):    similarity = {same_sim:.4f}  {'✓ STABLE' if same_sim >= 0.75 else '✗ UNEXPECTED'}")

# Test 2: Related topic (should be MEDIUM similarity)
related_data = fetch_20newsgroups(
    subset='all',
    categories=['alt.atheism'],
    remove=('headers', 'footers', 'quotes')
)
related_texts = [clean_text(t) for t in related_data.data[:50]]
related_texts = [t for t in related_texts if t.strip()]
related_tfidf = vectorizer.transform(related_texts)
related_centroid = np.mean(related_tfidf.toarray(), axis=0, keepdims=True)
related_sim = cosine_similarity(baseline_centroid, related_centroid)[0][0]
print(f"  Related topic (atheism):  similarity = {related_sim:.4f}  {'~ BORDERLINE' if 0.3 < related_sim < 0.75 else ('✓ STABLE' if related_sim >= 0.75 else '✗ DRIFTED')}")

# Test 3: Different topic (should be LOW similarity → drift detected)
diff_data = fetch_20newsgroups(
    subset='all',
    categories=['rec.sport.baseball'],
    remove=('headers', 'footers', 'quotes')
)
diff_texts = [clean_text(t) for t in diff_data.data[:50]]
diff_texts = [t for t in diff_texts if t.strip()]
diff_tfidf = vectorizer.transform(diff_texts)
diff_centroid = np.mean(diff_tfidf.toarray(), axis=0, keepdims=True)
diff_sim = cosine_similarity(baseline_centroid, diff_centroid)[0][0]
print(f"  Different topic (sports): similarity = {diff_sim:.4f}  {'✗ DRIFTED' if diff_sim < 0.75 else '✓ STABLE'}")

# Test 4: Very different topic
sci_data = fetch_20newsgroups(
    subset='all',
    categories=['comp.graphics'],
    remove=('headers', 'footers', 'quotes')
)
sci_texts = [clean_text(t) for t in sci_data.data[:50]]
sci_texts = [t for t in sci_texts if t.strip()]
sci_tfidf = vectorizer.transform(sci_texts)
sci_centroid = np.mean(sci_tfidf.toarray(), axis=0, keepdims=True)
sci_sim = cosine_similarity(baseline_centroid, sci_centroid)[0][0]
print(f"  Very different (comp.gfx): similarity = {sci_sim:.4f}  {'✗ DRIFTED' if sci_sim < 0.75 else '✓ STABLE'}")

# Verify ALL values are in [0, 1]
all_sims = [same_sim, related_sim, diff_sim, sci_sim]
assert all(0 <= s <= 1 for s in all_sims), f"ERROR: Some similarities are outside [0,1]: {all_sims}"
print(f"\n  ✓ All similarity scores are in [0, 1] range")
print(f"  ✓ Score spread: {min(all_sims):.4f} — {max(all_sims):.4f}")
print("\nDone! Models are ready.")
