export const API_BASE_URL = (() => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
})();

export const AUTH_STORAGE_KEY = 'jupiter_auth_token';
export const USER_STORAGE_KEY = 'jupiter_user';

export const DEPARTMENTS = [
  'Infraestructura',
  'Movilidad',
  'Salud',
  'Educación',
  'Servicios Públicos',
  'Seguridad',
  'Ambiente',
  'Desarrollo',
  'Cultura',
  'Otros'
];

export const CHANNELS = [
  { value: 'web', label: 'Formulario Web' },
  { value: 'email', label: 'Correo' },
  { value: 'chat', label: 'Chat' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'social', label: 'Redes Sociales' }
];
