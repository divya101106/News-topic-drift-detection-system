import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import os

# Download NLTK data to a specific directory to ensure it's available
nltk_data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'nltk_data')
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)

try:
    nltk.download('stopwords', download_dir=nltk_data_dir, quiet=True)
    nltk.download('wordnet', download_dir=nltk_data_dir, quiet=True)
    nltk.download('omw-1.4', download_dir=nltk_data_dir, quiet=True)
except Exception as e:
    print(f"Failed to download NLTK data: {e}")

lemmatizer = WordNetLemmatizer()
try:
    stop_words = set(stopwords.words('english'))
except:
    stop_words = set()

def clean_text(text: str) -> str:
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
    # remove stopwords and lemmatize
    cleaned_tokens = [
        lemmatizer.lemmatize(word) for word in tokens 
        if word not in stop_words and len(word) > 2
    ]
    
    return " ".join(cleaned_tokens)
