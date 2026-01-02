import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, Search, Shield, UserCheck, Eye, Grid } from 'lucide-react';
import {
    supabase,
    fetchBases,
    fetchOperadoras,
    syncUserOperadoras,
    createOperadora
} from '../services/supabase';

interface Usuario {
    id: string;
    email: string;
    nombre: string;
    rol: 'admin' | 'editor' | 'solo_lectura';
    activo: boolean;
    created_at: string;
    modules?: string[]; // Module IDs
    profile_can_authorize?: boolean;
    profile_level?: number | null;
    profile_active?: boolean;
    base_id?: string;
    operadoras?: string[];
}

interface Modulo {
    id: string;
    code: string;
    nombre: string;
    descripcion?: string;
    activo: boolean;
}

interface Base {
    id: string;
    nombre: string;
}

interface Operadora {
    id: string;
    nombre: string;
}
interface UsersProps {
    userRole?: string;
}

type UserGroupId = 'todos' | 'administradores' | 'colaboradores' | 'aprobadores';

const Users: React.FC<UsersProps> = ({ userRole = 'admin' }) => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<UserGroupId>('todos');
    const [bases, setBases] = useState<Base[]>([]);
    const [operadoras, setOperadoras] = useState<Operadora[]>([]);
    const [openModulesUser, setOpenModulesUser] = useState<string | null>(null);
    const [newOperadoraName, setNewOperadoraName] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        nombre: '',
        password: '',
        rol: 'editor' as 'admin' | 'editor' | 'solo_lectura',
        modules: [] as string[],
        profile_can_authorize: false,
        profile_level: 1,
        profile_active: true,
        base_id: '',
        operadoras: [] as string[]
    });

    const userGroups: { id: UserGroupId; label: string; description: string; filter: (usuario: Usuario) => boolean }[] = [
        {
            id: 'todos',
            label: 'Todos',
            description: 'Vista completa de usuarios activos',
            filter: () => true,
        },
        {
            id: 'administradores',
            label: 'Administradores',
            description: 'Usuarios con rol admin',
            filter: (usuario) => usuario.rol === 'admin',
        },
        {
            id: 'colaboradores',
            label: 'Colaboradores',
            description: 'Editores y lectura que trabajan día a día',
            filter: (usuario) => usuario.rol === 'editor' || usuario.rol === 'solo_lectura',
        },
        {
            id: 'aprobadores',
            label: 'Aprobadores',
            description: 'Usuarios autorizados para aprobar solicitudes',
            filter: (usuario) => usuario.profile_can_authorize,
        },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        await Promise.all([fetchUsuarios(), fetchModulos(), loadBases(), loadOperadoras()]);
    };

    const fetchModulos = async () => {
        try {
            const { data, error } = await supabase
                .from('modulos')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            setModulos(data || []);
        } catch (error) {
            console.error('Error fetching modulos:', error);
        }
    };

    const loadBases = async () => {
        const { data, error } = await fetchBases();
        if (error) {
            console.error('Error fetching bases:', error);
            return;
        }
        setBases(data || []);
    };

    const loadOperadoras = async () => {
        const { data, error } = await fetchOperadoras();
        if (error) {
            console.error('Error fetching operadoras:', error);
            return;
        }
        setOperadoras(data || []);
    };

    const handleAddOperadora = async () => {
        const trimmed = newOperadoraName.trim();
        if (!trimmed) return;
        try {
            const { data, error } = await createOperadora(trimmed);
            if (error) throw error;
            if (data) {
                setOperadoras((prev) => [...prev, data]);
                setNewOperadoraName('');
            }
        } catch (err: any) {
            alert('No se pudo crear la operadora: ' + err.message);
        }
    };

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch modules for each user
            const usuariosWithModules = await Promise.all(
                (data || []).map(async (usuario) => {
                    const { data: userModules } = await supabase
                        .from('usuarios_modulos')
                        .select('modulo_id')
                        .eq('usuario_id', usuario.id);

                    return {
                        ...usuario,
                        modules: userModules?.map(um => um.modulo_id) || []
                    };
                })
            );

            const ids = (data || []).map((u: any) => u.id);
            let profilesById: Record<string, any> = {};
            if (ids.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id,can_authorize,authorization_level,active')
                    .in('id', ids);
                (profilesData || []).forEach((p: any) => {
                    profilesById[p.id] = p;
                });
            }

            let operadoraMap: Record<string, string[]> = {};
            if (ids.length > 0) {
                const { data: userOperadoras, error: userOperadorasError } = await supabase
                    .from('usuarios_operadoras')
                    .select('usuario_id, operadora_id')
                    .in('usuario_id', ids);
                if (userOperadorasError) {
                    console.warn('No se pudieron cargar las operadoras (tabla ausente?):', userOperadorasError);
                } else {
                    (userOperadoras || []).forEach((row: any) => {
                        if (!operadoraMap[row.usuario_id]) {
                            operadoraMap[row.usuario_id] = [];
                        }
                        operadoraMap[row.usuario_id].push(row.operadora_id);
                    });
                }
            }

            const merged = usuariosWithModules.map((u: any) => ({
                ...u,
                profile_can_authorize: profilesById[u.id]?.can_authorize ?? false,
                profile_level: profilesById[u.id]?.authorization_level ?? null,
                profile_active: profilesById[u.id]?.active ?? false,
                base_id: u.base_id,
                operadoras: operadoraMap[u.id] || [],
            }));

            setUsuarios(merged);
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                // Actualizar usuario existente
                const updateData: any = {
                    email: formData.email,
                    nombre: formData.nombre,
                    rol: formData.rol,
                    base_id: formData.base_id || null,
                    updated_at: new Date().toISOString().replace('T', ' ').replace('Z', '')
                };

                // Solo actualizar password si se proporcionó uno nuevo
                if (formData.password) {
                    updateData.password = formData.password;
                }

                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update(updateData)
                    .eq('id', editingUser.id);

                if (updateError) throw updateError;

                // Actualizar módulos del usuario
                await syncUserModules(editingUser.id, formData.modules);
                await syncUserOperadoras(editingUser.id, formData.operadoras);

                await upsertProfile(editingUser.id);

                alert('Usuario actualizado exitosamente');
            } else {
                const { data: createdAuthUser, error: createAuthError } = await supabase.functions.invoke('create-user', {
                    body: {
                        email: formData.email,
                        password: formData.password,
                        nombre: formData.nombre,
                        role: formData.rol,
                        active: formData.profile_active,
                        can_authorize: formData.profile_can_authorize,
                        authorization_level: formData.profile_can_authorize ? Number(formData.profile_level || 1) : null
                    }
                });
                if (createAuthError) throw createAuthError;
                const parsedAuthUser = typeof createdAuthUser === 'string' ? JSON.parse(createdAuthUser) : createdAuthUser;
                if (!parsedAuthUser?.id) throw new Error('No se pudo crear el usuario en Auth');

                // Insertar modulos del usuario
                await supabase
                    .from('usuarios')
                    .update({ base_id: formData.base_id || null })
                    .eq('id', parsedAuthUser.id);

                await syncUserOperadoras(parsedAuthUser.id, formData.operadoras);

                if (formData.modules.length > 0) {
                    await syncUserModules(parsedAuthUser.id, formData.modules);
                }

                alert('Usuario creado exitosamente');
            }

            setShowModal(false);
            setEditingUser(null);
            setFormData({
                email: '',
                nombre: '',
                password: '',
                rol: 'editor',
                modules: [],
                profile_can_authorize: false,
                profile_level: 1,
                profile_active: true,
                base_id: '',
                operadoras: []
            });
            fetchUsuarios();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const syncUserModules = async (usuarioId: string, moduleIds: string[]) => {
        // Eliminar todos los módulos actuales del usuario
        await supabase
            .from('usuarios_modulos')
            .delete()
            .eq('usuario_id', usuarioId);

        // Insertar los nuevos módulos
        if (moduleIds.length > 0) {
            const { error } = await supabase
                .from('usuarios_modulos')
                .insert(
                    moduleIds.map(moduloId => ({
                        usuario_id: usuarioId,
                        modulo_id: moduloId
                    }))
                );

            if (error) throw error;
        }
    };

    const upsertProfile = async (userId: string) => {
        const payload = {
            id: userId,
            email: formData.email,
            role: formData.rol,
            can_authorize: !!formData.profile_can_authorize,
            authorization_level: formData.profile_can_authorize ? Number(formData.profile_level || 1) : null,
            active: !!formData.profile_active,
        };
        const { data, error } = await supabase.functions.invoke('upsert-profile', { body: payload });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingUser(usuario);
        setFormData({
            email: usuario.email,
            nombre: usuario.nombre,
            password: '',
            rol: usuario.rol,
            modules: usuario.modules || [],
            profile_can_authorize: usuario.profile_can_authorize ?? false,
            profile_level: usuario.profile_level ?? 1,
            profile_active: usuario.profile_active ?? true
            ,
            base_id: usuario.base_id ?? '',
            operadoras: usuario.operadoras ?? []
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Estas seguro de eliminar este usuario?')) return;

        try {
            const { data, error } = await supabase.functions.invoke('delete-user', { body: { id } });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            alert('Usuario eliminado exitosamente');
            fetchUsuarios();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

const getRoleBadge = (rol: string) => {
        const badges = {
            admin: { color: 'bg-red-100 text-red-800', icon: Shield, label: 'Admin' },
            editor: { color: 'bg-blue-100 text-blue-800', icon: Edit2, label: 'Editor' },
            solo_lectura: { color: 'bg-gray-100 text-gray-800', icon: Eye, label: 'Solo Lectura' }
        };

        const badge = badges[rol as keyof typeof badges];
        const Icon = badge.icon;

        return (
            <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    };

    const activeGroup = userGroups.find((group) => group.id === selectedGroup) ?? userGroups[0];
    const groupFilteredUsuarios = usuarios.filter(activeGroup.filter);
    const filteredUsuarios = groupFilteredUsuarios.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupCounts = userGroups.map((group) => ({
        id: group.id,
        count: usuarios.filter(group.filter).length,
    }));

    const canCreate = userRole === 'admin';
    const canEdit = userRole === 'admin';
    const canDelete = userRole === 'admin';
    const columnCount = 7 + (canEdit || canDelete ? 1 : 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando usuarios...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500 mt-1">Administrar usuarios y permisos del sistema</p>
                </div>

                {canCreate && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({
                                email: '',
                                nombre: '',
                                password: '',
                                rol: 'editor',
                                modules: [],
                                profile_can_authorize: false,
                                profile_level: 1,
                                profile_active: true,
                                base_id: '',
                                operadoras: []
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                        <Plus size={18} />
                        Nuevo Usuario
                    </button>
                )}
            </div>

        {/* Group filter */}
        <div className="grid gap-3 md:grid-cols-4">
            {userGroups.map((group) => {
                const isActive = selectedGroup === group.id;
                const countInfo = groupCounts.find((entry) => entry.id === group.id);
                return (
                    <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={`text-left rounded-2xl border p-4 transition ${
                            isActive
                                ? 'border-amber-500 bg-amber-50 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-stone-900">{group.label}</span>
                            <span className="text-xs text-slate-500">{countInfo?.count ?? 0}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                    </button>
                );
            })}
        </div>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Módulos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Base</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Operadoras</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Creación</th>
                                {(canEdit || canDelete) && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                                {filteredUsuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={columnCount} className="px-6 py-8 text-center text-slate-500">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
                                                    {usuario.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{usuario.nombre}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-slate-600">{usuario.email}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(usuario.rol)}
                                        </td>
                                        <td className="px-6 py-4 relative">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenModulesUser((current) =>
                                                        current === usuario.id ? null : usuario.id,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border border-stone-200 bg-white text-stone-700 hover:border-amber-300 transition"
                                            >
                                                <Grid size={14} />
                                                Ver módulos
                                            </button>
                                            {openModulesUser === usuario.id && (
                                                <div className="absolute z-20 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                                        Módulos asignados
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {usuario.modules && usuario.modules.length > 0 ? (
                                                            usuario.modules.map((moduleId) => {
                                                                const modulo = modulos.find((m) => m.id === moduleId);
                                                                return modulo ? (
                                                                    <span
                                                                        key={moduleId}
                                                                        className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                                                                    >
                                                                        {modulo.nombre}
                                                                    </span>
                                                                ) : null;
                                                            })
                                                        ) : (
                                                            <span className="text-xs text-slate-400">Sin módulos</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-slate-600">
                                                {bases.find((base) => base.id === usuario.base_id)?.nombre || 'Sin base'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {usuario.operadoras && usuario.operadoras.length > 0 ? (
                                                    usuario.operadoras.map((operadoraId) => {
                                                        const operadora = operadoras.find((op) => op.id === operadoraId);
                                                        return operadora ? (
                                                            <span key={operadoraId} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                                                                {operadora.nombre}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-slate-400 text-xs">Sin operadoras</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-slate-600">
                                                {new Date(usuario.created_at).toLocaleDateString('es-AR')}
                                            </p>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-2">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(usuario)}
                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(usuario.id)}
                                                            className="text-red-600 hover:text-red-900 p-1"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Contraseña {editingUser && '(dejar en blanco para no cambiar)'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
                                        <select
                                            value={formData.rol}
                                            onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="admin">Admin (acceso completo)</option>
                                            <option value="editor">Editor (ver y editar)</option>
                                            <option value="solo_lectura">Solo Lectura (solo ver)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">Modulos habilitados</p>
                                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 border border-slate-100 rounded-xl">
                                    {modulos.map((modulo) => (
                                        <label key={modulo.id} className="inline-flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={formData.modules.includes(modulo.id)}
                                                onChange={() => {
                                                    const has = formData.modules.includes(modulo.id);
                                                    const modules = has
                                                        ? formData.modules.filter((x) => x !== modulo.id)
                                                        : [...formData.modules, modulo.id];
                                                    setFormData({ ...formData, modules });
                                                }}
                                                className="h-4 w-4 text-amber-600 border-slate-200 rounded"
                                            />
                                            <span className="text-slate-700">{modulo.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                                {modulos.length === 0 && (
                                    <p className="text-sm text-slate-500">No hay modulos disponibles. Crea modulos primero.</p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-slate-600">
                                    <span className="text-sm font-semibold text-slate-700 block">Base asignada</span>
                                    <select
                                        value={formData.base_id}
                                        onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
                                        className="w-full rounded-2xl border border-stone-200 px-4 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-white"
                                    >
                                        <option value="">Sin base</option>
                                        {bases.map((base) => (
                                            <option key={base.id} value={base.id}>
                                                {base.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <p className="text-sm font-semibold text-slate-700">Operadoras</p>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                                        {operadoras.length === 0 && (
                                            <div className="text-xs text-slate-400">
                                                No hay operadoras cargadas. Agrega una nueva abajo.
                                            </div>
                                        )}
                                        {operadoras.map((operadora) => {
                                            const has = formData.operadoras.includes(operadora.id);
                                            return (
                                                <label key={operadora.id} className="inline-flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={has}
                                                        onChange={() => {
                                                            const next = has
                                                                ? formData.operadoras.filter((x) => x !== operadora.id)
                                                                : [...formData.operadoras, operadora.id];
                                                            setFormData({ ...formData, operadoras: next });
                                                        }}
                                                        className="h-4 w-4 text-amber-600 border-slate-200 rounded"
                                                    />
                                                    <span className="text-slate-700">{operadora.nombre}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newOperadoraName}
                                            onChange={(e) => setNewOperadoraName(e.target.value)}
                                            placeholder="Agregar operadora"
                                            className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddOperadora}
                                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
                                <h3 className="text-sm font-semibold text-slate-700">Perfil de autorizacion</h3>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.profile_can_authorize}
                                        onChange={(e) => setFormData({ ...formData, profile_can_authorize: e.target.checked })}
                                        className="h-4 w-4 text-amber-600 border-slate-200 rounded"
                                    />
                                    Puede autorizar
                                </label>
                                {formData.profile_can_authorize && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nivel de autorizacion</label>
                                        <select
                                            value={formData.profile_level}
                                            onChange={(e) => setFormData({ ...formData, profile_level: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value={1}>Nivel 1</option>
                                            <option value={3}>Nivel 3</option>
                                        </select>
                                    </div>
                                )}
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.profile_active}
                                        onChange={(e) => setFormData({ ...formData, profile_active: e.target.checked })}
                                        className="h-4 w-4 text-amber-600 border-slate-200 rounded"
                                    />
                                    Perfil activo
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    {editingUser ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
