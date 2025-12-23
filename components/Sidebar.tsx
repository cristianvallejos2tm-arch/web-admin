import React, { useState } from 'react';
import { LayoutDashboard, Truck, ClipboardList, Settings, LogOut, Activity, User, ChevronDown } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehículos', icon: Truck },
    { id: 'tasks', label: 'Tareas', icon: ClipboardList },
    { id: 'workorders', label: 'Orden de Trabajo', icon: ClipboardList },
    { id: 'shift', label: 'Cambio de Turno', icon: ClipboardList },
    { id: 'maintenance', label: 'Mantenimiento', icon: ClipboardList },
    { id: 'lubricantes', label: 'Lubricantes', icon: ClipboardList },
    { id: 'cubiertas', label: 'Cubiertas', icon: ClipboardList },
    { id: 'inventory', label: 'Inventario', icon: ClipboardList },
    { id: 'users', label: 'Usuarios', icon: ClipboardList },
    { id: 'panol', label: 'Pañol', icon: ClipboardList },
    { id: 'eval', label: 'Eval. de Desempeño', icon: ClipboardList },
    { id: 'analytics', label: 'Análisis IA', icon: Activity },
  ];

  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 z-10 shadow-xl">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-900 font-bold">
            P
        </div>
        <div>
            <h1 className="text-white font-bold text-lg tracking-wide">PATAGONIA</h1>
            <p className="text-xs text-amber-500 font-medium">FLEET COMMAND</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                        ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 font-semibold' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <Icon size={20} className={isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-amber-400'} />
                    {item.label}
                </button>
            )
        })}
      </nav>

        <div className="p-4 border-t border-slate-700">
          <div>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${profileOpen || activeTab === 'profile' || activeTab === 'change-password' || activeTab === 'configuration' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <span className="flex items-center gap-3">
                <User size={18} />
                Mi perfil
              </span>
              <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''} text-slate-400`} />
            </button>

            {profileOpen && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'profile' ? 'bg-amber-500 text-slate-900 font-semibold' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Perfil
                </button>
                <button
                  onClick={() => setActiveTab('change-password')}
                  className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'change-password' ? 'bg-amber-500 text-slate-900 font-semibold' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Cambiar contraseña
                </button>
                <button
                  onClick={() => setActiveTab('configuration')}
                  className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-md text-sm ${activeTab === 'configuration' ? 'bg-amber-500 text-slate-900 font-semibold' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  Configuración
                </button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm text-red-400">
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
    </div>
  );
};

export default Sidebar;
