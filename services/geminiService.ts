import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeChecklistComment = async (
  comment: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<AIAnalysisResult> => {
  
  if (!comment || comment.length < 5) {
      return {
          summary: "Comentario insuficiente para análisis.",
          severity: 'BAJA',
          recommendedAction: "Monitorear en próximo turno.",
          flaggedSystems: []
      }
  }

  try {
    const prompt = `
      Actúa como un Jefe de Mantenimiento de Flota Petrolera Senior.
      Analiza el siguiente comentario de un conductor sobre el estado de un vehículo (Checklist de cambio de turno).
      
      Comentario del conductor: "${comment}"
      
      Debes extraer:
      1. Un resumen técnico breve y profesional (máximo 15 palabras).
      2. Nivel de severidad (BAJA, MEDIA, ALTA, CRÍTICA).
      3. Acción recomendada inmediata (ej: "Enviar a taller", "Revisar fluidos", "Detener unidad inmediatamente").
      4. Sistemas afectados (ej: ["Frenos", "Motor", "Luces"]).
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['BAJA', 'MEDIA', 'ALTA', 'CRÍTICA'] },
            recommendedAction: { type: Type.STRING },
            flaggedSystems: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback in case of API error
    return {
      summary: "Error al analizar reporte con IA.",
      severity: 'MEDIA',
      recommendedAction: "Revisión manual requerida.",
      flaggedSystems: ["Sistema de IA no disponible"]
    };
  }
};
