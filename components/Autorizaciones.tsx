import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, CornerDownRight, FileText } from 'lucide-react';
import { supabase, authorizePurchase } from '../services/supabase';

interface AutorizacionesProps {
  userEmail?: string;
  userRole?: string;
}

interface PurchaseRow {
  id: string;
  proveedor_nombre?: string;
  numero?: string;
  fecha?: string;
  observaciones?: string;
  estado?: string;
  monto?: number | null;
  work_order_id?: string | null;
  origen_detalle?: string | null;
  work_order_numero?: string | null;
  work_order?: any | null;
}

// Panel para autorizadores: lista compras pendientes y permite aprobar/rechazar/derivar.
const Autorizaciones: React.FC<AutorizacionesProps> = ({ userEmail, userRole }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedOT, setSelectedOT] = useState<any | null>(null);

  const loadProfile = async () => {
    if (!userEmail) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('email', userEmail).single();
    if (error) {
      setErrorMsg('No se pudo cargar el perfil de autorizador.');
      return;
    }
    setProfile(data);
  };

  const allowedStatuses = useMemo(() => {
    if (userRole === 'admin') return ['PENDING_N1', 'PENDING_N3'];
    if (profile?.authorization_level === 1) return ['PENDING_N1'];
    if (profile?.authorization_level === 3) return ['PENDING_N3'];
    return [];
  }, [profile, userRole]);

  const fetchPendings = async () => {
    if (allowedStatuses.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('compras')
      .select('id, proveedor_id, numero, fecha, observaciones, estado, monto, work_order_id, origen_detalle, proveedores(nombre), ordenes_trabajo(numero,titulo,descripcion,estado,prioridad,fecha_inicio,fecha_fin,created_at,presupuesto_url,external_amount,vehiculos(patente,marca,modelo),usuarios:usuarios!ordenes_trabajo_responsable_id_fkey(nombre,email),proveedores(nombre))')
      .in('estado', allowedStatuses)
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMsg('No se pudieron cargar las compras pendientes.');
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      proveedor_nombre: r.proveedores?.nombre || '',
      numero: r.numero,
      fecha: r.fecha,
      observaciones: r.observaciones,
      estado: r.estado,
      monto: r.monto,
      work_order_id: r.work_order_id,
      origen_detalle: r.origen_detalle,
      work_order_numero: r.ordenes_trabajo?.numero || null,
      work_order: r.ordenes_trabajo || null,
    }));
    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [userEmail]);

  useEffect(() => {
    fetchPendings();
  }, [allowedStatuses.join('|')]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'DERIVE') => {
    const notes = prompt('Notas (opcional):') || undefined;
    setActioningId(id);
    const { error } = await authorizePurchase(id, action, notes);
    setActioningId(null);
    if (error) {
      setErrorMsg(error.message || 'No se pudo procesar la autorización.');
      return;
    }
    fetchPendings();
  };

  const canDerive = profile?.authorization_level === 1 || userRole === 'admin';

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-AR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Autorizaciones</h1>
        <p className="text-slate-500">Compras pendientes de autorizacion</p>
      </div>

      {errorMsg && (
        <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">{errorMsg}</div>
      )}

      {loading ? (
        <div className="text-slate-500">Cargando pendientes...</div>
      ) : allowedStatuses.length === 0 ? (
        <div className="text-slate-500">No tiene permisos de autorizacion.</div>
      ) : rows.length === 0 ? (
        <div className="text-slate-500">No hay compras pendientes.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{c.proveedor_nombre}</td>
                    <td className="px-6 py-4">{c.numero || '-'}</td>
                    <td className="px-6 py-4">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : '-'}</td>
                    <td className="px-6 py-4">{c.monto != null ? c.monto.toFixed(2) : '-'}</td>
                    <td className="px-6 py-4">{c.estado}</td>
                    <td className="px-6 py-4">
                      {c.work_order && (
                        <button
                          type="button"
                          onClick={() => setSelectedOT(c.work_order)}
                          className="text-slate-500 hover:text-slate-800"
                          title="Ver detalle de OT"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(c.id, 'APPROVE')}
                          disabled={actioningId === c.id}
                          className="text-emerald-600 hover:text-emerald-800 p-1"
                          title="Aprobar"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(c.id, 'REJECT')}
                          disabled={actioningId === c.id}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Rechazar"
                        >
                          <X size={16} />
                        </button>
                        {canDerive && c.estado === 'PENDING_N1' && (
                          <button
                            onClick={() => handleAction(c.id, 'DERIVE')}
                            disabled={actioningId === c.id}
                            className="text-amber-600 hover:text-amber-800 p-1"
                            title="Derivar a N3"
                          >
                            <CornerDownRight size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                Detalle Orden de Trabajo
              </h2>
              <button onClick={() => setSelectedOT(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div><span className="font-semibold">OT:</span> {selectedOT.numero || selectedOT.id || '-'}</div>
              <div><span className="font-semibold">Estado:</span> {selectedOT.estado || '-'}</div>
              <div><span className="font-semibold">Prioridad:</span> {selectedOT.prioridad || '-'}</div>
              <div><span className="font-semibold">Tipo:</span> {selectedOT.titulo || '-'}</div>
              <div><span className="font-semibold">Inicio:</span> {formatDateTime(selectedOT.fecha_inicio)}</div>
              <div><span className="font-semibold">Fin:</span> {formatDateTime(selectedOT.fecha_fin)}</div>
              <div><span className="font-semibold">Vehiculo:</span> {selectedOT.vehiculos ? `${selectedOT.vehiculos.patente || ''} ${selectedOT.vehiculos.marca || ''} ${selectedOT.vehiculos.modelo || ''}`.trim() : (selectedOT.vehiculo_id || '-')}</div>
              <div><span className="font-semibold">Responsable:</span> {selectedOT.usuarios ? (selectedOT.usuarios.nombre || selectedOT.usuarios.email) : (selectedOT.responsable_id || '-')}</div>
              <div><span className="font-semibold">Proveedor:</span> {selectedOT.proveedores ? selectedOT.proveedores.nombre : (selectedOT.proveedor_id || '-')}</div>
              <div><span className="font-semibold">Monto externo:</span> {selectedOT.external_amount != null ? Number(selectedOT.external_amount).toFixed(2) : '-'}</div>
              <div className="md:col-span-2"><span className="font-semibold">Descripcion:</span> {selectedOT.descripcion || '-'}</div>
              <div className="md:col-span-2">
                <span className="font-semibold">Presupuesto:</span>{' '}
                {selectedOT.presupuesto_url ? (
                  <a className="text-blue-600 hover:underline" href={selectedOT.presupuesto_url} target="_blank" rel="noreferrer">
                    Ver archivo
                  </a>
                ) : (
                  '-'
                )}
              </div>
              <div><span className="font-semibold">Creada:</span> {formatDateTime(selectedOT.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Autorizaciones;
