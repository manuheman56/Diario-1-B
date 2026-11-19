import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeRawText,
  parseInlineSegments,
  parseReadableBlocks,
  toReadablePreviewText,
} from '../src/utils/textFormatUtils';

let passed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    throw err;
  }
}

runTest('1. Normaliza saltos de línea reales (CRLF/LF) y literales escapados (\\n)', () => {
  const input = 'Primer párrafo.\\r\\nSegundo párrafo.\\nTercer párrafo.';
  const normalized = normalizeRawText(input);
  assert.equal(normalized, 'Primer párrafo.\nSegundo párrafo.\nTercer párrafo.');

  const blocks = parseReadableBlocks(input);
  assert.equal(blocks.length, 3);
  assert.deepEqual(
    blocks.map((b) => (b.type === 'paragraph' ? b.text : '')),
    ['Primer párrafo.', 'Segundo párrafo.', 'Tercer párrafo.']
  );
});

runTest('2. Aviso completo con párrafos, subtítulo, viñetas y negrita', () => {
  const aviso = [
    'Estimadas familias de 1.º B:',
    '',
    'El próximo **viernes 15 de mayo** realizaremos la excursión al jardín botánico.',
    '',
    'Material necesario:',
    '- Mochila pequeña con desayuno saludable',
    '- Botella de agua reutilizable',
    '• Gorra y calzado cómodo',
    '',
    'Rogamos puntualidad a las **09:00 h** en la puerta principal.',
  ].join('\n');

  const blocks = parseReadableBlocks(aviso);
  assert.equal(blocks.length, 5);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[1].type, 'paragraph');
  assert.equal(blocks[2].type, 'heading');
  if (blocks[2].type === 'heading') {
    assert.equal(blocks[2].text, 'Material necesario:');
  }
  assert.equal(blocks[3].type, 'bullet-list');
  if (blocks[3].type === 'bullet-list') {
    assert.deepEqual(blocks[3].items, [
      'Mochila pequeña con desayuno saludable',
      'Botella de agua reutilizable',
      'Gorra y calzado cómodo',
    ]);
  }
  assert.equal(blocks[4].type, 'paragraph');
});

runTest('3. Soporta listas numeradas sin confundir abreviaturas como 1.º B', () => {
  const text = [
    '1.º B participa esta semana en la lectura compartida.',
    'Pasos para participar:',
    '1. Elegir un cuento breve en casa.',
    '2) Practicar la lectura en voz alta.',
    '3. Traer el libro el miércoles.',
  ].join('\n');

  const blocks = parseReadableBlocks(text);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[1].type, 'heading');
  assert.equal(blocks[2].type, 'numbered-list');
  if (blocks[2].type === 'numbered-list') {
    assert.deepEqual(blocks[2].items, [
      { marker: '1.', text: 'Elegir un cuento breve en casa.' },
      { marker: '2.', text: 'Practicar la lectura en voz alta.' },
      { marker: '3.', text: 'Traer el libro el miércoles.' },
    ]);
  }
});

runTest('4. Desdobla viñetas Unicode en línea sin cortar frases por puntos', () => {
  const inlineBullets =
    'Recomendaciones: • Leer 10 min. al día • Repasar el C.E.I.P. Dr. Fleming • Revisar la agenda';
  const blocks = parseReadableBlocks(inlineBullets);

  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0], { type: 'heading', text: 'Recomendaciones:' });
  assert.deepEqual(blocks[1], {
    type: 'bullet-list',
    items: [
      'Leer 10 min. al día',
      'Repasar el C.E.I.P. Dr. Fleming',
      'Revisar la agenda',
    ],
  });
});

runTest('5. Compatibilidad total con textos antiguos de un solo párrafo', () => {
  const legacy =
    'Hoy en 1.º B hemos trabajado las sumas llevando y la lectura comprensiva en equipo. El alumnado ha participado con mucho entusiasmo.';
  const blocks = parseReadableBlocks(legacy);
  assert.equal(blocks.length, 1);
  assert.deepEqual(blocks[0], { type: 'paragraph', text: legacy });
});

runTest('6. Parsea formato en línea seguro (**negrita**, *cursiva*) sin romper asteriscos sueltos', () => {
  const segments = parseInlineSegments(
    'Traer **autorización firmada** y *ropa deportiva*. Nota: 2 * 3 = 6.'
  );
  assert.deepEqual(segments, [
    { type: 'text', value: 'Traer ' },
    { type: 'bold', value: 'autorización firmada' },
    { type: 'text', value: ' y ' },
    { type: 'italic', value: 'ropa deportiva' },
    { type: 'text', value: '. Nota: 2 * 3 = 6.' },
  ]);
});

runTest('7. Reconoce encabezados Markdown y subtítulos en negrita independiente', () => {
  const text = [
    '## Horario especial',
    'La entrada será a las 09:00.',
    '**Importante**',
    'No olvidar la botella de agua.',
  ].join('\n');

  const blocks = parseReadableBlocks(text);
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks[0], { type: 'heading', text: 'Horario especial' });
  assert.deepEqual(blocks[2], { type: 'heading', text: 'Importante' });
});

runTest('8. toReadablePreviewText limpia sintaxis Markdown y saltos escapados para Inicio y Calendario', () => {
  const raw = '## Excursión\\nTraer **desayuno** y agua.\\n- Gorra\\n- Calzado cómodo';
  const preview = toReadablePreviewText(raw);
  assert.equal(preview.includes('**'), false);
  assert.equal(preview.includes('##'), false);
  assert.equal(preview.includes('\\n'), false);
  assert.equal(preview, 'Excursión Traer desayuno y agua. Gorra · Calzado cómodo');
});

runTest('9. Verificación estática de seguridad e integración en los componentes permitidos', () => {
  const root = process.cwd();
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

  const formattedTextCode = read('src/components/FormattedText.tsx');
  assert.equal(formattedTextCode.includes('dangerouslySetInnerHTML'), false);

  const avisosCode = read('src/components/AvisosTab.tsx');
  assert.equal(avisosCode.includes('<FormattedText'), true);
  assert.equal(avisosCode.includes('dangerouslySetInnerHTML'), false);

  const diarioCode = read('src/components/DiarioTab.tsx');
  assert.equal(diarioCode.includes('<FormattedText'), true);
  assert.equal(diarioCode.includes("target.closest('main')"), true);

  const recursosCode = read('src/components/RecursosTab.tsx');
  assert.equal(recursosCode.includes('<FormattedText'), true);

  const calendarioCode = read('src/components/HorarioCalendarioTab.tsx');
  assert.equal(calendarioCode.includes('<FormattedText'), true);
  assert.equal(calendarioCode.includes('toReadablePreviewText'), true);

  const multimediaCode = read('src/components/MultimediaTab.tsx');
  assert.equal(multimediaCode.includes('https://www.youtube.com/@Hormiguitasde1oB'), true);
  assert.equal(
    multimediaCode.includes('1WZvH8J46ub2uFwT34S2pE2XLWbHzUlNl'),
    true
  );
  assert.equal(
    multimediaCode.includes('1goiI0L52EvoTcYfyu_MYAUlAdTMDcbLy'),
    true
  );
  assert.equal(
    multimediaCode.includes('1rO4wE-kdI4m1PiJQw51x3X-MU0kiJZ0a'),
    true
  );

  const inicioCode = read('src/components/InicioTab.tsx');
  assert.equal(inicioCode.includes('toReadablePreviewText'), true);
  assert.equal(inicioCode.includes('/portada-aula-1b.png'), true);
});

console.log(`\n🎉 Todas las pruebas de legibilidad superadas: ${passed}/${passed}`);
