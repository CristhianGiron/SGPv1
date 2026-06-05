import { useEffect, useMemo, useRef, useState } from "react";
import {
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { NAV_ITEMS, canAccess } from "../config/navigation";
import { getModuleVisualStyle } from "../config/moduleVisuals";
import { useAuth } from "../auth/AuthContext";
import { formatRole, joinText } from "../utils/format";
import { setHashRoute } from "../utils/routes";
import { Avatar } from "../components/Avatar";
import { NotificationBell } from "../components/notifications/NotificationBell";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useThemeMode } from "../hooks/useThemeMode";

const topbarIconButton =
  "grid h-8 w-8 place-items-center rounded-full border border-accent bg-transparent text-inverse transition-colors hover:border-inverse hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-panel/50";

const topbarDropdownBase =
  "absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(26rem,calc(100vw-1rem))] min-w-0 overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-soft transition-[opacity,transform] duration-150 dark:border-line dark:bg-surface dark:shadow-soft";

const menuActionButton =
  "flex w-full items-center gap-2 rounded-lg border border-accent bg-transparent px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:text-ink dark:hover:bg-primary dark:hover:text-inverse";

const sidebarToggleButton =
  "grid min-h-9 min-w-9 place-items-center rounded-lg border border-line bg-panel-soft text-primary transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface-soft dark:text-ink dark:hover:border-accent dark:hover:bg-hover-soft dark:hover:text-accent-strong";

const navButtonBase =
  "group relative flex min-h-11 w-full items-center rounded-lg border border-transparent text-left text-sm font-medium text-nav-text transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-nav-text";

const navIconBase =
  "grid h-8 w-8 flex-none place-items-center rounded-lg border border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)] transition-colors group-hover:bg-panel/90 dark:group-hover:bg-panel/10";

const navSubButtonBase =
  "group flex min-h-9 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs text-nav-subtext transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-nav-subtext";

const mobileNavItemBase =
  "group flex min-h-[3.25rem] w-full items-center gap-3 rounded-lg border border-line bg-panel-soft px-4 py-3 text-left text-base font-medium text-unl-graphite transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:border-line dark:bg-surface dark:text-ink";

const lightNavAccents = {
  default: {
    border: "color-mix(in srgb, var(--unl-blue) 20%, transparent)",
    marker: "var(--unl-blue)",
    soft: "var(--unl-blue-soft)",
    strong: "var(--color-primary-strong)",
  },
  green: {
    border: "color-mix(in srgb, var(--unl-green) 26%, transparent)",
    marker: "var(--unl-green)",
    soft: "var(--unl-green-soft)",
    strong: "var(--unl-green-strong)",
  },
  gold: {
    border: "color-mix(in srgb, var(--unl-gold) 34%, transparent)",
    marker: "var(--unl-gold)",
    soft: "var(--unl-gold-soft)",
    strong: "var(--color-warning-strong)",
  },
  red: {
    border: "color-mix(in srgb, var(--unl-red) 26%, transparent)",
    marker: "var(--unl-red)",
    soft: "var(--unl-red-soft)",
    strong: "var(--unl-red-strong)",
  },
  teal: {
    border: "color-mix(in srgb, var(--color-chart-8) 28%, transparent)",
    marker: "var(--color-chart-8)",
    soft: "color-mix(in srgb, var(--color-chart-8) 15%, var(--color-panel))",
    strong: "var(--color-chart-8)",
  },
  violet: {
    border: "color-mix(in srgb, var(--color-chart-7) 28%, transparent)",
    marker: "var(--color-chart-7)",
    soft: "color-mix(in srgb, var(--color-chart-7) 15%, var(--color-panel))",
    strong: "var(--color-chart-7)",
  },
};

const darkNavAccents = {
  default: {
    border: "color-mix(in srgb, var(--unl-blue) 22%, transparent)",
    marker: "var(--unl-blue)",
    soft: "color-mix(in srgb, var(--unl-blue) 11%, transparent)",
    strong: "var(--color-info-strong)",
  },
  gold: {
    border: "color-mix(in srgb, var(--unl-gold) 22%, transparent)",
    marker: "var(--unl-gold)",
    soft: "color-mix(in srgb, var(--unl-gold) 11%, transparent)",
    strong: "var(--color-warning-strong)",
  },
  green: {
    border: "color-mix(in srgb, var(--unl-green) 24%, transparent)",
    marker: "var(--unl-green)",
    soft: "color-mix(in srgb, var(--unl-green) 11%, transparent)",
    strong: "var(--unl-green-strong)",
  },
  violet: {
    border: "color-mix(in srgb, var(--color-chart-7) 22%, transparent)",
    marker: "var(--color-chart-7)",
    soft: "color-mix(in srgb, var(--color-chart-7) 11%, transparent)",
    strong: "var(--color-chart-7)",
  },
  teal: {
    border: "color-mix(in srgb, var(--color-chart-8) 22%, transparent)",
    marker: "var(--color-chart-8)",
    soft: "color-mix(in srgb, var(--color-chart-8) 10%, transparent)",
    strong: "var(--color-chart-8)",
  },
};

const lightNavAccentById = {
  accounts: lightNavAccents.teal,
  courses: lightNavAccents.green,
  "didactic-plans": lightNavAccents.gold,
  documents: lightNavAccents.teal,
  forms: lightNavAccents.violet,
  institutions: lightNavAccents.gold,
  locations: lightNavAccents.teal,
  notifications: lightNavAccents.violet,
  "observation-forms": lightNavAccents.teal,
  photos: lightNavAccents.red,
  "practice-archive": lightNavAccents.teal,
  profile: lightNavAccents.violet,
  reports: lightNavAccents.violet,
  schedules: lightNavAccents.green,
  universities: lightNavAccents.gold,
};

const darkNavAccentById = {
  accounts: darkNavAccents.teal,
  courses: darkNavAccents.green,
  institutions: darkNavAccents.green,
  locations: darkNavAccents.teal,
  notifications: darkNavAccents.teal,
  photos: darkNavAccents.gold,
  profile: darkNavAccents.teal,
  reports: darkNavAccents.violet,
  schedules: darkNavAccents.gold,
  universities: darkNavAccents.violet,
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function navAccentStyle(itemId, isDark) {
  const accent = isDark
    ? darkNavAccentById[itemId] || darkNavAccents.default
    : lightNavAccentById[itemId] || lightNavAccents.default;

  return navAccentVars(accent);
}

function mainNavAccentStyle(isDark) {
  return navAccentVars(isDark ? darkNavAccents.default : lightNavAccents.default);
}

function navAccentVars(accent) {
  return {
    "--nav-accent-border": accent.border,
    "--nav-accent-marker": accent.marker,
    "--nav-accent-soft": accent.soft,
    "--nav-accent-strong": accent.strong,
  };
}

const SEARCH_KEYWORDS = {
  dashboard: "inicio panel principal resumen metricas actividad accesos tareas recientes",
  notifications: "notificaciones avisos anuncios mensajes leido no leido campana",
  profile: "perfil cuenta datos personales contraseña cambiar contraseña correo telefono",
  photos: "evidencias fotos imagenes practica subir descargar visualizar estudiante",
  forms: "entrevistas formularios preguntas respuestas interpretacion borrador enviar responder",
  "observation-forms": "fichas observacion formulario preguntas respuestas interpretacion borrador enviar",
  courses: "paralelos grupos cursos matriculas inscripciones estudiantes tutor practicas concluidas historial",
  "practice-archive": "archivo practicas concluidas archivadas historial archivar desarchivar reabrir estudiantes paralelos",
  documents: "documentos practica actividad informe final evaluacion seguimiento record ficha revision enviar",
  "didactic-plans": "planificaciones didacticas plan de unidad didactica pud dua destrezas objetivos criterios evaluacion recursos tutor institucional estudiante reformulada adaptada recomendaciones",
  schedules: "jornadas asistencias horarios asistencia tutor institucional director institucion",
  institutions: "instituciones practica centros educativos escuelas colegios asignaciones",
  universities: "universidades facultades carreras ciclos academicos grados paralelos materias",
  reports: "seguimiento reportes estadisticas informes indicadores dashboard",
  accounts: "usuarios cuentas crear usuario roles bloquear desbloquear activar desactivar contraseña",
  locations: "territorio ubicaciones provincias cantones parroquias",
};

const SEARCH_ACTIONS = [
  "crear",
  "editar",
  "guardar",
  "borrador",
  "enviar",
  "revisar",
  "aprobar",
  "rechazar",
  "corregir",
  "descargar",
  "pdf",
  "buscar",
  "filtrar",
  "tabla",
  "detalle",
];

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildSearchEntries(items, roles) {
  return items.flatMap((item) => {
    const children = getVisibleChildren(item, roles);
    const itemKeywords = SEARCH_KEYWORDS[item.id] || "";
    const baseEntry = item.isGroupHeader
      ? []
      : [createSearchEntry(item, item.label, item.id, "Pantalla", itemKeywords)];
    const childEntries = children.map((child) =>
      createSearchEntry(
        child,
        `${child.label}`,
        child.id,
        item.label,
        `${itemKeywords} ${SEARCH_KEYWORDS[child.moduleId] || ""} ${SEARCH_ACTIONS.join(" ")}`,
      ),
    );

    if (item.isGroupHeader && children.length > 0) {
      return [
        createSearchEntry(
          item,
          item.label,
          children[0].id,
          "Grupo",
          `${itemKeywords} ${children.map((child) => child.label).join(" ")}`,
        ),
        ...childEntries,
      ];
    }

    return [...baseEntry, ...childEntries];
  });
}

function createSearchEntry(item, title, routeId, category, keywords = "") {
  const searchText = normalizeSearchText(
    [title, category, item.id, item.moduleId, keywords, SEARCH_ACTIONS.join(" ")].join(" "),
  );

  return {
    id: `${routeId}-${title}`,
    title,
    routeId,
    category,
    Icon: item.Icon,
    searchText,
  };
}

function filterSearchEntries(entries, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return entries.slice(0, 8);
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return entries
    .map((entry) => {
      const score = terms.reduce((total, term) => {
        if (normalizeSearchText(entry.title).startsWith(term)) return total + 4;
        if (normalizeSearchText(entry.title).includes(term)) return total + 3;
        if (entry.searchText.includes(term)) return total + 1;
        return total - 4;
      }, 0);

      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 8);
}

export function AppLayout({ route, routeChild, children }) {
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const previousActiveRouteRef = useRef(null);
  const { profile, roles, logout, token } = useAuth();
  const { isDark } = useThemeMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openNavGroupId, setOpenNavGroupId] = useState(null);
  const [isDesplegableOpen, setIsDesplegableOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(item, roles)),
    [roles],
  );
  const searchEntries = useMemo(() => buildSearchEntries(visibleItems, roles), [roles, visibleItems]);
  const searchResults = useMemo(
    () => filterSearchEntries(searchEntries, searchQuery),
    [searchEntries, searchQuery],
  );
  const activeRoute = routeChild ? `${route}/${routeChild}` : route;
  const moduleVisualStyle = useMemo(
    () => getModuleVisualStyle(activeRoute),
    [activeRoute],
  );
  const activeGroupId =
    visibleItems.find((item) =>
      getVisibleChildren(item, roles).some((child) => child.id === activeRoute),
    )?.id || null;
  const fullName =
    joinText(profile?.names, profile?.lastNames) ||
    profile?.username ||
    "Usuario";

  useEffect(() => {
    if (activeGroupId) {
      setOpenNavGroupId(activeGroupId);
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (previousActiveRouteRef.current === null) {
      previousActiveRouteRef.current = activeRoute;
      return;
    }

    if (previousActiveRouteRef.current !== activeRoute) {
      setSidebarCollapsed(true);
      previousActiveRouteRef.current = activeRoute;
    }
  }, [activeRoute]);

  useEffect(() => {
    if (!isDesplegableOpen) return;

    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsDesplegableOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isDesplegableOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    searchInputRef.current?.focus();

    function handleOutsideClick(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  function navigateTo(itemId) {
    if (!itemId.includes("/")) {
      setOpenNavGroupId(null);
    }

    setHashRoute(itemId);
    setSidebarCollapsed(true);
    setMobileMenuOpen(false);
    setIsDesplegableOpen(false);
    setSearchOpen(false);
  }

  function openSearch() {
    setSearchOpen(true);
    setIsDesplegableOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();

    if (searchResults.length > 0) {
      navigateTo(searchResults[0].routeId);
    }
  }

  function handleNavItemClick(item, hasChildren) {
    if (item.isGroupHeader) {
      if (hasChildren) {
        setOpenNavGroupId((current) =>
          current === item.id && !sidebarCollapsed ? null : item.id,
        );
        setSidebarCollapsed(false);
      }
      return;
    }

    navigateTo(item.id);
  }

  function openProfile() {
    navigateTo("profile");
  }

  return (
    <main className="min-h-screen bg-page text-ink" style={moduleVisualStyle}>
      <header className="sticky top-0 z-30 border-b-[3px] border-primary bg-panel shadow-card dark:border-line dark:bg-page print:hidden">
        <div className="bg-primary text-xs text-inverse">
          <div className="mx-auto flex min-h-9 w-full max-w-[96rem] items-center justify-between gap-4 px-3 py-0.5">
            <div className="hidden min-w-0 items-center gap-4 lg:flex">
              <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                <Phone aria-hidden="true" size={13} />
                Teléfono: +593 7 2547252
              </span>
              <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                <Mail aria-hidden="true" size={13} />
                Correo electrónico: comunicacion@unl.edu.ec
              </span>
            </div>

            <button
              aria-expanded={mobileMenuOpen}
              className={cx(topbarIconButton, "lg:hidden")}
              onClick={() => setMobileMenuOpen(true)}
              title="Abrir menu"
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>

            <div className="ml-auto flex flex-none items-center gap-2">
              <div ref={searchRef} className="relative">
                <button
                  type="button"
                  className={topbarIconButton}
                  aria-expanded={searchOpen}
                  aria-label="Buscar en la plataforma"
                  onClick={openSearch}
                  title="Buscar"
                >
                  <Search aria-hidden="true" size={17} />
                </button>

                <div
                  className={cx(
                    topbarDropdownBase,
                    searchOpen
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0",
                  )}
                >
                  <form className="border-b border-line p-3" onSubmit={submitSearch}>
                    <label className="sr-only" htmlFor="global-search-input">
                      Buscar en la plataforma
                    </label>
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body"
                        size={17}
                      />
                      <input
                        autoComplete="off"
                        className="min-h-11 w-full rounded-lg border border-line bg-field py-2.5 pl-10 pr-10 text-sm font-semibold text-heading outline-none placeholder:text-muted transition focus:border-focus focus:ring-4 focus:ring-focus-soft"
                        id="global-search-input"
                        placeholder="Buscar pantallas, módulos, textos o acciones"
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                      {searchQuery && (
                        <button
                          aria-label="Limpiar búsqueda"
                          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-body transition hover:bg-hover-soft hover:text-primary"
                          onClick={() => setSearchQuery("")}
                          type="button"
                        >
                          <X aria-hidden="true" size={16} />
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="max-h-[min(26rem,calc(100vh-8rem))] overflow-y-auto p-2">
                    {searchResults.length > 0 ? (
                      <div className="grid gap-1">
                        {searchResults.map((result, index) => {
                          const ResultIcon = result.Icon || Search;

                          return (
                            <button
                              className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-hover-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-soft"
                              key={`${result.id}-${index}`}
                              onClick={() => navigateTo(result.routeId)}
                              type="button"
                            >
                              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-primary-soft text-primary">
                                <ResultIcon aria-hidden="true" size={18} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-heading">
                                  {result.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs font-medium text-body">
                                  {result.category}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-line bg-panel-soft p-4 text-sm font-semibold leading-6 text-body">
                        No hay coincidencias. Prueba con el nombre de una pantalla, módulo o acción.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <NotificationBell />

              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  aria-expanded={isDesplegableOpen}
                  className="flex max-w-xs items-center gap-2 rounded-full border border-accent bg-primary-strong py-0.5 pl-1 pr-3 text-left transition-colors hover:border-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-panel/50"
                  onClick={() => setIsDesplegableOpen((current) => !current)}
                  type="button"
                >
                  <Avatar
                    className="!h-7 !w-7 !text-xs ring-1 ring-panel/70"
                    profile={profile}
                    size="sm"
                    token={token}
                  />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-xs font-semibold text-inverse">
                      {fullName}
                    </span>
                    <span className="block truncate text-[0.68rem] font-semibold text-inverse/75">
                      {profile?.institution ||
                        profile?.academicCycle ||
                        "Sesión activa"}
                    </span>
                  </span>
                </button>

                <div
                  className={cx(
                    topbarDropdownBase,
                    "opacity-0 transition-[max-height,opacity,transform] duration-200",
                    isDesplegableOpen
                      ? "max-h-[min(32rem,calc(100vh-4rem))] translate-y-0 overflow-y-auto opacity-100"
                      : "pointer-events-none max-h-0 -translate-y-1",
                  )}
                >
                  <div className="grid gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3 border-b border-border px-1 pb-3">
                      <Avatar profile={profile} size="md" token={token} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight text-unl-graphite dark:text-heading">
                          {fullName}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold leading-tight text-body">
                          {profile?.institutionalEmail || profile?.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 px-0.5">
                      {roles.map((role) => (
                        <span
                          className="inline-flex rounded-full border border-accent bg-accent-soft px-2.5 py-1 text-xs font-semibold leading-none text-accent-strong dark:bg-surface-soft dark:text-body"
                          key={role}
                        >
                          {formatRole(role)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-border px-1 pb-3">
                      <div>
                        <p className="text-sm font-semibold leading-tight text-unl-graphite dark:text-heading">
                          Apariencia
                        </p>
                        <p className="mt-1 text-xs font-medium leading-tight text-body">
                          Claro / oscuro
                        </p>
                      </div>
                      <ThemeToggle className="origin-right scale-[0.88]" />
                    </div>

                    <div className="grid gap-2">
                      <button
                        className={menuActionButton}
                        onClick={openProfile}
                        type="button"
                      >
                        <UserRound aria-hidden="true" size={18} />
                        <span>Mi perfil</span>
                      </button>
                      <button
                        className={menuActionButton}
                        onClick={logout}
                        title="Salir"
                        type="button"
                      >
                        <LogOut aria-hidden="true" size={18} />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className="mx-auto grid w-full max-w-[96rem] grid-cols-1 gap-3 px-3 pb-4 pt-3 transition-[grid-template-columns] duration-200 lg:grid-cols-[var(--sidebar-layout-width)_minmax(0,1fr)]"
        style={{
          "--sidebar-layout-width": sidebarCollapsed ? "70px" : "280px",
        }}
      >
        <aside className="hidden lg:block print:hidden">
          <section
            className={cx(
              "fixed left-[max(0.75rem,calc((100vw-96rem)/2+0.75rem))] top-14 z-20 flex h-[calc(100vh-4.25rem)] w-[var(--sidebar-layout-width)] flex-col overflow-hidden rounded-lg border border-line bg-panel-soft shadow-card transition-[width,padding] duration-200 dark:border-line dark:bg-surface",
                sidebarCollapsed ? "py-3 pl-2 pr-0" : "p-2.5",
            )}
          >
            <div
              className={cx(
                "flex flex-none items-center gap-3 pb-3 pr-2",
                sidebarCollapsed ? "justify-center pr-0" : "justify-between",
              )}
            >
              {!sidebarCollapsed && (
                <p className="px-2 text-xs font-semibold uppercase leading-tight tracking-normal text-primary">
                  Menu
                </p>
              )}
              <button
                aria-expanded={!sidebarCollapsed}
                className={sidebarToggleButton}
                onClick={() => setSidebarCollapsed((current) => !current)}
                title={sidebarCollapsed ? "Expandir menu" : "Contraer menu"}
                type="button"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen aria-hidden="true" size={17} />
                ) : (
                  <PanelLeftClose aria-hidden="true" size={17} />
                )}
              </button>
            </div>

            <nav
              aria-label="Principal"
              className={cx(
                "grid min-w-0 flex-1 content-start gap-1 overflow-y-auto overflow-x-hidden overscroll-contain",
                sidebarCollapsed ? "pr-1 [scrollbar-gutter:stable]" : "pr-1",
              )}
            >
              {visibleItems.map((item) => {
                const childItems = getVisibleChildren(item, roles);
                const hasChildren = childItems.length > 0;
                const itemIsActive = route === item.id;
                const childIsActive = childItems.some(
                  (child) => child.id === activeRoute,
                );
                const groupIsOpen = Boolean(
                  hasChildren &&
                    !sidebarCollapsed &&
                    openNavGroupId === item.id,
                );
                const ToggleIcon = item.ToggleIcon;
                const isActive = itemIsActive || childIsActive;

                return (
                  <div className="grid min-w-0 gap-1" key={item.id}>
                    <button
                      aria-current={
                        !item.isGroupHeader && activeRoute === item.id
                          ? "page"
                          : undefined
                      }
                      aria-expanded={
                        hasChildren && !sidebarCollapsed
                          ? groupIsOpen
                          : undefined
                      }
                      className={cx(
                        navButtonBase,
                        sidebarCollapsed
                          ? "justify-center px-2.5 py-2.5"
                          : "gap-3 px-3 py-2.5",
                        isActive &&
                          "!border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                      )}
                      onClick={() => handleNavItemClick(item, hasChildren)}
                      style={mainNavAccentStyle(isDark)}
                      title={sidebarCollapsed ? item.label : undefined}
                      type="button"
                    >
                      <span
                        className={cx(
                          "absolute left-1 h-5 w-1 rounded-full bg-[color:var(--nav-accent-marker)] transition-opacity",
                          isActive ? "opacity-100" : "opacity-0",
                          sidebarCollapsed && "left-0.5",
                        )}
                      />
                      {item.Icon && (
                        <span
                          className={cx(
                            navIconBase,
                            isActive && "bg-panel dark:bg-panel/10",
                          )}
                        >
                          <item.Icon aria-hidden="true" size={18} />
                        </span>
                      )}
                      {!sidebarCollapsed && (
                        <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
                          {item.label}
                        </span>
                      )}
                      {hasChildren && !sidebarCollapsed && ToggleIcon && (
                        <ToggleIcon
                          aria-hidden="true"
                          className={cx(
                            "ml-auto flex-none transition-transform",
                            groupIsOpen && "rotate-180",
                          )}
                          size={16}
                        />
                      )}
                    </button>

                    {groupIsOpen && (
                      <div
                        aria-label={`Submenu de ${item.label}`}
                        className="ml-4 mt-1 grid min-w-0 gap-1 border-l border-border pl-2"
                        role="group"
                        style={navAccentStyle(item.id, isDark)}
                      >
                        {childItems.map((child) => {
                          const childActive = activeRoute === child.id;

                          return (
                            <button
                              aria-current={childActive ? "page" : undefined}
                              className={cx(
                                navSubButtonBase,
                                "min-w-0",
                                childActive &&
                                  "!border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                              )}
                              key={child.id}
                              onClick={() => navigateTo(child.id)}
                              type="button"
                            >
                              {child.Icon && (
                                <span
                                  className={cx(
                                    "grid h-7 w-7 flex-none place-items-center rounded-lg bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)] transition-colors group-hover:bg-panel dark:bg-panel/10 dark:group-hover:bg-panel/10",
                                    childActive && "bg-panel dark:bg-panel/10",
                                  )}
                                >
                                  <child.Icon aria-hidden="true" size={16} />
                                </span>
                              )}
                              <span className="min-w-0 whitespace-normal break-words">
                                {child.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </section>
        </aside>

        <div className="sgp-page-canvas grid min-w-0 content-start gap-3 rounded-lg px-0 pb-4">{children}</div>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-[80] bg-black/40 transition-opacity lg:hidden dark:bg-black/60 print:hidden",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className={cx(
            "grid h-full min-h-full w-[min(100%,420px)] grid-rows-[auto_auto_auto_1fr] bg-page shadow-soft transition-transform duration-200",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border bg-panel/90 px-4 py-3 dark:bg-page/95">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-accent bg-primary text-xs font-semibold text-inverse">
                UNL
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase leading-tight text-primary dark:text-info-strong">
                  Universidad Nacional de Loja
                </p>
                <p className="mt-1 truncate text-sm font-semibold leading-tight text-unl-graphite dark:text-heading">
                  Sistema de Gestion de Practicas
                </p>
              </div>
            </div>
            <button
              className={sidebarToggleButton}
              onClick={() => setMobileMenuOpen(false)}
              title="Cerrar menu"
              type="button"
            >
              <X aria-hidden="true" size={21} />
            </button>
          </div>

          <div className="m-4 flex items-center gap-3 rounded-lg border border-border bg-panel/90 p-3 shadow-card dark:bg-surface">
            <Avatar profile={profile} size="md" token={token} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-unl-graphite dark:text-heading">
                {fullName}
              </p>
              <p className="truncate text-xs font-semibold text-body">
                {profile?.institutionalEmail || profile?.username}
              </p>
            </div>
          </div>

          <div className="mx-4 mb-4 grid gap-2 rounded-lg border border-border bg-surface-soft p-3 shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold leading-tight text-unl-graphite dark:text-heading">
                  Apariencia
                </p>
                <p className="mt-1 text-xs font-medium leading-tight text-body">
                  Claro / oscuro
                </p>
              </div>
              <ThemeToggle className="origin-right scale-[0.88]" />
            </div>
            <button
              type="button"
              onClick={logout}
              title="Salir"
              className={menuActionButton}
            >
              <LogOut aria-hidden="true" size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>

          <nav
            aria-label="Principal movil"
            className="grid content-start gap-2 overflow-y-auto overflow-x-hidden px-4 pb-5"
          >
            {visibleItems.map((item) => {
              const childItems = getVisibleChildren(item, roles);
              const hasChildren = childItems.length > 0;
              const itemIsActive = route === item.id;
              const childIsActive = childItems.some(
                (child) => child.id === activeRoute,
              );
              const groupIsOpen = Boolean(
                hasChildren && openNavGroupId === item.id,
              );
              const isActive = itemIsActive || childIsActive;

              return (
                <div
                  className={cx(
                    "grid gap-2",
                    hasChildren &&
                      "rounded-lg border border-border bg-panel/80 p-1.5 shadow-card dark:bg-surface",
                    isActive && hasChildren && "!border-[color:var(--nav-accent-border)]",
                  )}
                  key={item.id}
                >
                  <button
                    aria-current={
                      !item.isGroupHeader && activeRoute === item.id
                        ? "page"
                        : undefined
                    }
                    aria-expanded={hasChildren ? groupIsOpen : undefined}
                    className={cx(
                      mobileNavItemBase,
                      activeRoute === item.id &&
                        "!border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                      hasChildren && "border-transparent bg-transparent",
                    )}
                    onClick={() => handleNavItemClick(item, hasChildren)}
                    style={mainNavAccentStyle(isDark)}
                    type="button"
                  >
                    {item.Icon && (
                      <span className={navIconBase}>
                        <item.Icon aria-hidden="true" size={20} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </button>

                  {groupIsOpen && (
                    <div
                      aria-label={`Submenu de ${item.label}`}
                      className="grid gap-1.5 pl-6"
                      role="group"
                      style={navAccentStyle(item.id, isDark)}
                    >
                      {childItems.map((child) => {
                        const childActive = activeRoute === child.id;

                        return (
                          <button
                            aria-current={childActive ? "page" : undefined}
                            className={cx(
                              navSubButtonBase,
                              "min-h-11 bg-panel text-sm dark:bg-surface-soft",
                              childActive &&
                                "!border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                            )}
                            key={child.id}
                            onClick={() => navigateTo(child.id)}
                            type="button"
                          >
                            <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]">
                              {child.Icon && (
                                <child.Icon aria-hidden="true" size={16} />
                              )}
                            </span>
                            <span className="min-w-0 break-words">
                              {child.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </main>
  );
}

function getVisibleChildren(item, roles) {
  if (!item?.children?.length) {
    return [];
  }

  return item.children.filter((child) => canAccess(child, roles));
}
