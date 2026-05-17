export type AppRoute =
  | { name: 'list' }
  | { name: 'edit'; projectId?: string }
  | { name: 'calculator' }
  | { name: 'debug' };
