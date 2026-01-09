import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../services/supabase';

interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  rubro?: string;
  calle_numero?: string;
  colonia?: string;
  localidad?: string;
  codigo_postal?: string;
  provincia?: string;
  pais?: string;
  condicion_pago?: string;
  situacion_iva?: string;
  ganancias?: string;
  nro_iibb?: string;
  nro_agente_sicol?: string;
  reg_esp_calculo_auto?: string;
  observaciones?: string;
  es_externo?: boolean;
  es_local?: boolean;
  activo?: boolean;
  created_at?: string;
}

// Maneja listado, búsqueda y edición de proveedores con modal expansible por secciones.
const Proveedores: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Collapsible sections state
  const [datosComerciales, setDatosComerciales] = useState(true);
  const [datosImpositivos, setDatosImpositivos] = useState(true);
  const [observacionesOpen, setObservacionesOpen] = useState(true);

  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    rubro: '',
    calle_numero: '',
    colonia: '',
    localidad: '',
    codigo_postal: '',
    provincia: '',
    pais: '',
    condicion_pago: '01 - CONTADO',
    situacion_iva: 'Inscripto',
    ganancias: 'Inscripto',
    nro_iibb: '',
    nro_agente_sicol: '',
    reg_esp_calculo_auto: 'Ninguno',
    observaciones: '',
    es_externo: false,
    es_local: false
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('proveedores').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProveedores(data || []);
    } catch (err) {
      console.error('Error cargando proveedores', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      contacto: '',
      email: '',
      telefono: '',
      direccion: '',
      rubro: '',
      calle_numero: '',
      colonia: '',
      localidad: '',
      codigo_postal: '',
      provincia: '',
      pais: '',
      condicion_pago: '01 - CONTADO',
      situacion_iva: 'Inscripto',
      ganancias: 'Inscripto',
      nro_iibb: '',
      nro_agente_sicol: '',
      reg_esp_calculo_auto: 'Ninguno',
      observaciones: '',
      es_externo: false,
      es_local: false
    });
    setShowModal(true);
  };

  const handleEdit = (p: Proveedor) => {
    const rubroValue = p.rubro || '';
    const tieneDomicilioEstructurado = !!(p.calle_numero || p.colonia || p.localidad || p.codigo_postal || p.provincia || p.pais);
    const direccionParts = tieneDomicilioEstructurado
      ? []
      : (p.direccion || '').split('|').map((s) => s.trim()).filter(Boolean);
    const [calle_numero_fallback, colonia_fallback, localidad_fallback, cpRaw, provincia_fallback, pais_fallback] = direccionParts;
    const codigo_postal_fallback = (cpRaw || '').replace(/^CP\s*/i, '').trim();
    setEditing(p);
    setForm({
      nombre: p.nombre || '',
      contacto: p.contacto || '',
      email: p.email || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
      rubro: rubroValue,
      calle_numero: p.calle_numero || calle_numero_fallback || '',
      colonia: p.colonia || colonia_fallback || '',
      localidad: p.localidad || localidad_fallback || '',
      codigo_postal: p.codigo_postal || codigo_postal_fallback || '',
      provincia: p.provincia || provincia_fallback || '',
      pais: p.pais || pais_fallback || '',
      condicion_pago: p.condicion_pago || '01 - CONTADO',
      situacion_iva: p.situacion_iva || 'Inscripto',
      ganancias: p.ganancias || 'Inscripto',
      nro_iibb: p.nro_iibb || '',
      nro_agente_sicol: p.nro_agente_sicol || '',
      reg_esp_calculo_auto: p.reg_esp_calculo_auto || 'Ninguno',
      observaciones: p.observaciones || '',
      es_externo: !!p.es_externo,
      es_local: !!p.es_local
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('proveedores').delete().eq('id', id);
      if (error) throw error;
      setToast({ text: 'Proveedor eliminado', type: 'success' });
      fetchProveedores();
    } catch (err: any) {
      setToast({ text: err.message || 'Error al eliminar', type: 'error' });
    }
  };

  const buildDireccion = () => {
    const parts = [];
    if (form.calle_numero) parts.push(form.calle_numero);
    if (form.colonia) parts.push(form.colonia);
    if (form.localidad) parts.push(form.localidad);
    if (form.codigo_postal) parts.push(`CP ${form.codigo_postal}`);
    if (form.provincia) parts.push(form.provincia);
    if (form.pais) parts.push(form.pais);
    const composed = parts.join(' | ');
    return composed || form.direccion || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const direccion = buildDireccion();
    const payload = {
      nombre: form.nombre,
      contacto: form.contacto,
      email: form.email,
      telefono: form.telefono,
      direccion,
      calle_numero: form.calle_numero || null,
      colonia: form.colonia || null,
      localidad: form.localidad || null,
      codigo_postal: form.codigo_postal || null,
      provincia: form.provincia || null,
      pais: form.pais || null,
      rubro: form.rubro || null,
      condicion_pago: form.condicion_pago,
      situacion_iva: form.situacion_iva,
      ganancias: form.ganancias,
      nro_iibb: form.nro_iibb,
      nro_agente_sicol: form.nro_agente_sicol,
      reg_esp_calculo_auto: form.reg_esp_calculo_auto,
      observaciones: form.observaciones,
      es_externo: !!form.es_externo,
      es_local: !!form.es_local,
    };
    try {
      if (editing) {
        const { error } = await supabase.from('proveedores').update(payload).eq('id', editing.id);
        if (error) throw error;
        setToast({ text: 'Proveedor actualizado', type: 'success' });
      } else {
        const { error } = await supabase.from('proveedores').insert(payload);
        if (error) throw error;
        setToast({ text: 'Proveedor creado', type: 'success' });
      }
      setShowModal(false);
      fetchProveedores();
    } catch (err: any) {
      setToast({ text: err.message || 'Error al guardar', type: 'error' });
    }
  };

  const filtered = proveedores.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-slate-500">Cargando proveedores...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-md shadow-md text-xs text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.text}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-slate-500 mt-1">Administrar proveedores del sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Domicilio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rubro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No se encontraron proveedores</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.nombre}</td>
                    <td className="px-6 py-4 text-slate-600">{p.contacto}</td>
                    <td className="px-6 py-4 text-slate-600">{p.email}</td>
                    <td className="px-6 py-4 text-slate-600">{p.telefono}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {[p.calle_numero, p.colonia, p.localidad, p.codigo_postal ? `CP ${p.codigo_postal}` : '', p.provincia, p.pais]
                        .filter((v) => v && String(v).trim() !== '')
                        .join(' | ') || p.direccion || ''}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.rubro}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-900 p-1"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre del Proveedor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Proveedor *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ingrese el nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contacto</label>
                <input
                  value={form.contacto}
                  onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rubro</label>
                <input
                  value={form.rubro}
                  onChange={(e) => setForm({ ...form, rubro: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej. Taller mecánico, Repuestos, Servicios"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de contacto</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej. +54 9 11 1234-5678"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Datos del domicilio</span>
                </div>
                <div className="p-4 space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Calle y número</label>
                      <input
                        value={form.calle_numero}
                        onChange={(e) => setForm({ ...form, calle_numero: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ej. Av. Siempre Viva 742"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Colonia / Barrio</label>
                      <input
                        value={form.colonia}
                        onChange={(e) => setForm({ ...form, colonia: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Colonia o barrio"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Localidad / Ciudad</label>
                      <input
                        value={form.localidad}
                        onChange={(e) => setForm({ ...form, localidad: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Ciudad o localidad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Código Postal</label>
                      <input
                        value={form.codigo_postal}
                        onChange={(e) => setForm({ ...form, codigo_postal: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="CP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Provincia</label>
                      <input
                        value={form.provincia}
                        onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Provincia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
                      <input
                        value={form.pais}
                        onChange={(e) => setForm({ ...form, pais: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="País"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Comerciales */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDatosComerciales(!datosComerciales)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-700">Datos Comerciales</span>
                  {datosComerciales ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {datosComerciales && (
                  <div className="p-4 space-y-4 bg-white">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Condición de Pago</label>
                      <select
                        value={form.condicion_pago}
                        onChange={(e) => setForm({ ...form, condicion_pago: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="01 - CONTADO">01 - CONTADO</option>
                        <option value="02 - 30 DÍAS">02 - 30 DÍAS</option>
                        <option value="03 - 60 DÍAS">03 - 60 DÍAS</option>
                        <option value="04 - 90 DÍAS">04 - 90 DÍAS</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.es_externo}
                          onChange={(e) => setForm({ ...form, es_externo: e.target.checked })}
                          className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                        />
                        Proveedor externo
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.es_local}
                          onChange={(e) => setForm({ ...form, es_local: e.target.checked })}
                          className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                        />
                        Proveedor local
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Impositivos */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDatosImpositivos(!datosImpositivos)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-700">Datos Impositivos</span>
                  {datosImpositivos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {datosImpositivos && (
                  <div className="p-4 space-y-4 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Situación de IVA</label>
                        <select
                          value={form.situacion_iva}
                          onChange={(e) => setForm({ ...form, situacion_iva: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Inscripto">Inscripto</option>
                          <option value="Inscripto jurisdicción local">Inscripto jurisdicción local</option>
                          <option value="Exento">Exento</option>
                          <option value="No Inscripto">No Inscripto</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Ganancias</label>
                        <select
                          value={form.ganancias}
                          onChange={(e) => setForm({ ...form, ganancias: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Inscripto">Inscripto</option>
                          <option value="No Inscripto">No Inscripto</option>
                          <option value="Exento">Exento</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nro. IIBB</label>
                        <input
                          value={form.nro_iibb}
                          onChange={(e) => setForm({ ...form, nro_iibb: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Número de IIBB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nro. Agente S.I.C.O.L.</label>
                        <input
                          value={form.nro_agente_sicol}
                          onChange={(e) => setForm({ ...form, nro_agente_sicol: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Número de Agente S.I.C.O.L."
                        />
                      </div>
                    </div>

                   
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setObservacionesOpen(!observacionesOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-700">Observaciones</span>
                  {observacionesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {observacionesOpen && (
                  <div className="p-4 space-y-4 bg-white">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones</label>
                      <textarea
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                        placeholder="Escriba observaciones adicionales"
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  {editing ? 'Actualizar' : 'Aceptar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
