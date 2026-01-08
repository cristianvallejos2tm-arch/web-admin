-- Tablas y políticas ligeras para el módulo de Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  tipo character varying NOT NULL,
  archivos jsonb DEFAULT '[]'::jsonb,
  creado_por uuid NOT NULL REFERENCES public.usuarios(id),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notificaciones_bases (
  notificacion_id uuid NOT NULL REFERENCES public.notificaciones(id) ON DELETE CASCADE,
  base_id uuid NOT NULL REFERENCES public.bases(id),
  CONSTRAINT notificaciones_bases_pkey PRIMARY KEY (notificacion_id, base_id)
);

CREATE TABLE IF NOT EXISTS public.notificaciones_destinatarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  notificacion_id uuid NOT NULL REFERENCES public.notificaciones(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
  estado character varying NOT NULL DEFAULT 'pendiente',
  fecha_leido timestamp with time zone,
  CONSTRAINT notificaciones_destinatarios_pkey PRIMARY KEY (id)
);


ALTER TABLE public.notificaciones_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_destinatarios ENABLE ROW LEVEL SECURITY;



CREATE POLICY notificaciones_bases_select ON public.notificaciones_bases
  FOR SELECT USING (true);

CREATE POLICY notificaciones_destinatarios_select ON public.notificaciones_destinatarios
  FOR SELECT USING (true);

CREATE POLICY notificaciones_destinatarios_update ON public.notificaciones_destinatarios
  FOR UPDATE USING (true) WITH CHECK (true);
