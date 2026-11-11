import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline PWA support and automatic updates
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nueva versión de El Diario del Aula instalada y activa.');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.log('Fallo al registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

