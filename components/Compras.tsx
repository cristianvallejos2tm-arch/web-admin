import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, FileText, X } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Compra {
  id: string;
  proveedor_id?: string;
  proveedor_nombre?: string;
  numero?: string;
  fecha?: string;
  observaciones?: string;
  estado?: string;
  origen?: string | null;
  origen_detalle?: string | null;
  work_order_id?: string | null;
  work_order_numero?: string | null;
  work_order?: any | null;
}

// Panel para listar, buscar y gestionar compras (crear/editar/borrar) y explorar la OT vinculada.
const Compras: React.FC = () => {
  const norm = (value: unknown) => String(value ?? '').toLowerCase();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Compra | null>(null);
  const [selectedOT, setSelectedOT] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [proveedores, setProveedores] = useState<{ id: string; nombre: string }[]>([]);
  const [form, setForm] = useState({ proveedor_id: '', numero: '', fecha: '', observaciones: '', estado: 'borrador' } as any);

  useEffect(() => {
    fetchProveedores();
    fetchCompras();
  }, []);

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase.from('proveedores').select('id, nombre').order('nombre');
      if (error) throw error;
      setProveedores(data || []);
    } catch (err) {
      console.error('Error cargando proveedores', err);
    }
  };

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compras')
        .select('id, proveedor_id, numero, fecha, observaciones, estado, origen, origen_detalle, work_order_id, proveedores(nombre), ordenes_trabajo(numero,titulo,descripcion,estado,prioridad,fecha_inicio,fecha_fin,created_at,presupuesto_url,external_amount,vehiculos(patente,marca,modelo),usuarios:usuarios!ordenes_trabajo_responsable_id_fkey(nombre,email),proveedores(nombre))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        id: r.id,
        proveedor_id: r.proveedor_id,
        proveedor_nombre: r.proveedores?.nombre || '',
        numero: r.numero,
        fecha: r.fecha,
        observaciones: r.observaciones,
        estado: r.estado,
        origen: r.origen,
        origen_detalle: r.origen_detalle,
        work_order_id: r.work_order_id,
        work_order_numero: r.ordenes_trabajo?.numero || null,
        work_order: r.ordenes_trabajo || null,
      }));

      setCompras(rows);
    } catch (err) {
      console.error('Error cargando compras', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      proveedor_id: '',
      numero: '',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
      estado: 'borrador',
    });
    setShowModal(true);
  };

  const handleEdit = (c: Compra) => {
    setEditing(c);
    setForm({
      proveedor_id: c.proveedor_id || '',
      numero: c.numero || '',
      fecha: c.fecha?.slice(0, 10) || '',
      observaciones: c.observaciones || '',
      estado: c.estado || 'borrador',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar compra?')) return;
    try {
      const { error } = await supabase.from('compras').delete().eq('id', id);
      if (error) throw error;
      fetchCompras();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        proveedor_id: form.proveedor_id || null,
        numero: form.numero || null,
        fecha: form.fecha || null,
        observaciones: form.observaciones || null,
        estado: 'borrador',
      };

      if (editing) {
        const { error } = await supabase.from('compras').update(payload).eq('id', editing.id);
        if (error) throw error;
        alert('Compra actualizada');
      } else {
        const { error } = await supabase.from('compras').insert(payload);
        if (error) throw error;
        alert('Compra creada');
      }

      setShowModal(false);
      fetchCompras();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const filtered = compras.filter((c) => {
    const term = norm(search);
    return (
      norm(c.proveedor_nombre).includes(term) ||
      norm(c.numero).includes(term) ||
      norm(c.observaciones).includes(term) ||
      norm(c.work_order_numero).includes(term) ||
      norm(c.work_order_id).includes(term) ||
      norm(c.origen_detalle).includes(term)
    );
  });

  const detalleLabel = (c: Compra) => {
    if (c.work_order_numero) return `OT ${c.work_order_numero}`;
    if (c.work_order_id) return `OT ${c.work_order_id}`;
    return c.origen_detalle || c.observaciones || '';
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-AR');
  };

  const statusLabel = (estado?: string) => {
    if (!estado) return '';
    if (estado === 'PENDING_N1' || estado === 'PENDING_N3') return 'Pendiente de autorizacion';
    return estado;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando compras...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-slate-500">Registrar y administrar compras</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron compras
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{c.proveedor_nombre}</td>
                    <td className="px-6 py-4">{c.numero}</td>
                    <td className="px-6 py-4">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : ''}</td>
                    <td className="px-6 py-4">{statusLabel(c.estado)}</td>
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
                        <button onClick={() => handleEdit(c)} className="text-blue-600 p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Editar Compra' : 'Nueva Compra'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Proveedor</label>
                <select
                  required
                  value={form.proveedor_id}
                  onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">-- Seleccionar proveedor --</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nro comprobante</label>
                <input
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: 0001-00012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado (solo borrador)</label>
                <input
                  readOnly
                  value="borrador"
                  className="w-full px-4 py-2 border rounded-lg bg-slate-100 text-slate-600"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-200 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg">
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
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

export default Compras;
