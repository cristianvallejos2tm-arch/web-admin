import { ChecklistReport, ShiftType, Vehicle, VehicleStatus } from './types';

export const VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    plate: 'AD-123-BC',
    model: 'Toyota Hilux GR-Sport',
    type: 'Pickup 4x4',
    status: VehicleStatus.OPERATIONAL,
    currentDriver: 'Juan Pérez',
    location: 'Yacimiento Vaca Muerta - Sector Norte',
    mileage: 45230
  },
  {
    id: 'v2',
    plate: 'AE-992-ZZ',
    model: 'Ford Ranger Raptor',
    type: 'Pickup 4x4',
    status: VehicleStatus.MAINTENANCE_REQUIRED,
    currentDriver: 'Carlos Díaz',
    location: 'Base Operativa Añelo',
    mileage: 68100
  },
  {
    id: 'v3',
    plate: 'AC-555-XX',
    model: 'Toyota Hilux DX',
    type: 'Pickup 4x4',
    status: VehicleStatus.OPERATIONAL,
    currentDriver: 'Miguel Ángel Russo',
    location: 'Pozo B-45',
    mileage: 12050
  },
  {
    id: 'v4',
    plate: 'AF-101-AA',
    model: 'Volkswagen Amarok V6',
    type: 'Pickup 4x4',
    status: VehicleStatus.CRITICAL,
    currentDriver: 'Sin Asignar',
    location: 'Taller Central',
    mileage: 89000
  }
];

export const MOCK_REPORTS: ChecklistReport[] = [
  {
    id: 'rep-001',
    vehicleId: 'v2',
    vehiclePlate: 'AE-992-ZZ',
    driverName: 'Carlos Díaz',
    supervisorName: 'Ing. Roberto Gómez',
    date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    shift: ShiftType.MORNING,
    severityScore: 45,
    overallComments: "Se escucha un golpeteo metálico al pasar las 2500 revoluciones en segunda marcha. Además, la luz trasera izquierda parpadea cuando llueve. El nivel de aceite está en el mínimo permitido.",
    items: [
      { id: 'i1', category: 'Mecánica', label: 'Motor (Ruido/Funcionamiento)', status: 'fail', notes: 'Ruido metálico' },
      { id: 'i2', category: 'Fluidos', label: 'Nivel de Aceite', status: 'fail', notes: 'Nivel bajo' },
      { id: 'i3', category: 'Seguridad', label: 'Luces Traseras', status: 'fail', notes: 'Intermitencia' }
    ]
  },
  {
    id: 'rep-002',
    vehicleId: 'v1',
    vehiclePlate: 'AD-123-BC',
    driverName: 'Juan Pérez',
    supervisorName: 'Ing. Roberto Gómez',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    shift: ShiftType.NIGHT,
    severityScore: 0,
    overallComments: "Unidad en perfectas condiciones. Se realizó limpieza de cabina. Sin novedades mecánicas.",
    items: []
  },
  {
    id: 'rep-003',
    vehicleId: 'v4',
    vehiclePlate: 'AF-101-AA',
    driverName: 'Esteban Quito',
    supervisorName: 'Lic. Laura Menéndez',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    shift: ShiftType.AFTERNOON,
    severityScore: 90,
    overallComments: "URGENTE: Falla en frenos. El pedal se va al fondo. Pérdida visible de líquido de frenos en rueda trasera derecha. Neumático delantero izquierdo con tajo lateral profundo.",
    items: [
      { id: 'i4', category: 'Seguridad', label: 'Sistema de Frenos', status: 'fail', notes: 'Sin presión' },
      { id: 'i5', category: 'Carrocería', label: 'Neumáticos', status: 'fail', notes: 'Corte lateral' }
    ]
  },
  {
    id: 'rep-004',
    vehicleId: 'v3',
    vehiclePlate: 'AC-555-XX',
    driverName: 'Miguel Ángel Russo',
    supervisorName: 'Lic. Laura Menéndez',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    shift: ShiftType.AFTERNOON,
    severityScore: 10,
    overallComments: "Pequeño rayón en puerta del acompañante por roce con arbusto. El resto ok.",
    items: [
        { id: 'i6', category: 'Carrocería', label: 'Pintura/Chapa', status: 'fail', notes: 'Rayón menor' }
    ]
  }
];

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'fleet', label: 'Flota' },
  { key: 'inspections', label: 'Inspecciones' },
  { key: 'reports', label: 'Reportes' },
  { key: 'users', label: 'Usuarios' },
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'compras', label: 'Compras' },
  { key: 'autorizaciones', label: 'Autorizaciones' },
  { key: 'settings', label: 'Ajustes' }
];
