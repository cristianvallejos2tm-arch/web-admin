-- Insertar módulos en la tabla modulos
-- Ejecuta este script en tu base de datos PostgreSQL/Supabase

INSERT INTO public.modulos (code, nombre, descripcion, activo) VALUES
('dashboard', 'Dashboard', 'Panel principal con estadísticas y resumen', true),
('vehicles', 'Vehículos', 'Gestión de flota de vehículos', true),
('shift_change', 'Cambio de Turno', 'Registro de cambios de turno', true),
('work_orders', 'Órdenes de Trabajo', 'Gestión de órdenes de trabajo', true),
('tasks', 'Tareas', 'Gestión de tareas', true),
('maintenance', 'Mantenimiento', 'Planes y registros de mantenimiento', true),
('inventory', 'Inventario', 'Control de inventario y stock', true),
('panol', 'Pañol', 'Gestión de pañol', true),
('lubricants', 'Lubricantes', 'Control de lubricantes', true),
('tires', 'Neumáticos', 'Gestión de neumáticos', true),
('performance', 'Evaluación de Desempeño', 'Evaluación de desempeño de conductores', true),
('users', 'Usuarios', 'Gestión de usuarios y permisos', true),
('autorizaciones', 'Autorizaciones', 'Flujo de autorizaciones de compras', true),
('profile', 'Perfil', 'Perfil de usuario', true),
('config', 'Configuración', 'Configuración del sistema', true),
('password', 'Cambiar Contraseña', 'Cambio de contraseña', true);

-- Verificar que se insertaron correctamente
SELECT * FROM public.modulos ORDER BY nombre;
