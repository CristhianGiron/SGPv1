/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EvidencePicker.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente EvidencePicker de la interfaz del SGP.
 */

import { ActionBar, SecondaryButton } from "../../../../components/ui/ActionBar";
import { Field } from "../../../../components/ui/FormControls";
import { Image } from "lucide-react";
import { Modal } from "../../../../components/ui/Modal";
import { apiBlob, getApiBaseUrl } from "../../../../api/client";
import { cx } from "./DocumentReview";
import { useEffect, useState } from "react";

export function EvidenceLinkPicker({
  loading = false,
  photos = [],
  readOnly = false,
  token,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const selectedPhoto = photos.find(
    (photo) => publicEvidenceUrl(photo.publicContentUrl) === value || photo.contentUrl === value,
  );
  const directLink = value ? evidenceDisplayLink(value) : "";

  return (
    <Field label="Evidencia">
      <div className="space-y-2">
        <div className="min-h-[2.75rem] rounded-lg border border-line bg-panel-soft px-3 py-2 text-sm dark:border-line dark:bg-surface-soft">
          <p className="font-semibold text-heading dark:text-heading">
            {selectedPhoto
              ? selectedPhoto.description ||
                selectedPhoto.originalFilename ||
                "Evidencia seleccionada"
              : value
                ? "Evidencia seleccionada"
                : "Sin evidencia seleccionada"}
          </p>
          {value && (
            <div className="mt-1 space-y-1">
              {directLink ? (
                <a
                  className="break-all text-xs font-semibold text-primary hover:underline dark:text-accent-strong"
                  href={directLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  {directLink}
                </a>
              ) : (
                <p className="break-all text-xs text-body">{value}</p>
              )}
            </div>
          )}
        </div>
        {!readOnly && (
          <ActionBar>
            <SecondaryButton
              icon={Image}
              loading={loading}
              onClick={() => setOpen(true)}
              type="button"
            >
              Elegir evidencia
            </SecondaryButton>
            {value && (
              <SecondaryButton onClick={() => onChange("")} type="button">
                Quitar
              </SecondaryButton>
            )}
          </ActionBar>
        )}
      </div>

      <Modal
        description="Selecciona una imagen cargada en Evidencias. En el registro se guardará solo el enlace de la imagen."
        maxWidth="max-w-5xl"
        onClose={() => setOpen(false)}
        open={open}
        title="Seleccionar evidencia"
      >
        {loading ? (
          <p className="text-sm text-body">Cargando evidencias...</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-body">
            No hay evidencias fotograficas disponibles para esta inscripción.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <button
                className={cx(
                  "overflow-hidden rounded-lg border bg-panel text-left shadow-card transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 dark:bg-surface",
                  publicEvidenceUrl(photo.publicContentUrl) === value || photo.contentUrl === value
                    ? "border-accent ring-2 ring-accent/25"
                    : "border-line dark:border-line",
                )}
                key={photo.id || photo.contentUrl}
                onClick={() => {
                  onChange(publicEvidenceUrl(photo.publicContentUrl || photo.contentUrl || ""));
                  setOpen(false);
                }}
                type="button"
              >
                <EvidencePhotoPreview photo={photo} token={token} />
                <div className="space-y-1 p-3">
                  <p className="text-sm font-semibold text-heading dark:text-heading">
                    {photo.description || photo.originalFilename || "Evidencia"}
                  </p>
                  <p className="text-xs text-body">
                    {[photo.practiceDate, photo.courseName]
                      .filter(Boolean)
                      .join(" | ") || "Sin detalles"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </Field>
  );
}

function evidenceDisplayLink(url) {
  if (!url) {
    return "";
  }

  if (isPublicEvidenceUrl(url)) {
    return publicEvidenceUrl(url);
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${window.location.origin}${window.location.pathname}#/evidence-viewer?src=${encodeURIComponent(url)}`;
}

function isPublicEvidenceUrl(url) {
  return String(url || "").includes("/api/public/practice-photos/");
}

function publicEvidenceUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBase = getApiBaseUrl();

  if (/^https?:\/\//i.test(apiBase)) {
    return `${apiBase}${normalizedPath}`;
  }

  const { protocol, hostname, port, origin } = window.location;

  if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "3000") {
    return `${protocol}//${hostname}:8080${normalizedPath}`;
  }

  return `${origin}${normalizedPath}`;
}

function EvidencePhotoPreview({ photo, token }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    setSource("");
    setFailed(false);

    if (!photo.contentUrl) {
      setFailed(true);
      return undefined;
    }

    apiBlob(photo.contentUrl, token)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setSource(objectUrl);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo.contentUrl, token]);

  if (!source || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-panel-soft text-sm font-semibold text-body dark:bg-surface-soft">
        {failed ? "Vista no disponible" : "Cargando imagen"}
      </div>
    );
  }

  return (
    <img
      alt={photo.description || photo.originalFilename || "Evidencia de práctica"}
      className="aspect-[4/3] w-full object-cover"
      src={source}
    />
  );
}

