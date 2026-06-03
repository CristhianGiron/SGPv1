/**
 * APP.JS - Componente Raíz de la Aplicación
 * 
 * Este es el componente principal de ReactJS que:
 * 1. Proporciona autenticación global mediante AuthProvider
 * 2. Controla la navegación entre páginas según roles
 * 3. Maneja el enrutamiento por hash (#)
 * 4. Verifica permisos de acceso para cada sección
 * 
 * Flujo:
 * - Verifica si usuario está autenticado (token)
 * - Si no: muestra LoginPage o RegisterPage
 * - Si sí: muestra AppLayout con la página correspondiente
 */
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { canAccess, NAV_ITEMS } from "./config/navigation";
import { AppLayout } from "./layout/AppLayout";
import { AccountsPage } from "./pages/AccountsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { ForcePasswordChangePage } from "./pages/ForcePasswordChangePage";
import { EvidenceViewerPage } from "./pages/EvidenceViewerPage";
import { LocationsPage } from "./pages/LocationsPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { RegisterStudentPage } from "./pages/RegisterPublic";
import { PhotosPage } from "./pages/PhotosPage";
import { ObservationFormsPage, PracticeFormsPage } from "./pages/PracticeFormsPage";
import { PracticeInstitutionsPage } from "./pages/PracticeInstitutionsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { UniversitiesPage } from "./pages/UniversitiesPage";
import { Alert } from "./components/ui/Alert";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { SectionCard } from "./components/ui/SectionCard";
import { Skeleton } from "./components/ui/Skeleton";
import { getBaseRoute, getNestedRoute, useHashRoute } from "./utils/routes";
import AccessibilityWidget from "./components/accessibility/AccessibilityWidget";

/**
 * Mapeo de rutas a componentes
 * Las claves son los IDs de ruta (lo que va después de #/)
 * Los valores son los componentes a renderizar
 * Ejemplo: #/dashboard → renderiza DashboardPage
 */
const PAGES = {
  dashboard: DashboardPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  photos: PhotosPage,
  forms: PracticeFormsPage,
  "observation-forms": ObservationFormsPage,
  courses: CoursesPage,
  documents: DocumentsPage,
  schedules: SchedulesPage,
  institutions: PracticeInstitutionsPage,
  universities: UniversitiesPage,
  accounts: AccountsPage,
  locations: LocationsPage,
  reports: ReportsPage,
  //register: RegisterStudentPage,
};

/**
 * AppShell - Componente que gestiona la lógica de autenticación y navegación
 * - Obtiene la ruta actual del hash (#)
 * - Obtiene el token y roles del contexto de autenticación
 * - Decide qué mostrar basado en si está autenticado
 */
function AppShell() {
  const route = useHashRoute();
  const baseRoute = getBaseRoute(route);
  const nestedRoute = getNestedRoute(route);
  const { token, roles, loadingProfile, profileError, profile } = useAuth();

  // Si no hay token, mostrar páginas públicas (login, registro)
  if (!token) {
    if (route === "register") {
      return <RegisterStudentPage />;
    }
    // Por defecto, mostrar login
    return <LoginPage />;
  }

  if (!loadingProfile && profile?.passwordChangeRequired) {
    return <ForcePasswordChangePage />;
  }

  if (baseRoute === "evidence-viewer") {
    return (
      <AppLayout route="photos">
        {profileError && <Alert tone="error">{profileError}</Alert>}
        {loadingProfile ? (
          <SectionCard>
            <Skeleton lines={5} />
          </SectionCard>
        ) : (
          <EvidenceViewerPage />
        )}
      </AppLayout>
    );
  }
  // Verificar que el usuario tenga acceso a la ruta actual según sus roles
  // Si no tiene acceso, redirigir a dashboard
  const navItem = NAV_ITEMS.find((item) => item.id === baseRoute);
  const nestedNavItem = navItem?.children?.find(
    (item) => item.id === `${baseRoute}/${nestedRoute}` || item.moduleId === nestedRoute
  );
  const safeRoute = navItem && canAccess(navItem, roles) ? baseRoute : "dashboard";
  const safeRouteChild =
    safeRoute === baseRoute && nestedNavItem && canAccess(nestedNavItem, roles)
      ? nestedNavItem.moduleId || nestedRoute
      : undefined;
  // Obtener el componente de página a renderizar
  const Page = PAGES[safeRoute] || DashboardPage;

  return (
    <AppLayout route={safeRoute} routeChild={safeRouteChild}>
      {profileError && <Alert tone="error">{profileError}</Alert>}
      {loadingProfile ? (
        <SectionCard>
          <Skeleton lines={5} />
        </SectionCard>
      ) : (
        <Page activeModuleId={safeRouteChild} />
      )}
    </AppLayout>
  );
}

/**
 * Componente App principal
 * Envuelve todo con AuthProvider para proporcionar autenticación global
 */
function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AppShell />
        <AccessibilityWidget />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
