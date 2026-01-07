-- Tabla y políticas para el módulo de Observaciones de Seguridad
CREATE TABLE IF NOT EXISTS public.observaciones_seguridad (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  area text,
  tarea_observada text,
  tipo character varying,
  descripcion text,
  accion_sugerida text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT observaciones_seguridad_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.observaciones_checklist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  observacion_id uuid NOT NULL REFERENCES public.observaciones_seguridad(id) ON DELETE CASCADE,
  categoria character varying NOT NULL,
  opcion text NOT NULL,
  seleccionada boolean NOT NULL DEFAULT true,
  CONSTRAINT observaciones_checklist_pkey PRIMARY KEY (id)
);

ALTER TABLE public.observaciones_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observaciones_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY obs_seguridad_public_select ON public.observaciones_seguridad
  FOR SELECT USING (true);

CREATE POLICY obs_seguridad_user_insert ON public.observaciones_seguridad
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY obs_seguridad_user_update ON public.observaciones_seguridad
  FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY obs_seguridad_user_delete ON public.observaciones_seguridad
  FOR DELETE USING (auth.uid() = usuario_id);

CREATE POLICY obs_checklist_user_select ON public.observaciones_checklist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.observaciones_seguridad o
      WHERE o.id = observacion_id AND auth.uid() = o.usuario_id
    )
  );

CREATE POLICY obs_checklist_user_insert ON public.observaciones_checklist
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.observaciones_seguridad o
      WHERE o.id = observacion_id AND auth.uid() = o.usuario_id
    )
  );

CREATE POLICY obs_checklist_user_update ON public.observaciones_checklist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.observaciones_seguridad o
      WHERE o.id = observacion_id AND auth.uid() = o.usuario_id
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.observaciones_seguridad o
      WHERE o.id = observacion_id AND auth.uid() = o.usuario_id
    )
  );

CREATE POLICY obs_checklist_user_delete ON public.observaciones_checklist
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.observaciones_seguridad o
      WHERE o.id = observacion_id AND auth.uid() = o.usuario_id
    )
  );
