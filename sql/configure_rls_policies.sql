-- Script para verificar y configurar políticas RLS en Supabase
-- Ejecuta este script si sigues teniendo problemas con el error 400

-- 1. Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'modulos', 'usuarios_modulos');

-- 2. Deshabilitar temporalmente RLS para pruebas (SOLO PARA DESARROLLO)
-- ADVERTENCIA: Esto permite acceso completo a las tablas. No usar en producción.
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_modulos DISABLE ROW LEVEL SECURITY;

-- 3. O crear políticas permisivas para desarrollo
-- Opción alternativa: Habilitar RLS pero permitir todas las operaciones

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_modulos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Enable all for usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Enable all for modulos" ON public.modulos;
DROP POLICY IF EXISTS "Enable all for usuarios_modulos" ON public.usuarios_modulos;

-- Crear políticas permisivas (SOLO PARA DESARROLLO)
CREATE POLICY "Enable all for usuarios" ON public.usuarios
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for modulos" ON public.modulos
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all for usuarios_modulos" ON public.usuarios_modulos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('usuarios', 'modulos', 'usuarios_modulos');
