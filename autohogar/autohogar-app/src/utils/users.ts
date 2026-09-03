export interface UserAccount {
  id: string;
  username: string;
  label: string;
  role: string;
}

export const USERS: UserAccount[] = [
  { id: 'recepcion', username: 'recepcion', label: 'Recepción', role: 'Operador' },
  { id: 'cobranzas1', username: 'cobranzas1', label: 'Cobranzas 1', role: 'Operador' },
  { id: 'cobranzas2', username: 'cobranzas2', label: 'Cobranzas 2', role: 'Operador' },
  { id: 'administrador1', username: 'administrador1', label: 'Administrador 1', role: 'Admin' },
  { id: 'administrador2', username: 'administrador2', label: 'Administrador 2', role: 'Admin' },
];

export const DEFAULT_USER = USERS[0];
