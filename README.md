# News Topic Drift Detection System

## Overview

The News Topic Drift Detection System is a monitoring tool designed to identify shifts in news themes over time. It compares incoming batches of news articles against a established baseline to determine if the current discussion topics have changed significantly. This is critical for understanding when a news source or dataset is diverging from its intended focus or when new trends are overshadowing historical patterns.

## Getting Started

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/divya101106/News-topic-drift-detection-system.git
   cd News-topic-drift-detection-system
   ```

2. Backend Setup:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Frontend Setup:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Project

### Start Backend
From the `backend` directory:
```bash
source venv/bin/activate
uvicorn app.main:app --reload
```
The backend will be available at `http://localhost:8000`.

### Start Frontend
From the `frontend` directory:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## Core Functionality

1. Batch Scan: Analyzes a single collection of articles against the system baseline.
2. Article Selection: Allows users to preview uploaded files and manually select specific articles for analysis.
3. Batch Comparison: Directly compares two different news sets to calculate their mutual correlation.
4. Drift Visualization: Provides graphical breakdowns of how topics are shifting at a term-by-term and category-by-category level.

## Machine Learning Models

The system relies on several statistical and machine learning models to process text:

1. TF-IDF Vectorizer: A Scikit-learn model that converts raw text into numerical vectors. It assigns weights to words based on how frequently they appear in a document relative to the entire dataset.
2. Principal Component Analysis (PCA): A dimensionality reduction model that takes high-dimensional TF-IDF data and compresses it into two dimensions (X and Y coordinates) for visual plotting.
3. Category Centroids: A collection of reference vectors representing four major news domains: Politics & Religion, Technology, Science, and Sports.

## Project Structure

### Backend (Python/FastAPI)

- app/main.py: The entry point of the server that initializes the API and database.
- app/api/routes.py: Contains all API endpoints for file uploads, analysis, and history retrieval.
- app/services/drift.py: The core logic for calculating cosine similarity, topic deltas, and category alignment.
- app/services/vectorization.py: Handles the loading of pre-trained models and transformation of text into vectors.
- app/services/preprocessing.py: Cleans raw text by removing stop words, lemmatizing, and filtering short tokens.
- app/db/models.py: Defines the database schema for storing history logs.
- app/db/schemas.py: Defines the data validation rules for API requests and responses.

### Frontend (React/TypeScript)

- src/pages/Dashboard.tsx: The main monitoring center showing real-time stats and interactive history.
- src/pages/ScanBatch.tsx: The interface for uploading and selecting articles for baseline comparison.
- src/pages/CompareBatches.tsx: The interface for side-by-side comparison of two news sets.
- src/components/ArticleSelector.tsx: UI component for previewing and picking articles from a file.
- src/components/TopicDriftChart.tsx: Visualizes the specific terms contributing to a shift.
- src/components/CategoryDriftChart.tsx: Shows how a batch aligns with different news categories.
- src/components/PCAScatterChart.tsx: Plots articles on a 2D map to show topical clusters.
- src/services/api.ts: The bridge between the frontend UI and the backend services.

### Models and Data

- models/generate_mock_models.py: Script used to train the vectorizer and generate reference centroids using the 20 Newsgroups dataset.
- models/tfidf_vectorizer.pkl: The saved TF-IDF model.
- models/category_centroids.joblib: Dictionary of reference vectors for domain alignment.

## Logic and Algorithms

### Centroid-Based Comparison
Instead of comparing every article individually, the system calculates a "Centroid" for the entire batch. This is the mathematical average of all TF-IDF vectors in the set, representing the core theme of the batch.

### Cosine Similarity
The system uses Cosine Similarity to measure the distance between the batch centroid and the baseline. This algorithm looks at the angle between vectors rather than their magnitude, making it ideal for text comparison where document length varies.

### Linear Score Rescaling
Raw cosine similarity scores in high-dimensional text space often cluster between 0.15 and 0.75 even for similar content. The system applies a linear transformation to map these raw values onto a human-friendly 0% to 100% scale, where anything below 75% is typically flagged as a "Drift."

### Topic Breakdown (Delta TF-IDF)
To explain "why" a drift occurred, the system calculates the difference in importance for every word between the baseline and the current batch. Terms with the highest positive or negative change are displayed to the user as the primary drivers of the drift.

## Deployment (Non-Docker)

To deploy the project in production mode on a local server or VM:

1. **Prerequisites**: Ensure you have Node.js (v18+) and Python (v3.9+) installed.
2. **Run Deployment Script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

This script will:
- Build the React frontend into static assets.
- Configure the FastAPI backend to serve those assets.
- Start a production-ready Uvicorn server on port 8000.

You can then access the application at `http://localhost:8000`.

## Online Deployment (Render.com)

Render is the recommended platform for this project as it supports both the FastAPI backend and the ML models.

### Step-by-Step Instructions:

1. **Push to GitHub**: Upload your project to a GitHub repository.
2. **Create a New Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
   - Connect your GitHub repository.
3. **Configure Settings**:
   - **Environment**: `Python 3`
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `cd backend && gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
4. **Environment Variables**:
   - Go to the **Environment** tab in Render.
   - Add `NEWS_API_KEY`: `pub_d8ede7bbda494f5fa882230aa626cbc4` (or your personal key).
   - Add `PYTHONPATH`: `./backend`

### Why not Vercel?
While Vercel is great for React, it has a 50MB limit for serverless functions, which is too small for Scikit-learn and the associated ML models used in this project. Render handles these dependencies perfectly.
