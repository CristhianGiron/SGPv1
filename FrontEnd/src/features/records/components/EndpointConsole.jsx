/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EndpointConsole.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente EndpointConsole de la interfaz del SGP.
 */

import { Alert } from "../../../components/ui/Alert";
import { EndpointModule } from "./console/EndpointModule";
import { ModuleTab, ModuleTabs } from "../../../components/ui/ModuleTabs";
import { SectionCard } from "../../../components/ui/SectionCard";
import { useAuth } from "../../auth/context/AuthContext";
import { useEffect, useMemo, useState } from "react";

export function EndpointConsole({
  modules,
  activeModuleId,
  showModuleSwitcher = true,
  enableListFilters = false,
}) {
  const { token, roles } = useAuth();
  const availableModules = useMemo(
    () =>
      modules.filter(
        (module) =>
          !module.roles || module.roles.some((role) => roles.includes(role)),
      ),
    [modules, roles],
  );
  const moduleIsControlled = activeModuleId !== undefined;
  const requestedModuleId = availableModules.some(
    (module) => module.id === activeModuleId,
  )
    ? activeModuleId
    : "";
  const [moduleId, setModuleId] = useState(availableModules[0]?.id || "");
  const currentModule =
    availableModules.find((module) => module.id === moduleId) ||
    availableModules[0];

  useEffect(() => {
    if (moduleIsControlled) {
      const nextModuleId = requestedModuleId || availableModules[0]?.id || "";

      if (moduleId !== nextModuleId) {
        setModuleId(nextModuleId);
      }

      return;
    }

    if (!availableModules.some((module) => module.id === moduleId)) {
      setModuleId(availableModules[0]?.id || "");
    }
  }, [availableModules, moduleId, moduleIsControlled, requestedModuleId]);

  if (!currentModule) {
    return (
      <Alert tone="warning">No hay secciones disponibles para tu perfil.</Alert>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-5">
      {showModuleSwitcher && availableModules.length > 1 && (
        <SectionCard
          description="Elige la seccion que necesitas revisar o completar."
          title="Seccion activa"
        >
          <ModuleTabs>
            {availableModules.map((module) => (
              <ModuleTab
                active={currentModule.id === module.id}
                key={module.id}
                onClick={() => setModuleId(module.id)}
              >
                {module.title}
              </ModuleTab>
            ))}
          </ModuleTabs>
        </SectionCard>
      )}

      <EndpointModule
        enableListFilters={enableListFilters}
        key={currentModule.id}
        module={currentModule}
        roles={roles}
        token={token}
      />
    </div>
  );
}

