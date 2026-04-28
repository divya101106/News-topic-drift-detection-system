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

# ============================================================
# CATEGORY DEFINITIONS for "Drift Per Category"
# ============================================================
CATEGORY_MAP = {
    "Politics & Religion": [
        'talk.politics.misc', 'talk.politics.guns', 'talk.politics.mideast',
        'talk.religion.misc', 'soc.religion.christian'
    ],
    "Technology & Graphics": [
        'comp.graphics', 'comp.os.ms-windows.misc', 'comp.sys.ibm.pc.hardware',
        'comp.sys.mac.hardware', 'comp.windows.x'
    ],
    "Science & Space": [
        'sci.crypt', 'sci.electronics', 'sci.med', 'sci.space'
    ],
    "Sports & Recreation": [
        'rec.autos', 'rec.motorcycles', 'rec.sport.baseball', 'rec.sport.hockey'
    ]
}

print("\n[4/5] Computing reference centroids for all categories...")
category_centroids = {}

for cat_name, subcategories in CATEGORY_MAP.items():
    print(f"  Processing {cat_name}...")
    cat_data = fetch_20newsgroups(
        subset='all',
        categories=subcategories,
        remove=('headers', 'footers', 'quotes')
    )
    cat_texts = [clean_text(t) for t in cat_data.data]
    cat_texts = [t for t in cat_texts if t.strip()]
    
    if cat_texts:
        cat_tfidf = vectorizer.transform(cat_texts)
        cat_centroid = np.mean(cat_tfidf.toarray(), axis=0, keepdims=True)
        category_centroids[cat_name] = cat_centroid

# Save the main baseline (Politics/Religion) as the primary drift reference
primary_baseline = category_centroids["Politics & Religion"]

# Step 5: Save everything
print("\n[5/5] Saving models...")
joblib.dump(vectorizer, os.path.join(models_dir, 'tfidf_vectorizer.pkl'))
joblib.dump(pca, os.path.join(models_dir, 'pca_model.pkl'))
joblib.dump(category_centroids, os.path.join(models_dir, 'category_centroids.joblib'))

# Main baseline files
np.save(os.path.join(models_dir, 'tfidf_baseline_centroid.npy'), primary_baseline)
baseline_pca = pca.transform(primary_baseline)
np.save(os.path.join(models_dir, 'baseline_centroid.npy'), baseline_pca)

print(f"  ✓ tfidf_vectorizer.pkl")
print(f"  ✓ category_centroids.joblib ({list(category_centroids.keys())})")
print(f"  ✓ tfidf_baseline_centroid.npy")

# ============================================================
# VERIFICATION
# ============================================================
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

test_cats = {
    "Politics Sample": ['talk.politics.misc'],
    "Sports Sample": ['rec.sport.baseball'],
    "Science Sample": ['sci.space']
}

for label, cats in test_cats.items():
    data = fetch_20newsgroups(subset='all', categories=cats, remove=('headers', 'footers', 'quotes'))
    texts = [clean_text(t) for t in data.data[:50]]
    tfidf = vectorizer.transform(texts)
    centroid = np.mean(tfidf.toarray(), axis=0, keepdims=True)
    
    print(f"\nComparing {label} against all references:")
    for ref_name, ref_centroid in category_centroids.items():
        sim = float(cosine_similarity(ref_centroid, centroid)[0][0])
        # Apply scaling logic [0.15, 0.75] -> [0, 1]
        scaled = np.clip((sim - 0.15) / 0.60, 0, 1)
        print(f"  -> vs {ref_name:22}: {scaled:.2%} match")

print("\nDone! Models are ready.")
