import React, { useEffect, useState } from 'react';
import { ChecklistReport, AIAnalysisResult } from '../types';
import { analyzeChecklistComment } from '../services/geminiService';
import { X, Sparkles, AlertOctagon, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface AIModalProps {
  report: ChecklistReport | null;
  onClose: () => void;
}

const AIModal: React.FC<AIModalProps> = ({ report, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (report) {
      setLoading(true);
      // Simulate network delay for UX then call API
      analyzeChecklistComment(report.overallComments)
        .then(res => setResult(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setResult(null);
    }
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-500/30">
                    <Sparkles className="text-indigo-300" size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xl">Análisis Inteligente</h3>
                    <p className="text-indigo-200 text-sm">Gemini 2.5 Flash Engine</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comentario Original del Operador</p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic text-sm">
                    "{report.overallComments}"
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Procesando reporte con IA...</p>
                </div>
            ) : result ? (
                <div className="space-y-6">
                    {/* Severity Badge */}
                    <div className="flex items-center justify-between">
                         <span className="text-sm text-slate-500 font-medium">Nivel de Severidad detectado:</span>
                         <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                             result.severity === 'CRÍTICA' ? 'bg-red-100 text-red-700 border-red-200' :
                             result.severity === 'ALTA' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                             result.severity === 'MEDIA' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                             'bg-emerald-100 text-emerald-700 border-emerald-200'
                         }`}>
                             {result.severity}
                         </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <Activity className="text-blue-500 mt-1 shrink-0" size={20} />
                            <div>
                                <h4 className="font-semibold text-slate-800">Resumen Técnico</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={20} />
                            <div>
                                <h4 className="font-semibold text-slate-800">Acción Recomendada</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{result.recommendedAction}</p>
                            </div>
                        </div>
                        
                        {result.flaggedSystems.length > 0 && (
                            <div className="flex gap-3 items-start">
                                <AlertTriangle className="text-amber-500 mt-1 shrink-0" size={20} />
                                <div className="w-full">
                                    <h4 className="font-semibold text-slate-800 mb-2">Sistemas Comprometidos</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.flaggedSystems.map((sys, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-medium">
                                                {sys}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-400">
                    <p>No se pudo generar el análisis.</p>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
