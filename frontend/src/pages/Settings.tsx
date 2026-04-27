import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Server, RefreshCw } from 'lucide-react';
import { checkHealth } from '../services/api';

export default function Settings() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [isChecking, setIsChecking] = useState(true);

  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      const res = await checkHealth();
      setHealthStatus(res.status === 'ok' ? 'Online' : 'Warning');
    } catch (err) {
      setHealthStatus('Offline');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Settings</h1>
        <p className="text-text-muted mt-1">Configure system parameters and view status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle/50 pb-4">
              <SettingsIcon className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-text-main">Detection Configuration</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">Similarity Threshold</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" max="100" 
                    defaultValue="75" 
                    disabled
                    className="w-full accent-cyan-500 opacity-50 cursor-not-allowed" 
                  />
                  <span className="w-12 text-right font-mono text-brand-primary">0.75</span>
                </div>
                <p className="text-xs text-text-muted mt-2">Cosine similarity below this threshold triggers a drift alert. (Configured in backend)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-2">PCA Components</label>
                <input 
                  type="text" 
                  value="Pre-trained Model Default" 
                  disabled 
                  className="input-field w-full opacity-50 cursor-not-allowed" 
                />
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle/50 pb-4">
              <Database className="w-5 h-5 text-brand-primary" />
              <h2 className="text-lg font-bold text-text-main">Model Information</h2>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                <span className="text-text-muted">Vectorization</span>
                <span className="text-text-main font-medium">TF-IDF Vectorizer</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                <span className="text-text-muted">Dimensionality Reduction</span>
                <span className="text-text-main font-medium">PCA (Principal Component Analysis)</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                <span className="text-text-muted">Preprocessing</span>
                <span className="text-text-main font-medium">NLTK (Stopwords, Lemmatization)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Similarity Metric</span>
                <span className="text-text-main font-medium">Cosine Similarity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6 border-b border-border-subtle/50 pb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-brand-primary" />
                <h2 className="text-lg font-bold text-text-main">System Status</h2>
              </div>
              <button 
                onClick={checkApiHealth}
                disabled={isChecking}
                className={`p-1 text-text-muted hover:text-brand-primary transition-colors ${isChecking ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                healthStatus === 'Online' ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                healthStatus === 'Checking...' ? 'bg-border-strong/50 text-text-muted' :
                'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}>
                <Server className="w-8 h-8" />
              </div>
              <span className={`text-xl font-bold ${
                healthStatus === 'Online' ? 'text-green-400' :
                healthStatus === 'Checking...' ? 'text-text-muted' : 'text-red-400'
              }`}>{healthStatus}</span>
              <p className="text-xs text-text-muted mt-2">API Backend Connection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
