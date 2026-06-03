/**
 * NAVIGATION CONFIG - Configuración del menú de navegación
 * 
 * Define:
 * 1. Los items del menú disponibles
 * 2. Los roles que pueden acceder a cada ítem
 * 3. Los iconos y etiquetas de cada menú
 * 
 * Cada ítem tiene:
 * - id: identificador único (usado en hash routing)
 * - label: texto a mostrar en UI
 * - Icon: componente icono de lucide-react
 * - roles: array de roles permitidos (vacío = disponible para todos)
 */
import {
  BookOpen,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  FileText,
  FileStack,
  GraduationCap,
  Home,
  Image,
  ListChecks,
  MapPinned,
  SearchCheck,
  University,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { DOCUMENT_MODULES } from './endpointModules';
import { PRACTICE_CATALOG_RESOURCES, UNIVERSITY_CATALOG_RESOURCES } from './resources';

const DOCUMENT_MODULE_ICONS = {
  'activity-plans': ClipboardList,
  'practice-reports': FileStack,
  'final-reports': FileText,
  'activity-evaluations': SearchCheck,
  'follow-up': ClipboardCheck,
  'completed-records': ListChecks,
};

export const DOCUMENT_NAV_ITEMS = DOCUMENT_MODULES
  .slice()
  .sort((left, right) => (left.documentOrder || 0) - (right.documentOrder || 0))
  .map((module) => ({
    id: `documents/${module.id}`,
    moduleId: module.id,
    label: module.title,
    Icon: DOCUMENT_MODULE_ICONS[module.id] || FileText,
    roles: module.roles || [],
  }));

export const PRACTICE_INSTITUTION_NAV_ITEMS = [
  {
    id: 'institutions/institutions',
    moduleId: 'institutions',
    label: 'Instituciones',
    Icon: Building2,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
  },
  ...PRACTICE_CATALOG_RESOURCES.map((resource) => ({
    id: `institutions/${resource.id}`,
    moduleId: resource.id,
    label: resource.title,
    Icon: BookOpen,
    roles: ['ROLE_ADMIN'],
  })),
];

export const UNIVERSITY_NAV_ITEMS = [
  {
    id: 'universities/universities',
    moduleId: 'universities',
    label: 'Universidades',
    Icon: University,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
  },
  ...UNIVERSITY_CATALOG_RESOURCES.map((resource) => ({
    id: `universities/${resource.id}`,
    moduleId: resource.id,
    label: resource.title,
    Icon: GraduationCap,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
  })),
];

/**
 * NAV_ITEMS - Array de items del menú principal
 * El orden aquí define el orden en el menú de la aplicación
 */
export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Inicio',
    Icon: Home,
    roles: [],
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    Icon: Bell,
    roles: [],
  },
  {
    id: 'profile',
    label: 'Perfil',
    Icon: UserRound,
    roles: [],
  },
  {
    id: 'photos',
    label: 'Evidencias',
    Icon: Image,
    roles: ['ROLE_ESTUDIANTE', 'ROLE_TUTOR_PRACTICAS', 'ROLE_TUTOR_INSTITUCIONAL', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_ADMIN'],
  },
  {
    id: 'forms',
    label: 'Entrevistas',
    Icon: FileQuestion,
    roles: [
      'ROLE_ESTUDIANTE',
      'ROLE_TUTOR_INSTITUCIONAL',
      'ROLE_DIRECTORA_INSTITUCION',
      'ROLE_TUTOR_PRACTICAS',
      'ROLE_DIRECTOR_PRACTICAS',
      'ROLE_ADMIN',
    ],
  },
  {
    id: 'observation-forms',
    label: 'Fichas de observación',
    Icon: ClipboardList,
    roles: ['ROLE_ESTUDIANTE', 'ROLE_TUTOR_PRACTICAS', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_ADMIN'],
  },
  {
    id: 'courses',
    label: 'Paralelos y grupos',
    Icon: GraduationCap,
    roles: ['ROLE_TUTOR_PRACTICAS', 'ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
  },
  {
    id: 'documents',
    label: 'Documentos de practica',
    Icon: FileText,
    ToggleIcon: ChevronDown,
    isGroupHeader: true,
    roles: [
      'ROLE_ESTUDIANTE',
      'ROLE_TUTOR_PRACTICAS',
      'ROLE_TUTOR_INSTITUCIONAL',
      'ROLE_DIRECTOR_PRACTICAS',
      'ROLE_ADMIN',
    ],
    children: DOCUMENT_NAV_ITEMS,
  },
  {
    id: 'schedules',
    label: 'Jornadas y asistencias',
    Icon: CalendarClock,
    roles: ['ROLE_ESTUDIANTE', 'ROLE_TUTOR_INSTITUCIONAL', 'ROLE_DIRECTORA_INSTITUCION'],
  },
  {
    id: 'institutions',
    label: 'Instituciones de practica',
    Icon: Building2,
    ToggleIcon: ChevronDown,
    isGroupHeader: true,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
    children: PRACTICE_INSTITUTION_NAV_ITEMS,
  },
  {
    id: 'universities',
    label: 'Universidades',
    Icon: University,
    ToggleIcon: ChevronDown,
    isGroupHeader: true,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
    children: UNIVERSITY_NAV_ITEMS,
  },
  {
    id: 'reports',
    label: 'Seguimiento',
    Icon: BarChart3,
    roles: ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'],
  },
  {
    id: 'accounts',
    label: 'Usuarios',
    Icon: UsersRound,
    roles: ['ROLE_ADMIN'],
  },
  {
    id: 'locations',
    label: 'Territorio',
    Icon: MapPinned,
    roles: ['ROLE_ADMIN'],
  },
];

/**
 * canAccess - Verifica si un usuario puede acceder a un item del menú
 * 
 * Regla:
 * - Si el item no tiene roles especificados (roles=[]), es accesible para todos
 * - Si tiene roles, el usuario debe tener al menos uno de ellos
 * 
 * @param {Object} item - Item del menú
 * @param {Array} roles - Roles del usuario
 * @returns {boolean} true si el usuario puede acceder
 */
export function canAccess(item, roles) {
  if (!item.roles.length) {
    return true;
  }

  return item.roles.some((role) => roles.includes(role));
}
