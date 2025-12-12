import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, ChatMessage } from '../types';
import { chatWithAnalysis } from '../services/geminiService';
import { Send, X, Bot, User, Sparkles } from 'lucide-react';

interface AetherAssistantProps {
  analysisResult: AnalysisResult;
  onClose: () => void;
  initialMessages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
}

const AetherAssistant: React.FC<AetherAssistantProps> = ({ 
  analysisResult, 
  onClose,
  initialMessages,
  onUpdateMessages
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages or set default welcome if empty
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else {
      const defaultMsg: ChatMessage = {
        id: 'init',
        role: 'ai',
        text: `I've analyzed your ${analysisResult.category.toLowerCase()}. I see some risks regarding ${analysisResult.risks[0]?.toLowerCase() || 'the current state'}. How can I help you optimize this?`
      };
      setMessages([defaultMsg]);
      // Sync initial welcome message immediately so it's saved
      onUpdateMessages([defaultMsg]);
    }
  }, [initialMessages, analysisResult.category]); // Re-run if analysis changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    onUpdateMessages(newHistory); // Persist
    
    setInputText('');
    setIsTyping(true);

    try {
      const responseText = await chatWithAnalysis(inputText, newHistory, analysisResult);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: responseText
      };
      
      const updatedHistory = [...newHistory, aiMsg];
      setMessages(updatedHistory);
      onUpdateMessages(updatedHistory); // Persist

    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] glass-card rounded-2xl border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
      
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 absolute top-0 right-0 bg-green-500 rounded-full animate-pulse"></div>
            <Bot className="text-cyan-300" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Aether Live</h3>
            <p className="text-[10px] text-cyan-200 uppercase tracking-wider">Contextual Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-300'}`}>
              {msg.role === 'ai' ? <Sparkles size={14} /> : <User size={14} />}
            </div>
            <div className={`p-3 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
              msg.role === 'ai' 
              ? 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none' 
              : 'bg-blue-600 text-white rounded-tr-none shadow-lg'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
               <LoaderDots />
             </div>
             <div className="text-xs text-slate-500 flex items-center">Aether is thinking...</div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#020617]/80 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a follow-up question..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="absolute right-1 top-1 bottom-1 w-10 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const LoaderDots = () => (
  <div className="flex space-x-1">
    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></div>
  </div>
);

export default AetherAssistant;