import React, { useState, useEffect } from 'react';
import { analyzeLifeInput } from './services/geminiService';
import { AnalysisResult, HistoryItem, InputItem, ChatMessage } from './types';
import InputArea from './components/InputArea';
import AnalysisDashboard from './components/AnalysisDashboard';
import Sidebar from './components/Sidebar';
import { HistoryView, GraphView } from './components/HistoryView';
import { AetherLogo } from './components/Logo';
import SettingsView from './components/SettingsView';
import { Plus } from 'lucide-react';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userImages, setUserImages] = useState<string[]>([]); // Changed to array
  
  // State for Navigation and History
  const [currentView, setCurrentView] = useState('dashboard');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryItem, setActiveHistoryItem] = useState<HistoryItem | null>(null);

  // --- PERSISTENCE LAYER ---
  useEffect(() => {
    // Load from DB (LocalStorage) on mount
    const saved = localStorage.getItem('aether_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-hydrate Date objects
        const hydrated = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(hydrated);
      } catch (e) {
        console.error("Database load error:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to DB (LocalStorage) on change
    if (history.length > 0) {
      localStorage.setItem('aether_history', JSON.stringify(history));
    }
  }, [history]);

  // --- ACTIONS ---

  const handleAnalyze = async (inputs: InputItem[]) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    // Extract ALL images for Reality Merge display
    const images = inputs
      .filter(i => i.type === 'image')
      .map(i => i.content);
    
    setUserImages(images);

    try {
      const analysis = await analyzeLifeInput(inputs);
      setResult(analysis);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        result: analysis,
        image: images[0] || null, // Primary thumbnail
        images: images, // Store all images
        chatHistory: [] 
      };
      
      setHistory(prev => [newItem, ...prev]);
      setActiveHistoryItem(newItem);

    } catch (err: any) {
      console.error(err);
      setError("Analysis interrupted. Please check your API key or connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    // Reset View State to show InputArea
    setResult(null);
    setActiveHistoryItem(null);
    setUserImages([]);
    setError(null);
    setCurrentView('dashboard');
    setIsAnalyzing(false); 
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'graph' && !activeHistoryItem && history.length > 0) {
      setActiveHistoryItem(history[0]);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    // Load all images if available, fall back to single image if legacy
    const imgs = item.images && item.images.length > 0 
      ? item.images 
      : (item.image ? [item.image] : []);
      
    setUserImages(imgs);
    setActiveHistoryItem(item);
    setCurrentView('dashboard');
  };

  const handleChatUpdate = (historyId: string, messages: ChatMessage[]) => {
    // Update global history state
    setHistory(prev => prev.map(item => 
      item.id === historyId ? { ...item, chatHistory: messages } : item
    ));
    
    // Update active item if it matches
    if (activeHistoryItem?.id === historyId) {
      setActiveHistoryItem(prev => prev ? { ...prev, chatHistory: messages } : null);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all history? This cannot be undone.")) {
      setHistory([]);
      setActiveHistoryItem(null);
      setResult(null);
      localStorage.removeItem('aether_history');
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-50 selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]" />
         <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <Sidebar currentView={currentView} onNavigate={handleNavigate} onNewAnalysis={handleNewAnalysis} />

      <main className="flex-1 ml-0 lg:ml-20 xl:ml-64 relative z-10 p-6 lg:p-10">
        
        {/* Header - Mobile Only */}
        <header className="flex justify-between items-center mb-8 lg:hidden">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 flex items-center justify-center">
               <AetherLogo size={32} />
             </div>
             <span className="font-bold text-white text-xl">AETHER</span>
           </div>
           {/* Mobile New Analysis Button */}
           <button 
             onClick={handleNewAnalysis}
             className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
           >
             <Plus size={24} />
           </button>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto min-h-[85vh] flex flex-col">
          
          {/* DASHBOARD VIEW */}
          {currentView === 'dashboard' && (
            <>
              {!result && !isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center mb-10 text-center animate-in fade-in duration-700">
                   <div className="mb-6 animate-pulse">
                      <AetherLogo size={80} />
                   </div>
                   <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-6">
                     AETHER ANALYTICA
                   </h1>
                   <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-12">
                     The Multimodal World Insight Engine. <br/>
                     Upload reality. Download intelligence.
                   </p>
                   <div className="w-full">
                     <InputArea onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                   </div>
                </div>
              )}

              {isAnalyzing && (
                 <div className="flex-1 flex items-center justify-center">
                    <InputArea onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                 </div>
              )}

              {result && activeHistoryItem && (
                 <AnalysisDashboard 
                   result={result} 
                   userImages={userImages} 
                   historyId={activeHistoryItem.id}
                   initialChatHistory={activeHistoryItem.chatHistory || []}
                   onChatUpdate={handleChatUpdate}
                 />
              )}
            </>
          )}

          {/* HISTORY VIEW */}
          {currentView === 'history' && (
             <div className="w-full">
                <h2 className="text-3xl font-light text-white mb-8 tracking-tight">ANALYSIS HISTORY</h2>
                <HistoryView history={history} onSelect={loadHistoryItem} />
             </div>
          )}

          {/* WORLD GRAPH VIEW */}
          {currentView === 'graph' && (
             <div className="w-full h-full">
                <GraphView currentResult={activeHistoryItem} />
             </div>
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <SettingsView onClearHistory={handleClearHistory} />
          )}

          {error && (
            <div className="fixed bottom-10 right-10 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl backdrop-blur-md animate-in slide-in-from-right-10">
              <p>⚠️ {error}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;