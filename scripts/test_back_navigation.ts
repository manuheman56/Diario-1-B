import assert from 'node:assert/strict';
import {
  createBackNavigationController,
  resolveMainTab,
  WindowNavigationAdapter,
  BackNavSnapshot,
} from '../src/hooks/useBackNavigation';

interface MockEntry {
  state: unknown;
  url: string;
}

function createMockBrowser(externalEntriesBeforeApp = 1) {
  const entries: MockEntry[] = [];
  for (let i = 0; i < externalEntriesBeforeApp; i++) {
    entries.push({ state: { external: true, idx: i }, url: `https://launcher.local/${i}` });
  }
  const appStartIndex = entries.length;
  entries.push({ state: null, url: 'https://diario.local/' });
  let cursor = appStartIndex;
  let exitedApp = false;
  let closeCalled = false;
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  const dispatch = (type: string, eventObj: Event) => {
    const set = listeners.get(type);
    if (!set) return;
    for (const listener of [...set]) {
      if (typeof listener === 'function') {
        listener(eventObj);
      } else {
        listener.handleEvent(eventObj);
      }
    }
  };

  const history = {
    get state() {
      return cursor >= 0 && cursor < entries.length ? entries[cursor].state : null;
    },
    get length() {
      return entries.length;
    },
    replaceState(data: unknown, _unused: string, url?: string | URL | null) {
      entries[cursor] = {
        state: data,
        url: url ? String(url) : entries[cursor].url,
      };
    },
    pushState(data: unknown, _unused: string, url?: string | URL | null) {
      entries.splice(cursor + 1);
      entries.push({
        state: data,
        url: url ? String(url) : entries[cursor].url,
      });
      cursor = entries.length - 1;
    },
    go(delta = 0) {
      if (delta === 0) return;
      const target = cursor + delta;
      if (target < appStartIndex) {
        cursor = Math.max(0, target);
        exitedApp = true;
        return;
      }
      if (target >= entries.length) return;
      cursor = target;
      const popEvent = { type: 'popstate', state: entries[cursor].state } as unknown as PopStateEvent;
      dispatch('popstate', popEvent);
    },
    back() {
      this.go(-1);
    },
  };

  const adapter: WindowNavigationAdapter = {
    history,
    get href() {
      return entries[cursor]?.url ?? 'https://diario.local/';
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    isStandalone: () => externalEntriesBeforeApp === 0,
    tryCloseWindow: () => {
      closeCalled = true;
    },
  };

  return {
    adapter,
    history,
    getCursor: () => cursor,
    getAppStartIndex: () => appStartIndex,
    getEntries: () => entries.slice(appStartIndex),
    hasExitedApp: () => exitedApp,
    wasCloseCalled: () => closeCalled,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    simulateHardwareBack() {
      history.back();
    },
  };
}

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`PASS: ${name}`);
    });
}

async function runAllTests() {
  await test('1. resolveMainTab mapea correctamente sub-pestañas hacia las 8 secciones', () => {
    assert.equal(resolveMainTab('inicio'), 'inicio');
    assert.equal(resolveMainTab('horario', 'calendario'), 'calendario');
    assert.equal(resolveMainTab('horario', 'horario'), 'horario');
    assert.equal(resolveMainTab('recursos', 'aprendemos'), 'aprendemos');
    assert.equal(resolveMainTab('recursos', 'fotos'), 'multimedia');
    assert.equal(resolveMainTab('recursos', 'multimedia'), 'multimedia');
    assert.equal(resolveMainTab('avisos'), 'avisos');
  });

  await test('2. Montaje inicial prepara centinela y entrada app sin duplicados en remount', () => {
    const browser = createMockBrowser(1);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });

    ctrl.mount();
    assert.equal(snap.activeTab, 'inicio');
    assert.equal(snap.isExitModalOpen, false);
    assert.equal(browser.getEntries().length, 2);
    assert.equal(browser.listenerCount('popstate'), 1);

    // Simular remount (p. ej. recarga o StrictMode) sobre historial ya inicializado
    ctrl.unmount();
    assert.equal(browser.listenerCount('popstate'), 0);

    const ctrl2 = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl2.mount();
    assert.equal(browser.getEntries().length, 2);
    assert.equal(snap.activeTab, 'inicio');
    ctrl2.unmount();
  });

  await test('3. Pulsaciones repetidas en la misma pestaña no duplican entradas en history', () => {
    const browser = createMockBrowser(1);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl.mount();

    assert.equal(ctrl.navigateToTab('inicio'), false);
    assert.equal(browser.getEntries().length, 2);

    assert.equal(ctrl.navigateToTab('diario'), true);
    assert.equal(snap.activeTab, 'diario');
    assert.equal(browser.getEntries().length, 3);

    assert.equal(ctrl.navigateToTab('diario'), false);
    assert.equal(ctrl.navigateToTab('diario'), false);
    assert.equal(browser.getEntries().length, 3);

    ctrl.unmount();
  });

  await test('4. Botón Atrás regresa paso a paso por las secciones visitadas antes de llegar a Inicio', () => {
    const browser = createMockBrowser(1);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl.mount();

    ctrl.navigateToTab('diario');
    ctrl.navigateToTab('avisos');
    ctrl.navigateToTab('aprendemos');
    ctrl.navigateToTab('calendario');
    assert.equal(snap.activeTab, 'calendario');

    browser.simulateHardwareBack();
    assert.equal(snap.activeTab, 'aprendemos');
    assert.equal(snap.isExitModalOpen, false);

    browser.simulateHardwareBack();
    assert.equal(snap.activeTab, 'avisos');
    assert.equal(snap.isExitModalOpen, false);

    browser.simulateHardwareBack();
    assert.equal(snap.activeTab, 'diario');
    assert.equal(snap.isExitModalOpen, false);

    browser.simulateHardwareBack();
    assert.equal(snap.activeTab, 'inicio');
    assert.equal(snap.isExitModalOpen, false);
    assert.equal(browser.hasExitedApp(), false);

    // Ahora sí, estando en Inicio, Atrás muestra confirmación sin salir
    browser.simulateHardwareBack();
    assert.equal(snap.activeTab, 'inicio');
    assert.equal(snap.isExitModalOpen, true);
    assert.equal(browser.hasExitedApp(), false);

    ctrl.unmount();
  });

  await test('5. Seguir en la aplicación mantiene Inicio y re-arma la protección para futuros Atrás', () => {
    const browser = createMockBrowser(1);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl.mount();

    browser.simulateHardwareBack();
    assert.equal(snap.isExitModalOpen, true);
    assert.equal(browser.hasExitedApp(), false);

    ctrl.stayInApp();
    assert.equal(snap.isExitModalOpen, false);
    assert.equal(snap.activeTab, 'inicio');
    assert.equal(browser.hasExitedApp(), false);

    // Pulsar Atrás de nuevo vuelve a mostrar confirmación (sin bucle infinito)
    browser.simulateHardwareBack();
    assert.equal(snap.isExitModalOpen, true);
    assert.equal(snap.activeTab, 'inicio');

    ctrl.unmount();
  });

  await test('6. Salir permite abandonar la aplicación limpiamente tanto recién abierta como tras visitar pestañas', () => {
    // Caso A: recién abierta en Inicio
    const browserA = createMockBrowser(1);
    let snapA!: BackNavSnapshot;
    const ctrlA = createBackNavigationController(browserA.adapter, (s) => {
      snapA = s;
    });
    ctrlA.mount();
    browserA.simulateHardwareBack();
    assert.equal(snapA.isExitModalOpen, true);

    ctrlA.confirmExit();
    assert.equal(snapA.isExitModalOpen, false);
    assert.equal(browserA.hasExitedApp(), true);
    ctrlA.unmount();

    // Caso B: Inicio -> Diario -> Avisos -> Inicio (clic en BottomNav) -> Atrás -> Salir
    const browserB = createMockBrowser(1);
    let snapB!: BackNavSnapshot;
    const ctrlB = createBackNavigationController(browserB.adapter, (s) => {
      snapB = s;
    });
    ctrlB.mount();
    ctrlB.navigateToTab('diario');
    ctrlB.navigateToTab('avisos');
    ctrlB.navigateToTab('inicio');
    assert.equal(snapB.activeTab, 'inicio');

    browserB.simulateHardwareBack();
    assert.equal(snapB.isExitModalOpen, true);
    assert.equal(browserB.hasExitedApp(), false);

    ctrlB.confirmExit();
    assert.equal(snapB.isExitModalOpen, false);
    assert.equal(browserB.hasExitedApp(), true);
    ctrlB.unmount();
  });

  await test('7. En PWA standalone sin historial previo, Salir intenta cerrar ventana limpiamente', async () => {
    const browser = createMockBrowser(0);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl.mount();

    browser.simulateHardwareBack();
    assert.equal(snap.isExitModalOpen, true);

    ctrl.confirmExit();
    await new Promise((resolve) => setTimeout(resolve, 160));
    assert.equal(browser.wasCloseCalled(), true);
    ctrl.unmount();
  });

  await test('8. InstallModal se cierra con Atrás o con botón X sin disparar ExitConfirmModal en Inicio', () => {
    const browser = createMockBrowser(1);
    let snap!: BackNavSnapshot;
    const ctrl = createBackNavigationController(browser.adapter, (s) => {
      snap = s;
    });
    ctrl.mount();

    // Abrir modal y cerrar con botón Atrás
    ctrl.openInstallModal();
    assert.equal(snap.isInstallOpen, true);
    browser.simulateHardwareBack();
    assert.equal(snap.isInstallOpen, false);
    assert.equal(snap.isExitModalOpen, false);
    assert.equal(snap.activeTab, 'inicio');

    // Abrir modal y cerrar con botón X (closeInstallModal)
    ctrl.openInstallModal();
    assert.equal(snap.isInstallOpen, true);
    ctrl.closeInstallModal();
    assert.equal(snap.isInstallOpen, false);
    assert.equal(snap.isExitModalOpen, false);
    assert.equal(snap.activeTab, 'inicio');

    // Tras cerrarlo, pulsar Atrás en Inicio sí muestra confirmación de salida
    browser.simulateHardwareBack();
    assert.equal(snap.isExitModalOpen, true);

    ctrl.unmount();
  });

  await test('9. Doble pulsación Atrás mientras el diálogo de salida está abierto sale sin atrapar al usuario', () => {
    // Caso A: en raíz Inicio (depth 1 -> Back a centinela depth 0 -> Back sale directo del navegador/PWA)
    const browserA = createMockBrowser(1);
    let snapA!: BackNavSnapshot;
    const ctrlA = createBackNavigationController(browserA.adapter, (s) => {
      snapA = s;
    });
    ctrlA.mount();

    browserA.simulateHardwareBack();
    assert.equal(snapA.isExitModalOpen, true);

    browserA.simulateHardwareBack();
    assert.equal(browserA.hasExitedApp(), true);
    ctrlA.unmount();

    // Caso B: tras volver a Inicio desde otra pestaña (depth 3 -> Back a depth 2 -> Back dispara confirmExit)
    const browserB = createMockBrowser(1);
    let snapB!: BackNavSnapshot;
    const ctrlB = createBackNavigationController(browserB.adapter, (s) => {
      snapB = s;
    });
    ctrlB.mount();
    ctrlB.navigateToTab('diario');
    ctrlB.navigateToTab('inicio');

    browserB.simulateHardwareBack();
    assert.equal(snapB.isExitModalOpen, true);

    browserB.simulateHardwareBack();
    assert.equal(snapB.isExitModalOpen, false);
    assert.equal(browserB.hasExitedApp(), true);
    ctrlB.unmount();
  });

  console.log(`\nALL BACK NAVIGATION TESTS PASSED (${passed}/9).`);
}

runAllTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
