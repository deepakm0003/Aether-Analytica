import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Bell, ToggleLeft, ToggleRight, Trash2, Check, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  onClearHistory?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClearHistory }) => {
  // Preference States
  const [allowTraining, setAllowTraining] = useState(false);
  const [localStorageEnabled, setLocalStorageEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // API Key UI States
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [apiKey, setApiKey] = useState("************************");
  const [showKeySuccess, setShowKeySuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aether_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllowTraining(parsed.allowTraining ?? false);
        setLocalStorageEnabled(parsed.localStorageEnabled ?? true);
        setNotifications(parsed.notifications ?? true);
        setWeeklyDigest(parsed.weeklyDigest ?? false);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  // Save settings to localStorage on change
  useEffect(() => {
    const settings = {
      allowTraining,
      localStorageEnabled,
      notifications,
      weeklyDigest
    };
    localStorage.setItem('aether_settings', JSON.stringify(settings));
  }, [allowTraining, localStorageEnabled, notifications, weeklyDigest]);

  const handleUpdateKey = () => {
    if (isEditingKey) {
      // Simulate saving
      setIsEditingKey(false);
      setShowKeySuccess(true);
      setTimeout(() => setShowKeySuccess(false), 2000);
      setApiKey("************************");
    } else {
      setApiKey(""); // Clear mask to allow typing
      setIsEditingKey(true);
    }
  };

  const ToggleBtn = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button 
      onClick={onClick} 
      className="focus:outline-none transition-transform active:scale-95"
    >
      {active ? (
        <ToggleRight className="text-cyan-400" size={32} />
      ) : (
        <ToggleLeft className="text-slate-600" size={32} />
      )}
    </button>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-white mb-2">Settings & Preferences</h2>
        <p className="text-slate-400">Manage your Aether Analytica experience.</p>
      </div>

      {/* Profile Section */}
      <div className="glass-panel rounded-2xl p-8">
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">User Profile</h3>
         <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
              AA
            </div>
            <div>
               <h4 className="text-xl font-medium text-white">Demo User</h4>
               <p className="text-slate-400 text-sm">Pro License Active • Kaggle Hackathon Edition</p>
            </div>
            <button className="md:ml-auto px-4 py-2 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              Edit Profile
            </button>
         </div>
      </div>

      {/* API Configuration */}
      <div className="glass-panel rounded-2xl p-8">
         <div className="flex items-center gap-3 mb-6">
            <Key className="text-cyan-400" size={20} />
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Model Configuration</h3>
         </div>
         <div className="space-y-4">
            <div className="flex flex-col gap-2">
               <label className="text-sm text-slate-300">Gemini API Key</label>
               <div className="flex gap-3">
                  <input 
                    type={isEditingKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    readOnly={!isEditingKey}
                    placeholder="Enter API Key"
                    className={`flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-slate-400 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors ${isEditingKey ? 'text-white' : ''}`}
                  />
                  <button 
                    onClick={handleUpdateKey}
                    className={`px-4 py-2 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                      ${isEditingKey ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-white/5 text-slate-300 hover:bg-white/10'}
                    `}
                  >
                    {isEditingKey ? (
                      <>Save Key</>
                    ) : (
                      showKeySuccess ? <><Check size={16} /> Saved</> : "Update"
                    )}
                  </button>
               </div>
               <p className="text-xs text-slate-500 flex items-center gap-1">
                 {isEditingKey ? (
                   <span className="text-amber-400 flex items-center gap-1"><AlertCircle size={12}/> Be careful sharing your screen.</span>
                 ) : (
                   "Using Gemini 2.5 Flash for low-latency reasoning."
                 )}
               </p>
            </div>
         </div>
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Privacy */}
         <div className="glass-panel rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="text-emerald-400" size={20} />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Privacy</h3>
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-300 block">Allow Data Training</span>
                    <span className="text-xs text-slate-500">Help improve the model</span>
                  </div>
                  <ToggleBtn active={allowTraining} onClick={() => setAllowTraining(!allowTraining)} />
               </div>
               <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-300 block">Local Storage History</span>
                    <span className="text-xs text-slate-500">Save analysis on device</span>
                  </div>
                  <ToggleBtn active={localStorageEnabled} onClick={() => setLocalStorageEnabled(!localStorageEnabled)} />
               </div>
               
               {onClearHistory && (
                  <div className="pt-4 border-t border-white/5">
                    <button 
                      onClick={onClearHistory}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors group"
                    >
                      <Trash2 size={16} className="group-hover:animate-bounce" />
                      Clear Database
                    </button>
                  </div>
               )}
            </div>
         </div>

         {/* Notifications */}
         <div className="glass-panel rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="text-purple-400" size={20} />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Notifications</h3>
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-slate-300">Analysis Complete Alert</span>
                  <ToggleBtn active={notifications} onClick={() => setNotifications(!notifications)} />
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-300">Weekly Digest</span>
                  <ToggleBtn active={weeklyDigest} onClick={() => setWeeklyDigest(!weeklyDigest)} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SettingsView;