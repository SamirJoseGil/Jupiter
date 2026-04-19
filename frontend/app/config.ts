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

export type InternalChannel = 'web' | 'email' | 'chat' | 'phone' | 'social';
export type OfficialChannel = 'official-web' | 'official-whatsapp' | 'official-ai' | 'official-email' | 'official-phone';
export type FormChannel = InternalChannel | OfficialChannel;

export const OFFICIAL_CHANNEL_CONFIG: Record<OfficialChannel, {
  label: string;
  description: string;
  redirectUrl: string;
  ingestChannel: InternalChannel;
  actionLabel: string;
}> = {
  'official-whatsapp': {
    label: 'WhatsApp Alcaldía de Medellín',
    description: 'Canal conversacional oficial para atención rápida.',
    redirectUrl: import.meta.env.VITE_MEDELLIN_WHATSAPP_URL || 'https://www.medellin.gov.co/es/contactenos/',
    ingestChannel: 'social',
    actionLabel: 'Abrir WhatsApp oficial'
  },
  'official-web': {
    label: 'Jupiter',
    description: 'Radicación y seguimiento de solicitudes dentro del sistema institucional.',
    redirectUrl: import.meta.env.VITE_MEDELLIN_WEB_URL || 'https://www.medellin.gov.co/es/contactenos/',
    ingestChannel: 'web',
    actionLabel: 'Abrir Jupiter'
  },
  'official-ai': {
    label: 'Asistente Virtual IA',
    description: 'Asistencia guiada en línea para orientación ciudadana.',
    redirectUrl: import.meta.env.VITE_MEDELLIN_AI_URL || 'https://www.medellin.gov.co/es/contactenos/',
    ingestChannel: 'chat',
    actionLabel: 'Abrir asistente virtual'
  },
  'official-email': {
    label: 'Correo oficial',
    description: 'Comunicación por correo para casos con adjuntos.',
    redirectUrl: import.meta.env.VITE_MEDELLIN_EMAIL_URL || 'mailto:contacto@medellin.gov.co',
    ingestChannel: 'email',
    actionLabel: 'Abrir correo oficial'
  },
  'official-phone': {
    label: 'Línea Telefónica Oficial',
    description: 'Atención por llamada con orientación de un agente.',
    redirectUrl: import.meta.env.VITE_MEDELLIN_PHONE_URL || 'tel:+576044444144',
    ingestChannel: 'phone',
    actionLabel: 'Llamar ahora'
  }
};

export const FORM_CHANNELS: Array<{ value: FormChannel; label: string; type: 'internal' | 'official' }> = [
  { value: 'official-web', label: 'Jupiter', type: 'official' },
  { value: 'official-whatsapp', label: 'WhatsApp Alcaldía de Medellín', type: 'official' },
  { value: 'official-ai', label: 'Asistente Virtual IA', type: 'official' },
  { value: 'official-email', label: 'Correo oficial Alcaldía', type: 'official' },
  { value: 'official-phone', label: 'Línea Telefónica Oficial', type: 'official' }
];
