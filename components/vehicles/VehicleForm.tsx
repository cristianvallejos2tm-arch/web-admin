import React, { useState } from 'react';
import { HelpCircle, Upload, Car, FileText, Info, Fuel, Settings, Save, X } from 'lucide-react';
import { createVehiculo } from '../../services/supabase';

interface VehicleFormProps {
    onBack: () => void;
}

export const baseOptions = [
    'Sin Asignar',
    'Caleta Olivia',
    'Las Heras',
    'Koluel Kayke',
    'Administración',
    'Valle Hermoso',
    'Escalante',
    'Guardado',
    'Cerro Dragon',
    'Añelo Neuquén',
];

export const sectorFunciones: Record<string, string[]> = {
    'A DESIGNAR': [],
    'AGUA DULCE': ['TRACTOR DOBLE', 'TRACTOR SIMPLE', 'CISTERNA DE 35 MTS'],
    'AGUA PURGA': [],
    'CARGAS SOLIDAS': ['HIDRO C/CAJA', 'CAMIONETA 4X4', 'SEMIPLAYO', 'TRACTOR BALANCIN', 'TRACTOR CON HIDRO', 'SEMI BIVUELCO'],
    'CHUPA DE 9 MTS': ['EQUIPO DE VACIO 9M3'],
    'CHUPAS': [
        'AGUAS GRISES',
        'CHUPA EX 147 CLAMAR',
        'CISTERNA CHUPA DE 25 MTS',
        'CISTERNA DE 25 MTS',
        'EQUIPO DE VACIO 9M3',
        'TRACTOR + VACIO 30M3',
        'TRACTOR DOBLE',
        'TRACTOR SIMPLE',
        'TRACTOR SIMPLE/VACIO DE 25',
        'CISTERNA CHUPA DE 30 MTS',
    ],
    'CISTERNA 35M3': ['CISTERNA DE 35 MTS'],
    'FLOTA LIVIANA': ['CAMIONETA 4X4', 'TPT PERSONAL 19+1', 'EQUIPO DE VACIO 9M3'],
    'MODULO HABITACIONAL': ['TRAILER VIVIENDA'],
    'PORTACONTENEDORES': ['PORTA DOBLE', 'PORTA SIMPLE'],
    'POTABLE': ['AGUA POTABLE', 'ACOPLADO DE 25 MTS'],
    'PRODUCCION': [
        'MOTOBOMBA',
        'EQUIPO DE VACIO 9M3',
        'TRACTOR BALANCIN/CONTROL DE POZOS',
        'TRACTOR SIMPLE/CONTROL DE POZOS',
        'TRACTOR DOBLE/CONTROL DE POZOS',
        'HOTOIL/MMBB',
        'TRACTOR SIMPLE',
        'CISTERNA DE 25 MTS',
        'CISTERNA DE 30 MTS/CONTROL DE POZO',
        'CISTERNA DE 35 MTS',
        'CISTERNA DE 25 MTS/CONTROL DE POZO',
    ],
    'TRAILER VIVIENDA': ['SIN DESIGNAR'],
    'TRANSPORTE': ['TRACTOR DOBLE', 'TRACTOR CON HIDRO', 'SEMIPLAYO', 'TTE GASOLINA', 'PERSONAL EJECUTIVO'],
VACTOR: ['VACTOR'],
};

export const operatorOptions = ['PAE', 'CGC', 'YPF', 'CP', 'VIS'];

// Formulario para registrar nuevos vehículos con datos técnicos, consumo e imagen.
const VehicleForm: React.FC<VehicleFormProps> = ({ onBack }) => {
    const [form, setForm] = useState({
        patente: '',
        interno: '',
        fecha: '',
        estado: 'Operativo',
        modelo: '',
        marca: '',
        anio: '',
        vin: '',
        sector: '',
        funcion: '',
        base: '',
        odometro: '',
        horometro: '',
        tipoComb: '',
        consumoKmLt: '',
        consumo100: '',
        capacidad: '',
        caracteristicas: '',
        observaciones: '',
        foto_url: '',
        operadoras: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    const handleSave = async () => {
        if (!form.patente) return;
        setSaving(true);
        let fotoUrl: string | null = null;
        try {
            if (file) {
                const { uploadVehicleImage } = await import('../../services/supabase');
                fotoUrl = await uploadVehicleImage(file);
            }
        } catch (err) {
            console.error('Error subiendo imagen', err);
        }
        const operadoraPrincipal = form.operadoras[0] ?? null;

        await createVehiculo({
            patente: form.patente,
            marca: form.marca || null,
            modelo: form.modelo || null,
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
            op: operadoraPrincipal,
            horometro: form.horometro ? Number(form.horometro) : null,
            tipo_combustible: form.tipoComb || null,
            consumo_Km: form.consumoKmLt || null,
            Consumo_100km: form.consumo100 || null,
            capacidat_Tanque: form.capacidad || null,
            observaciones: form.observaciones || null,
            caracteristicas_equipo: form.caracteristicas || null,
        });
        setSaving(false);
        onBack();
    };

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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="text-blue-500" size={24} />
                        Nuevo Vehículo
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Complete la información para registrar una nueva unidad en la flota.</p>
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
                                placeholder="Ej. AA124FF"
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
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
                                value={form.fecha}
                                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Estado Inicial</label>
                            <div className="relative">
                                <select
                                    value={form.estado}
                                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none transition-all"
                                >
                                    <option value="Operativo">Operativo</option>
                                    <option value="En Mantenimiento">En Mantenimiento</option>
                                    <option value="Fuera de Servicio">Fuera de Servicio</option>
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
                                    placeholder="Ej. FORD CARGO 1932"
                                    className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
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
                                <option value="Diesel">Diesel</option>
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
                                value={form.consumoKmLt}
                                onChange={(e) => setForm({ ...form, consumoKmLt: e.target.value })}
                                placeholder="Ej. 2.5"
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
                                placeholder="Ej. 20.5"
                                className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Capacidad (Lts)</label>
                            <input
                                type="text"
                                value={form.capacidad}
                                onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                                placeholder="Ej. 55"
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
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={fileName || 'Seleccionar archivo...'}
                                        className="w-full h-10 px-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition-all pr-24 cursor-pointer"
                                    />
                                    <label className="absolute right-0 top-0 h-10 px-4 bg-slate-100 border-l border-slate-200 rounded-r-lg text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center gap-2 cursor-pointer">
                                        <Upload size={14} />
                                        Examinar
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
                                    placeholder="Ej.: Hidro modelo..."
                                ></textarea>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                    className="w-full h-32 p-3 text-sm border-slate-200 bg-slate-50/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 resize-none transition-all"
                                    placeholder="Ej.: Está chocado y tiene detalles de chapa y pintura"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-60"
                    >
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Vehículo'}
                    </button>
                    <button
                        onClick={onBack}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-sm font-bold rounded-lg transition-all flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleForm;
