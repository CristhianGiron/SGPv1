export function filterInactiveForNonAdmin(rows, roles) {
  if (roles?.includes('ROLE_ADMIN')) {
    return rows || [];
  }

  return (rows || []).filter(isVisibleActiveRecord);
}

function isVisibleActiveRecord(row) {
  if (!row || typeof row !== 'object') {
    return true;
  }

  if (row.status === 'COMPLETED') {
    return true;
  }

  if (row.active === false || row.enabled === false || row.courseActive === false) {
    return false;
  }

  return true;
}
