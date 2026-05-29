export function getPortalRoot() {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.getElementById('portal-root') || document.body;
}
