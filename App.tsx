import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar-simple';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Fleet from './components/Fleet';
import Proveedores from './components/Proveedores';
import Compras from './components/Compras';
import Autorizaciones from './components/Autorizaciones';
import Tasks from './components/Tasks';
import WorkOrders from './components/WorkOrders';
import ShiftChange from './components/ShiftChange';
import Maintenance from './components/Maintenance';
import Lubricants from './components/Lubricants';
import Tires from './components/Tires';
import Inventory from './components/Inventory';
import Panol from './components/Panol';
import Capacitaciones from './components/Capacitaciones';
import CapacitacionExam from './components/CapacitacionExam';
import PerformanceEval from './components/PerformanceEval';
import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import Configuration from './components/Configuration';
import Vehicles from './components/Vehicles';
import ObservationsModule from './components/observations/ObservationsModule';
import IncidentsModule from './components/incidents/IncidentsModule';
import NotificationsModule from './components/notifications/NotificationsModule';
import { supabase } from './services/supabase';

interface UserData {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'editor' | 'solo_lectura';
  modules: string[]; // Module codes the user has access to
}

const App: React.FC = () => {
  const STORAGE_KEY = 'cam-session';
  const TAB_KEY = 'cam-last-tab';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/capacitaciones/') && path.split('/').length >= 3) {
    return <CapacitacionExam />;
  }
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadUserData = async (userId: string, email?: string | null) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .eq('activo', true)
      .single();

    if (error || !data) {
      setLoginError('No hay perfil activo en usuarios para este acceso');
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      return;
    }

    const { data: userModulesData, error: modulesError } = await supabase
      .from('usuarios_modulos')
      .select(`
          modulo_id,
          modulos (
            code
          )
        `)
      .eq('usuario_id', data.id);

    if (modulesError) {
      console.error('Error al cargar modulos:', modulesError);
    }

    const moduleCodes = userModulesData?.map((um: any) => um.modulos?.code).filter(Boolean) || [];

    const user = {
      id: data.id,
      nombre: data.nombre,
      email: data.email || email || '',
      rol: data.rol,
      modules: moduleCodes
    };
    setUserData(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    setIsAuthenticated(true);
  };

  // Al montar, intenta restaurar sesión desde Supabase/localStorage y recuerda la última pestaña.
  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await loadUserData(sessionData.session.user.id, sessionData.session.user.email);
      }
      const savedTab = localStorage.getItem(TAB_KEY);
      if (savedTab) setActiveTab(savedTab);
    };
    loadSession();
  }, []);

  // Cambia la pestaña activa y la persiste en localStorage para la próxima visita.
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
  };

  // Procesa el formulario de login usando Supabase Auth y carga los datos del usuario.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.username,
        password: loginForm.password,
      });

      if (error || !data?.user) {
        setLoginError('Credenciales incorrectas');
        return;
      }

      await loadUserData(data.user.id, data.user.email);
    } catch (err: any) {
      console.error('Error en login:', err);
      setLoginError('Error al iniciar sesion');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cierra sesión y limpia el estado/localStorage para volver al login.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserData(null);
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TAB_KEY);
  };

  // Mientras no esté autenticado mostramos el formulario de inicio de sesión.
  if (!isAuthenticated) {
  return (
    <div
      className="min-h-screen w-full bg-center bg-cover bg-no-repeat flex items-center justify-center font-sans relative"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Overlay para legibilidad */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Contenido */}
      <div className="relative z-10 w-full px-4">
        <div className="mx-auto bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-xl">
              CAM
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900"></h1>
              <p className="text-sm text-amber-500 font-medium">GESTION DIGITAL</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Iniciar Sesión</h2>
          <p className="text-slate-500 mb-6">Ingresa tus credenciales para acceder</p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="admin@patagonia.com"
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                disabled={isLoggingIn}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>
        </div>
       <footer className="absolute bottom-6 right-8 text-xs tracking-wide text-white/60">
  <a
    href="https://2tm.com.ar"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    Powered by <span className="font-bold">2TM</span>
  </a>
</footer>



      </div>
    </div>
    
  );
}

  // Una vez autenticado mostramos el layout principal con sidebar y vistas por pestaña.
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          handleTabChange(tab);
          setMobileMenuOpen(false);
        }}
        onLogout={handleLogout}
        userName={userData?.nombre}
        userModules={userData?.modules}
        userRole={userData?.rol}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Header (placeholder for mobile responsive nav) */}
      <div className="md:hidden fixed w-full bg-stone-900 text-white p-4 z-20 flex justify-between items-center shadow-md">
        <span className="font-bold tracking-wide">CAM</span>
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="text-amber-500 font-bold"
          aria-label="Cambiar menú"
        >
          MENU
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'vehicles' && <Vehicles />}
          {activeTab === 'checklists' && (
            <div className="flex items-center justify-center h-[60vh] text-slate-400">
              <p>Historial Completo de Reportes (Próximamente)</p>
            </div>
          )}
          {activeTab === 'tasks' && <Tasks />}
          {activeTab === 'workorders' && <WorkOrders />}
          {activeTab === 'shift' && <ShiftChange userName={userData?.nombre || userData?.email || ''} />}
          {activeTab === 'maintenance' && <Maintenance />}
          {activeTab === 'lubricantes' && <Lubricants />}
          {activeTab === 'cubiertas' && <Tires />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'panol' && <Panol />}
          {activeTab === 'capacitaciones' && <Capacitaciones />}
          {activeTab === 'eval' && <PerformanceEval />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'change-password' && <ChangePassword />}
          {activeTab === 'configuration' && <Configuration />}
          {activeTab === 'users' && <Users userRole={userData?.rol} />}
          {activeTab === 'proveedores' && <Proveedores />}
          {activeTab === 'compras' && <Compras />}
          {activeTab === 'autorizaciones' && <Autorizaciones userEmail={userData?.email} userRole={userData?.rol} />}
          {activeTab === 'observations' && <ObservationsModule userRole={userData?.rol} />}
          {activeTab === 'incidents' && <IncidentsModule userRole={userData?.rol} />}
          {activeTab === 'notifications' && <NotificationsModule />}
          
        </div>
      </main>
    </div>
  );
};

export default App;
