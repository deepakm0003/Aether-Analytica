import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AnalysisResult, AnalysisCategory, ChatMessage, InputItem } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "AETHER ANALYTICA", a hyper-advanced multimodal world insight engine.

**NEW CAPABILITIES ENABLED:**
1. **REALITY MERGE ENGINE**: The user may provide MULTIPLE inputs (e.g., a photo of a room + a voice note about goals + a text list of budget). You must FUSE these into a single, holistic understanding. Find connections between the visual, audio, and text data.
2. **CONSEQUENCE SIMULATION**: You must predict the *future impact* of the current state. "If this continues, what happens?"

**CORE ENGINES TO EXECUTE:**

1. **CLASSIFICATION**: Detect category (ROOM, FOOD, FINANCE, SCHEDULE, GOAL, MAP, LEARNING, PROBLEM, GENERAL).
2. **DEEP INSIGHT**: Analyze *why* the situation exists.
3. **CONSEQUENCE MODELING**:
   - Analyze specific consequences in 5 domains: LIFESTYLE, FINANCIAL, EMOTIONAL, TIME, HEALTH.
   - Assign severity (low/medium/high) and timeframe (immediate/short_term/long_term).
4. **KNOWLEDGE GRAPH**: Extract entities and relationships.
5. **MERGE CONNECTIONS**: Identify cross-modal connections if multiple inputs exist.

**OUTPUT SCHEMA RULES:**
- Return valid JSON matching the schema.
- 'isMergedReality' should be true if multiple input types were provided.
- Be precise, professional, and insightful.
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: [
        AnalysisCategory.ROOM, AnalysisCategory.FOOD, AnalysisCategory.FINANCE, 
        AnalysisCategory.SCHEDULE, AnalysisCategory.GOAL, AnalysisCategory.MAP, 
        AnalysisCategory.LEARNING, AnalysisCategory.PROBLEM, AnalysisCategory.GENERAL
      ]
    },
    summary: { type: Type.STRING, description: "Executive summary. If multiple inputs, explain how they connect." },
    score: { type: Type.NUMBER, description: "0-100 Rating." },
    isMergedReality: { type: Type.BOOLEAN, description: "True if analysis combined multiple inputs." },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          color: { type: Type.STRING }
        }
      }
    },
    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
    consequences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING, enum: ['LIFESTYLE', 'FINANCIAL', 'EMOTIONAL', 'TIME', 'HEALTH'] },
          prediction: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          timeframe: { type: Type.STRING, enum: ['immediate', 'short_term', 'long_term'] }
        },
        required: ["domain", "prediction", "severity", "timeframe"]
      }
    },
    mergeConnections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          source1: { type: Type.STRING },
          source2: { type: Type.STRING },
          insight: { type: Type.STRING }
        },
        required: ["type", "source1", "source2", "insight"]
      }
    },
    predictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          outcome: { type: Type.STRING },
          likelihood: { type: Type.STRING },
          impact: { type: Type.STRING },
          timeframe: { type: Type.STRING }
        }
      }
    },
    causeEffectChain: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    },
    knowledgeGraph: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['entity', 'action', 'risk', 'outcome'] }
            }
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              label: { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  required: ["category", "summary", "score", "metrics", "insights", "actionPlan", "risks", "opportunities", "consequences"]
};

export const analyzeLifeInput = async (
  inputs: InputItem[]
): Promise<AnalysisResult> => {
  
  const model = "gemini-2.5-flash"; 
  
  const parts: any[] = [];

  inputs.forEach(input => {
    if (input.type === 'text') {
      parts.push({ text: input.content });
    } else if (input.type === 'image') {
      const cleanBase64 = input.content.split(',')[1] || input.content;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      });
    } else if (input.type === 'audio') {
      const cleanAudio = input.content.split(',')[1] || input.content;
      parts.push({
         inlineData: {
             mimeType: "audio/wav",
             data: cleanAudio
         }
      });
    }
  });

  if (parts.length === 0) throw new Error("No input provided");

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.3, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithAnalysis = async (
  currentMessage: string,
  history: ChatMessage[],
  analysisContext: AnalysisResult
): Promise<string> => {
  const model = "gemini-2.5-flash";

  // Construct context prompt
  const contextPrompt = `
    You are Aether Assistant. You are chatting with the user about a specific analysis you just performed.
    
    ANALYSIS CONTEXT:
    Category: ${analysisContext.category}
    Summary: ${analysisContext.summary}
    Key Insights: ${analysisContext.insights.join(', ')}
    Action Plan: ${analysisContext.actionPlan.join(', ')}
    
    USER QUESTION: ${currentMessage}
    
    Respond helpfully, concisely, and specifically based on the context above. 
    If asked for calculations, costs, or locations, provide realistic estimates.
  `;

  // Build simplistic history for context (last 5 messages)
  const previousMessages = history.slice(-5).map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...previousMessages,
        { role: 'user', parts: [{ text: contextPrompt }] }
      ]
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Connection to Aether interrupted.";
  }
};