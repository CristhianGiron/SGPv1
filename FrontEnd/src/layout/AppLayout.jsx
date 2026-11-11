/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AppLayout.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AppLayout de la interfaz del SGP.
 */

import { useDialogFocus } from '../hooks/useDialogFocus';
import unlLogo from '../assets/branding/unl-logo.png';
import { PRACTICE_MODULE_IDS } from '../config/practiceWorkflow';
import { navigationLabel } from '../config/roleExperience';
import { useInstitutionalContext } from "../contexts/InstitutionalContext";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
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
import { AccountMenu } from "../components/ui/AccountMenu";
import { useThemeMode } from "../hooks/useThemeMode";

const topbarIconButton =
  "grid h-10 w-10 place-items-center rounded-md text-body transition-colors hover:bg-panel-soft hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const topbarDropdownBase =
  "absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(26rem,calc(100vw-1rem))] min-w-0 overflow-hidden rounded-lg border border-line bg-panel text-ink shadow-soft transition-[opacity,transform] duration-150 dark:border-line dark:bg-surface dark:shadow-soft";

const menuActionButton =
  "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-body transition-colors hover:bg-panel-soft hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const sidebarToggleButton =
  "grid h-9 w-9 flex-none place-items-center rounded-md text-muted transition-colors hover:bg-panel-soft hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const navButtonBase =
  "group relative flex min-h-11 w-full items-center rounded-md border border-transparent text-left text-[13px] font-medium text-nav-text transition-colors hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-nav-text";

const navIconBase =
  "grid h-6 w-6 flex-none place-items-center text-muted group-hover:text-heading";

const navSubButtonBase =
  "group flex min-h-9 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs text-nav-subtext transition-colors hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:text-nav-subtext";

const mobileNavItemBase =
  "group flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-body transition-colors hover:bg-panel-soft hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function mainNavAccentStyle(isDark) {
  return {
    "--nav-accent-border": "var(--color-line)",
    "--nav-accent-marker": "var(--color-focus)",
    "--nav-accent-soft": "var(--color-primary-soft)",
    "--nav-accent-strong": isDark ? "var(--color-info-strong)" : "var(--color-primary-strong)",
  };
}

function navAccentStyle(itemId, isDark) {
  return mainNavAccentStyle(isDark);
}

const NAV_SECTIONS = [
  { title: 'Mi espacio', ids: ['dashboard', 'institution-work', 'practices', 'overview', 'notifications', 'profile'] },
  { title: 'Prácticas y seguimiento', ids: ['courses', 'documents', 'didactic-plans', 'photos', 'forms', 'observation-forms', 'schedules', 'practice-archive'] },
  { title: 'Gestión académica', ids: ['reports', 'institutions', 'universities', 'accounts', 'locations'] },
];

function navSection(item) {
  const index = NAV_SECTIONS.findIndex((section) => section.ids.includes(item.id));
  return index < 0 ? NAV_SECTIONS.length - 1 : index;
}

function navOrder(item) {
  const section = navSection(item);
  const position = NAV_SECTIONS[section].ids.indexOf(item.id);
  return section * 100 + (position < 0 ? 99 : position);
}

const SEARCH_KEYWORDS = {
  dashboard: "inicio panel principal resumen metricas actividad accesos tareas recientes",
  notifications: "notificaciones avisos anuncios mensajes leido no leido campana",
  profile: "perfil cuenta datos personales contraseña cambiar contraseña correo teléfono",
  photos: "evidencias fotos imagenes práctica subir descargar visualizar estudiante",
  forms: "entrevistas formularios preguntas respuestas interpretación borrador enviar responder",
  "observation-forms": "fichas observación formulario preguntas respuestas interpretación borrador enviar",
  courses: "paralelos grupos cursos matriculas inscripciones estudiantes tutor prácticas concluidas historial",
  "practice-archive": "archivo prácticas concluidas archivadas historial archivar desarchivar reabrir estudiantes paralelos",
  documents: "documentos práctica actividad informe final evaluación seguimiento record ficha revisión enviar",
  "didactic-plans": "planificaciones didacticas plan de unidad didactica pud dua destrezas objetivos criterios evaluación recursos tutor institucional estudiante reformulada adaptada recomendaciones",
  schedules: "jornadas asistencias horarios asistencia tutor institucional director institución",
  institutions: "instituciones práctica centros educativos escuelas colegios asignaciones",
  universities: "universidades facultades carreras ciclos académicos grados paralelos materias",
  reports: "seguimiento reportes estadísticas informes indicadores dashboard",
  accounts: "usuarios cuentas crear usuario roles bloquear desbloquear activar desactivar contraseña",
  locations: "territorio ubicaciones provincias cantones parroquias",
};

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
        `${itemKeywords} ${SEARCH_KEYWORDS[child.moduleId] || ""} `,
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
    [title, category, item.id, item.moduleId, keywords].join(" "),
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
  const institutionDefaults = useInstitutionalContext();
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileDialogRef = useRef(null);
  const { profile, roles, logout, token } = useAuth();
  const { isDark } = useThemeMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openNavGroupId, setOpenNavGroupId] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAccess(item, roles) && !PRACTICE_MODULE_IDS.includes(item.id) && !(item.id === 'dashboard' && roles.length === 1 && roles.includes('ROLE_ESTUDIANTE')) && !(item.id === 'practices' && roles.length === 1 && roles.includes('ROLE_DIRECTORA_INSTITUCION')) && (item.id !== 'practice-archive' || roles.includes('ROLE_ADMIN'))).map((item) => ({ ...item, ...(item.id === 'universities' || item.id === 'institutions' ? { children: [], isGroupHeader: false } : {}), label: navigationLabel(item, roles) })).sort((left, right) => navOrder(left) - navOrder(right)),
    [roles],
  );
  const searchEntries = useMemo(() => buildSearchEntries(visibleItems, roles), [roles, visibleItems]);
  const searchResults = useMemo(
    () => filterSearchEntries(searchEntries, searchQuery),
    [searchEntries, searchQuery],
  );
  const activeRoute = route === 'dashboard' && roles.length === 1 && roles.includes('ROLE_ESTUDIANTE') ? 'practices' : routeChild ? `${route}/${routeChild}` : route;
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
    function handleSearchShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.altKey) {
        if ([...document.querySelectorAll('[aria-modal="true"]')].some(dialog => !dialog.closest('[inert], [aria-hidden="true"]'))) return;
        event.preventDefault();
        setSearchOpen(true);
        setAccountOpen(false);
      }
    }
    document.addEventListener('keydown', handleSearchShortcut);
    return () => document.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      setOpenNavGroupId(activeGroupId);
    }
  }, [activeGroupId]);



  useDialogFocus(mobileMenuOpen, mobileDialogRef, () => setMobileMenuOpen(false));

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
    setAccountOpen(false);
    setSearchOpen(false);
  }

  function openSearch() {
    setSearchOpen(true);
    setAccountOpen(false);
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
    <main className="sgp-app-layout min-h-screen bg-page text-ink" style={{ ...moduleVisualStyle, "--sidebar-layout-width": sidebarCollapsed ? "76px" : "260px" }}>
      <a className="sgp-skip-link" href="#sgp-main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById('sgp-main-content')?.focus();
      }}>Saltar al contenido</a>
      <header className="sgp-app-topbar sticky top-0 z-30 border-b border-line bg-panel print:hidden">
        <div>
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-7">
            <nav aria-label="Ubicación actual" className="hidden min-w-0 items-center gap-2 text-sm text-muted lg:flex">
              <button className="rounded py-1 hover:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus" onClick={() => navigateTo('dashboard')} type="button">Inicio</button>
              {route !== 'dashboard' && <><span aria-hidden="true" className="text-subtle">/</span><span aria-current="page" className="truncate font-medium text-heading">{searchEntries.find((item) => item.routeId === activeRoute && item.category !== 'Grupo')?.title || visibleItems.find((item) => item.id === route)?.label || NAV_ITEMS.find(item => item.id === route)?.children?.find(item => item.moduleId === routeChild)?.label || NAV_ITEMS.find(item => item.id === route)?.label || 'Prácticas'}</span></>}
            </nav>

            <button
              aria-expanded={mobileMenuOpen}
              className={cx(topbarIconButton, "lg:hidden")}
              onClick={() => setMobileMenuOpen(true)}
              title="Abrir menu"
              type="button"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
            <span className="text-sm font-semibold text-heading lg:hidden">SGP</span>

            <div className="ml-auto flex flex-none items-center gap-2">
              <div ref={searchRef} className="relative">
                <button
                  type="button"
                  className={cx(topbarIconButton, "sgp-search-trigger")}
                  aria-expanded={searchOpen}
                  aria-label="Buscar en la plataforma"
                  onClick={openSearch}
                  title="Buscar en el sistema (Ctrl K / ⌘ K)"
                >
                  <Search aria-hidden="true" size={17} />
                </button>

                <div
                  inert={!searchOpen}
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

              <AccountMenu profile={profile} roles={roles} token={token} open={accountOpen}
                onOpen={() => { setSearchOpen(false); setMobileMenuOpen(false); setAccountOpen(true); }}
                onClose={() => setAccountOpen(false)} onProfile={openProfile} onLogout={logout} />

            </div>
          </div>
        </div>
      </header>

      <div
        className="sgp-layout-body"
      >
        <aside className="hidden lg:block print:hidden">
          <section
            data-collapsed={sidebarCollapsed}
            className="sgp-sidebar-shell sgp-sidebar-desktop fixed inset-y-0 left-0 z-40 flex h-dvh w-[var(--sidebar-layout-width)] flex-col overflow-hidden border-r px-3 py-4"
          >
            <div className="sgp-sidebar-header relative flex flex-none items-start gap-2">
                <button aria-hidden={sidebarCollapsed} inert={sidebarCollapsed} tabIndex={sidebarCollapsed ? -1 : undefined} className="sgp-sidebar-brand flex min-w-0 items-center gap-2.5 rounded-md px-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus" onClick={() => navigateTo('dashboard')} type="button" aria-label="SGP · Inicio">
                  <img src={`${process.env.PUBLIC_URL || ''}/sgp-icon.svg`} width="36" height="36" className="h-9 w-9 flex-none" alt="" aria-hidden="true" />
                  <span><span className="block text-lg font-semibold tracking-tight text-heading">SGP</span><span className="block text-[10px] text-muted">Gestión de prácticas</span></span>
                </button>
              <button
                aria-expanded={!sidebarCollapsed}
                className={cx(sidebarToggleButton, 'sgp-sidebar-toggle')}
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
                "grid min-w-0 flex-1 content-start gap-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1",
              )}
            >
              {visibleItems.map((item, itemIndex) => {
                const childItems = getVisibleChildren(item, roles);
                const hasChildren = childItems.length > 0;
                const itemIsActive = (route === 'dashboard' && roles.length === 1 && roles.includes('ROLE_ESTUDIANTE') ? 'practices' : route) === item.id;
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
                    {(itemIndex === 0 || navSection(visibleItems[itemIndex - 1]) !== navSection(item)) && (
                      <p aria-hidden={sidebarCollapsed} className="sgp-sidebar-section-title px-3 pb-1 pt-4 text-[11px] font-semibold tracking-wide text-muted">{NAV_SECTIONS[navSection(item)]?.title}</p>
                    )}
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
                      aria-label={item.label}
                      className={cx(
                        navButtonBase,
                        "sgp-sidebar-item gap-2.5 px-3 py-2",
                        isActive &&
                          "bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                      )}
                      onClick={() => handleNavItemClick(item, hasChildren)}
                      style={mainNavAccentStyle(isDark)}
                      title={item.label}
                      type="button"
                    >
                      {item.Icon && (
                        <span
                          className={cx(
                            navIconBase,
                          )}
                        >
                          <item.Icon aria-hidden="true" size={18} />
                        </span>
                      )}
                      <span aria-hidden={sidebarCollapsed} className="sgp-sidebar-label min-w-0 flex-1 leading-tight">
                        <span>{item.label}</span>
                      </span>
                      {hasChildren && ToggleIcon && (
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

                    {hasChildren && (
                      <div className="sgp-sidebar-submenu" data-open={groupIsOpen} aria-hidden={!groupIsOpen} inert={!groupIsOpen}>
                      <div className="sgp-sidebar-submenu-clip">
                      <div
                        aria-label={`Submenu de ${item.label}`}
                        className="sgp-sidebar-submenu-content ml-4 mt-1 grid min-w-0 gap-1 border-l border-border pl-2"
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
                                  "bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
                              )}
                              key={child.id}
                              onClick={() => navigateTo(child.id)}
                              type="button"
                            >
                              {child.Icon && (
                                <span
                                  className={cx(
                                    "grid h-5 w-5 flex-none place-items-center text-muted",
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
                      </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div aria-hidden={sidebarCollapsed} inert={sidebarCollapsed} className="sgp-sidebar-identity mt-4 border-t border-line px-3 pt-4">
              {institutionDefaults.universityCode?.toUpperCase() === 'UNL' && (
                <span className="sgp-institution-mark">
                  <img src={unlLogo} alt="Universidad Nacional de Loja" />
                  <img src={unlLogo} alt="" aria-hidden="true" className="sgp-institution-mark-ink" />
                </span>
              )}
              <p className="text-[11px] font-medium text-body">{institutionDefaults.universityName}</p>
              <p className="mt-1 text-[11px] text-muted">{roles.map(formatRole).join(' · ')}</p>
            </div>
          </section>
        </aside>

        <div id="sgp-main-content" tabIndex={-1} className="sgp-page-canvas mx-auto grid w-full min-w-0 max-w-[84rem] content-start gap-6 outline-none">
          {children}
        </div>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-[80] bg-black/40 transition-opacity lg:hidden dark:bg-black/60 print:hidden",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setMobileMenuOpen(false);
          }
        }}
      >
        <div
          className={cx(
            "sgp-sidebar-shell grid h-full min-h-full w-[min(100%,420px)] grid-rows-[auto_auto_auto_1fr] shadow-soft transition-transform duration-200 motion-reduce:transition-none",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          ref={mobileDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border bg-panel/90 px-4 py-3 dark:bg-page/95">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-accent bg-primary text-xs font-semibold text-inverse">
                {institutionDefaults.universityCode}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase leading-tight text-primary dark:text-info-strong">
                  {institutionDefaults.universityName}
                </p>
                <p className="mt-1 truncate text-sm font-semibold leading-tight text-unl-graphite dark:text-heading">
                  Sistema de Gestión de Prácticas
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

          <div className="mx-4 mt-4 flex items-center gap-3 border-b border-line pb-4">
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

          <div className="mx-4 mb-4 mt-3 grid gap-2 border-b border-line pb-4">
            <button type="button" className={menuActionButton} onClick={() => { setMobileMenuOpen(false); setAccountOpen(true); }}><UserRound size={18} aria-hidden="true" /><span>Cuenta y apariencia</span></button>
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
            {visibleItems.map((item, itemIndex) => {
              const childItems = getVisibleChildren(item, roles);
              const hasChildren = childItems.length > 0;
              const itemIsActive = (route === 'dashboard' && roles.length === 1 && roles.includes('ROLE_ESTUDIANTE') ? 'practices' : route) === item.id;
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
                    hasChildren && "rounded-md",
                    isActive && hasChildren && "!border-[color:var(--nav-accent-border)]",
                  )}
                  key={item.id}
                >
                  {(itemIndex === 0 || navSection(visibleItems[itemIndex - 1]) !== navSection(item)) && (
                    <p className="px-2 pb-1 pt-3 text-xs font-semibold text-muted">{NAV_SECTIONS[navSection(item)]?.title}</p>
                  )}
                  <button
                    aria-current={
                      !item.isGroupHeader && activeRoute === item.id
                        ? "page"
                        : undefined
                    }
                    aria-expanded={hasChildren ? groupIsOpen : undefined}
                    className={cx(
                      mobileNavItemBase,
                      isActive &&
                        "bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
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
                    {hasChildren && <ChevronDown aria-hidden="true" size={18} className={cx('flex-none transition-transform', groupIsOpen && 'rotate-180')} />}
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
                                "bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)]",
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
