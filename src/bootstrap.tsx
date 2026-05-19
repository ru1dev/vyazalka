import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { installGlobalErrorHandlers, storeLastError } from './shared/utils/errorLog';
import { storeStartupFailure } from './startupFailure';

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
  storeStartupFailure(error);
}
