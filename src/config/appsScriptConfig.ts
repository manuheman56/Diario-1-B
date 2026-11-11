/**
 * ============================================================================
 * CONFIGURACIÓN DE CONEXIÓN CON GOOGLE APPS SCRIPT
 * ============================================================================
 * Introduce aquí la URL generada al publicar tu proyecto en Google Apps Script
 * como Aplicación Web ("Web App").
 *
 * Puedes definirla aquí directamente o a través de la variable de entorno:
 * VITE_APPS_SCRIPT_URL en Netlify / .env
 * ============================================================================
 */

function getEnvAppsScriptUrl(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APPS_SCRIPT_URL) {
      return String(import.meta.env.VITE_APPS_SCRIPT_URL);
    }
  } catch {
    // Entornos sin import.meta
  }

  if (typeof process !== 'undefined' && process.env && process.env.VITE_APPS_SCRIPT_URL) {
    return String(process.env.VITE_APPS_SCRIPT_URL);
  }

  return '';
}

export const APPS_SCRIPT_WEBAPP_URL: string = getEnvAppsScriptUrl();

// Identificador oficial de la hoja de cálculo
export const SPREADSHEET_ID: string = '1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1';

/**
 * Comprueba si la URL del Web App está configurada
 */
export function isAppsScriptConfigured(): boolean {
  return Boolean(
    APPS_SCRIPT_WEBAPP_URL &&
    APPS_SCRIPT_WEBAPP_URL.trim() !== '' &&
    APPS_SCRIPT_WEBAPP_URL.includes('script.google.com')
  );
}
