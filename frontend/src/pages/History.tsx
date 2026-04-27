import { useEffect, useState } from 'react';
import HistoryTable from '../components/HistoryTable';
import { getHistory } from '../services/api';


export default function History() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getHistory(100);
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">Detection Logs</h1>
        <p className="text-text-muted mt-1">Complete history of all processed news batches and drift analysis</p>
      </div>
      
      <div className="h-full">
        <HistoryTable logs={logs} isLoading={loading} />
      </div>
    </div>
  );
}
