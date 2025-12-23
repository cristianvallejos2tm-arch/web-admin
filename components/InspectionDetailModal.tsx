import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Calendar, Gauge, Image as ImageIcon } from 'lucide-react';

interface Inspeccion {
    id: string;
    patente: string;
    kilometraje: number;
    checklist_critico: any;
    checklist_preventivo: any;
    danios: any;
    created_at: string;
    foto_frontal?: string;
    foto_trasera?: string;
    foto_lateral_izquierda?: string;
    foto_lateral_derecha?: string;
    foto_interior?: string;
    foto_tablero?: string;
    foto_motor?: string;
    foto_neumaticos?: string;
}

interface InspectionDetailModalProps {
    inspeccion: Inspeccion | null;
    onClose: () => void;
}

const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({ inspeccion, onClose }) => {
    if (!inspeccion) return null;

    const critico = inspeccion.checklist_critico || {};
    const preventivo = inspeccion.checklist_preventivo || {};
    const danios = Array.isArray(inspeccion.danios) ? inspeccion.danios : [];

    // Recopilar todas las fotos disponibles
    const fotos = [
        { url: inspeccion.foto_frontal, label: 'Frontal' },
        { url: inspeccion.foto_trasera, label: 'Trasera' },
        { url: inspeccion.foto_lateral_izquierda, label: 'Lateral Izquierda' },
        { url: inspeccion.foto_lateral_derecha, label: 'Lateral Derecha' },
        { url: inspeccion.foto_interior, label: 'Interior' },
        { url: inspeccion.foto_tablero, label: 'Tablero' },
        { url: inspeccion.foto_motor, label: 'Motor' },
        { url: inspeccion.foto_neumaticos, label: 'Neumáticos' },
    ].filter(foto => foto.url);

    const renderChecklistItem = (key: string, value: any) => {
        const isOk = value === true || value === 'ok';
        return (
            <div key={key} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                {isOk ? (
                    <CheckCircle className="text-green-600" size={20} />
                ) : (
                    <XCircle className="text-red-600" size={20} />
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Detalles de Inspección</h2>
                        <p className="text-slate-500 mt-1">Patente: {inspeccion.patente}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Información General */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-blue-600" size={20} />
                                <span className="text-sm font-medium text-blue-900">Fecha</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">
                                {new Date(inspeccion.created_at).toLocaleDateString('es-AR')}
                            </p>
                            <p className="text-sm text-blue-700">
                                {new Date(inspeccion.created_at).toLocaleTimeString('es-AR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Gauge className="text-purple-600" size={20} />
                                <span className="text-sm font-medium text-purple-900">Kilometraje</span>
                            </div>
                            <p className="text-lg font-bold text-purple-900">
                                {inspeccion.kilometraje?.toLocaleString()} km
                            </p>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="text-amber-600" size={20} />
                                <span className="text-sm font-medium text-amber-900">ID Inspección</span>
                            </div>
                            <p className="text-sm font-mono text-amber-900">
                                {inspeccion.id.substring(0, 8)}...
                            </p>
                        </div>
                    </div>

                    {/* Checklist Crítico */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" size={20} />
                            Checklist Crítico
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.keys(critico).length > 0 ? (
                                Object.entries(critico).map(([key, value]) => renderChecklistItem(key, value))
                            ) : (
                                <p className="text-slate-500 col-span-2">No hay datos de checklist crítico</p>
                            )}
                        </div>
                    </div>

                    {/* Checklist Preventivo */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="text-blue-600" size={20} />
                            Checklist Preventivo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.keys(preventivo).length > 0 ? (
                                Object.entries(preventivo).map(([key, value]) => renderChecklistItem(key, value))
                            ) : (
                                <p className="text-slate-500 col-span-2">No hay datos de checklist preventivo</p>
                            )}
                        </div>
                    </div>

                    {/* Daños Reportados */}
                    {danios.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="text-orange-600" size={20} />
                                Daños Reportados
                            </h3>
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <ul className="space-y-2">
                                    {danios.map((danio: any, index: number) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-orange-600 font-bold">•</span>
                                            <span className="text-slate-700">
                                                <strong className="text-orange-900">{danio.tipo || 'Daño'}:</strong>{' '}
                                                {danio.ubicacion || danio.descripcion || 'Sin descripción'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Galería de Fotos */}
                    {fotos.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <ImageIcon className="text-green-600" size={20} />
                                Galería de Fotos ({fotos.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {fotos.map((foto, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={foto.url}
                                            alt={foto.label}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 group-hover:border-amber-500 transition-all cursor-pointer"
                                            onClick={() => window.open(foto.url, '_blank')}
                                        />
                                        <p className="text-xs text-center text-slate-600 mt-1 font-medium">
                                            {foto.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                Click en una foto para verla en tamaño completo
                            </p>
                        </div>
                    )}

                    {fotos.length === 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                            <ImageIcon className="text-slate-400 mx-auto mb-2" size={32} />
                            <p className="text-slate-500">No hay fotos disponibles para esta inspección</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InspectionDetailModal;
