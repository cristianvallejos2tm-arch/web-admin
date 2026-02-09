import React, { useMemo, useState } from 'react';
import { getCatalogOptions } from './data';

type CatalogValues = Record<string, string>;

export type IncidentFormValues = {
  informanteApellido: string;
  informanteNombres: string;
  fechaReporte: string;
  tipoIncidente: string;
  gravedad: string;
  clasificacion: string;
  huboLesionados: string;
  cantidadLesionados: string;
  fechaIncidente: string;
  horaIncidente: string;
  accidentadoNombre: string;
  accidentadoDni: string;
  accidentadoEdad: string;
  accidentadoEstadoCivil: string;
  accidentadoFechaIngreso: string;
  accidentadoCargo: string;
  accidentadoOtros: string;
  unidadInterna: string;
  unidadMarcaModelo: string;
  unidadPatente: string;
  conductorNombre: string;
  conductorTelefono: string;
  descripcionEvento: string;
  causasIncidente: string;
  testigos: string;
  accionesCorrectivas: string;
  nombreSupervisor: string;
  presenteEnLugar: boolean;
  temperaturaAmbiente: string;
  velocidadViento: string;
  incidenteAmbientalLocacion: string;
  incidenteAmbientalVolumen: string;
  incidenteAmbientalAreaM2: string;
  fotosFiles: File[];
  catalogo: CatalogValues;
};

type Props = {
  onSave: (values: IncidentFormValues) => Promise<void>;
  onCancel?: () => void;
};

const createInitialCatalog = (): CatalogValues => ({
  tipo_servicio: '',
  condicion_climatica: '',
  condicion_luz: '',
  tipo_terreno: '',
  condicion_ruta_terreno: '',
  permiso_trabajo: '',
  naturaleza_lesion: '',
  zona_cuerpo: '',
  area_evento: '',
  tipo_tarea: '',
  forma_accidente: '',
  agente_material: '',
  condiciones_inseguras: '',
  actos_inseguros: '',
  epp: '',
  cargo: '',
});

const CATALOG_LABELS: Record<string, string> = {
  tipo_servicio: 'Tipo de servicio',
  condicion_climatica: 'Condicion climatica',
  condicion_luz: 'Condicion de luz',
  tipo_terreno: 'Tipo de terreno',
  condicion_ruta_terreno: 'Condicion ruta/terreno',
  permiso_trabajo: 'Permiso de trabajo',
  naturaleza_lesion: 'Naturaleza de la lesion',
  zona_cuerpo: 'Zona del cuerpo afectada',
  area_evento: 'Area donde sucedio el evento',
  tipo_tarea: 'Tipo de tarea',
  forma_accidente: 'Forma del accidente',
  agente_material: 'Agente material causante',
  condiciones_inseguras: 'Condiciones inseguras',
  actos_inseguros: 'Actos inseguros',
  epp: 'Elementos de proteccion personal',
  cargo: 'Cargo',
};

export default function IncidentsForm({ onSave, onCancel }: Props) {
  const [values, setValues] = useState<IncidentFormValues>({
    informanteApellido: '',
    informanteNombres: '',
    fechaReporte: '',
    tipoIncidente: '',
    gravedad: '',
    clasificacion: '',
    huboLesionados: '',
    cantidadLesionados: '',
    fechaIncidente: '',
    horaIncidente: '',
    accidentadoNombre: '',
    accidentadoDni: '',
    accidentadoEdad: '',
    accidentadoEstadoCivil: '',
    accidentadoFechaIngreso: '',
    accidentadoCargo: '',
    accidentadoOtros: '',
    unidadInterna: '',
    unidadMarcaModelo: '',
    unidadPatente: '',
    conductorNombre: '',
    conductorTelefono: '',
    descripcionEvento: '',
    causasIncidente: '',
    testigos: '',
    accionesCorrectivas: '',
    nombreSupervisor: '',
    presenteEnLugar: false,
    temperaturaAmbiente: '',
    velocidadViento: '',
    incidenteAmbientalLocacion: '',
    incidenteAmbientalVolumen: '',
    incidenteAmbientalAreaM2: '',
    fotosFiles: [],
    catalogo: createInitialCatalog(),
  });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(
    () =>
      Boolean(values.tipoIncidente) &&
      Boolean(values.gravedad) &&
      Boolean(values.huboLesionados) &&
      Boolean(values.descripcionEvento.trim()),
    [values],
  );

  const handleChange = (field: keyof IncidentFormValues, payload: string | boolean | CatalogValues | File[]) => {
    setValues((prev) => ({ ...prev, [field]: payload }));
  };

  const handleCatalogChange = (id: string, option: string) => {
    setValues((prev) => ({
      ...prev,
      catalogo: {
        ...prev.catalogo,
        [id]: option,
      },
    }));
  };

  const handlePhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const onlyImages = selected.filter((file) => file.type.startsWith('image/'));

    if (selected.length > 0 && onlyImages.length === 0) {
      setPhotoError('Solo se permiten archivos de imagen.');
      event.target.value = '';
      return;
    }

    const existing = values.fotosFiles ?? [];
    const merged = [...existing];
    onlyImages.forEach((candidate) => {
      const duplicated = merged.some(
        (current) =>
          current.name === candidate.name &&
          current.size === candidate.size &&
          current.lastModified === candidate.lastModified,
      );
      if (!duplicated) {
        merged.push(candidate);
      }
    });

    if (merged.length > 3) {
      handleChange('fotosFiles', merged.slice(0, 3));
      setPhotoError('Solo se permiten hasta 3 fotos.');
      event.target.value = '';
      return;
    }

    handleChange('fotosFiles', merged);
    setPhotoError(null);
    event.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const updated = values.fotosFiles.filter((_, currentIndex) => currentIndex !== index);
    handleChange('fotosFiles', updated);
    if (updated.length < 3) {
      setPhotoError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      setError('Complete los campos obligatorios.');
      return;
    }

    setStatus('saving');
    setError(null);
    try {
      await onSave(values);
      setStatus('saved');
      setValues({
        informanteApellido: '',
        informanteNombres: '',
        fechaReporte: '',
        tipoIncidente: '',
        gravedad: '',
        clasificacion: '',
        huboLesionados: '',
        cantidadLesionados: '',
        fechaIncidente: '',
        horaIncidente: '',
        accidentadoNombre: '',
        accidentadoDni: '',
        accidentadoEdad: '',
        accidentadoEstadoCivil: '',
        accidentadoFechaIngreso: '',
        accidentadoCargo: '',
        accidentadoOtros: '',
        unidadInterna: '',
        unidadMarcaModelo: '',
        unidadPatente: '',
        conductorNombre: '',
        conductorTelefono: '',
        descripcionEvento: '',
        causasIncidente: '',
        testigos: '',
        accionesCorrectivas: '',
        nombreSupervisor: '',
        presenteEnLugar: false,
        temperaturaAmbiente: '',
        velocidadViento: '',
        incidenteAmbientalLocacion: '',
        incidenteAmbientalVolumen: '',
        incidenteAmbientalAreaM2: '',
        fotosFiles: [],
        catalogo: createInitialCatalog(),
      });
      setPhotoError(null);
      onCancel?.();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('No se pudo guardar el incidente.');
    }
  };

  const renderCatalogSelect = (id: string) => (
    <label key={id}>
      <span className="text-sm font-semibold text-slate-700">{CATALOG_LABELS[id] ?? id}</span>
      <select
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        value={values.catalogo[id] ?? ''}
        onChange={(event) => handleCatalogChange(id, event.target.value)}
      >
        <option value="">Seleccionar</option>
        {getCatalogOptions(id).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Informante del incidente</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-sm font-semibold text-slate-700">Apellido</span>
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.informanteApellido}
              onChange={(event) => handleChange('informanteApellido', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Nombres</span>
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.informanteNombres}
              onChange={(event) => handleChange('informanteNombres', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Fecha</span>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.fechaReporte}
              onChange={(event) => handleChange('fechaReporte', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Incidentes / accidentes personales</p>
        <div className="mt-3 grid gap-4 md:grid-cols-4">
          <label>
            <span className="text-sm font-semibold text-slate-700">Tipo de incidente *</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.tipoIncidente}
              onChange={(event) => handleChange('tipoIncidente', event.target.value)}
            >
              <option value="">Seleccionar</option>
              {getCatalogOptions('tipo_incidente').map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Gravedad *</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.gravedad}
              onChange={(event) => handleChange('gravedad', event.target.value)}
            >
              <option value="">Seleccionar</option>
              {getCatalogOptions('gravedad').map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Clasificacion</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.clasificacion}
              onChange={(event) => handleChange('clasificacion', event.target.value)}
            >
              <option value="">Seleccionar</option>
              {getCatalogOptions('clasificacion').map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Hubo lesionados *</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.huboLesionados}
              onChange={(event) => handleChange('huboLesionados', event.target.value)}
            >
              <option value="">Seleccionar</option>
              {getCatalogOptions('hubo_lesionados').map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Cantidad de lesionados</span>
            <input
              type="number"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.cantidadLesionados}
              onChange={(event) => handleChange('cantidadLesionados', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Fecha incidente</span>
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.fechaIncidente}
              onChange={(event) => handleChange('fechaIncidente', event.target.value)}
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Hora incidente</span>
            <input
              type="time"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.horaIncidente}
              onChange={(event) => handleChange('horaIncidente', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Datos del accidentado</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-sm font-semibold text-slate-700">Nombre y apellido</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoNombre} onChange={(event) => handleChange('accidentadoNombre', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">DNI</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoDni} onChange={(event) => handleChange('accidentadoDni', event.target.value)} />
          </label>
          {renderCatalogSelect('cargo')}
          <label>
            <span className="text-sm font-semibold text-slate-700">Edad</span>
            <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoEdad} onChange={(event) => handleChange('accidentadoEdad', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Estado civil</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoEstadoCivil} onChange={(event) => handleChange('accidentadoEstadoCivil', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Fecha de ingreso</span>
            <input type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoFechaIngreso} onChange={(event) => handleChange('accidentadoFechaIngreso', event.target.value)} />
          </label>
          <label className="md:col-span-3">
            <span className="text-sm font-semibold text-slate-700">Otros</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoOtros} onChange={(event) => handleChange('accidentadoOtros', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Unidad afectada y datos del conductor</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-sm font-semibold text-slate-700">Interno</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.unidadInterna} onChange={(event) => handleChange('unidadInterna', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Marca / Modelo</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.unidadMarcaModelo} onChange={(event) => handleChange('unidadMarcaModelo', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Patente</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.unidadPatente} onChange={(event) => handleChange('unidadPatente', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Apellido y nombre conductor</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.conductorNombre} onChange={(event) => handleChange('conductorNombre', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Telefono conductor</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.conductorTelefono} onChange={(event) => handleChange('conductorTelefono', event.target.value)} />
          </label>
          {renderCatalogSelect('tipo_servicio')}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Condiciones</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {renderCatalogSelect('condicion_climatica')}
          {renderCatalogSelect('condicion_luz')}
          {renderCatalogSelect('tipo_terreno')}
          {renderCatalogSelect('condicion_ruta_terreno')}
          <label>
            <span className="text-sm font-semibold text-slate-700">Temperatura ambiente (C)</span>
            <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.temperaturaAmbiente} onChange={(event) => handleChange('temperaturaAmbiente', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Velocidad del viento (Km/h)</span>
            <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.velocidadViento} onChange={(event) => handleChange('velocidadViento', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Incidente ambiental</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-sm font-semibold text-slate-700">Locacion</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.incidenteAmbientalLocacion} onChange={(event) => handleChange('incidenteAmbientalLocacion', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Volumen lts o m3</span>
            <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.incidenteAmbientalVolumen} onChange={(event) => handleChange('incidenteAmbientalVolumen', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Area afectada (m2)</span>
            <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.incidenteAmbientalAreaM2} onChange={(event) => handleChange('incidenteAmbientalAreaM2', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Otras consideraciones preliminares</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {renderCatalogSelect('actos_inseguros')}
          {renderCatalogSelect('condiciones_inseguras')}
          {renderCatalogSelect('agente_material')}
          {renderCatalogSelect('forma_accidente')}
          {renderCatalogSelect('naturaleza_lesion')}
          {renderCatalogSelect('zona_cuerpo')}
          {renderCatalogSelect('area_evento')}
          {renderCatalogSelect('epp')}
          {renderCatalogSelect('tipo_tarea')}
          {renderCatalogSelect('permiso_trabajo')}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Descripcion del evento</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Descripcion del evento *</span>
            <textarea
              rows={4}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={values.descripcionEvento}
              onChange={(event) => handleChange('descripcionEvento', event.target.value)}
            />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Fotos del evento (2 o 3)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              onChange={handlePhotosChange}
            />
            {values.fotosFiles.length > 0 && (
              <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                {values.fotosFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-2 py-1">
                    <p className="truncate">{file.name}</p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:border-slate-500"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Cierre del reporte</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">Nombre supervisor</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.nombreSupervisor} onChange={(event) => handleChange('nombreSupervisor', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Cargo (manual)</span>
            <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accidentadoCargo} onChange={(event) => handleChange('accidentadoCargo', event.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Causas del accidente/incidente</span>
            <textarea rows={3} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.causasIncidente} onChange={(event) => handleChange('causasIncidente', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Testigos</span>
            <textarea rows={2} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.testigos} onChange={(event) => handleChange('testigos', event.target.value)} />
          </label>
          <label>
            <span className="text-sm font-semibold text-slate-700">Acciones correctivas inmediatas</span>
            <textarea rows={2} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" value={values.accionesCorrectivas} onChange={(event) => handleChange('accionesCorrectivas', event.target.value)} />
          </label>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="presente_en_lugar"
              type="checkbox"
              checked={values.presenteEnLugar}
              onChange={(event) => handleChange('presenteEnLugar', event.target.checked)}
            />
            <label htmlFor="presente_en_lugar" className="text-sm text-slate-700">
              Supervisor presente en el lugar
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-600">
          {status === 'saved' && 'Registro guardado correctamente.'}
          {status === 'error' && error}
        </div>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          disabled={!isValid || status === 'saving'}
        >
          {status === 'saving' ? 'Guardando...' : 'Guardar incidente'}
        </button>
      </div>
    </form>
  );
}
