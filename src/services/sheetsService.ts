import { Notice, PostCategory } from '../types';

/**
 * Parses CSV text, handling quotes, commas, and newlines properly
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes category string to valid PostCategory
 */
function normalizeCategory(raw: string): PostCategory {
  const lower = (raw || '').toLowerCase().trim();
  if (lower.includes('tarea') || lower.includes('deber')) return 'Tarea';
  if (lower.includes('clase') || lower.includes('actividad')) return 'Actividad';
  if (lower.includes('examen') || lower.includes('control') || lower.includes('prueba')) return 'Examen';
  if (lower.includes('urgente') || lower.includes('importante')) return 'Urgente';
  return 'Aviso';
}

/**
 * Fetches and parses notices from a published Google Sheets URL (CSV or JSON).
 * Expected CSV columns: fecha, categoria, titulo, mensaje, icono (optional)
 */
export async function fetchNoticesFromSheets(url: string): Promise<Notice[]> {
  if (!url || !url.trim()) {
    throw new Error('URL de Google Sheets no especificada');
  }

  // Ensure URL is a CSV or JSON endpoint
  let targetUrl = url.trim();

  // If user provided a standard Google Sheets edit URL, convert it to public CSV export URL if possible
  if (targetUrl.includes('docs.google.com/spreadsheets/d/') && !targetUrl.includes('output=csv') && !targetUrl.includes('pub?')) {
    const match = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/pub?output=csv`;
    }
  }

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/csv, application/json, text/plain, */*',
    },
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: no se pudo acceder a la hoja de cálculo`);
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  // If JSON format
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : data.items || data.values || [];
      return items.map((item: Record<string, unknown>, idx: number) => ({
        id: `sheets-${idx}-${Date.now()}`,
        title: String(item.titulo || item.title || 'Aviso escolar'),
        tag: normalizeCategory(String(item.categoria || item.category || 'Aviso')),
        date: String(item.fecha || item.date || 'Reciente'),
        content: String(item.mensaje || item.content || item.description || ''),
        author: String(item.autor || item.author || 'Tutor/a (Google Sheets)'),
        timestamp: Date.now() - idx * 60000,
        completed: false,
        important: String(item.categoria || '').toLowerCase().includes('urgente'),
        icon: item.icono ? String(item.icono) : undefined,
        source: 'sheets' as const,
      }));
    } catch {
      // Fallback to CSV parsing below
    }
  }

  // Parse as CSV
  const rows = parseCSV(text);
  if (rows.length < 2) {
    throw new Error('La hoja de cálculo está vacía o no tiene filas de datos');
  }

  // Header row detection
  const headers = rows[0].map((h) => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const colDate = headers.findIndex((h) => h.includes('fecha') || h.includes('date'));
  const colCat = headers.findIndex((h) => h.includes('categoria') || h.includes('tipo') || h.includes('tag'));
  const colTitle = headers.findIndex((h) => h.includes('titulo') || h.includes('title') || h.includes('asunto'));
  const colMsg = headers.findIndex((h) => h.includes('mensaje') || h.includes('texto') || h.includes('contenido') || h.includes('desc'));
  const colIcon = headers.findIndex((h) => h.includes('icono') || h.includes('icon'));

  const notices: Notice[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawTitle = colTitle !== -1 ? row[colTitle] : row[2] || row[0];
    const rawMsg = colMsg !== -1 ? row[colMsg] : row[3] || row[1];
    const rawCat = colCat !== -1 ? row[colCat] : row[1] || 'Aviso';
    const rawDate = colDate !== -1 ? row[colDate] : row[0] || 'Hoy';
    const rawIcon = colIcon !== -1 ? row[colIcon] : undefined;

    if (!rawTitle && !rawMsg) continue;

    const category = normalizeCategory(rawCat);

    notices.push({
      id: `sheets-${i}-${Date.now()}`,
      title: rawTitle || 'Aviso de aula',
      tag: category,
      date: rawDate || 'Hoy',
      timestamp: Date.now() - i * 1000,
      content: rawMsg || '',
      author: 'Docente (Google Sheets)',
      completed: false,
      important: category === 'Urgente',
      icon: rawIcon,
      source: 'sheets',
    });
  }

  if (notices.length === 0) {
    throw new Error('No se encontraron avisos válidos en la hoja de cálculo');
  }

  return notices;
}
