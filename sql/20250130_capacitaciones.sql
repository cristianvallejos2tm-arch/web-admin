CREATE TABLE public.capacitaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  titulo text NOT NULL,
  introduccion text,
  descripcion text,
  tipo character varying,
  instructor character varying,
  ubicacion character varying,
  fecha timestamp with time zone,
  estado character varying NOT NULL DEFAULT 'borrador',
  capacidad integer NOT NULL DEFAULT 0,
  inscriptos integer NOT NULL DEFAULT 0,
  cuestionario_nombre character varying,
  video_url text,
  archivos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT capacitaciones_pkey PRIMARY KEY (id),
  CONSTRAINT capacitaciones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id)
);

CREATE TABLE public.capacitaciones_preguntas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  capacitacion_id uuid NOT NULL,
  orden integer NOT NULL,
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT capacitaciones_preguntas_pkey PRIMARY KEY (id),
  CONSTRAINT capacitaciones_preguntas_capacitacion_id_fkey FOREIGN KEY (capacitacion_id) REFERENCES public.capacitaciones(id) ON DELETE CASCADE
);

CREATE TABLE public.capacitaciones_inscripciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  capacitacion_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  estado character varying NOT NULL DEFAULT 'Confirmado',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT capacitaciones_inscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT capacitaciones_inscripciones_capacitacion_id_fkey FOREIGN KEY (capacitacion_id) REFERENCES public.capacitaciones(id) ON DELETE CASCADE,
  CONSTRAINT capacitaciones_inscripciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- Opcional: estadísticas sintetizadas que facilitan la UI
CREATE VIEW public.capacitaciones_view AS
SELECT
  c.*,
  COALESCE(ci.cantidad, 0) AS inscriptos_total
FROM public.capacitaciones c
LEFT JOIN (
  SELECT capacitacion_id, COUNT(*) AS cantidad
  FROM public.capacitaciones_inscripciones
  GROUP BY capacitacion_id
) ci ON ci.capacitacion_id = c.id;

CREATE OR REPLACE FUNCTION public.refresh_capacitaciones_inscriptos()
RETURNS trigger AS $$
BEGIN
  UPDATE public.capacitaciones
  SET inscriptos = (
    SELECT COUNT(*) FROM public.capacitaciones_inscripciones WHERE capacitacion_id = NEW.capacitacion_id
  )
  WHERE id = NEW.capacitacion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capacitaciones_inscripciones_refresh
AFTER INSERT OR DELETE OR UPDATE ON public.capacitaciones_inscripciones
FOR EACH ROW EXECUTE FUNCTION public.refresh_capacitaciones_inscriptos();

CREATE TABLE public.operadoras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT operadoras_pkey PRIMARY KEY (id)
);

CREATE TABLE public.usuarios_operadoras (
  usuario_id uuid NOT NULL,
  operadora_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_operadoras_pkey PRIMARY KEY (usuario_id, operadora_id),
  CONSTRAINT usuarios_operadoras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT usuarios_operadoras_operadora_id_fkey FOREIGN KEY (operadora_id) REFERENCES public.operadoras(id) ON DELETE CASCADE
);

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS base_id uuid REFERENCES public.bases(id);

CREATE TABLE IF NOT EXISTS public.capacitaciones_respuestas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pregunta_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  respuesta text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT capacitaciones_respuestas_pkey PRIMARY KEY (id),
  CONSTRAINT capacitaciones_respuestas_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.capacitaciones_preguntas(id) ON DELETE CASCADE,
  CONSTRAINT capacitaciones_respuestas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS capacitaciones_respuestas_unique
ON public.capacitaciones_respuestas (pregunta_id, usuario_id);

-- Ensure the capacitaciones module exists for granting access via the UI
INSERT INTO public.modulos (code, nombre, descripcion, activo)
VALUES ('capacitaciones', 'Capacitaciones', 'Gestión de capacitaciones y planillas de preguntas', true)
ON CONFLICT (code) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    activo = EXCLUDED.activo;
