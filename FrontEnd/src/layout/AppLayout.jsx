import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../auth/AuthContext";
import { formatRole, joinText } from "../utils/format";
import { setHashRoute } from "../utils/routes";
import { Avatar } from "../components/Avatar";
import { NotificationBell } from "../components/notifications/NotificationBell";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useThemeMode } from "../hooks/useThemeMode";

const topbarIconButton =
  "grid h-8 w-8 place-items-center rounded-full border border-[#529914] bg-transparent text-white transition-colors hover:border-white hover:bg-[#074462] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const menuActionButton =
  "flex w-full items-center gap-2 rounded-lg border border-[#529914] bg-transparent px-3 py-2 text-sm font-extrabold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/40 dark:text-ink dark:hover:bg-[#04344c] dark:hover:text-white";

const sidebarToggleButton =
  "grid min-h-9 min-w-9 place-items-center rounded-lg border border-[#aebfba] bg-[#edf3ef] text-primary transition-colors hover:border-[#529914] hover:bg-[#e4f0d8] hover:text-[#3f760f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-[#334155] dark:bg-[#172033] dark:text-ink dark:hover:border-[#75c66a] dark:hover:bg-[#203026] dark:hover:text-[#bbf7d0]";

const navButtonBase =
  "group relative flex min-h-11 w-full items-center rounded-lg border border-transparent text-left text-sm font-extrabold text-[#40525a] transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:text-[#c8d3df]";

const navIconBase =
  "grid h-8 w-8 flex-none place-items-center rounded-lg border border-[color:var(--nav-accent-border)] bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)] transition-colors group-hover:bg-white/90 dark:group-hover:bg-white/10";

const navSubButtonBase =
  "group flex min-h-9 w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs font-bold text-[#52656d] transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:text-[#b7c4d1]";

const mobileNavItemBase =
  "group flex min-h-[3.25rem] w-full items-center gap-3 rounded-lg border border-[#c4d2cd] bg-[#f6f7f3] px-4 py-3 text-left text-base font-extrabold text-unl-graphite transition-colors hover:border-[color:var(--nav-accent-border)] hover:bg-[var(--nav-accent-soft)] hover:text-[color:var(--nav-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-[#334155] dark:bg-surface dark:text-ink";

const lightNavAccents = {
  default: {
    border: "rgba(4, 52, 76, 0.2)",
    marker: "#04344c",
    soft: "#d7e4e9",
    strong: "#04344c",
  },
  green: {
    border: "rgba(82, 153, 20, 0.26)",
    marker: "#529914",
    soft: "#e4f0d8",
    strong: "#3f760f",
  },
};

const darkNavAccents = {
  default: {
    border: "rgba(125, 211, 252, 0.22)",
    marker: "#7dd3fc",
    soft: "rgba(102, 189, 242, 0.11)",
    strong: "#cbeafe",
  },
  gold: {
    border: "rgba(244, 200, 74, 0.22)",
    marker: "#f4c84a",
    soft: "rgba(244, 200, 74, 0.11)",
    strong: "#f6df8e",
  },
  green: {
    border: "rgba(117, 198, 106, 0.24)",
    marker: "#75c66a",
    soft: "rgba(117, 198, 106, 0.11)",
    strong: "#c7f3c1",
  },
  violet: {
    border: "rgba(167, 139, 250, 0.22)",
    marker: "#a78bfa",
    soft: "rgba(167, 139, 250, 0.11)",
    strong: "#ddd6fe",
  },
  teal: {
    border: "rgba(45, 212, 191, 0.22)",
    marker: "#5eead4",
    soft: "rgba(45, 212, 191, 0.1)",
    strong: "#b5f4e8",
  },
};

const lightNavAccentById = {
  courses: lightNavAccents.green,
  institutions: lightNavAccents.green,
  photos: lightNavAccents.green,
  schedules: lightNavAccents.green,
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

  return {
    "--nav-accent-border": accent.border,
    "--nav-accent-marker": accent.marker,
    "--nav-accent-soft": accent.soft,
    "--nav-accent-strong": accent.strong,
  };
}

export function AppLayout({ route, routeChild, children }) {
  const menuRef = useRef(null);
  const { profile, roles, logout, token } = useAuth();
  const { isDark } = useThemeMode();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openNavGroupId, setOpenNavGroupId] = useState(null);
  const [isDesplegableOpen, setIsDesplegableOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item, roles));
  const activeRoute = routeChild ? `${route}/${routeChild}` : route;
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

  function navigateTo(itemId) {
    if (!itemId.includes("/")) {
      setOpenNavGroupId(null);
    }

    setHashRoute(itemId);
    setMobileMenuOpen(false);
    setIsDesplegableOpen(false);
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
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b-[3px] border-primary bg-white shadow-[0_8px_22px_rgba(4,52,76,0.08)] dark:border-slate-700 dark:bg-[#0b1120] print:hidden">
        <div className="bg-primary text-xs font-semibold text-white">
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
              <button
                type="button"
                className={topbarIconButton}
                aria-label="Buscar"
                title="Buscar"
              >
                <Search aria-hidden="true" size={17} />
              </button>
              <NotificationBell />

              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  aria-expanded={isDesplegableOpen}
                  className="flex max-w-xs items-center gap-2 rounded-full border border-[#529914] bg-[#074462] py-0.5 pl-1 pr-3 text-left transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  onClick={() => setIsDesplegableOpen((current) => !current)}
                  type="button"
                >
                  <Avatar
                    className="!h-7 !w-7 !text-xs ring-1 ring-white/70"
                    profile={profile}
                    size="sm"
                    token={token}
                  />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-xs font-extrabold text-white">
                      {fullName}
                    </span>
                    <span className="block truncate text-[0.68rem] font-semibold text-white/75">
                      {profile?.institution ||
                        profile?.academicCycle ||
                        "Sesión activa"}
                    </span>
                  </span>
                </button>

                <div
                  className={cx(
                    "absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-[#bdcbd0] bg-[#fbfaf7] text-ink opacity-0 shadow-[0_18px_42px_rgba(4,52,76,0.16)] transition-[max-height,opacity,transform] duration-200 dark:border-slate-700 dark:bg-surface dark:shadow-[0_18px_42px_rgba(0,0,0,0.34)]",
                    isDesplegableOpen
                      ? "max-h-[min(32rem,calc(100vh-4rem))] translate-y-0 overflow-y-auto opacity-100"
                      : "pointer-events-none max-h-0 -translate-y-1",
                  )}
                >
                  <div className="grid gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3 border-b border-border px-1 pb-3">
                      <Avatar profile={profile} size="md" token={token} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-[850] leading-tight text-unl-graphite dark:text-slate-50">
                          {fullName}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold leading-tight text-muted">
                          {profile?.institutionalEmail || profile?.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 px-0.5">
                      {roles.map((role) => (
                        <span
                          className="inline-flex rounded-full border border-[#529914] bg-accent-soft px-2.5 py-1 text-xs font-extrabold leading-none text-accent-strong dark:bg-[#172033] dark:text-slate-200"
                          key={role}
                        >
                          {formatRole(role)}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-border px-1 pb-3">
                      <div>
                        <p className="text-sm font-[850] leading-tight text-unl-graphite dark:text-slate-50">
                          Apariencia
                        </p>
                        <p className="mt-1 text-xs font-bold leading-tight text-muted">
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
        className="mx-auto grid w-full max-w-[96rem] grid-cols-1 gap-3 px-3 pb-5 pt-3 transition-[grid-template-columns] duration-200 lg:grid-cols-[var(--sidebar-layout-width)_minmax(0,1fr)]"
        style={{
          "--sidebar-layout-width": sidebarCollapsed ? "74px" : "300px",
        }}
      >
        <aside className="hidden lg:block print:hidden">
          <section
            className={cx(
              "fixed left-[max(0.75rem,calc((100vw-96rem)/2+0.75rem))] top-14 z-20 flex h-[calc(100vh-4.25rem)] w-[var(--sidebar-layout-width)] flex-col overflow-hidden rounded-lg border border-[#b9c9c4] bg-[#eef3f2] shadow-card transition-[width,padding] duration-200 dark:border-[#263449] dark:bg-[#101827]",
              sidebarCollapsed ? "py-3 pl-2 pr-0" : "p-3",
            )}
          >
            <div
              className={cx(
                "flex flex-none items-center gap-3 pb-3 pr-2",
                sidebarCollapsed ? "justify-center pr-0" : "justify-between",
              )}
            >
              {!sidebarCollapsed && (
                <p className="px-2 text-xs font-extrabold uppercase leading-tight tracking-normal text-primary">
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
                  <div className="grid min-w-0 gap-1" key={item.id} style={navAccentStyle(item.id, isDark)}>
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
                            isActive && "bg-white dark:bg-white/10",
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
                                    "grid h-7 w-7 flex-none place-items-center rounded-lg bg-[var(--nav-accent-soft)] text-[color:var(--nav-accent-strong)] transition-colors group-hover:bg-white dark:bg-white/10 dark:group-hover:bg-white/10",
                                    childActive && "bg-white dark:bg-white/10",
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

        <div className="grid min-w-0 content-start gap-4">{children}</div>
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
            "grid h-full min-h-full w-[min(100%,420px)] grid-rows-[auto_auto_auto_1fr] bg-page shadow-[24px_0_60px_rgba(27,33,21,0.18)] transition-transform duration-200",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border bg-white/90 px-4 py-3 dark:bg-[#0b1120]/95">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-lg border border-[#529914] bg-primary text-xs font-black text-white">
                UNL
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase leading-tight text-primary dark:text-sky-200">
                  Universidad Nacional de Loja
                </p>
                <p className="mt-1 truncate text-sm font-black leading-tight text-unl-graphite dark:text-slate-50">
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

          <div className="m-4 flex items-center gap-3 rounded-lg border border-border bg-white/90 p-3 shadow-card dark:bg-surface">
            <Avatar profile={profile} size="md" token={token} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-unl-graphite dark:text-slate-50">
                {fullName}
              </p>
              <p className="truncate text-xs font-semibold text-muted">
                {profile?.institutionalEmail || profile?.username}
              </p>
            </div>
          </div>

          <div className="mx-4 mb-4 grid gap-2 rounded-lg border border-border bg-surface-soft p-3 shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-[850] leading-tight text-unl-graphite dark:text-slate-50">
                  Apariencia
                </p>
                <p className="mt-1 text-xs font-bold leading-tight text-muted">
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
                      "rounded-lg border border-border bg-white/80 p-1.5 shadow-[0_10px_24px_rgba(62,65,61,0.06)] dark:bg-surface",
                    isActive && hasChildren && "!border-[color:var(--nav-accent-border)]",
                  )}
                  key={item.id}
                  style={navAccentStyle(item.id, isDark)}
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
                    >
                      {childItems.map((child) => {
                        const childActive = activeRoute === child.id;

                        return (
                          <button
                            aria-current={childActive ? "page" : undefined}
                            className={cx(
                              navSubButtonBase,
                              "min-h-11 bg-white text-sm dark:bg-surface-soft",
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
