import React from 'react';
import { LayoutDashboard, Brain, History, Settings, FileText, Globe, Plus } from 'lucide-react';
import { AetherLogo } from './Logo';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onNewAnalysis: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onNewAnalysis }) => {
  return (
    <div className="hidden lg:flex flex-col w-20 xl:w-64 h-screen fixed left-0 top-0 border-r border-white/10 glass-panel z-50">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div className="flex-shrink-0">
          <AetherLogo size={36} />
        </div>
        <span className="hidden xl:block font-bold text-lg tracking-tight text-white">AETHER</span>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 mb-6">
        <button 
          onClick={onNewAnalysis}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all active:scale-95 group"
          title="Start New Analysis"
        >
          <Plus size={20} className="transition-transform group-hover:rotate-90" />
          <span className="hidden xl:block">New Analysis</span>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')} 
        />
        <NavItem 
          icon={<Globe size={20} />} 
          label="World Graph" 
          active={currentView === 'graph'} 
          onClick={() => onNavigate('graph')} 
        />
        <NavItem 
          icon={<History size={20} />} 
          label="History" 
          active={currentView === 'history'} 
          onClick={() => onNavigate('history')} 
        />
      </nav>

      <div className="p-4 border-t border-white/10">
        <NavItem icon={<Settings size={20} />} label="Settings" active={currentView === 'settings'} onClick={() => onNavigate('settings')} />
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
      active 
      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className="hidden xl:block font-medium text-sm">{label}</span>
  </button>
);

export default Sidebar;