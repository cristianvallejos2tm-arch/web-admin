import React, { useEffect, useMemo, useState } from "react";
import { Plus, BarChart2, Loader2, Eye, X } from "lucide-react";
import WorkOrderForm from "./WorkOrderForm";
import WorkOrderStats from "./WorkOrderStats";
import { fetchWorkOrders, fetchVehiculos, fetchUsuariosLite, updateWorkOrder } from "../services/supabase";

const ESTADOS_PENDIENTES = ["abierta", "en_progreso", "pausada", "confirmada", "vencido"];
const ESTADOS_FINALIZADAS = ["cerrada", "cancelada"];

const WorkOrders: React.FC = () => {
    const [view, setView] = useState<"pendientes" | "finalizadas" | "new" | "stats">("pendientes");
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("");
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [pendingPage, setPendingPage] = useState(1);
    const [finalOrders, setFinalOrders] = useState<any[]>([]);
    const [finalTotal, setFinalTotal] = useState(0);
    const [finalPage, setFinalPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selected, setSelected] = useState<any | null>(null);
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const loadOrders = async ({
        estados,
        pageNumber,
        limit = rowsPerPage,
        target,
    }: {
        estados: string[];
        pageNumber: number;
        limit?: number;
        target: "pendientes" | "finalizadas";
    }) => {
        setLoading(true);
        const { data, count, error } = await fetchWorkOrders({ page: pageNumber, limit, estados });
        setLoading(false);
        if (error) {
            console.error("Error cargando OTs", error);
            setErrorMsg('No se pudieron cargar las órdenes. Revisa políticas de lectura/actualización en "ordenes_trabajo".');
            return;
        }
        setErrorMsg(null);
        if (target === "pendientes") {
            setPendingOrders(data || []);
            setPendingTotal(count ?? 0);
            setPendingPage(pageNumber);
        } else {
            setFinalOrders(data || []);
            setFinalTotal(count ?? 0);
            setFinalPage(pageNumber);
        }
    };

    const loadCatalogs = async () => {
        const [{ data: vehs }, { data: users }] = await Promise.all([fetchVehiculos(), fetchUsuariosLite()]);
        setVehiculos(vehs || []);
        setUsuarios(users || []);
    };

    useEffect(() => {
        loadOrders({ estados: ESTADOS_PENDIENTES, pageNumber: 1, target: "pendientes" });
        loadOrders({ estados: ESTADOS_FINALIZADAS, pageNumber: 1, target: "finalizadas" });
        loadCatalogs();
    }, []);

    const currentOrders = view === "pendientes" ? pendingOrders : finalOrders;
    const currentTotal = view === "pendientes" ? pendingTotal : finalTotal;
    const currentPage = view === "pendientes" ? pendingPage : finalPage;
    const estadosActivos = view === "pendientes" ? ESTADOS_PENDIENTES : ESTADOS_FINALIZADAS;

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return currentOrders.filter((o) => {
            if (!term) return true;
            return (
                (o.numero || "").toLowerCase().includes(term) ||
                (o.titulo || "").toLowerCase().includes(term) ||
                (o.descripcion || "").toLowerCase().includes(term)
            );
        });
    }, [currentOrders, search]);

    const totalPages = Math.max(1, Math.ceil(currentTotal / rowsPerPage));

    const vehiculoLabel = (id?: string | null) => {
        if (!id) return "—";
        const v = vehiculos.find((x) => x.id === id);
        if (!v) return id;
        return `${v.patente || ""} ${v.marca ? `- ${v.marca}` : ""} ${v.modelo ? `(${v.modelo})` : ""}`.trim();
    };

    const usuarioLabel = (id?: string | null) => {
        if (!id) return "—";
        const u = usuarios.find((x) => x.id === id);
        if (!u) return id;
        return u.nombre || u.email || id;
    };

    const handleStatusChange = async (id: string, estado: string) => {
        setUpdatingId(id);
        const { error } = await updateWorkOrder(id, { estado });
        setUpdatingId(null);
        if (error) {
            console.error("Error actualizando estado OT", error);
            setErrorMsg('No se pudo actualizar el estado. Revisa políticas de actualización en "ordenes_trabajo".');
            return;
        }
        loadOrders({
            estados: view === "pendientes" ? ESTADOS_PENDIENTES : ESTADOS_FINALIZADAS,
            pageNumber: currentPage,
            target: view,
            limit: rowsPerPage,
        });
        if (selected && selected.id === id) {
            setSelected({ ...selected, estado });
        }
    };

    const StatusSelect = ({ order }: { order: any }) => (
        <select
            value={order.estado || "abierta"}
            onChange={(e) => handleStatusChange(order.id, e.target.value)}
            disabled={updatingId === order.id}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
        >
            <option value="abierta">Pendiente</option>
            <option value="en_progreso">En Proceso</option>
            <option value="pausada">Pausada</option>
            <option value="confirmada">Confirmada</option>
            <option value="cerrada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
            <option value="vencido">Vencido</option>
        </select>
    );

    if (view === "new") {
        return <WorkOrderForm onBack={() => { setView("pendientes"); }} />;
    }

    if (view === "stats") {
        return <WorkOrderStats onBack={() => setView("pendientes")} orders={orders} />;
    }

    const handlePageChange = (newPage: number) => {
        loadOrders({
            estados: view === "pendientes" ? ESTADOS_PENDIENTES : ESTADOS_FINALIZADAS,
            pageNumber: newPage,
            limit: rowsPerPage,
            target: view,
        });
    };

    const handleRowsPerPageChange = (limit: number) => {
        setRowsPerPage(limit);
        loadOrders({
            estados: view === "pendientes" ? ESTADOS_PENDIENTES : ESTADOS_FINALIZADAS,
            pageNumber: 1,
            limit,
            target: view,
        });
    };

    const handleEstadoFilterChange = (estado: string) => {
        setEstadoFilter(estado);
        loadOrders({
            estados: estado ? [estado] : ESTADOS_PENDIENTES,
            pageNumber: 1,
            target: "pendientes",
            limit: rowsPerPage,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Orden de trabajo</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setView("new")}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        <Plus size={16} />
                        Agregar Nueva
                    </button>
                    <button
                        onClick={() => setView("pendientes")}
                        className={`flex items-center gap-2 px-4 py-2 ${view === "pendientes" ? "bg-white border" : "bg-sky-50 border"} rounded-lg text-slate-700`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setView("finalizadas")}
                        className={`flex items-center gap-2 px-4 py-2 ${view === "finalizadas" ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"} rounded-lg`}
                    >
                        Ver finalizadas
                    </button>
                    <button
                        onClick={() => setView("stats")}
                        className="flex items-center gap-2 px-3 py-2 border rounded text-slate-700 hover:bg-slate-50"
                    >
                        <BarChart2 size={14} />
                        Estadisticas
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
                    <span>
                        Mostrando {filtered.length} registros de {currentTotal} ({view === "pendientes" ? "activos" : "finalizados"}).
                    </span>
                </div>
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">Mostrar</label>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 border rounded"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-slate-600">registros</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600 hidden md:block">Buscar:</label>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-3 pr-3 py-2 border rounded"
                        />
                    </div>
                    {view === "pendientes" && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Estado:</label>
                            <select
                                value={estadoFilter}
                                onChange={(e) => handleEstadoFilterChange(e.target.value)}
                                className="px-2 py-1 border rounded"
                            >
                                <option value="">Todos</option>
                                {ESTADOS_PENDIENTES.map((estado) => (
                                    <option key={estado} value={estado}>
                                        {estado.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3 text-sm">{errorMsg}</div>
                )}

                {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Loader2 className="animate-spin" size={16} /> Cargando...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-slate-500">No hay ítems que mostrar</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase"># OT</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Inicio</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Prioridad</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Observaciones</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase">Detalle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.slice(0, rowsPerPage).map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 text-slate-900">{t.numero || "—"}</td>
                                        <td className="px-4 py-2 text-slate-700 text-xs">
                                            {t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 text-xs font-semibold rounded text-white bg-red-500">
                                                {(t.prioridad || "").charAt(0).toUpperCase() + (t.prioridad || "").slice(1) || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 uppercase text-xs">
                                            <StatusSelect order={t} />
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 text-xs">{t.titulo || "—"}</td>
                                        <td className="px-4 py-2 text-slate-700 text-xs">{t.descripcion || "—"}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                onClick={() => setSelected(t)}
                                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs justify-end"
                                            >
                                                <Eye size={14} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col gap-2 mt-4 text-xs text-slate-500">
                    <span>
                        Página {currentPage} de {totalPages} ({currentTotal} registros)
                    </span>
                    <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 border rounded"
                        >
                            Anterior
                        </button>
                        {[...Array(totalPages).keys()].map((i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-slate-900 text-white" : "border-slate-200 text-slate-600"}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1 border rounded"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-slate-500" /> Detalle OT
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                            <div>
                                <span className="font-semibold"># OT:</span> {selected.numero || "—"}
                            </div>
                            <div>
                                <span className="font-semibold">Prioridad:</span>{" "}
                                {(selected.prioridad || "").charAt(0).toUpperCase() + (selected.prioridad || "").slice(1) || "—"}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Estado:</span>
                                <StatusSelect order={selected} />
                            </div>
                            <div>
                                <span className="font-semibold">Tipo:</span> {selected.titulo || "—"}
                            </div>
                            <div>
                                <span className="font-semibold">Inicio:</span>{" "}
                                {selected.fecha_inicio ? new Date(selected.fecha_inicio).toLocaleString() : "—"}
                            </div>
                            <div>
                                <span className="font-semibold">Fin:</span>{" "}
                                {selected.fecha_fin ? new Date(selected.fecha_fin).toLocaleString() : "—"}
                            </div>
                            <div className="md:col-span-2">
                                <span className="font-semibold">Observaciones:</span> {selected.descripcion || "—"}
                            </div>
                            <div>
                                <span className="font-semibold">Vehículo:</span> {vehiculoLabel(selected.vehiculo_id)}
                            </div>
                            <div>
                                <span className="font-semibold">Responsable:</span> {usuarioLabel(selected.responsable_id)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrders;
