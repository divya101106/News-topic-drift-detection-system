import React, { useState } from 'react';
import { Search, CheckCircle2, Circle, ListFilter } from 'lucide-react';

interface ArticleSelectorProps {
  articles: string[];
  onAnalyze: (selectedTexts: string[]) => void;
  onCancel: () => void;
}

const ArticleSelector: React.FC<ArticleSelectorProps> = ({ articles, onAnalyze, onCancel }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(articles.map((_, i) => i)));
  const [searchTerm, setSearchTerm] = useState('');

  const toggleArticle = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleAll = () => {
    if (selectedIndices.size === articles.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(articles.map((_, i) => i)));
    }
  };

  const filteredArticles = articles
    .map((text, index) => ({ text, index }))
    .filter(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAnalyze = () => {
    const selectedTexts = Array.from(selectedIndices).map(i => articles[i]);
    onAnalyze(selectedTexts);
  };

  return (
    <div className="glass-card flex flex-col h-[600px] overflow-hidden">
      <div className="p-6 border-b border-border-subtle bg-bg-surface/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-brand-primary" />
            Article Selection
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">
              {selectedIndices.size} of {articles.length} selected
            </span>
            <button 
              onClick={toggleAll}
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              {selectedIndices.size === articles.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search articles..." 
            className="w-full bg-[#0b0c0e] border border-border-strong rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-brand-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0b0c0e]/30">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(({ text, index }) => (
            <div 
              key={index}
              onClick={() => toggleArticle(index)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                selectedIndices.has(index) 
                  ? 'bg-brand-primary/5 border-brand-primary/30' 
                  : 'bg-transparent border-border-subtle hover:border-slate-600'
              }`}
            >
              {selectedIndices.has(index) ? (
                <CheckCircle2 className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-text-muted mt-1 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm text-white line-clamp-3 leading-relaxed">
                  {text || <span className="text-text-muted italic">No content</span>}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono">
                    Index #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>No articles found matching your search</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border-subtle bg-bg-surface/50 flex justify-end gap-4">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button 
          onClick={handleAnalyze}
          disabled={selectedIndices.size === 0}
          className="btn-primary"
        >
          Analyze Selected Articles
        </button>
      </div>
    </div>
  );
};

export default ArticleSelector;
