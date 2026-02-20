
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- KILL SWITCH: Removendo Service Workers legados que causam Tela Branca ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('SW Desregistrado para correção de cache');
    }
  });
}

// Limpar caches de SW programaticamente
if ('caches' in window) {
  caches.keys().then(names => {
    for (const name of names) caches.delete(name);
  });
}
