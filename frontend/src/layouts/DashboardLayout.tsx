import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Removed cyber background ambient glow effects */}
      <Sidebar />
      
      <div className="flex-1 md:ml-64 flex flex-col relative z-10 min-h-screen">
        <Topbar />
        
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
