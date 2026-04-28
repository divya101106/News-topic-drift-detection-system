import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard-stats');
  return response.data;
};

export const getHistory = async (limit = 100) => {
  const response = await api.get(`/history?limit=${limit}`);
  return response.data;
};

export const uploadBatch = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload-batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const compareBatches = async (fileA: File, fileB: File) => {
  const formData = new FormData();
  formData.append('file_a', fileA);
  formData.append('file_b', fileB);
  
  const response = await api.post('/compare-batches', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const extractArticles = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/extract-articles', formData);
  return response.data.articles;
};

export const analyzeTexts = async (texts: string[]) => {
  const response = await api.post('/analyze-texts', { texts });
  return response.data;
};

export const compareTexts = async (texts_a: string[], texts_b: string[]) => {
  const response = await api.post('/compare-texts', { texts_a, texts_b });
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};
