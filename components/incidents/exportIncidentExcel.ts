import JSZip from 'jszip';
import { IncidentRow } from '../../services/incidentes';

const INCIDENT_TEMPLATE_URL = new URL('../../reporte de incidente.xlsm', import.meta.url).href;
const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

const asText = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const buildCatalogMap = (incident: IncidentRow) => {
  const map = new Map<string, string>();
  (incident.incidentes_catalogo ?? []).forEach((entry) => {
    if (entry?.categoria && entry?.opcion && !map.has(entry.categoria)) {
      map.set(entry.categoria, entry.opcion);
    }
  });
  return map;
};

const getCellCoordinates = (address: string) => {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { column: match[1], row: Number(match[2]) };
};

const columnToNumber = (column: string) => {
  let num = 0;
  for (let i = 0; i < column.length; i += 1) {
    num = num * 26 + (column.charCodeAt(i) - 64);
  }
  return num;
};

const getOrCreateCell = (document: XMLDocument, address: string) => {
  const coords = getCellCoordinates(address);
  if (!coords) return null;
  const sheetData =
    document.getElementsByTagNameNS(SHEET_NS, 'sheetData')[0] ||
    document.getElementsByTagName('sheetData')[0];
  if (!sheetData) return null;

  let rowElement: Element | null = null;
  const rowsNs = Array.from(sheetData.getElementsByTagNameNS(SHEET_NS, 'row'));
  const rowsFallback = Array.from(sheetData.getElementsByTagName('row'));
  const rows = rowsNs.length > 0 ? rowsNs : rowsFallback;
  rowElement = rows.find((row) => Number(row.getAttribute('r')) === coords.row) ?? null;

  if (!rowElement) {
    rowElement = document.createElementNS(SHEET_NS, 'row');
    rowElement.setAttribute('r', String(coords.row));
    sheetData.appendChild(rowElement);
  }

  let cellElement: Element | null = null;
  const cellsNs = Array.from(rowElement.getElementsByTagNameNS(SHEET_NS, 'c'));
  const cellsFallback = Array.from(rowElement.getElementsByTagName('c'));
  const rowCells = cellsNs.length > 0 ? cellsNs : cellsFallback;
  cellElement = rowCells.find((cell) => cell.getAttribute('r') === address) ?? null;

  if (!cellElement) {
    cellElement = document.createElementNS(SHEET_NS, 'c');
    cellElement.setAttribute('r', address);
    const newColumnNumber = columnToNumber(coords.column);
    const insertBefore = rowCells.find((cell) => {
      const ref = cell.getAttribute('r') ?? '';
      const parsed = getCellCoordinates(ref);
      if (!parsed) return false;
      return columnToNumber(parsed.column) > newColumnNumber;
    });
    if (insertBefore) {
      rowElement.insertBefore(cellElement, insertBefore);
    } else {
      rowElement.appendChild(cellElement);
    }
  }

  return cellElement;
};

const setSharedStringCell = (
  document: XMLDocument,
  address: string,
  value: unknown,
  getSharedStringIndex: (text: string) => number,
) => {
  const normalized = asText(value);
  const cellElement = getOrCreateCell(document, address);
  if (!cellElement) return;

  while (cellElement.firstChild) {
    cellElement.removeChild(cellElement.firstChild);
  }

  if (!normalized.trim()) {
    cellElement.removeAttribute('t');
    return;
  }

  const index = getSharedStringIndex(normalized);
  cellElement.setAttribute('t', 's');
  const vNode = document.createElementNS(SHEET_NS, 'v');
  vNode.textContent = String(index);
  cellElement.appendChild(vNode);
};

const resolveSheetPath = async (zip: JSZip, targetSheetName: string) => {
  const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
  const workbookRelsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!workbookXml || !workbookRelsXml) {
    throw new Error('No se pudo leer la estructura del workbook.');
  }

  const parser = new DOMParser();
  const workbookDoc = parser.parseFromString(workbookXml, 'application/xml');
  const relsDoc = parser.parseFromString(workbookRelsXml, 'application/xml');

  const sheet = Array.from(workbookDoc.getElementsByTagName('sheet')).find(
    (node) => node.getAttribute('name') === targetSheetName,
  );
  if (!sheet) {
    return null;
  }

  const relationId =
    sheet.getAttribute('r:id') ||
    sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
  if (!relationId) return null;

  const relation = Array.from(relsDoc.getElementsByTagName('Relationship')).find(
    (node) => node.getAttribute('Id') === relationId,
  );
  const target = relation?.getAttribute('Target');
  if (!target) return null;

  return target.startsWith('/') ? target.replace(/^\//, '') : `xl/${target.replace(/^xl\//, '')}`;
};

export async function downloadIncidentAsExcelTemplate(incident: IncidentRow) {
  const response = await fetch(INCIDENT_TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla de Excel.');
  }

  const templateArrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(templateArrayBuffer);
  const sheetPath = (await resolveSheetPath(zip, 'Reporte Incidente')) ?? 'xl/worksheets/sheet1.xml';
  const sheetXml = await zip.file(sheetPath)?.async('string');
  if (!sheetXml) {
    throw new Error('No se pudo encontrar la hoja de reporte.');
  }
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
  const sharedStringsPath = 'xl/sharedStrings.xml';
  const sharedStringsXml = await zip.file(sharedStringsPath)?.async('string');
  if (!sharedStringsXml) {
    throw new Error('La plantilla no tiene sharedStrings.xml.');
  }
  const sharedDoc = parser.parseFromString(sharedStringsXml, 'application/xml');

  const sharedRoot =
    sharedDoc.getElementsByTagNameNS(SHEET_NS, 'sst')[0] || sharedDoc.getElementsByTagName('sst')[0];
  if (!sharedRoot) {
    throw new Error('No se pudo leer sharedStrings.');
  }

  const sharedItems = Array.from(
    sharedRoot.getElementsByTagNameNS(SHEET_NS, 'si').length
      ? sharedRoot.getElementsByTagNameNS(SHEET_NS, 'si')
      : sharedRoot.getElementsByTagName('si'),
  );
  const sharedMap = new Map<string, number>();
  sharedItems.forEach((item, index) => {
    const tNodes = Array.from(
      item.getElementsByTagNameNS(SHEET_NS, 't').length
        ? item.getElementsByTagNameNS(SHEET_NS, 't')
        : item.getElementsByTagName('t'),
    );
    const text = tNodes.map((node) => node.textContent ?? '').join('');
    if (!sharedMap.has(text)) {
      sharedMap.set(text, index);
    }
  });

  const getSharedStringIndex = (text: string) => {
    const normalized = text ?? '';
    const existing = sharedMap.get(normalized);
    if (typeof existing === 'number') return existing;

    const siNode = sharedDoc.createElementNS(SHEET_NS, 'si');
    const tNode = sharedDoc.createElementNS(SHEET_NS, 't');
    tNode.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    tNode.textContent = normalized;
    siNode.appendChild(tNode);
    sharedRoot.appendChild(siNode);
    const newIndex = sharedItems.length;
    sharedItems.push(siNode);
    sharedMap.set(normalized, newIndex);
    return newIndex;
  };

  const catalog = buildCatalogMap(incident);
  const informante = `${asText(incident.informante_apellido)} ${asText(incident.informante_nombres)}`.trim();

  // Informante del incidente
  setSharedStringCell(sheetDoc, 'D7', incident.informante_apellido, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E7', incident.informante_nombres, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'I7', incident.fecha_reporte, getSharedStringIndex);

  // Incidentes / accidentes personales
  setSharedStringCell(sheetDoc, 'C10', incident.tipo_incidente, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C11', incident.gravedad, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E10', incident.hubo_lesionados, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E11', incident.cantidad_lesionados, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C12', incident.fecha_incidente, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E12', incident.hora_incidente, getSharedStringIndex);

  // Datos del accidentado
  setSharedStringCell(sheetDoc, 'C14', incident.accidentado_nombre, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C15', incident.accidentado_dni, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E15', incident.accidentado_estado_civil, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C16', incident.accidentado_edad, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E16', incident.accidentado_fecha_ingreso, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C17', incident.accidentado_cargo || catalog.get('cargo'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'E17', incident.accidentado_otros, getSharedStringIndex);

  // Unidad afectada y conductor
  setSharedStringCell(sheetDoc, 'H11', incident.unidad_interna, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'H12', incident.unidad_marca_modelo, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'H13', incident.unidad_patente, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J11', incident.conductor_nombre, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J12', incident.conductor_telefono, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J13', incident.tipo_servicio || catalog.get('tipo_servicio'), getSharedStringIndex);

  // Condiciones e incidente ambiental
  setSharedStringCell(sheetDoc, 'H15', incident.condicion_climatica || catalog.get('condicion_climatica'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'H16', incident.condicion_luz || catalog.get('condicion_luz'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'H17', incident.tipo_terreno || catalog.get('tipo_terreno'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J15', incident.incidente_ambiental_locacion, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J16', incident.incidente_ambiental_volumen, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J17', incident.incidente_ambiental_area_m2, getSharedStringIndex);

  // Descripcion y consideraciones
  const fotos = incident.fotos ?? [];
  const photosText = fotos.length
    ? `\n\nFOTOS CARGADAS:\n${fotos.map((url, index) => `${index + 1}) ${url}`).join('\n')}`
    : '';
  setSharedStringCell(sheetDoc, 'B19', `${asText(incident.descripcion_evento)}${photosText}`, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J19', catalog.get('actos_inseguros'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J20', catalog.get('condiciones_inseguras'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J21', catalog.get('agente_material'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J22', catalog.get('forma_accidente'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J23', catalog.get('naturaleza_lesion'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J24', catalog.get('zona_cuerpo'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J25', catalog.get('area_evento'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J26', catalog.get('epp'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J27', catalog.get('tipo_tarea'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J28', catalog.get('permiso_trabajo'), getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J29', incident.temperatura_ambiente, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J30', incident.velocidad_viento, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'J31', incident.condicion_ruta_terreno || catalog.get('condicion_ruta_terreno'), getSharedStringIndex);

  // Cierre
  setSharedStringCell(sheetDoc, 'B30', incident.nombre_supervisor, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'C31', incident.presente_en_lugar ? 'SI' : 'NO', getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'B33', incident.causas_incidente, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'B37', incident.testigos, getSharedStringIndex);
  setSharedStringCell(sheetDoc, 'G37', incident.acciones_correctivas, getSharedStringIndex);

  const now = new Date();
  const filenameDate = now.toISOString().slice(0, 10);
  const filenameTime = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const safeInformante = informante.replace(/[^\w.-]+/g, '_') || 'incidente';
  const outputName = `reporte_incidente_${safeInformante}_${filenameDate}_${filenameTime}.xlsm`;

  zip.file(sheetPath, serializer.serializeToString(sheetDoc));
  sharedRoot.setAttribute('count', String(sharedItems.length));
  sharedRoot.setAttribute('uniqueCount', String(sharedMap.size));
  zip.file(sharedStringsPath, serializer.serializeToString(sharedDoc));
  const output = await zip.generateAsync({ type: 'uint8array' });
  const blob = new Blob([output], {
    type: 'application/vnd.ms-excel.sheet.macroEnabled.12',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = outputName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
