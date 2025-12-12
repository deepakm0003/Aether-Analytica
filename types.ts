export type InputMode = 'image' | 'voice' | 'text' | 'document';

export enum AnalysisCategory {
  ROOM = 'ROOM',
  FOOD = 'FOOD',
  FINANCE = 'FINANCE',
  SCHEDULE = 'SCHEDULE',
  GOAL = 'GOAL',
  MAP = 'MAP',
  LEARNING = 'LEARNING',
  PROBLEM = 'PROBLEM',
  GENERAL = 'GENERAL'
}

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface Prediction {
  outcome: string;
  likelihood: string; 
  impact: string;     
  timeframe: string;
}

export interface CauseEffect {
  step: string;
  description: string;
}

export interface Consequence {
  domain: 'LIFESTYLE' | 'FINANCIAL' | 'EMOTIONAL' | 'TIME' | 'HEALTH';
  prediction: string;
  severity: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'long_term';
}

export interface MergeConnection {
  type: string;
  source1: string;
  source2: string;
  insight: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'action' | 'risk' | 'outcome';
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface AnalysisResult {
  category: AnalysisCategory;
  summary: string;
  score: number; // 0-100
  metrics: Metric[];
  insights: string[];
  actionPlan: string[];
  risks: string[];
  opportunities: string[];
  consequences?: Consequence[]; // New Feature
  isMergedReality?: boolean; // New Feature
  mergeConnections?: MergeConnection[]; // New Feature
  chartData?: ChartDataPoint[]; 
  
  predictions?: Prediction[];
  causeEffectChain?: CauseEffect[];
  knowledgeGraph?: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  result: AnalysisResult;
  image?: string | null; // Keep for backward compatibility
  images?: string[]; // New: Store all images
  chatHistory?: ChatMessage[];
}

export interface InputItem {
  id: string;
  type: 'image' | 'text' | 'audio';
  content: string; // Base64 or text
  preview?: string; // For images
}