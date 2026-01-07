import React from 'react';
import diplomaBg from '../diploma.png?inline';

export type DiplomaTemplateProps = {
  nombreApellido: string;
  curso: string;
  calificacion: string;
  fechaValidez: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '148.5mm',
    height: '105mm',
    backgroundImage: `url(${diplomaBg})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100% 100%',   // ✅ NO recorta, ajusta exacto al rectángulo
    backgroundColor: '#fff',
    fontFamily: 'Montserrat, Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },

  content: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '10mm 14mm',          // ✅ “margen” interno controlado
    boxSizing: 'border-box',
  },

  // IMPORTANTE: limitá ancho y permití cortes para emails largos
  textBlock: {
    maxWidth: '120mm',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },

  label: { fontSize: '10pt', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2mm' },
  title: { fontSize: '18pt', fontWeight: 700, marginBottom: '5mm' },
  name:  { fontSize: '20pt', fontWeight: 700, marginBottom: '3mm' },
  text:  { fontSize: '11pt', color: '#444', marginBottom: '2mm' },
  course:{ fontSize: '13pt', fontWeight: 600, fontStyle: 'italic', marginBottom: '2mm' },
};


const DiplomaTemplate: React.FC<DiplomaTemplateProps> = ({
  nombreApellido,
  curso,
  calificacion,
  fechaValidez,
}) => {
  return (
    <div style={styles.page}>
  <div style={styles.content}>
    <div style={styles.label}>Certificado</div>
    <div style={styles.title}>CAM certifica que:</div>

    <div style={{ ...styles.name, ...styles.textBlock }}>{nombreApellido}</div>

    <div style={styles.text}>Acreditó favorablemente el curso</div>
    <div style={{ ...styles.course, ...styles.textBlock }}>"{curso}"</div>
    <div style={styles.text}>con calificación del {calificacion}</div>

    <div style={{ ...styles.text, marginTop: '5mm' }}>
      Certificado con validez desde el {fechaValidez}
    </div>
  </div>
</div>

  );
};

export default DiplomaTemplate;
