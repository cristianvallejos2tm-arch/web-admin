import React from 'react';
import logo from '../logo.png';
import diplomaBg from '../diploma.png?inline';

export type EvaluacionQA = {
  orden: number;
  pregunta: string;
  respuesta: string;
};

export type EvaluacionTemplateProps = {
  codigo: string;            // "RGI-06.03"
  revision: string;          // "00"
  fechaDocumento: string;    // "30/12/2025"
  empleado: {
    apellidos: string;
    nombres: string;
    fecha: string;
    email?: string;
    puesto: string;
    tema: string;
  };
  puntaje: string;
  resultado: string;
  evaluador: string;
  qa: EvaluacionQA[];        // puede venir > 23
};

// helpers
const QA_LIMIT = 23;
const pick = (qa: EvaluacionQA[], n: number) =>
  [...qa].sort((a, b) => a.orden - b.orden).slice(0, n);

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "210mm",
    height: "297mm",
    backgroundColor: "#fff",
    backgroundImage: `url(${diplomaBg})`,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    fontFamily: "Arial, Calibri, sans-serif",
    color: "#000",
    boxSizing: "border-box",
    padding: "0mm",
  },
  sheet: {
    margin: "0 auto",
    width: "210mm",
    height: "297mm",
    boxSizing: "border-box",
    padding: "10mm", // margen visual como impresión
  },
  frame: {
    border: "2px solid #000",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "grid",
    width: "100%",
    boxSizing: "border-box",
  },
  cell: {
    borderRight: "2px solid #000",
    borderBottom: "2px solid #000",
    padding: "2mm 2mm",
    fontSize: "10pt",
    lineHeight: 1.15,
    boxSizing: "border-box",
  },
  cellNoRight: {
    borderBottom: "2px solid #000",
    padding: "2mm 2mm",
    fontSize: "10pt",
    lineHeight: 1.15,
    boxSizing: "border-box",
  },
  center: { display: "flex", alignItems: "center", justifyContent: "center" },
  bold: { fontWeight: 700 },
  small: { fontSize: "9pt" },
  tiny: { fontSize: "8pt" },
  title: { fontSize: "16pt", fontWeight: 700, letterSpacing: "0.5pt" },
  gray: { background: "#d9d9d9" }, // gris del template
  lightGray: { background: "#efefef" },
  noBottom: { borderBottom: "none" },
  noRight: { borderRight: "none" },
  hr1: { borderBottom: "1px solid #000" },
};

export const EvaluacionTemplateExact: React.FC<EvaluacionTemplateProps> = (props) => {
  const { codigo, revision, fechaDocumento, empleado, puntaje, resultado, evaluador } = props;

  const qaMain = pick(props.qa, QA_LIMIT);
  const qaExtra = [...props.qa].sort((a, b) => a.orden - b.orden).slice(QA_LIMIT);

  return (
    <div>
      {/* PAGE 1 */}
      <div style={styles.page}>
        <div style={styles.sheet}>
          <div style={styles.frame}>

            {/* Header row: logo | title | emitio/reviso/autorizo */}
            <div
              style={{
                ...styles.row,
                gridTemplateColumns: "45mm 1fr 35mm",
              }}
            >
              <div style={{ ...styles.cell, ...styles.center }}>
                <img src={logo} alt="CAM SRL" style={{ width: "34mm", height: "auto" }} />
              </div>

              <div style={{ ...styles.cell, ...styles.center }}>
                <div style={styles.title}>EVALUACION DE CAPACITACION</div>
              </div>

              <div style={{ ...styles.cellNoRight }}>
                <div style={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", height: "100%" }}>
                  {[
                    ["Emitió", "CSMA"],
                    ["Revisó", "EC"],
                    ["Autorizó", "JA/GM"],
                  ].map(([l, v], idx) => (
                    <div
                      key={l}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        borderBottom: idx < 2 ? "1px solid #000" : "none",
                        alignItems: "center",
                        padding: "1.5mm 1.5mm",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ ...styles.tiny, ...styles.bold }}>{l}</div>
                      <div style={{ ...styles.tiny, ...styles.bold, textAlign: "right" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row: Código | Revisión doc | 00 | Fecha actualización | fecha */}
            <div
              style={{
                ...styles.row,
                gridTemplateColumns: "70mm 30mm 15mm 55mm 1fr",
              }}
            >
              <div style={{ ...styles.cell, ...styles.gray }}>
                <span style={styles.bold}>Código:</span>{" "}
                <span style={styles.bold}>{codigo}</span>
              </div>

              <div style={{ ...styles.cell, ...styles.gray }}>
                <div style={{ ...styles.tiny, ...styles.bold }}>Revision del documento N° :</div>
              </div>

              <div style={{ ...styles.cell, ...styles.gray, ...styles.center }}>
                <span style={styles.bold}>{revision}</span>
              </div>

              <div style={{ ...styles.cell, ...styles.gray }}>
                <div style={{ ...styles.tiny, ...styles.bold }}>Fecha actualización del documento</div>
              </div>

              <div style={{ ...styles.cellNoRight, ...styles.gray, ...styles.center }}>
                <span style={styles.bold}>{fechaDocumento}</span>
              </div>
            </div>

            {/* DATOS DEL EMPLEADO header */}
            <div
              style={{
                ...styles.row,
                gridTemplateColumns: "55mm 1fr 1fr 35mm 35mm",
              }}
            >
              <div style={{ ...styles.cell, ...styles.center, ...styles.gray }}>
                <span style={styles.bold}>DATOS DEL EMPLEADO</span>
              </div>
              <div style={{ ...styles.cell, ...styles.center, ...styles.gray }}>
                <span style={styles.bold}>Apellidos</span>
              </div>
              <div style={{ ...styles.cell, ...styles.center, ...styles.gray }}>
                <span style={styles.bold}>Nombres</span>
              </div>
              <div style={{ ...styles.cell, ...styles.center, ...styles.gray }}>
                <span style={styles.bold}>Fecha</span>
              </div>
              <div style={{ ...styles.cellNoRight, ...styles.center, ...styles.gray }}>
                <span style={styles.bold}>Firma</span>
              </div>
            </div>

            {/* DATOS DEL EMPLEADO values */}
            <div
              style={{
                ...styles.row,
                gridTemplateColumns: "55mm 1fr 1fr 35mm 35mm",
              }}
            >
              <div style={{ ...styles.cell, ...styles.center }}>
                {/* vacío como template */}
              </div>
              <div style={styles.cell}>{empleado.apellidos}</div>
              <div style={styles.cell}>{empleado.nombres}</div>
              <div style={styles.cell}>{empleado.fecha}</div>
              <div style={styles.cellNoRight}>{/* firma */}</div>
            </div>

            {/* Puesto de trabajo */}
            <div style={{ ...styles.row, gridTemplateColumns: "55mm 1fr" }}>
              <div style={{ ...styles.cell, ...styles.bold, ...styles.center }}>
                PUESTO DE TRABAJO:
              </div>
              <div style={styles.cellNoRight}>{empleado.puesto}</div>
            </div>

            {/* Tema evaluado */}
            <div style={{ ...styles.row, gridTemplateColumns: "55mm 1fr" }}>
              <div style={{ ...styles.cell, ...styles.bold, ...styles.center }}>
                TEMA EVALUADO:
              </div>
              <div style={styles.cellNoRight}>{empleado.tema}</div>
            </div>

            {/* CUESTIONARIO band */}
            <div style={{ ...styles.row, gridTemplateColumns: "1fr" }}>
              <div style={{ ...styles.cellNoRight, ...styles.center, ...styles.lightGray }}>
                <span style={styles.bold}>CUESTIONARIO</span>
              </div>
            </div>

            {/* Big questionnaire box (page 1 area) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  flex: 1,
                  borderBottom: "2px solid #000",
                  boxSizing: "border-box",
                  padding: "2mm 2mm",
                  display: "grid",
                  gridTemplateRows: `repeat(${QA_LIMIT}, 1fr)`,
                  gap: 0,
                }}
              >
                {Array.from({ length: QA_LIMIT }, (_, i) => {
                  const item = qaMain[i];
                  return (
                    <div
                      key={i}
                      style={{
                        borderBottom: i < QA_LIMIT - 1 ? "1px solid #000" : "none",
                        display: "grid",
                        gridTemplateColumns: "1fr 45mm",
                        alignItems: "center",
                        padding: "1mm 1mm",
                        boxSizing: "border-box",
                        fontSize: "9pt",
                      }}
                    >
                      <div>
                        {item ? `(${item.orden}) ${item.pregunta}` : ""}
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 700 }}>
                        {item?.respuesta ?? ""}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Puntaje / Resultado row */}
              <div style={{ ...styles.row, gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ ...styles.cell }}>
                  <div style={styles.bold}>Puntaje:</div>
                  <div>{puntaje}</div>
                </div>
                <div style={{ ...styles.cellNoRight }}>
                  <div style={styles.bold}>Resultado:</div>
                  <div>{resultado}</div>
                </div>
              </div>

              {/* Evaluó al operario (header) */}
              <div style={{ ...styles.row, gridTemplateColumns: "55mm 1fr 55mm" }}>
                <div style={{ ...styles.cell, ...styles.gray, ...styles.center, ...styles.bold }}>
                  Evaluó al Operario.
                </div>
                <div style={{ ...styles.cell, ...styles.gray, ...styles.center, ...styles.bold }}>
                  Apellido y Nombre
                </div>
                <div style={{ ...styles.cellNoRight, ...styles.gray, ...styles.center, ...styles.bold }}>
                  Firma
                </div>
              </div>

              {/* Evaluó al operario (values) */}
              <div style={{ ...styles.row, gridTemplateColumns: "55mm 1fr 55mm" }}>
                <div style={{ ...styles.cell, ...styles.center }} />
                <div style={{ ...styles.cell, ...styles.center }}>{evaluador}</div>
                <div style={{ ...styles.cellNoRight }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 (ANEXO) only if overflow */}
      {qaExtra.length > 0 && (
        <div style={{ ...styles.page, pageBreakBefore: "always" as any }}>
          <div style={styles.sheet}>
            <div style={styles.frame}>
              <div style={{ ...styles.row, gridTemplateColumns: "1fr" }}>
                <div style={{ ...styles.cellNoRight, ...styles.center }}>
                  <span style={styles.bold}>ANEXO - Continuación del cuestionario</span>
                </div>
              </div>

              <div style={{ flex: 1, borderTop: "2px solid #000", padding: "2mm" }}>
                {qaExtra.map((it) => (
                  <div
                    key={it.orden}
                    style={{
                      borderBottom: "1px solid #000",
                      padding: "1mm 0",
                      display: "grid",
                      gridTemplateColumns: "1fr 45mm",
                      fontSize: "9pt",
                      alignItems: "center",
                    }}
                  >
                    <div>{`(${it.orden}) ${it.pregunta}`}</div>
                    <div style={{ textAlign: "right", fontWeight: 700 }}>{it.respuesta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print rules */}
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default EvaluacionTemplateExact;
