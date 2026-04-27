import { Search, Bell, Menu, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 glass-panel border-b flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-text-muted hover:text-text-main">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search batches..." 
            className="input-field pl-10 h-9 w-64 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">System Online</span>
        </div>
        
        <div className="h-6 w-px bg-border-subtle mx-2 hidden sm:block"></div>
        
        <button 
          onClick={toggleTheme}
          className="relative p-2 text-text-muted hover:text-brand-primary transition-colors duration-200 rounded-full hover:bg-bg-secondary"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="relative p-2 text-text-muted hover:text-brand-primary transition-colors duration-200 rounded-full hover:bg-bg-secondary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-bg-card"></span>
        </button>
        
        <button 
          onClick={() => navigate('/scan')}
          className="btn-primary text-sm h-9 px-4 hidden sm:flex items-center justify-center gap-2"
        >
          <span>Scan Batch</span>
        </button>
      </div>
    </header>
  );
}
