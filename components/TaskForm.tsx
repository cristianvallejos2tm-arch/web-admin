import React, { useEffect, useState } from 'react';
import { Car, Calendar, User, AlertCircle, FileText, X, ClipboardList } from 'lucide-react';
import { createTask, fetchVehiculos, fetchUsuariosLite } from '../services/supabase';

interface TaskFormProps {
    onBack: () => void;
    onSaved: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        vehiculoId: '',
        prioridad: '',
        fecha: '',
        responsable: '',
        responsableId: '',
        observaciones: '',
    });
    const [saving, setSaving] = useState(false);
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [showUserList, setShowUserList] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [{ data: vehs }, { data: users }] = await Promise.all([fetchVehiculos(), fetchUsuariosLite()]);
            setVehiculos(vehs || []);
            setUsuarios(users || []);
        };
        loadData();
    }, []);

    const filteredUsuarios = form.responsable
        ? usuarios.filter((u) => u.nombre?.toLowerCase().includes(form.responsable.toLowerCase())).slice(0, 8)
        : usuarios.slice(0, 8);

    const handleSave = async () => {
        if (!form.observaciones) return;
        setSaving(true);
        const selectedVehiculo = vehiculos.find((v) => v.id === form.vehiculoId);
        const responsableNombre = form.responsable || '';
        const prioridadValue = (form.prioridad || 'media').toLowerCase();
        const { error } = await createTask({
            titulo: selectedVehiculo ? `Vehiculo ${selectedVehiculo.patente}` : 'Tarea de vehiculo',
            descripcion: `${form.observaciones}${responsableNombre ? ` - Resp: ${responsableNombre}` : ''}`,
            estado: 'pendiente',
            prioridad: prioridadValue,
            fecha_vencimiento: form.fecha || null,
            asignado_a: form.responsableId || null,
            vehiculo_id: form.vehiculoId || null,
        });
        setSaving(false);
        if (error) {
            console.error('Error creando tarea', error);
            alert('No se pudo guardar la tarea. Revisa permisos de inserción en "tareas".');
            return;
        }
        onSaved();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="text-blue-500" size={24} />
                        NUEVA TAREA
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Registre una nueva tarea o pendiente para un vehiculo de la flota.</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <Car size={14} className="text-slate-400" />
                        Seleccione un vehiculo
                    </label>
                    <select
                        value={form.vehiculoId}
                        onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
                        className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                    >
                        <option value="">No corresponde</option>
                        {vehiculos.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.patente} {v.marca ? `- ${v.marca}` : ''} {v.modelo ? `(${v.modelo})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <AlertCircle size={14} className="text-slate-400" />
                            Prioridad
                        </label>
                        <select
                            value={form.prioridad}
                            onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                        >
                            <option value="">Seleccionar</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                            <option value="critica">Crítica</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Calendar size={14} className="text-slate-400" />
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={form.fecha}
                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-500 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5 relative">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <User size={14} className="text-slate-400" />
                            Responsable
                        </label>
                        <input
                            type="text"
                            value={form.responsable}
                            onChange={(e) => {
                                setForm({ ...form, responsable: e.target.value, responsableId: '' });
                                setShowUserList(true);
                            }}
                            onBlur={() => setTimeout(() => setShowUserList(false), 150)}
                            onFocus={() => setShowUserList(true)}
                            className="w-full h-11 px-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
                            placeholder="Buscar usuario"
                        />
                        {showUserList && filteredUsuarios.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-auto">
                                {filteredUsuarios.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            setForm({ ...form, responsable: u.nombre || '', responsableId: u.id });
                                            setShowUserList(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                    >
                                        <div className="text-sm text-slate-800">{u.nombre}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <FileText size={14} className="text-slate-400" />
                        Observaciones
                    </label>
                    <textarea
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                        className="w-full h-40 p-4 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 resize-none transition-all"
                        placeholder="Ej.: Se quedo sin embrague, llevar a taller"
                    ></textarea>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Cargar Tarea'}
                    </button>
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskForm;
