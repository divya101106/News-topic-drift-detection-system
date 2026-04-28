import { useState } from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryLog {
  id: string;
  timestamp: string;
  batch_size: number;
  similarity_score: number;
  is_drifted: boolean;
  top_terms: string[];
}

interface HistoryTableProps {
  logs: HistoryLog[];
  isLoading?: boolean;
  onSelectLog?: (log: HistoryLog) => void;
  selectedLogId?: number | null;
}

export default function HistoryTable({ logs, isLoading = false, onSelectLog, selectedLogId }: HistoryTableProps) {
  const [filter, setFilter] = useState<'all' | 'drifted' | 'stable'>('all');
  const [search, setSearch] = useState('');
  
  const filteredLogs = logs.filter(log => {
    if (filter === 'drifted' && !log.is_drifted) return false;
    if (filter === 'stable' && log.is_drifted) return false;
    
    if (search) {
      const termMatch = log.top_terms.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const idMatch = log.id.toLowerCase().includes(search.toLowerCase());
      if (!termMatch && !idMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface-hover/20">
        <h2 className="text-lg font-bold text-text-main tracking-wide">Detection History</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search terms or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 h-9 w-48 text-sm bg-bg-base/50 border-border-subtle focus:border-brand-primary"
            />
          </div>
          
          <div className="flex bg-bg-base/50 rounded-lg p-1 border border-border-subtle">
            {(['all', 'drifted', 'stable'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors",
                  filter === f 
                    ? (f === 'drifted' ? "bg-red-500/20 text-red-400" : f === 'stable' ? "bg-brand-primary/20 text-brand-primary" : "bg-border-strong text-text-main") 
                    : "text-text-muted hover:text-text-main hover:bg-bg-surface-hover"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle/50 text-xs uppercase tracking-wider text-text-muted bg-bg-surface-hover/10">
              <th className="p-4 font-medium">Timestamp</th>
              <th className="p-4 font-medium">Batch ID</th>
              <th className="p-4 font-medium text-center">Size</th>
              <th className="p-4 font-medium text-center">Score</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium">Top Terms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-muted">
                  No detection logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={log.id} 
                  onClick={() => onSelectLog?.(log)}
                  className={clsx(
                    "hover:bg-bg-surface-hover/30 transition-colors group cursor-pointer border-l-2",
                    selectedLogId === Number(log.id) ? "bg-brand-primary/10 border-brand-primary" : "border-transparent"
                  )}
                >
                  <td className="p-4 whitespace-nowrap text-text-main">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="p-4 whitespace-nowrap text-text-muted font-mono text-xs">
                    {String(log.id).substring(0, 8)}
                  </td>
                  <td className="p-4 text-center text-text-main">
                    {log.batch_size}
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className={clsx(
                      log.is_drifted ? "text-red-400" : "text-brand-primary"
                    )}>
                      {log.similarity_score.toFixed(3)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                      log.is_drifted 
                        ? "bg-red-500/10 text-red-400 border border-red-500/30" 
                        : "bg-brand-primary/10 text-brand-primary border border-brand-primary/30"
                    )}>
                      {log.is_drifted ? 'Drifted' : 'Stable'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {log.top_terms.slice(0, 3).map((term, i) => (
                        <span key={i} className="text-xs text-text-muted bg-bg-surface-hover px-2 py-0.5 rounded border border-border-subtle font-mono">
                          {term}
                        </span>
                      ))}
                      {log.top_terms.length > 3 && (
                        <span className="text-xs text-text-muted px-1 py-0.5">+{log.top_terms.length - 3}</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-border-subtle/50 flex items-center justify-between bg-bg-surface-hover/20">
        <span className="text-xs text-text-muted">Showing {filteredLogs.length} entries</span>
        <div className="flex gap-2">
          <button className="p-1 rounded-md text-text-muted hover:text-text-main hover:bg-border-strong disabled:opacity-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-1 rounded-md text-text-muted hover:text-text-main hover:bg-border-strong disabled:opacity-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
