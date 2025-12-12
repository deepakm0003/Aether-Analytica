import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, AnalysisCategory, GraphNode, GraphEdge, ChatMessage } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';
import AetherAssistant from './AetherAssistant';
import { 
  Zap, Heart, DollarSign, Layout, Calendar, Brain,
  Map as MapIcon, BookOpen, Activity, FileDown, Share2, MessageSquare, Flame, AlertCircle, Clock, Smile, TrendingUp
} from 'lucide-react';

interface AnalysisDashboardProps {
  result: AnalysisResult | null;
  userImages?: string[]; // Changed to array
  historyId: string;
  initialChatHistory: ChatMessage[];
  onChatUpdate: (id: string, messages: ChatMessage[]) => void;
}

// --- Sub-Component: Knowledge Graph Visualization (SVG) ---
const KnowledgeGraphViz: React.FC<{ nodes: GraphNode[], edges: GraphEdge[] }> = ({ nodes, edges }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const width = 400;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;

  // --- Smart Concentric Layout ---
  const nodePositions = useMemo(() => {
    // Group nodes by hierarchy
    const entities = nodes.filter(n => n.type === 'entity');
    const actions = nodes.filter(n => n.type === 'action');
    const risks = nodes.filter(n => n.type === 'risk');
    const outcomes = nodes.filter(n => n.type === 'outcome');
    const others = nodes.filter(n => !['entity', 'action', 'risk', 'outcome'].includes(n.type));

    const posMap = new Map<string, { x: number, y: number }>();

    // Helper: Distribute nodes along a circle
    const distribute = (list: GraphNode[], radius: number, startAngle: number = 0) => {
      const count = list.length;
      if (count === 0) return;
      const step = (2 * Math.PI) / count;
      list.forEach((node, i) => {
        const angle = startAngle + i * step - Math.PI / 2; // Start from top
        posMap.set(node.id, {
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
        });
      });
    };

    // Layer 1: Entities (Center)
    // If only 1 entity, put it dead center. If multiple, small ring.
    if (entities.length === 1) {
      posMap.set(entities[0].id, { x: cx, y: cy });
    } else {
      distribute(entities, 40, 0);
    }

    // Layer 2: Actions (Middle Ring)
    distribute(actions, 90, 0.5); // Slight angle offset

    // Layer 3: Outcomes & Risks (Outer Ring)
    // Interleave them or place them together in the outer ring
    distribute([...risks, ...outcomes, ...others], 130, 1.0);

    return nodes.map(n => ({
      ...n,
      ...(posMap.get(n.id) || { x: cx, y: cy }) // Fallback
    }));
  }, [nodes]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'risk': return '#ef4444'; // Red
      case 'outcome': return '#f59e0b'; // Amber
      case 'action': return '#10b981'; // Green
      case 'entity': return '#06b6d4'; // Cyan
      default: return '#94a3b8'; // Slate 400
    }
  };

  const activeNode = nodePositions.find(n => n.id === hoveredNodeId);

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full select-none overflow-visible">
      <defs>
        <marker id="arrowhead-dash" markerWidth="10" markerHeight="7" refX="18" refY="3.5" orient="auto">
          <path d="M0 0 L10 3.5 L0 7" fill="none" stroke="#64748b" strokeWidth="1" />
        </marker>
        <filter id="glow-dash">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="edgeGradient" gradientUnits="userSpaceOnUse">
           <stop offset="0%" stopColor="#334155" stopOpacity="0.4"/>
           <stop offset="100%" stopColor="#64748b" stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      
      {/* Edges */}
      {edges.map((edge, i) => {
        const start = nodePositions.find(n => n.id === edge.from);
        const end = nodePositions.find(n => n.id === edge.to);
        if (!start || !end) return null;
        
        const isConnectedToHover = hoveredNodeId && (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
        
        return (
          <g key={i} className="pointer-events-none transition-all duration-300">
            <line 
              x1={start.x} y1={start.y} 
              x2={end.x} y2={end.y} 
              stroke={isConnectedToHover ? "#22d3ee" : "url(#edgeGradient)"}
              strokeWidth={isConnectedToHover ? "2" : "1"}
              strokeOpacity={hoveredNodeId && !isConnectedToHover ? 0.1 : 1}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {nodePositions.map((node, i) => {
         const isHovered = hoveredNodeId === node.id;
         const isDimmed = hoveredNodeId && hoveredNodeId !== node.id;

         return (
          <g 
            key={node.id} 
            className="cursor-pointer transition-all duration-300"
            style={{ opacity: isDimmed ? 0.2 : 1 }}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            {/* Outer Glow Ring on Hover */}
            <circle 
              cx={node.x} 
              cy={node.y} 
              r={isHovered ? 16 : 0} 
              fill="none"
              stroke={getNodeColor(node.type)}
              strokeWidth="1"
              opacity="0.3"
              className="transition-all duration-300"
            />
            
            {/* Main Node Circle */}
            <circle 
              cx={node.x} 
              cy={node.y} 
              r={isHovered ? 10 : 6} 
              fill={isHovered ? "#fff" : "#0f172a"} 
              stroke={getNodeColor(node.type)} 
              strokeWidth={isHovered ? 0 : 2}
              filter={isHovered ? "url(#glow-dash)" : ""}
              className="transition-all duration-300"
            />
          </g>
        );
      })}

      {/* Interactive Tooltip (Rendered last to be on top) */}
      {activeNode && (
        <g 
          transform={`translate(${activeNode.x}, ${activeNode.y - 20})`} 
          className="pointer-events-none animate-in fade-in zoom-in duration-200"
        >
          {/* Tooltip Background */}
          <rect 
            x="-50" y="-30" width="100" height="30" rx="4" 
            fill="#0f172a" 
            stroke={getNodeColor(activeNode.type)} 
            strokeWidth="1"
            fillOpacity="0.9"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
          />
          
          {/* Tooltip Text */}
          <text y="-11" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
            {activeNode.label.length > 15 ? activeNode.label.substring(0, 14) + '..' : activeNode.label}
          </text>
        </g>
      )}
    </svg>
  );
};

// --- Main Dashboard ---
const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result, userImages, historyId, initialChatHistory, onChatUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'cause-effect'>('overview');
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
    setShowAssistant(false);
  }, [result]);

  if (!result) return null;

  const handleExportPDF = () => {
    generatePDFReport(result, userImages);
  };

  const getCategoryIcon = (category: AnalysisCategory) => {
    // Icons
    const icons: Record<string, any> = {
      ROOM: <Layout className="text-cyan-400" size={24} />,
      FOOD: <Heart className="text-pink-400" size={24} />,
      FINANCE: <DollarSign className="text-emerald-400" size={24} />,
      SCHEDULE: <Calendar className="text-purple-400" size={24} />,
      GOAL: <TrendingUp className="text-amber-400" size={24} />,
      MAP: <MapIcon className="text-blue-400" size={24} />,
      LEARNING: <BookOpen className="text-indigo-400" size={24} />,
      PROBLEM: <Activity className="text-red-400" size={24} />,
      GENERAL: <Brain className="text-slate-400" size={24} />
    };
    return icons[category] || icons.GENERAL;
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      
      {/* LEFT COLUMN - Main Analysis */}
      <div className="flex-1 space-y-6">
        
        {/* Header Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none ${result.isMergedReality ? 'bg-purple-500/20' : 'bg-cyan-500/10'}`} />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                   {getCategoryIcon(result.category)}
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white tracking-tight">{result.category} ANALYSIS</h2>
                   {result.isMergedReality && (
                     <span className="text-xs font-bold text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full bg-purple-500/10">REALITY MERGE ACTIVE</span>
                   )}
                 </div>
               </div>
               <p className="text-slate-300 leading-relaxed max-w-2xl">{result.summary}</p>
            </div>
            
            <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-white/5 bg-white/5 backdrop-blur-md">
               <span className="text-3xl font-bold text-white">{result.score}</span>
               <span className="text-[10px] text-slate-400 uppercase tracking-widest">Score</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-8 border-b border-white/10 pb-1">
             {[
               { id: 'overview', label: 'Overview' },
               { id: 'impact', label: 'Future Impact' },
               { id: 'cause-effect', label: 'Logic Chain' }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 {tab.label}
                 {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
               </button>
             ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Metrics */}
               <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Key Metrics</h3>
                  <div className="space-y-4">
                    {result.metrics.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-sm text-slate-400">{m.label}</span>
                        <span className="font-mono text-white">{m.value} {m.unit}</span>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Graph */}
               <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[300px]">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">World Graph</h3>
                  <div className="flex-1 relative">
                    {result.knowledgeGraph ? (
                      <KnowledgeGraphViz nodes={result.knowledgeGraph.nodes} edges={result.knowledgeGraph.edges} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-600">No Graph Data</div>
                    )}
                  </div>
               </div>

               {/* Reality Merge Intelligence Section (Only if Merged) */}
               {result.isMergedReality && result.mergeConnections && result.mergeConnections.length > 0 && (
                 <div className="md:col-span-2 glass-panel rounded-2xl p-6 border-l-4 border-purple-500 bg-purple-500/5">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Brain size={16} /> Reality Merge Intelligence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.mergeConnections.map((conn, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-500/20 uppercase">{conn.type}</span>
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <span>{conn.source1}</span>
                              <span className="text-slate-600">vs</span>
                              <span>{conn.source2}</span>
                           </div>
                           <p className="text-sm text-white">{conn.insight}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {/* Insights */}
               <div className="md:col-span-2 glass-panel rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Strategic Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.insights.map((insight, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-300">
                        <Zap className="text-yellow-400 shrink-0" size={16} />
                        {insight}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'impact' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Immediate Column */}
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/30 pb-2">Immediate (1 Week)</h4>
                   {result.consequences?.filter(c => c.timeframe === 'immediate').map((cons, i) => (
                      <div key={i} className={`p-4 rounded-xl border border-white/5 bg-white/5 ${cons.severity === 'high' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-cyan-500'}`}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 uppercase">{cons.domain}</span>
                         </div>
                         <p className="text-sm text-slate-200">{cons.prediction}</p>
                      </div>
                   ))}
                   {!result.consequences?.some(c => c.timeframe === 'immediate') && <p className="text-xs text-slate-600 italic">No immediate impacts detected.</p>}
                </div>

                {/* Short Term Column */}
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-blue-500/30 pb-2">Short Term (1 Month)</h4>
                   {result.consequences?.filter(c => c.timeframe === 'short_term').map((cons, i) => (
                      <div key={i} className={`p-4 rounded-xl border border-white/5 bg-white/5 ${cons.severity === 'high' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 uppercase">{cons.domain}</span>
                         </div>
                         <p className="text-sm text-slate-200">{cons.prediction}</p>
                      </div>
                   ))}
                   {!result.consequences?.some(c => c.timeframe === 'short_term') && <p className="text-xs text-slate-600 italic">No short term impacts detected.</p>}
                </div>

                {/* Long Term Column */}
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/30 pb-2">Long Term (1 Year)</h4>
                   {result.consequences?.filter(c => c.timeframe === 'long_term').map((cons, i) => (
                      <div key={i} className={`p-4 rounded-xl border border-white/5 bg-white/5 ${cons.severity === 'high' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-purple-500'}`}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 uppercase">{cons.domain}</span>
                         </div>
                         <p className="text-sm text-slate-200">{cons.prediction}</p>
                      </div>
                   ))}
                   {!result.consequences?.some(c => c.timeframe === 'long_term') && <p className="text-xs text-slate-600 italic">No long term impacts detected.</p>}
                </div>

                {/* Legacy Fallback if no consequences */}
                {!result.consequences && (
                   <div className="col-span-3 text-center py-10 text-slate-500">
                      Run a new analysis to see temporal consequences.
                   </div>
                )}
             </div>
          )}

          {activeTab === 'cause-effect' && (
             <div className="glass-panel rounded-2xl p-8 relative">
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-800" />
                <div className="space-y-8">
                   {result.causeEffectChain?.map((step, i) => (
                      <div key={i} className="relative pl-10">
                         <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 z-10" />
                         <h4 className="text-white font-medium mb-1">{step.step}</h4>
                         <p className="text-sm text-slate-400">{step.description}</p>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN - Tools & Actions */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* NEW: WINNING FEATURE - LIVE LINK BUTTON */}
        <div className="glass-card rounded-2xl p-1 bg-gradient-to-r from-cyan-500 to-blue-600">
           <button 
             onClick={() => setShowAssistant(!showAssistant)}
             className="w-full py-4 bg-[#020617] hover:bg-[#0f172a] rounded-xl flex items-center justify-center gap-3 transition-colors group relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <MessageSquare size={20} className="text-cyan-400" />
             <div className="text-left">
               <span className="block font-bold text-white text-sm">Open Aether Live</span>
               <span className="block text-[10px] text-cyan-400">Chat with this Analysis</span>
             </div>
           </button>
        </div>

        {/* Actions Box */}
        <div className="glass-panel rounded-2xl p-6">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Recommended Actions</h3>
           <div className="space-y-3">
              {result.actionPlan.map((action, i) => (
                 <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="mt-0.5 w-4 h-4 rounded border border-slate-600 group-hover:border-emerald-500 flex items-center justify-center">
                       <div className="w-2 h-2 bg-emerald-500 opacity-0 group-hover:opacity-100 rounded-sm transition-opacity" />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action}</span>
                 </div>
              ))}
           </div>
        </div>

        {/* Export Tools */}
        <div className="glass-card rounded-2xl p-6">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Tools</h3>
           <div className="space-y-3">
              <button 
                onClick={handleExportPDF}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all"
              >
                 <FileDown size={16} />
                 Download PDF Report
              </button>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-slate-300 flex items-center justify-center gap-2 transition-all">
                 <Share2 size={16} />
                 Share Analysis
              </button>
           </div>
        </div>

        {/* Risks/Opps Summary (Mini) */}
        <div className="glass-panel rounded-2xl p-6 flex-1">
           <div className="mb-6">
             <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Risks</h3>
             <ul className="text-sm text-slate-400 space-y-1">
               {result.risks?.slice(0,2).map((r,i) => <li key={i}>• {r}</li>)}
             </ul>
           </div>
           <div>
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Opportunities</h3>
             <ul className="text-sm text-slate-400 space-y-1">
               {result.opportunities?.slice(0,2).map((o,i) => <li key={i}>• {o}</li>)}
             </ul>
           </div>
        </div>

      </div>

      {/* Floating Assistant Panel */}
      {showAssistant && (
        <AetherAssistant 
           analysisResult={result} 
           onClose={() => setShowAssistant(false)} 
           initialMessages={initialChatHistory}
           onUpdateMessages={(msgs) => onChatUpdate(historyId, msgs)}
        />
      )}

    </div>
  );
};

export default AnalysisDashboard;