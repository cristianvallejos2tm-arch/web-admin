import React, { useState } from 'react';
import { ChecklistReport } from '../types';
import { AlertTriangle, CheckCircle, Clock, Eye, Sparkles } from 'lucide-react';

interface ChecklistTableProps {
  reports: ChecklistReport[];
  onAnalyze: (report: ChecklistReport) => void;
}

// Tabla que muestra los reportes recientes y permite saltar al análisis asistido.
const ChecklistTable: React.FC<ChecklistTableProps> = ({ reports, onAnalyze }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Reportes Recientes</h2>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-800">Ver todo el historial</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Vehículo</th>
              <th className="px-6 py-4">Conductor</th>
              <th className="px-6 py-4">Fecha / Turno</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <span className="font-bold text-xs">{report.vehiclePlate.slice(0,2)}</span>
                    </div>
                    <div>
                        <div className="font-bold text-slate-800">{report.vehiclePlate}</div>
                        <div className="text-xs text-slate-400">ID: {report.vehicleId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-medium">{report.driverName}</div>
                    <div className="text-xs text-slate-400">Sup: {report.supervisorName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                    <div>{new Date(report.date).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400">{report.shift.split('(')[0]}</div>
                </td>
                <td className="px-6 py-4">
                    {report.items.some(i => i.status === 'fail') ? (
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                            <AlertTriangle size={12} />
                            Fallas ({report.items.filter(i => i.status === 'fail').length})
                         </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <CheckCircle size={12} />
                            OK
                         </span>
                    )}
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={() => onAnalyze(report)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow-md hover:from-indigo-500 hover:to-violet-500 transition-all"
                            title="Analizar con IA"
                        >
                            <Sparkles size={14} />
                            Analizar
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChecklistTable;
