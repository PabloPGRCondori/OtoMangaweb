// ageRestriction.js
// Utilidad para manejar la restricción de edad en localStorage

export function getAgeRestriction() {
  if (typeof window === 'undefined') return true; // Por defecto activado
  const value = localStorage.getItem('otomanga_age_restriction');
  return value === null ? true : value === 'true';
}

export function setAgeRestriction(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('otomanga_age_restriction', enabled ? 'true' : 'false');
}
