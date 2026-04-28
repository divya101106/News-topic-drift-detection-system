import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, UploadCloud, Settings, Activity, ArrowRightLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Scan New Batch', path: '/scan', icon: UploadCloud },
  { name: 'Compare Batches', path: '/compare', icon: ArrowRightLeft },
  { name: 'History Logs', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r flex flex-col z-20 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border-subtle">
        <Activity className="w-6 h-6 text-brand-primary mr-3" />
        <span className="text-xl font-bold tracking-wide text-text-primary flex items-center gap-2">
          Drift<span className="text-brand-primary">Sense</span>
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-brand-primary/10 text-brand-primary dark:text-brand-primary font-semibold" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-brand-primary/5 rounded-xl border border-brand-primary/20 shadow-[inset_2px_0_0_0_var(--color-brand-primary)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <Icon className={clsx("w-5 h-5 mr-3 relative z-10 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="font-medium text-sm relative z-10">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-6 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-slate-900 font-bold text-xs shadow-soft">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">Admin User</span>
            <span className="text-xs text-text-muted">System Operator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
