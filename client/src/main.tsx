import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// ── Service Worker kill-switch ──────────────────────────────────────────────
// The old allrated SW pinned the app shell forever. This force-unregisters
// any existing SW so users immediately see the latest deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    const hadSw = regs.length > 0;
    Promise.all(regs.map((r) => r.unregister())).then(() => {
      if (hadSw) {
        // Reload once to clear the old SW's control over the page
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
