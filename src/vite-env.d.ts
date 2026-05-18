/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

interface Window {
  __VYAZALKA_APP_MOUNTED__?: boolean;
  __VYAZALKA_STARTUP_ERRORS__?: Array<Record<string, unknown>>;
}
