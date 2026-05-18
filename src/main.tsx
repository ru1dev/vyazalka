import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { installGlobalErrorHandlers, storeLastError } from './shared/utils/errorLog';
import './styles.css';

installGlobalErrorHandlers();

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element was not found.');

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  window.__VYAZALKA_APP_MOUNTED__ = true;
} catch (error) {
  storeLastError(error);
  document.body.innerHTML = `
    <main style="font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto;">
      <h1>Что-то пошло не так</h1>
      <p>Приложение не смогло загрузиться. Попробуйте обновить страницу или откройте диагностику.</p>
      <p><a href="/debug.html">Открыть диагностику</a></p>
    </main>
  `;
}
