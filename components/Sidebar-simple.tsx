import React, { useState } from 'react';
import { LayoutDashboard, Truck, ClipboardList, Settings, LogOut, Activity, Users, ShoppingCart, User, ChevronDown, ShieldCheck, BookOpenCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userName?: string;
  userModules?: string[]; // Module IDs the user has access to
  userRole?: string; // User role
  mobileMenuOpen?: boolean;
  onCloseMobile?: () => void;
}

// Barra lateral con navegación basada en módulos asignados y rol del usuario.
const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  userName,
  userModules = [],
  userRole,
  mobileMenuOpen,
  onCloseMobile,
}) => {
    // Mapeo de IDs de módulos a IDs de menú
    const moduleToMenuMap: { [key: string]: string } = {
        'dashboard': 'dashboard',
        'vehicles': 'vehicles',
        'tasks': 'tasks',
        'work_orders': 'workorders',
        'shift_change': 'shift',
        'maintenance': 'maintenance',
        'lubricants': 'lubricantes',
        'tires': 'cubiertas',
        'inventory': 'inventory',
        'users': 'users',
        'panol': 'panol',
        'performance': 'eval',
        'proveedores': 'proveedores',
        'compras': 'compras',
        'autorizaciones': 'autorizaciones',
        'capacitaciones': 'capacitaciones',
        'analytics': 'analytics',
        'profile': 'profile',
        'config': 'configuration',
    'password': 'change-password',
    'observaciones': 'observations',
    'incidentes': 'incidents',
    };

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, moduleCode: 'dashboard' },
        { id: 'vehicles', label: 'Vehículos', icon: Truck, moduleCode: 'vehicles' },
        { id: 'tasks', label: 'Tareas', icon: ClipboardList, moduleCode: 'tasks' },
        { id: 'workorders', label: 'Orden de Trabajo', icon: ClipboardList, moduleCode: 'work_orders' },
        { id: 'shift', label: 'Cambio de Turno', icon: ClipboardList, moduleCode: 'shift_change' },
        { id: 'maintenance', label: 'Mantenimiento', icon: ClipboardList, moduleCode: 'maintenance' },
        { id: 'lubricantes', label: 'Lubricantes', icon: ClipboardList, moduleCode: 'lubricants' },
        { id: 'cubiertas', label: 'Cubiertas', icon: ClipboardList, moduleCode: 'tires' },
        { id: 'inventory', label: 'Inventario', icon: ClipboardList, moduleCode: 'inventory' },
        { id: 'users', label: 'Usuarios', icon: Users, moduleCode: 'users' },
        { id: 'panol', label: 'Pañol', icon: ClipboardList, moduleCode: 'panol' },
        { id: 'capacitaciones', label: 'Capacitaciones', icon: BookOpenCheck, moduleCode: 'capacitaciones' },
        { id: 'eval', label: 'Eval. de Desempeño', icon: ClipboardList, moduleCode: 'performance' },
        { id: 'proveedores', label: 'Proveedores', icon: Users, moduleCode: 'proveedores' },
        { id: 'compras', label: 'Compras', icon: ShoppingCart, moduleCode: 'compras' },
        { id: 'autorizaciones', label: 'Autorizaciones', icon: ShieldCheck, moduleCode: 'autorizaciones' },
        { id: 'analytics', label: 'Análisis IA', icon: Activity, moduleCode: 'analytics' },
        { id: 'notifications', label: 'Comunicaciones', icon: ShieldCheck, moduleCode: 'notificaciones' },
        { id: 'observations', label: 'Obs. Seguridad', icon: ShieldCheck, moduleCode: 'observaciones' },
        { id: 'incidents', label: 'Incidentes', icon: ShieldCheck, moduleCode: 'incidentes' },
    ];

    const [profileOpen, setProfileOpen] = useState(false);

    // Función para verificar si el usuario tiene acceso a un módulo
  const hasModuleAccess = (moduleCode: string): boolean => {
    if (moduleCode === 'dashboard') return userRole === 'admin';
    if (userRole === 'admin') return true;
    if (moduleCode === 'observaciones' && ['editor', 'solo_lectura'].includes(userRole ?? '')) {
      return true;
    }
    if (!userModules || userModules.length === 0) return false;
    return userModules.some((moduleId) => moduleCode === moduleId);
  };

    // Filtrar items del menú basándose en los módulos del usuario
  const filteredMenuItems = menuItems.filter((item) => hasModuleAccess(item.moduleCode));

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    onCloseMobile?.();
  };

  const content = (
    <div className="flex flex-col h-full text-stone-300 bg-stone-900">
      <div className="p-6 border-b border-stone-800 flex items-center gap-3">
        <div>
          <div>
            <h1 className="text-white font-bold text-2xl tracking-wide">CAM</h1>
            <p className="text-xs text-amber-500 font-medium">GESTION DIGITAL</p>
          </div>
        </div>
      </div>

      {userName && (
        <div className="px-6 py-3 border-b border-stone-800">
          <p className="text-xs text-stone-500">Sesión iniciada como:</p>
          <p className="text-sm text-white font-medium">{userName}</p>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20 font-semibold'
                : 'hover:bg-stone-800 hover:text-white'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-amber-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <div>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${profileOpen || activeTab === 'profile' || activeTab === 'change-password' || activeTab === 'configuration' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-800'
              }`}
          >
            <span className="flex items-center gap-3">
              <User size={18} />
              Mi perfil
            </span>
            <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''} text-stone-300`} />
          </button>

          {profileOpen && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  handleNavigate('profile');
                }}
                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'profile' ? 'bg-amber-500 text-stone-900 font-semibold' : 'text-stone-400 hover:bg-stone-800'}`}
              >
                Perfil
              </button>
              <button
                onClick={() => {
                  handleNavigate('change-password');
                }}
                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'change-password' ? 'bg-amber-500 text-stone-900 font-semibold' : 'text-stone-400 hover:bg-stone-800'}`}
              >
                Cambiar contraseña
              </button>
              <button
                onClick={() => {
                  handleNavigate('configuration');
                }}
                className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'configuration' ? 'bg-amber-500 text-stone-900 font-semibold' : 'text-stone-400 hover:bg-stone-800'}`}
              >
                Configuración
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            onClick={() => {
              onLogout?.();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-800 transition-colors text-sm text-red-400"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 h-screen fixed left-0 top-0 z-10 shadow-xl">
        {content}
      </div>

      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
        <div
          className={`relative h-full w-64 bg-stone-900 text-stone-300 shadow-xl transition-all duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {content}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
