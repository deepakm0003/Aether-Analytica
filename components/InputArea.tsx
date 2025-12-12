import React, { useState, useRef } from 'react';
import { Camera, Mic, Send, Upload, X, BrainCircuit, Plus, Image as ImageIcon, FileText, Trash2, Layers } from 'lucide-react';
import { blobToBase64 } from '../utils/audioUtils';
import { InputItem } from '../types';

interface InputAreaProps {
  onAnalyze: (inputs: InputItem[]) => void;
  isAnalyzing: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputs, setInputs] = useState<InputItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem: InputItem = {
          id: Date.now().toString(),
          type: 'image',
          content: reader.result as string,
          preview: reader.result as string
        };
        setInputs(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const base64Audio = await blobToBase64(audioBlob);
        
        const newItem: InputItem = {
          id: Date.now().toString(),
          type: 'audio',
          content: base64Audio
        };
        setInputs(prev => [...prev, newItem]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const addTextNote = () => {
    if (!textInput.trim()) return;
    const newItem: InputItem = {
      id: Date.now().toString(),
      type: 'text',
      content: textInput
    };
    setInputs(prev => [...prev, newItem]);
    setTextInput('');
  };

  const removeInput = (id: string) => {
    setInputs(prev => prev.filter(i => i.id !== id));
  };

  const handleAnalyze = () => {
    if (inputs.length > 0) {
      onAnalyze(inputs);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-t-4 border-l-4 border-cyan-500 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-b-4 border-r-4 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="text-white animate-pulse" size={40} />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-light tracking-widest text-white uppercase">Reality Merge Active</h2>
        <p className="text-cyan-400 font-mono text-sm mt-2">Simulating Real-World Consequences...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* 1. INPUT STAGING AREA (The "Stack") */}
      <div className="glass-panel rounded-3xl p-6 min-h-[200px] border border-white/10 relative overflow-hidden">
        
        {/* Background Hint */}
        {inputs.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
            <Layers size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-light">Reality Merge Engine Empty</p>
            <p className="text-sm opacity-60">Add multiple inputs to fuse them into one insight.</p>
          </div>
        )}

        {/* Input List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {inputs.map((item) => (
            <div key={item.id} className="relative group animate-in zoom-in duration-300">
              <div className="h-32 rounded-xl bg-slate-800/80 border border-white/10 overflow-hidden flex flex-col items-center justify-center p-2 relative">
                
                {item.type === 'image' && (
                  <img src={item.preview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="preview" />
                )}
                
                <div className="relative z-10 p-3 bg-black/40 rounded-full backdrop-blur-sm">
                   {item.type === 'image' && <ImageIcon className="text-cyan-400" size={24} />}
                   {item.type === 'audio' && <Mic className="text-purple-400" size={24} />}
                   {item.type === 'text' && <FileText className="text-emerald-400" size={24} />}
                </div>
                
                <span className="relative z-10 text-xs font-mono text-white mt-2 uppercase tracking-wider">
                  {item.type} Input
                </span>
                
                {/* Remove Button */}
                <button 
                  onClick={() => removeInput(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors z-20"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* ADD NEW CARD */}
          <div className="h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group">
             <div className="text-center">
               <span className="block text-slate-500 text-sm group-hover:text-cyan-400">Add to Stack</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROL BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Buttons */}
        <div className="flex gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex-1 px-4 py-3 glass-card rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-white/5 border border-white/5 active:scale-95 transition-all"
           >
             <Camera className="text-cyan-400" size={20} />
             <span className="text-xs text-slate-300">Image</span>
           </button>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

           <button 
             onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
             className={`flex-1 px-4 py-3 glass-card rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 active:scale-95 transition-all ${isRecording ? 'bg-red-500/20 border-red-500/50' : 'hover:bg-white/5'}`}
           >
             <Mic className={isRecording ? "text-red-400 animate-pulse" : "text-purple-400"} size={20} />
             <span className="text-xs text-slate-300">{isRecording ? 'Stop' : 'Voice'}</span>
           </button>
        </div>

        {/* Text Input Field */}
        <div className="flex-1 glass-card rounded-xl p-1 flex items-center border border-white/5">
          <input 
            type="text" 
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTextNote()}
            placeholder="Type a goal, question, or context..."
            className="flex-1 bg-transparent border-none px-4 text-white focus:outline-none placeholder:text-slate-600"
          />
          <button 
            onClick={addTextNote}
            disabled={!textInput.trim()}
            className="p-2 mr-1 bg-white/10 hover:bg-emerald-500 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* MAIN ANALYZE ACTION */}
        <button 
          onClick={handleAnalyze}
          disabled={inputs.length === 0}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center gap-2 whitespace-nowrap"
        >
          <BrainCircuit size={20} />
          {inputs.length > 1 ? "RUN REALITY MERGE" : "ANALYZE INPUT"}
        </button>
      </div>

    </div>
  );
};

export default InputArea;