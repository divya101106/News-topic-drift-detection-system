import { useEffect, useState } from 'react';
import { Activity, Database, Clock, Layers } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import SimilarityGauge from '../components/SimilarityGauge';
import DriftAlertBanner from '../components/DriftAlertBanner';
import PCAScatterChart from '../components/PCAScatterChart';
import TopTermsChips from '../components/TopTermsChips';
import HistoryTable from '../components/HistoryTable';
import { getDashboardStats, getHistory } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        getDashboardStats(),
        getHistory(5) // Get latest 5 for dashboard
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // In a real app, we might set up polling here
  }, []);

  const latestLog = logs.length > 0 ? logs[0] : null;
  const isDrifted = stats?.latest_similarity < 0.75; // assuming 0.75 is the threshold

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
      <div>
        <h1 className="text-2xl font-bold text-text-main tracking-tight">News Topic Drift Detection System</h1>
        <p className="text-text-muted mt-1">Monitor topic shifts across incoming news batches in real-time</p>
      </div>

      {latestLog && (
        <DriftAlertBanner 
          isDrifted={latestLog.is_drifted} 
          score={latestLog.similarity_score} 
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Latest Similarity" 
          value={stats?.latest_similarity?.toFixed(3) || "0.000"} 
          subtitle="Cosine distance to baseline"
          icon={<Activity />}
          glowColor={isDrifted ? 'red' : 'cyan'}
          delay={0.1}
        />
        <MetricCard 
          title="Total Articles" 
          value={(stats?.total_articles_processed || 0).toLocaleString()} 
          subtitle="Processed since inception"
          icon={<Database />}
          delay={0.2}
        />
        <MetricCard 
          title="Drift Events" 
          value={stats?.drift_count || 0} 
          subtitle="Total detected shifts"
          icon={<Layers />}
          delay={0.3}
        />
        <MetricCard 
          title="Last Scan" 
          value={stats?.last_updated ? formatDistanceToNow(new Date(stats.last_updated), { addSuffix: true }) : 'Never'} 
          subtitle="Time since last batch"
          icon={<Clock />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Gauge and Terms */}
        <div className="space-y-6">
          <SimilarityGauge score={stats?.latest_similarity || 1.0} />
          {latestLog && <TopTermsChips terms={latestLog.top_terms} />}
        </div>
        
        {/* Middle/Right - PCA Chart */}
        <div className="lg:col-span-2">
          <PCAScatterChart 
            // Send empty for now if we don't store PCA points in DB, 
            // In a real app we might fetch the latest batch's points specifically
            pcaPoints={[]} 
            isDrifted={isDrifted} 
          />
        </div>
      </div>

      {/* Recent History */}
      <div className="h-[400px]">
        <HistoryTable logs={logs} />
      </div>
    </div>
  );
}
