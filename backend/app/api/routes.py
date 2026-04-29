from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import DriftLog
from app.db.schemas import UploadResponse, DashboardStats, DriftLogResponse, CompareResponse
from app.services.preprocessing import clean_text
from app.services.vectorization import vectorization_service
from app.services.drift import detect_drift
from app.core.config import settings
import pandas as pd
import json
import httpx
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/upload-batch", response_model=UploadResponse)
async def upload_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported.")
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
            # Find the text column (assuming 'text', 'content', or take first string column)
            text_col = next((col for col in df.columns if col.lower() in ['text', 'content', 'article']), None)
            if not text_col:
                text_col = df.select_dtypes(include=['object']).columns[0]
            texts = df[text_col].dropna().astype(str).tolist()
        else: # JSON
            content = await file.read()
            data = json.loads(content)
            # Assuming list of strings or list of dicts with text
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], dict):
                    texts = [item.get('text', item.get('content', '')) for item in data]
                elif isinstance(data[0], str):
                    texts = data
                else:
                    raise ValueError("Invalid JSON format")
            else:
                raise ValueError("JSON must be a list of documents")
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    if not texts:
        raise HTTPException(status_code=400, detail="No text data found in file")

    # Pipeline
    cleaned_texts = [clean_text(text) for text in texts]
    
    try:
        tfidf_matrix, pca_vectors, top_terms = vectorization_service.transform(cleaned_texts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during vectorization: {str(e)}")
        
    is_drifted, similarity, batch_centroid, topic_drift, category_drift = detect_drift(
        tfidf_matrix, 
        pca_vectors, 
        vectorization_service.vectorizer, 
        settings.SIMILARITY_THRESHOLD
    )
    
    # Take a sample of PCA points for frontend visualization (to avoid huge payloads)
    sample_size = min(200, len(pca_vectors))
    sample_indices = pd.Series(range(len(pca_vectors))).sample(sample_size).values
    pca_points = pca_vectors[sample_indices, :2].tolist() # only send first 2 components for 2D plot

    # Create DB log with ALL details
    db_log = DriftLog(
        batch_size=len(texts),
        similarity_score=similarity,
        is_drifted=is_drifted,
        top_terms=top_terms,
        pca_points=pca_points,
        topic_drift=topic_drift,
        category_drift=category_drift
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return UploadResponse(
        similarity_score=similarity,
        drift_detected=is_drifted,
        batch_size=len(texts),
        top_terms=top_terms,
        timestamp=db_log.timestamp,
        pca_points=pca_points,
        topic_drift=topic_drift,
        category_drift=category_drift
    )

async def parse_uploaded_file(file: UploadFile) -> List[str]:
    try:
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file.file)
            text_col = next((col for col in df.columns if col.lower() in ['text', 'content', 'article']), None)
            if not text_col:
                object_cols = df.select_dtypes(include=['object']).columns
                if len(object_cols) > 0:
                    text_col = object_cols[0]
                else:
                    raise ValueError("No text-based column found in CSV. Please ensure your file has a 'text' or 'content' column.")
            return df[text_col].dropna().astype(str).tolist()
        elif file.filename.lower().endswith('.json'):
            content = await file.read()
            data = json.loads(content)
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], dict):
                    return [item.get('text', item.get('content', '')) for item in data]
                elif isinstance(data[0], str):
                    return data
            raise ValueError("Invalid JSON format")
        elif file.filename.lower().endswith('.txt'):
            content = await file.read()
            try:
                text = content.decode('utf-8')
            except UnicodeDecodeError:
                text = content.decode('latin-1')
            # Split by double newline or multiple newlines if it looks like multiple articles
            if '\n\n' in text:
                return [t.strip() for t in text.split('\n\n') if t.strip()]
            return [text.strip()]
        elif file.filename.lower().endswith('.pdf'):
            from pypdf import PdfReader
            import io
            content = await file.read()
            reader = PdfReader(io.BytesIO(content))
            full_text = ""
            for page in reader.pages:
                full_text += page.extract_text() + "\n"
            return [full_text.strip()]
        else:
            raise ValueError("Unsupported file format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing {file.filename}: {str(e)}")

@router.post("/compare-batches", response_model=CompareResponse)
async def compare_batches(
    file_a: UploadFile = File(...), 
    file_b: UploadFile = File(...)
):
    from app.services.drift import compare_two_matrices
    
    texts_a = await parse_uploaded_file(file_a)
    texts_b = await parse_uploaded_file(file_b)
    
    cleaned_a = [clean_text(t) for t in texts_a]
    cleaned_b = [clean_text(t) for t in texts_b]
    
    tfidf_a, _, top_a = vectorization_service.transform(cleaned_a)
    tfidf_b, _, top_b = vectorization_service.transform(cleaned_b)
    
    similarity = compare_two_matrices(tfidf_a, tfidf_b)
    common = list(set(top_a) & set(top_b))
    
    return CompareResponse(
        similarity_score=similarity,
        batch_a_size=len(texts_a),
        batch_b_size=len(texts_b),
        batch_a_top_terms=top_a,
        batch_b_top_terms=top_b,
        common_terms=common
    )

@router.post("/compare-texts", response_model=CompareResponse)
async def compare_texts(payload: dict):
    from app.services.drift import compare_two_matrices
    texts_a = payload.get("texts_a", [])
    texts_b = payload.get("texts_b", [])
    
    if not texts_a or not texts_b:
        raise HTTPException(status_code=400, detail="Both text lists must be provided")
        
    cleaned_a = [clean_text(t) for t in texts_a]
    cleaned_b = [clean_text(t) for t in texts_b]
    
    tfidf_a, _, top_a = vectorization_service.transform(cleaned_a)
    tfidf_b, _, top_b = vectorization_service.transform(cleaned_b)
    
    similarity = compare_two_matrices(tfidf_a, tfidf_b)
    common = list(set(top_a) & set(top_b))
    
    return CompareResponse(
        similarity_score=similarity,
        batch_a_size=len(texts_a),
        batch_b_size=len(texts_b),
        batch_a_top_terms=top_a,
        batch_b_top_terms=top_b,
        common_terms=common
    )

@router.get("/history", response_model=List[DriftLogResponse])
def get_history(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(DriftLog).order_by(DriftLog.timestamp.desc()).limit(limit).all()
    return logs

@router.post("/analyze-texts", response_model=UploadResponse)
async def analyze_texts(payload: dict, db: Session = Depends(get_db)):
    texts = payload.get("texts", [])
    if not texts:
        raise HTTPException(status_code=400, detail="No texts provided")
    
    cleaned_texts = [clean_text(text) for text in texts]
    tfidf_matrix, pca_vectors, top_terms = vectorization_service.transform(cleaned_texts)
    
    is_drifted, similarity, batch_centroid, topic_drift, category_drift = detect_drift(
        tfidf_matrix, 
        pca_vectors, 
        vectorization_service.vectorizer, 
        settings.SIMILARITY_THRESHOLD
    )
    
    # Send PCA points
    sample_size = min(200, len(pca_vectors))
    sample_indices = pd.Series(range(len(pca_vectors))).sample(sample_size).values
    pca_points = pca_vectors[sample_indices, :2].tolist()
    
    # Save to DB
    db_log = DriftLog(
        batch_size=len(texts),
        similarity_score=similarity,
        is_drifted=is_drifted,
        top_terms=top_terms,
        pca_points=pca_points,
        topic_drift=topic_drift,
        category_drift=category_drift
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return UploadResponse(
        similarity_score=similarity,
        drift_detected=is_drifted,
        batch_size=len(texts),
        top_terms=top_terms,
        timestamp=db_log.timestamp,
        pca_points=pca_points,
        topic_drift=topic_drift,
        category_drift=category_drift
    )

@router.post("/extract-articles")
async def extract_articles(file: UploadFile = File(...)):
    texts = await parse_uploaded_file(file)
    return {"articles": texts}

@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    latest_log = db.query(DriftLog).order_by(DriftLog.timestamp.desc()).first()
    
    from sqlalchemy import func
    total_articles = db.query(func.sum(DriftLog.batch_size)).scalar() or 0
    total_batches = db.query(func.count(DriftLog.id)).scalar() or 0
    drift_count = db.query(func.count(DriftLog.id)).filter(DriftLog.is_drifted == True).scalar() or 0
    
    return DashboardStats(
        latest_similarity=latest_log.similarity_score if latest_log else 1.0,
        total_articles_processed=total_articles,
        total_batches=total_batches,
        drift_count=drift_count,
        last_updated=latest_log.timestamp if latest_log else None
    )

@router.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": vectorization_service.pca is not None}

@router.post("/fetch-news-and-analyze", response_model=UploadResponse)
async def fetch_news_and_analyze(payload: dict, db: Session = Depends(get_db)):
    category = payload.get("category", "politics") 
    if category == "general":
        category = "top"
    api_key = settings.NEWS_API_KEY
    
    if api_key == "your_newsapi_key_here":
        raise HTTPException(status_code=400, detail="Please provide a valid NewsAPI key in backend settings.")

    # Using newsdata.io as requested
    url = f"https://newsdata.io/api/1/latest?apikey={api_key}&language=en&category={category}&country=in&timezone=asia/kolkata"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
        results = data.get("results", [])
        if not results:
            raise HTTPException(status_code=404, detail="No articles found for this category.")
            
        texts = [f"{a.get('title', '')}. {a.get('description', '')}. {a.get('content', '')}" for a in results]
        
        # Now use the existing analyze logic
        from app.services.drift import detect_drift
        from app.services.vectorization import vectorization_service
        from app.services.preprocessing import clean_text

        cleaned_texts = [clean_text(t) for t in texts]
        tfidf_matrix, pca_vectors, _ = vectorization_service.transform(cleaned_texts)
        
        # FIX: Correct signature and return unpacking
        is_drifted, similarity, _, topic_drift, category_drift = detect_drift(
            tfidf_matrix, 
            pca_vectors,
            vectorization_service.vectorizer,
            settings.SIMILARITY_THRESHOLD
        )
        
        # Get top terms for the response (using terms from transform if needed)
        # Vectorization service already returns top terms in the 3rd return value
        _, _, top_terms = vectorization_service.transform(cleaned_texts)

        # Send PCA points
        sample_size = min(200, len(pca_vectors))
        sample_indices = pd.Series(range(len(pca_vectors))).sample(sample_size).values
        pca_points = pca_vectors[sample_indices, :2].tolist()
        
        # Save to DB
        db_log = DriftLog(
            batch_size=len(texts),
            similarity_score=similarity,
            is_drifted=is_drifted,
            top_terms=top_terms,
            pca_points=pca_points,
            topic_drift=topic_drift,
            category_drift=category_drift
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        return UploadResponse(
            similarity_score=similarity,
            drift_detected=is_drifted,
            batch_size=len(texts),
            top_terms=top_terms,
            timestamp=db_log.timestamp,
            pca_points=pca_points,
            topic_drift=topic_drift,
            category_drift=category_drift
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch or analyze news: {str(e)}")
