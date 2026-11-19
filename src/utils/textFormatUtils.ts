export type InlineSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string };

export type FormattedBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: Array<{ marker: string; text: string }> };

const UNICODE_BULLET_CHARS = '•▪◦●‣';
const INLINE_BULLET_REGEX = /[•▪◦●‣]/;
const LEADING_UNICODE_BULLET_REGEX = /^[•▪◦●‣]\s*(.+)$/;
const LEADING_MARKDOWN_BULLET_REGEX = /^(?:[-–—]|\*(?!\*))\s+(.+)$/;
const LEADING_NUMBERED_REGEX = /^(\d{1,2})[.)]\s+(.+)$/;
const MARKDOWN_HEADING_REGEX = /^#{1,4}\s+(.+)$/;
const STANDALONE_BOLD_REGEX = /^(?:\*\*([^*\n]+)\*\*|__([^_\n]+)__)$/;

/**
 * Normaliza saltos de línea reales, literales escapados (\n) y caracteres invisibles
 * sin alterar el contenido real del texto.
 */
export function normalizeRawText(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    .replace(/\uFEFF|\u200B|\u200C|\u200D/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

/**
 * Desdobla líneas que contienen varios elementos separados por viñetas Unicode (•, ▪, ◦, ●, ‣)
 * en líneas independientes sin romper frases normales ni usar puntos como separador.
 */
function expandInlineBulletLines(lines: string[]): string[] {
  const expanded: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      expanded.push('');
      continue;
    }

    if (!INLINE_BULLET_REGEX.test(trimmed)) {
      expanded.push(trimmed);
      continue;
    }

    const parts = trimmed
      .split(new RegExp(`[${UNICODE_BULLET_CHARS}]`))
      .map((part) => part.trim());

    const startsWithBullet = new RegExp(`^[${UNICODE_BULLET_CHARS}]`).test(trimmed);

    if (!startsWithBullet && parts[0]) {
      expanded.push(parts[0]);
      for (let i = 1; i < parts.length; i++) {
        if (parts[i]) {
          expanded.push(`• ${parts[i]}`);
        }
      }
    } else {
      for (const part of parts) {
        if (part) {
          expanded.push(`• ${part}`);
        }
      }
    }
  }

  return expanded;
}

function stripOuterBoldMarkers(text: string): string {
  const match = text.match(STANDALONE_BOLD_REGEX);
  if (!match) return text;
  return (match[1] ?? match[2] ?? text).trim();
}

function isColonSectionHeading(line: string, hasFollowingContent: boolean): boolean {
  if (!hasFollowingContent) return false;
  const clean = stripOuterBoldMarkers(line).trim();
  if (!clean.endsWith(':')) return false;
  if (clean.length < 3 || clean.length > 75) return false;
  // Evitar clasificar frases largas con varias oraciones terminadas en dos puntos
  if (/[.!?]\s/.test(clean)) return false;
  return true;
}

function isStandaloneBoldHeading(line: string, hasFollowingContent: boolean): boolean {
  const match = line.match(STANDALONE_BOLD_REGEX);
  if (!match) return false;
  const inner = (match[1] ?? match[2] ?? '').trim();
  if (!inner || inner.length > 85) return false;
  if (!hasFollowingContent) return false;
  // Si termina en punto y es larga, tratar como párrafo destacado, no como subtítulo
  if (inner.endsWith('.') && inner.length > 50) return false;
  return true;
}

/**
 * Parsea un texto informativo en bloques semánticos (subtítulos, párrafos, listas con viñetas
 * y listas numeradas) respetando todos los saltos de línea y siendo 100 % compatible con
 * textos simples antiguos de un único párrafo.
 */
export function parseReadableBlocks(raw?: string | null): FormattedBlock[] {
  const normalized = normalizeRawText(raw);
  if (!normalized) return [];

  const rawLines = normalized.split('\n');
  const lines = expandInlineBulletLines(rawLines);
  const blocks: FormattedBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Línea en blanco: separa bloques contiguos (p. ej. dos listas distintas)
      continue;
    }

    const hasFollowingContent = lines.slice(i + 1).some((next) => next.trim().length > 0);
    const prevLineWasBlank = i > 0 && lines[i - 1].trim() === '';

    // 1. Subtítulo Markdown (#, ##, ###, ####)
    const mdHeadingMatch = line.match(MARKDOWN_HEADING_REGEX);
    if (mdHeadingMatch) {
      const headingText = stripOuterBoldMarkers(mdHeadingMatch[1].trim());
      if (headingText) {
        blocks.push({ type: 'heading', text: headingText });
      }
      continue;
    }

    // 2. Elemento de lista con viñeta
    const unicodeBulletMatch = line.match(LEADING_UNICODE_BULLET_REGEX);
    const mdBulletMatch = !unicodeBulletMatch ? line.match(LEADING_MARKDOWN_BULLET_REGEX) : null;
    if (unicodeBulletMatch || mdBulletMatch) {
      const itemText = (unicodeBulletMatch?.[1] ?? mdBulletMatch?.[1] ?? '').trim();
      if (itemText) {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'bullet-list' && !prevLineWasBlank) {
          lastBlock.items.push(itemText);
        } else {
          blocks.push({ type: 'bullet-list', items: [itemText] });
        }
      }
      continue;
    }

    // 3. Elemento de lista numerada (1. / 2))
    const numberedMatch = line.match(LEADING_NUMBERED_REGEX);
    if (numberedMatch) {
      const marker = `${numberedMatch[1]}.`;
      const itemText = numberedMatch[2].trim();
      if (itemText) {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'numbered-list' && !prevLineWasBlank) {
          lastBlock.items.push({ marker, text: itemText });
        } else {
          blocks.push({ type: 'numbered-list', items: [{ marker, text: itemText }] });
        }
      }
      continue;
    }

    // 4. Subtítulo independiente en negrita (**Recomendaciones**) o acabado en dos puntos (Recomendaciones:)
    if (
      isStandaloneBoldHeading(line, hasFollowingContent) ||
      isColonSectionHeading(line, hasFollowingContent)
    ) {
      blocks.push({ type: 'heading', text: stripOuterBoldMarkers(line) });
      continue;
    }

    // 5. Párrafo independiente
    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
}

/**
 * Parsea formato en línea seguro (**negrita**, __negrita__, *cursiva*) sin HTML ni inyección.
 */
export function parseInlineSegments(text: string): InlineSegment[] {
  if (!text) return [];

  const segments: InlineSegment[] = [];
  const pattern =
    /\*\*([^*\n]+?)\*\*|__([^_\n]+?)__|(?<!\*)\*([^\s*\n](?:[^*\n]*?[^\s*\n])?)\*(?!\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined || match[2] !== undefined) {
      segments.push({
        type: 'bold',
        value: match[1] ?? match[2],
      });
    } else if (match[3] !== undefined) {
      segments.push({
        type: 'italic',
        value: match[3],
      });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

/**
 * Limpia marcas Markdown y saltos de línea para vistas previas compactas (Inicio,
 * próximos eventos del Calendario) manteniendo una lectura natural de 1-2 líneas.
 */
export function toReadablePreviewText(raw?: string | null): string {
  const blocks = parseReadableBlocks(raw);
  if (blocks.length === 0) return '';

  const stripInlineSyntax = (value: string): string =>
    parseInlineSegments(value)
      .map((seg) => seg.value)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'paragraph') {
      const clean = stripInlineSyntax(block.text);
      if (clean) parts.push(clean);
    } else if (block.type === 'bullet-list') {
      const cleanItems = block.items.map(stripInlineSyntax).filter(Boolean);
      if (cleanItems.length > 0) {
        parts.push(cleanItems.join(' · '));
      }
    } else if (block.type === 'numbered-list') {
      const cleanItems = block.items
        .map((item) => `${item.marker} ${stripInlineSyntax(item.text)}`.trim())
        .filter(Boolean);
      if (cleanItems.length > 0) {
        parts.push(cleanItems.join(' · '));
      }
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
