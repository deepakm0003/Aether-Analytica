import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HistoryItem, GraphNode, GraphEdge } from '../types';
import { FileDown, Calendar, Search, ArrowRight, Activity, History, ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';
import { generatePDFReport } from '../utils/pdfGenerator';

// --- Full Screen Graph Visualization ---
const FullScreenGraph: React.FC<{ nodes: GraphNode[], edges: GraphEdge[] }> = ({ nodes, edges }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // View State for Pan/Zoom
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Dimensions for full screen view (internal coordinate system)
  const width = 800;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;

  // --- Zoom/Pan Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, viewState.scale + delta), 4);
    setViewState(prev => ({ ...prev, scale: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => setViewState({ x: 0, y: 0, scale: 1 });
  const zoomIn = () => setViewState(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 4) }));
  const zoomOut = () => setViewState(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.2) }));

  // --- Smart Positioning Logic (Scaled Up) ---
  const nodePositions = useMemo(() => {
    // Categorize
    const entities = nodes.filter(n => n.type === 'entity');
    const actions = nodes.filter(n => n.type === 'action');
    const results = nodes.filter(n => ['risk', 'outcome'].includes(n.type));
    const others = nodes.filter(n => !['entity', 'action', 'risk', 'outcome'].includes(n.type));

    const posMap = new Map<string, {x: number, y: number}>();

    // Distribution Helper
    const distribute = (list: GraphNode[], radiusX: number, radiusY: number, startAngle: number = 0) => {
      const count = list.length;
      if (count === 0) return;
      const step = (2 * Math.PI) / count;
      list.forEach((node, i) => {
        const angle = startAngle + i * step - Math.PI / 2;
        posMap.set(node.id, {
          x: cx + radiusX * Math.cos(angle),
          y: cy + radiusY * Math.sin(angle)
        });
      });
    };

    // Layer 1: Entities (Center)
    if (entities.length === 1) {
        posMap.set(entities[0].id, { x: cx, y: cy });
    } else {
        distribute(entities, 100, 80);
    }

    // Layer 2: Actions
    distribute(actions, 220, 160, 0.5);

    // Layer 3: Results
    distribute([...results, ...others], 320, 240, 1.0);

    return nodes.map(n => ({
        ...n,
        ...(posMap.get(n.id) || { x: cx, y: cy })
    }));
  }, [nodes]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'risk': return '#ef4444'; 
      case 'outcome': return '#f59e0b'; 
      case 'action': return '#10b981'; 
      case 'entity': return '#06b6d4';
      default: return '#64748b'; 
    }
  };

  const activeNode = nodePositions.find(n => n.id === hoveredNodeId);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950/50">
      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl">
        <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-lg text-white" title="Zoom In"><ZoomIn size={20}/></button>
        <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-lg text-white" title="Zoom Out"><ZoomOut size={20}/></button>
        <div className="h-px bg-white/10 my-1"/>
        <button onClick={resetView} className="p-2 hover:bg-white/10 rounded-lg text-cyan-400" title="Reset View"><RefreshCw size={20}/></button>
      </div>

      <svg 
        ref={svgRef}
        viewBox="0 0 800 600" 
        className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrowhead-fs" markerWidth="14" markerHeight="10" refX="28" refY="5" orient="auto">
            <path d="M0 0 L14 5 L0 10" fill="#64748b" opacity="0.8" />
          </marker>
          <filter id="glow-fs">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
          <linearGradient id="edgeGradientFS" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#475569" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.8"/>
          </linearGradient>
        </defs>

        {/* Dynamic Transform Group */}
        <g transform={`translate(${viewState.x}, ${viewState.y}) scale(${viewState.scale})`}>
          
          {/* Infinite-like Background Grid */}
          <rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#grid)" />
        
          {/* Edges */}
          {edges.map((edge, i) => {
            const start = nodePositions.find(n => n.id === edge.from);
            const end = nodePositions.find(n => n.id === edge.to);
            if (!start || !end) return null;
            
            const isConnectedToHover = hoveredNodeId && (edge.from === hoveredNodeId || edge.to === hoveredNodeId);
            
            return (
              <g key={i} className="transition-opacity duration-300" style={{ opacity: hoveredNodeId && !isConnectedToHover ? 0.1 : 1 }}>
                <line 
                  x1={start.x} y1={start.y} 
                  x2={end.x} y2={end.y} 
                  stroke={isConnectedToHover ? "#22d3ee" : "url(#edgeGradientFS)"}
                  strokeWidth={isConnectedToHover ? 3 / viewState.scale : 1.5 / viewState.scale} // Scale stroke inversely
                  markerEnd="url(#arrowhead-fs)"
                />
                {/* Edge Label */}
                {(!hoveredNodeId || isConnectedToHover) && viewState.scale > 0.6 && (
                    <text 
                      x={(start.x + end.x)/2} 
                      y={(start.y + end.y)/2} 
                      fill={isConnectedToHover ? "#22d3ee" : "#64748b"} 
                      fontSize={10 / viewState.scale + 2} // Scale font inversely
                      textAnchor="middle" 
                      dy="-8"
                      fontWeight="bold"
                      className="bg-slate-900 pointer-events-none"
                      style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
                    >
                      {edge.label}
                    </text>
                )}
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
                style={{ opacity: isDimmed ? 0.3 : 1 }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Outer Ring */}
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={isHovered ? 32 : 0} 
                  fill="none"
                  stroke={getNodeColor(node.type)}
                  strokeWidth={1 / viewState.scale}
                  opacity="0.5"
                  className="transition-all duration-300"
                />

                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r={isHovered ? 18 : 14} 
                  fill={isHovered ? "#fff" : "#0f172a"}
                  stroke={getNodeColor(node.type)} 
                  strokeWidth={isHovered ? 0 : 2}
                  filter={isHovered ? "url(#glow-fs)" : ""}
                  className="transition-all duration-300"
                />
                
                {/* Node Label (LOD Logic: Hide when zoomed out too far) */}
                {viewState.scale > 0.4 && (
                  <text 
                    x={node.x} 
                    y={node.y + 35} 
                    textAnchor="middle" 
                    fill={isHovered ? "white" : "#cbd5e1"} 
                    fontSize={(isHovered ? 16 : 12) / viewState.scale + 2} 
                    fontWeight="bold"
                    className="uppercase tracking-wider shadow-black drop-shadow-md pointer-events-none transition-all"
                    style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Static Overlay Tooltip (Top Left) - Does not transform */}
        {activeNode && (
          <g transform="translate(20, 20)">
              <rect width="220" height="90" rx="12" fill="#0f172a" stroke={getNodeColor(activeNode.type)} strokeOpacity="0.5" fillOpacity="0.9" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
              <text x="20" y="35" fill="white" fontSize="18" fontWeight="bold">{activeNode.label}</text>
              <text x="20" y="60" fill="#94a3b8" fontSize="12" className="uppercase tracking-widest">{activeNode.type}</text>
              <text x="20" y="75" fill="#64748b" fontSize="10">Double click to focus</text>
          </g>
        )}
      </svg>
    </div>
  );
};

interface HistoryViewProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
         <History size={48} className="mb-4 opacity-50" />
         <p className="text-xl">No Analysis History Yet</p>
         <p className="text-sm">Upload images or perform analysis to build your database.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-8">
       {history.map((item) => (
         <div key={item.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 hover:bg-white/5 transition-colors group">
             {/* Thumbnail */}
             <div className="w-24 h-24 rounded-xl bg-slate-800 flex-shrink-0 overflow-hidden border border-white/10">
                {item.image ? (
                  <img src={item.image} alt="analysis" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Activity className="text-slate-500" />
                  </div>
                )}
             </div>

             {/* Content */}
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                     {item.result.category}
                   </span>
                   <span className="text-slate-400 text-xs flex items-center gap-1">
                      <Calendar size={12} /> {item.timestamp.toLocaleDateString()}
                   </span>
                </div>
                <h3 className="text-white font-medium text-lg mb-1">{item.result.summary.substring(0, 80)}...</h3>
                <div className="flex gap-4 text-xs text-slate-500">
                   <span>Score: <span className="text-white">{item.result.score}</span></span>
                   <span>Risks: {item.result.risks?.length || 0}</span>
                </div>
             </div>

             {/* Actions */}
             <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     const images = item.images || (item.image ? [item.image] : []);
                     generatePDFReport(item.result, images);
                   }}
                   className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                   title="Download PDF"
                 >
                    <FileDown size={20} />
                 </button>
                 <button 
                   onClick={() => onSelect(item)}
                   className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                   title="View Details"
                 >
                    <ArrowRight size={20} />
                 </button>
             </div>
         </div>
       ))}
    </div>
  );
};

export const GraphView: React.FC<{ currentResult: HistoryItem | null }> = ({ currentResult }) => {
   if (!currentResult || !currentResult.result.knowledgeGraph) {
     return (
       <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
          <Search size={48} className="mb-4 opacity-50" />
          <p className="text-xl">No Graph Data Available</p>
          <p className="text-sm">Run an analysis to generate a World Graph.</p>
       </div>
     );
   }

   return (
     <div className="w-full h-[70vh] glass-card rounded-3xl p-4 overflow-hidden relative animate-in zoom-in duration-500 border border-cyan-500/30">
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
           <h2 className="text-2xl font-bold text-white mb-1">WORLD GRAPH</h2>
           <p className="text-cyan-400 text-sm font-mono">{currentResult.result.category} • {currentResult.timestamp.toLocaleDateString()}</p>
        </div>
        <FullScreenGraph nodes={currentResult.result.knowledgeGraph.nodes} edges={currentResult.result.knowledgeGraph.edges} />
     </div>
   );
};