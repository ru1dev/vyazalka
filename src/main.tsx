import { storeStartupFailure } from './startupFailure';
import './styles.css';

window.__VYAZALKA_MAIN_LOADED__ = true;

import('./bootstrap').catch((error: unknown) => {
  storeStartupFailure(error);
});
