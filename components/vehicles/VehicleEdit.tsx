import React, { useState } from 'react';
import { HelpCircle, Upload, Car, FileText, Info, Fuel, Settings, Save, X } from 'lucide-react';
import { updateVehiculo, uploadVehicleImage } from '../../services/supabase';
import { baseOptions, operatorOptions, sectorFunciones } from './VehicleForm';

interface VehicleEditProps {
    vehicle: any;
    onBack: () => void;
}

// Formulario completo para editar datos, estado y consumo de un vehículo, incluyendo foto.
const VehicleEdit: React.FC<VehicleEditProps> = ({ vehicle, onBack }) => {
    const initialOperadoras = Array.isArray(vehicle?.operadoras) && vehicle.operadoras.length > 0
        ? vehicle.operadoras
        : String(vehicle?.op || '')
            .split(',')
            .map((value: string) => value.trim())
            .filter(Boolean);

    const [form, setForm] = useState({
        id: vehicle?.id || '',
        patente: vehicle?.dominio || vehicle?.patente || '',
        interno: vehicle?.internalNumber || vehicle?.patente || '',
        fechaInscripcion: '',
        estado: vehicle?.estado || 'Operativo',
        modelo: vehicle?.modelo || '',
        marca: vehicle?.marca || '',
        anio: vehicle?.anio || '',
        vin: vehicle?.vin || '',
        sector: vehicle?.sector || '',
        funcion: vehicle?.funcion || '',
        base: vehicle?.base || '',
        operadoras: initialOperadoras,
        odometro: vehicle?.km || vehicle?.kilometraje_actual || '',
        horometro: vehicle?.horometro || '',
        tipoComb: vehicle?.tipoComb || '',
        consumoKm: vehicle?.consumoKmLt || '',
        consumo100: vehicle?.consumo100 || '',
        capacidad: vehicle?.capacidad || '',
        caracteristicas: vehicle?.caracteristicas || '',
        observaciones: vehicle?.observaciones || '',
    });
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    const toggleOperadora = (value: string) => {
        setForm((prev) => {
            const exists = prev.operadoras.includes(value);
            return {
                ...prev,
                operadoras: exists
                    ? prev.operadoras.filter((op) => op !== value)
                    : [...prev.operadoras, value],
            };
        });
    };

    const handleSave = async () => {
        if (!form.id) return;
        setSaving(true);
        let fotoUrl: string | null = null;
        try {
            if (file) {
                fotoUrl = await uploadVehicleImage(file);
            } else {
                fotoUrl = vehicle?.foto_url || null;
            }
        } catch (err) {
            console.error('Error subiendo imagen', err);
        }
        const operadorasValue = form.operadoras.length ? form.operadoras.join(', ') : null;

        await updateVehiculo(form.id, {
            patente: form.patente,
            modelo: form.modelo || null,
            marca: form.marca || null,
            anio: form.anio ? Number(form.anio) : null,
            vin: form.vin || null,
            kilometraje_actual: form.odometro ? Number(form.odometro) : null,
            activo: form.estado !== 'Fuera de Servicio',
            foto_url: fotoUrl,
            base: form.base || null,
            sector: form.sector || null,
            funcion: form.funcion || null,
            estado: form.estado || null,
            num_int: form.interno || null,
            op: operadorasValue,
            horometro: form.horometro ? Number(form.horometro) : null,
            tipo_combustible: form.tipoComb || null,
            consumo_Km: form.consumoKm || null,
            Consumo_100km: form.consumo100 || null,
            capacidat_Tanque: form.capacidad || null,
            observaciones: form.observaciones || null,
            caracteristicas_equipo: form.caracteristicas || null,
        });
        setSaving(false);
        onBack();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="text-blue-500" size={24} />
                        Editar Datos del Vehículo
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Modifique la información de la unidad seleccionada.</p>
                </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <FileText size={16} className="text-slate-400" />
                        Identificación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                Dominio <HelpCircle size={12} className="text-blue-400 cursor-help" />
                            </label>
                            <input
                                type="text"
                                value={form.patente}
                                onChange={(e) => setForm({ ...form, patente: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Nro. de Interno</label>
                            <input
                                type="text"
                                value={form.interno}
                                onChange={(e) => setForm({ ...form, interno: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Fecha Inscripción</label>
                            <input
                                type="date"
                                value={form.fechaInscripcion}
                                onChange={(e) => setForm({ ...form, fechaInscripcion: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Estado</label>
                            <div className="relative">
                                <select
                                    value={form.estado}
                                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none transition-all"
                                >
                                    <option>Operativo</option>
                                    <option>Back Up</option>
                                    <option>En Mantenimiento</option>
                                    <option>Fuera de Servicio</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Settings size={16} className="text-slate-400" />
                        Datos Técnicos
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Modelo</label>
                                <input
                                    type="text"
                                    value={form.modelo}
                                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Marca</label>
                                <input
                                    type="text"
                                    value={form.marca}
                                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Año</label>
                                <select
                                    value={form.anio}
                                    onChange={(e) => setForm({ ...form, anio: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                >
                                    <option value="">Seleccionar</option>
                                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Nro. Chasis</label>
                                <input
                                    type="text"
                                    value={form.vin}
                                    onChange={(e) => setForm({ ...form, vin: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Sector</label>
                                <select
                                    value={form.sector}
                                    onChange={(e) => {
                                        const sector = e.target.value;
                                        const funciones = sectorFunciones[sector] || [];
                                        setForm({
                                            ...form,
                                            sector,
                                            funcion: funciones.length ? funciones[0] : sector,
                                        });
                                    }}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                >
                                    <option value="">Seleccionar</option>
                                    {Object.keys(sectorFunciones).map((sector) => (
                                        <option key={sector} value={sector}>
                                            {sector}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Función</label>
                                <select
                                    value={form.funcion}
                                    onChange={(e) => setForm({ ...form, funcion: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                >
                                    <option value="">Seleccionar</option>
                                    {(sectorFunciones[form.sector] && sectorFunciones[form.sector].length
                                        ? sectorFunciones[form.sector]
                                        : form.sector
                                        ? [form.sector]
                                        : []
                                    ).map((fn) => (
                                        <option key={fn} value={fn}>
                                            {fn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Base</label>
                                <select
                                    value={form.base}
                                    onChange={(e) => setForm({ ...form, base: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                                >
                                    <option value="">Seleccionar</option>
                                    {baseOptions.map((base) => (
                                        <option key={base} value={base}>
                                            {base}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Settings size={16} className="text-slate-400" />
                        Operadoras
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {operatorOptions.map((op) => (
                            <label
                                key={op}
                                className="flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer hover:border-blue-500"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.operadoras.includes(op)}
                                    onChange={() => toggleOperadora(op)}
                                    className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <span className="font-semibold">{op}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Fuel size={16} className="text-slate-400" />
                        Medición y Consumo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Odómetro (Km.)</label>
                            <input
                                type="number"
                                value={form.odometro}
                                onChange={(e) => setForm({ ...form, odometro: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Horómetro (Hs.)</label>
                            <input
                                type="number"
                                value={form.horometro}
                                onChange={(e) => setForm({ ...form, horometro: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Tipo Comb.</label>
                            <select
                                value={form.tipoComb}
                                onChange={(e) => setForm({ ...form, tipoComb: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 transition-all"
                            >
                                <option value="">Seleccionar</option>
                                <option value="DIESEL">Diesel</option>
                                <option value="Nafta">Nafta</option>
                                <option value="GNC">GNC</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                Consumo KM/LT <Info size={12} className="text-slate-400" />
                            </label>
                            <input
                                type="text"
                                value={form.consumoKm}
                                onChange={(e) => setForm({ ...form, consumoKm: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                Consumo 100KM/LT <Info size={12} className="text-slate-400" />
                            </label>
                            <input
                                type="text"
                                value={form.consumo100}
                                onChange={(e) => setForm({ ...form, consumo100: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Capacidad del tanque</label>
                            <input
                                type="text"
                                value={form.capacidad}
                                onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Upload size={16} className="text-slate-400" />
                        Detalles Adicionales
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Imagen del Vehículo</label>
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={fileName || 'Elegir nueva imagen'}
                                        className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all pr-24 cursor-pointer"
                                    />
                                    <label className="absolute right-0 top-0 h-10 px-4 bg-slate-100 border-l border-slate-200 rounded-r-lg text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center gap-2 cursor-pointer">
                                        Browse
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setFile(f);
                                                    setFileName(f.name);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Características del equipo</label>
                                <textarea
                                    value={form.caracteristicas}
                                    onChange={(e) => setForm({ ...form, caracteristicas: e.target.value })}
                                    className="w-full h-32 p-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 resize-none transition-all"
                                ></textarea>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                    className="w-full h-32 p-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 resize-none transition-all"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-60"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleEdit;

