/**
 * Spanish Accounts Translations
 * Financial accounts, connections, sync
 */
export const accounts = {
  // Main
  accounts: 'Cuentas',
  account: 'Cuenta',
  myAccounts: 'Mis cuentas',
  addAccount: 'Agregar cuenta',
  newAccount: 'Nueva cuenta',
  editAccount: 'Editar cuenta',
  deleteAccount: 'Eliminar cuenta',
  accountDetails: 'Detalles de cuenta',
  manualAccount: 'Cuenta manual',
  connectedAccount: 'Cuenta conectada',

  // Types
  checking: 'Cuenta corriente',
  savings: 'Cuenta de ahorro',
  credit: 'Tarjeta de crédito',
  investment: 'Inversión',
  loan: 'Préstamo',
  mortgage: 'Hipoteca',
  crypto: 'Criptomonedas',
  cash: 'Efectivo',
  other: 'Otro',

  // Providers
  provider: 'Proveedor',
  manual: 'Manual',
  belvo: 'Belvo',
  plaid: 'Plaid',
  bitso: 'Bitso',
  connected: 'Conectado',
  disconnected: 'Desconectado',

  // Fields
  accountName: 'Nombre de cuenta',
  accountType: 'Tipo de cuenta',
  accountNumber: 'Número de cuenta',
  lastFourDigits: 'Últimos 4 dígitos',
  routingNumber: 'Número de routing',
  institution: 'Institución',
  balance: 'Saldo',
  availableBalance: 'Saldo disponible',
  currentBalance: 'Saldo actual',
  creditLimit: 'Límite de crédito',
  currency: 'Moneda',
  lastSynced: 'Última sincronización',
  status: 'Estado',

  // Status
  active: 'Activa',
  inactive: 'Inactiva',
  syncing: 'Sincronizando',
  syncFailed: 'Sincronización fallida',
  needsReauth: 'Requiere reautenticación',
  closed: 'Cerrada',

  // Actions
  connectAccount: 'Conectar cuenta',
  reconnect: 'Reconectar',
  disconnect: 'Desconectar',
  refreshBalance: 'Actualizar saldo',
  syncNow: 'Sincronizar ahora',
  updateBalance: 'Actualizar saldo',
  viewTransactions: 'Ver transacciones',
  hideAccount: 'Ocultar cuenta',
  showAccount: 'Mostrar cuenta',

  // Connection
  selectInstitution: 'Seleccionar institución',
  searchInstitutions: 'Buscar instituciones',
  popularInstitutions: 'Instituciones populares',
  allInstitutions: 'Todas las instituciones',
  enterCredentials: 'Ingresa tus credenciales',
  authorizingConnection: 'Autorizando conexión',
  connectionSuccessful: 'Conexión exitosa',
  connectionFailed: 'Conexión fallida',
  retryConnection: 'Reintentar conexión',

  // Sync
  syncInProgress: 'Sincronización en progreso',
  syncCompleted: 'Sincronización completada',
  lastSyncedAt: 'Última sincronización: {{time}}',
  neverSynced: 'Nunca sincronizado',
  autoSync: 'Sincronización automática',
  enableAutoSync: 'Habilitar sincronización automática',
  syncFrequency: 'Frecuencia de sincronización',
  syncEveryHour: 'Cada hora',
  syncDaily: 'Diariamente',
  syncWeekly: 'Semanalmente',

  // Balance
  totalBalance: 'Saldo total',
  netWorth: 'Patrimonio neto',
  assets: 'Activos',
  liabilities: 'Pasivos',
  positiveBalance: 'Saldo positivo',
  negativeBalance: 'Saldo negativo',
  balanceHistory: 'Historial de saldo',

  // Messages
  noAccounts: 'No tienes cuentas',
  addFirstAccount: 'Agrega tu primera cuenta',
  accountCreated: 'Cuenta creada',
  accountUpdated: 'Cuenta actualizada',
  accountDeleted: 'Cuenta eliminada',
  accountConnected: 'Cuenta conectada',
  accountDisconnected: 'Cuenta desconectada',
  balanceUpdated: 'Saldo actualizado',

  // Warnings
  accountInactive: 'Esta cuenta está inactiva',
  syncRequired: 'Se requiere sincronización',
  reauthRequired: 'Se requiere reautenticación',
  providerIssue: 'Problema con el proveedor',
  staleData: 'Datos desactualizados',

  // Errors
  accountNotFound: 'Cuenta no encontrada',
  institutionNotFound: 'Institución no encontrada',
  invalidAccountNumber: 'Número de cuenta inválido',
  connectionError: 'Error de conexión',
  authenticationFailed: 'Autenticación fallida',
  insufficientPermissions: 'Permisos insuficientes',
  providerError: 'Error del proveedor',
  accountNameRequired: 'El nombre de la cuenta es requerido',
  accountTypeRequired: 'El tipo de cuenta es requerido',
  balanceRequired: 'El saldo es requerido',
  currencyRequired: 'La moneda es requerida',

  // Confirmation
  confirmDelete: '¿Eliminar esta cuenta?',
  deleteWarning: 'Esto también eliminará todas las transacciones asociadas',
  confirmDisconnect: '¿Desconectar esta cuenta?',
  disconnectWarning: 'Tendrás que volver a autenticarte para reconectar',
} as const;
