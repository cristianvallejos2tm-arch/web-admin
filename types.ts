export enum VehicleStatus {
  OPERATIONAL = 'Operativo',
  MAINTENANCE_REQUIRED = 'Mantenimiento',
  CRITICAL = 'Crítico',
  OUT_OF_SERVICE = 'Fuera de Servicio'
}

export enum ShiftType {
  MORNING = 'Mañana (06:00 - 14:00)',
  AFTERNOON = 'Tarde (14:00 - 22:00)',
  NIGHT = 'Noche (22:00 - 06:00)'
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string; // e.g., Toyota Hilux, Ford Ranger
  type: string; // e.g., Pickup 4x4
  status: VehicleStatus;
  currentDriver: string;
  location: string; // e.g., Base Neuquén, Pozo A-102
  mileage: number;
}

export interface ChecklistItem {
  id: string;
  category: 'Seguridad' | 'Mecánica' | 'Carrocería' | 'Fluidos' | 'Documentación';
  label: string;
  status: 'ok' | 'fail' | 'na';
  notes?: string;
}

export interface ChecklistReport {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  supervisorName: string;
  date: string; // ISO String
  shift: ShiftType;
  items: ChecklistItem[];
  overallComments: string; // The "Voice of the Driver"
  severityScore: number; // 0-100, calculated
  aiAnalysis?: AIAnalysisResult; // Populated after Gemini call
}

export interface AIAnalysisResult {
  summary: string;
  severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRÍTICA';
  recommendedAction: string;
  flaggedSystems: string[];
}
