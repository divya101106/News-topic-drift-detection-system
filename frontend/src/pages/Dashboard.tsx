import { useEffect, useState } from 'react';
import { Activity, Database, Clock, Layers } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import SimilarityGauge from '../components/SimilarityGauge';
import DriftAlertBanner from '../components/DriftAlertBanner';
import PCAScatterChart from '../components/PCAScatterChart';
import TopTermsChips from '../components/TopTermsChips';
import HistoryTable from '../components/HistoryTable';
import { getDashboardStats, getHistory } from '../services/api';
import { formatDistanceToNow, format } from 'date-fns';

import TopicDriftChart from '../components/TopicDriftChart';
import CategoryDriftChart from '../components/CategoryDriftChart';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        getDashboardStats(),
        getHistory(10) // Get more for dashboard
      ]);
      setStats(statsData);
      setLogs(logsData);
      
      // Auto-select latest if none selected
      if (logsData.length > 0 && !selectedLog) {
        setSelectedLog(logsData[0]);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const displayLog = selectedLog || (logs.length > 0 ? logs[0] : null);
  const isDrifted = displayLog?.is_drifted;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="w-12 h-12 text-brand-primary mb-4 animate-bounce" />
          <p className="text-brand-primary font-mono tracking-widest text-sm uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)]">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">System Dashboard</h1>
          <p className="text-text-muted mt-1">
            {selectedLog 
              ? `Viewing analysis for Batch #${selectedLog.id.toString().substring(0,8)}` 
              : 'Monitor topic shifts across incoming news batches'}
          </p>
        </div>
        {selectedLog && (
          <div className="text-xs text-text-muted bg-bg-surface-hover px-3 py-1 rounded-full border border-border-subtle">
            Scan Date: {format(new Date(selectedLog.timestamp), 'MMM dd, HH:mm')}
          </div>
        )}
      </div>

      {displayLog && (
        <DriftAlertBanner 
          isDrifted={displayLog.is_drifted} 
          score={displayLog.similarity_score} 
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Batch Similarity" 
          value={displayLog?.similarity_score?.toFixed(3) || "0.000"} 
          subtitle="Match to reference baseline"
          icon={<Activity />}
          glowColor={isDrifted ? 'red' : 'cyan'}
          delay={0.1}
        />
        <MetricCard 
          title="Batch Size" 
          value={displayLog?.batch_size || 0} 
          subtitle="Articles in this batch"
          icon={<Database />}
          delay={0.2}
        />
        <MetricCard 
          title="Total Shifts" 
          value={stats?.drift_count || 0} 
          subtitle="All-time drift events"
          icon={<Layers />}
          delay={0.3}
        />
        <MetricCard 
          title="Last Sync" 
          value={stats?.last_updated ? formatDistanceToNow(new Date(stats.last_updated), { addSuffix: true }) : 'Never'} 
          subtitle="System uptime status"
          icon={<Clock />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Gauge and Terms */}
        <div className="space-y-6">
          <SimilarityGauge score={displayLog?.similarity_score || 1.0} />
          {displayLog && <TopTermsChips terms={displayLog.top_terms} />}
          {displayLog?.category_drift && (
            <CategoryDriftChart data={displayLog.category_drift} />
          )}
        </div>
        
        {/* Middle/Right - PCA Chart and Topic Drift */}
        <div className="lg:col-span-2 space-y-6">
          <PCAScatterChart 
            pcaPoints={displayLog?.pca_points || []} 
            isDrifted={isDrifted} 
          />
          {displayLog?.topic_drift && (
            <TopicDriftChart data={displayLog.topic_drift} />
          )}
        </div>
      </div>

      {/* Recent History */}
      <div className="h-[500px]">
        <HistoryTable 
          logs={logs} 
          onSelectLog={setSelectedLog}
          selectedLogId={selectedLog?.id}
        />
      </div>
    </div>
  );
}
