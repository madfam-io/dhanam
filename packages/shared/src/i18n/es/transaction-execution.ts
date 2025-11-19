/**
 * Spanish Transaction Execution Translations
 * Terms for autonomous trade execution and order management
 */
export const transactionExecution = {
  // General Terms
  transactionExecution: 'Ejecución de Transacciones',
  order: 'Orden',
  orders: 'Órdenes',
  tradeOrder: 'Orden de Comercio',
  tradeOrders: 'Órdenes de Comercio',
  execution: 'Ejecución',
  executions: 'Ejecuciones',

  // Order Types
  orderTypes: {
    buy: 'Comprar',
    sell: 'Vender',
    transfer: 'Transferir',
    deposit: 'Depositar',
    withdraw: 'Retirar',
  },

  // Order Status
  status: {
    pending_verification: 'Pendiente de Verificación',
    pending_execution: 'Pendiente de Ejecución',
    executing: 'Ejecutando',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
  },

  // Order Priority
  priority: {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    critical: 'Crítica',
  },

  // Execution Providers
  providers: {
    bitso: 'Bitso',
    plaid: 'Plaid',
    belvo: 'Belvo',
    manual: 'Manual',
  },

  // Actions
  createOrder: 'Crear Orden',
  placeOrder: 'Colocar Orden',
  updateOrder: 'Actualizar Orden',
  cancelOrder: 'Cancelar Orden',
  executeOrder: 'Ejecutar Orden',
  retryOrder: 'Reintentar Orden',
  verifyOrder: 'Verificar Orden',
  viewOrder: 'Ver Orden',
  viewExecutions: 'Ver Ejecuciones',

  // Form Fields
  orderType: 'Tipo de Orden',
  amount: 'Monto',
  amountPlaceholder: 'ej., 1000.00',
  currency: 'Moneda',
  assetSymbol: 'Símbolo del Activo',
  assetSymbolPlaceholder: 'ej., BTC, ETH',
  targetPrice: 'Precio Objetivo',
  targetPriceOptional: 'Precio Objetivo (Opcional)',
  targetPricePlaceholder: 'ej., 50000.00',

  fromAccount: 'Desde Cuenta',
  toAccount: 'Hacia Cuenta',
  selectAccount: 'Seleccionar Cuenta',

  provider: 'Proveedor de Ejecución',
  maxSlippage: 'Deslizamiento Máximo',
  maxSlippagePlaceholder: 'ej., 3 (3%)',

  dryRunMode: 'Modo de Prueba',
  dryRunDescription: 'Simular ejecución sin realizar transacciones reales',

  autoExecute: 'Ejecutar Automáticamente',
  autoExecuteDescription: 'Ejecutar automáticamente después de la verificación',

  otpCode: 'Código OTP',
  otpCodePlaceholder: '000000',

  notes: 'Notas',
  notesOptional: 'Notas (Opcional)',
  notesPlaceholder: 'Notas adicionales sobre esta orden',

  idempotencyKey: 'Clave de Idempotencia',
  idempotencyKeyDescription: 'Previene órdenes duplicadas',

  // Labels & Headers
  orderDetails: 'Detalles de la Orden',
  orderSummary: 'Resumen de la Orden',
  executionDetails: 'Detalles de Ejecución',
  executionHistory: 'Historial de Ejecución',
  orderManagement: 'Gestión de Órdenes',

  orderNumber: 'Número de Orden',
  orderDate: 'Fecha de Orden',
  executionDate: 'Fecha de Ejecución',
  executionTime: 'Tiempo de Ejecución',

  executedAmount: 'Monto Ejecutado',
  executedPrice: 'Precio Ejecutado',
  executionFees: 'Comisiones de Ejecución',
  totalCost: 'Costo Total',

  providerOrderId: 'ID de Orden del Proveedor',
  attemptNumber: 'Número de Intento',

  // Order Limits
  orderLimits: 'Límites de Orden',
  dailyLimit: 'Límite Diario',
  weeklyLimit: 'Límite Semanal',
  monthlyLimit: 'Límite Mensual',
  perTransactionLimit: 'Límite por Transacción',

  limitsRemaining: 'Límites Restantes',
  limitUsed: 'Usado',
  limitAvailable: 'Disponible',
  limitResets: 'Se Reinicia',

  // Verification
  verificationRequired: 'Verificación Requerida',
  verificationPending: 'Pendiente de Verificación',
  verificationComplete: 'Verificación Completada',
  otpVerification: 'Verificación OTP',
  enterOtpCode: 'Ingresa el código de 6 dígitos de tu aplicación de autenticación',

  // Execution Messages
  orderCreatedSuccess: 'Orden creada exitosamente',
  orderUpdatedSuccess: 'Orden actualizada exitosamente',
  orderCancelledSuccess: 'Orden cancelada exitosamente',
  orderVerifiedSuccess: 'Orden verificada exitosamente',
  orderExecutedSuccess: 'Orden ejecutada exitosamente',
  orderExecutionStarted: 'Ejecución de orden iniciada',

  // Errors
  orderNotFound: 'Orden no encontrada',
  noAccessToOrder: 'No tienes acceso a esta orden',
  invalidOrderStatus: 'Estado de orden inválido para esta acción',
  orderExpired: 'La orden ha expirado',
  orderAlreadyExecuted: 'La orden ya fue ejecutada',
  cannotCancelExecutingOrder: 'No se puede cancelar una orden en ejecución',
  cannotUpdateExecutingOrder: 'No se puede actualizar una orden en ejecución',

  insufficientBalance: 'Saldo insuficiente en la cuenta',
  exceedsOrderLimit: 'Excede el límite de orden',
  exceedsDailyLimit: 'Excede el límite diario',
  exceedsWeeklyLimit: 'Excede el límite semanal',
  exceedsMonthlyLimit: 'Excede el límite mensual',

  invalidOtpCode: 'Código OTP inválido',
  otpVerificationFailed: 'Verificación OTP fallida',
  tooManyOtpAttempts: 'Demasiados intentos de OTP. Intenta de nuevo más tarde.',

  executionFailed: 'Ejecución de orden fallida',
  providerUnavailable: 'Proveedor de ejecución no disponible',
  marketClosed: 'El mercado está cerrado',
  priceLimitExceeded: 'Límite de precio excedido',
  slippageExceeded: 'Deslizamiento excedido',

  idempotencyKeyConflict: 'Clave de idempotencia ya utilizada con diferente solicitud',

  // Descriptions
  createOrderDescription: 'Crea una nueva orden de transacción para ejecución',
  highValueWarning: 'Esta es una transacción de alto valor y requiere verificación OTP',
  dryRunWarning: 'Modo de prueba: No se realizarán transacciones reales',

  buyOrderDescription: 'Comprar activos con fondos de tu cuenta',
  sellOrderDescription: 'Vender activos y depositar fondos en tu cuenta',
  transferOrderDescription: 'Transferir fondos entre tus cuentas',
  depositOrderDescription: 'Depositar fondos desde fuente externa',
  withdrawOrderDescription: 'Retirar fondos a cuenta externa',

  // Goal-Driven Execution
  goalDrivenExecution: 'Ejecución Dirigida por Objetivos',
  linkedToGoal: 'Vinculado a Objetivo',
  goalName: 'Nombre del Objetivo',
  goalProgress: 'Progreso del Objetivo',
  autoRebalancing: 'Rebalanceo Automático',

  // Audit & Security
  auditTrail: 'Registro de Auditoría',
  securityVerification: 'Verificación de Seguridad',
  ipAddress: 'Dirección IP',
  userAgent: 'Agente de Usuario',
  requestTimestamp: 'Marca de Tiempo de Solicitud',
  verificationTimestamp: 'Marca de Tiempo de Verificación',
  executionTimestamp: 'Marca de Tiempo de Ejecución',

  // Provider Responses
  providerResponse: 'Respuesta del Proveedor',
  providerRequest: 'Solicitud al Proveedor',
  errorCode: 'Código de Error',
  errorMessage: 'Mensaje de Error',
  rawResponse: 'Respuesta Bruta',

  // Dry Run Results
  dryRunResults: 'Resultados de Prueba',
  simulatedExecution: 'Ejecución Simulada',
  simulatedPrice: 'Precio Simulado',
  simulatedFees: 'Comisiones Simuladas',
  simulatedSlippage: 'Deslizamiento Simulado',
  estimatedTotal: 'Total Estimado',

  // Statistics
  totalOrders: 'Órdenes Totales',
  pendingOrders: 'Órdenes Pendientes',
  completedOrders: 'Órdenes Completadas',
  failedOrders: 'Órdenes Fallidas',
  cancelledOrders: 'Órdenes Canceladas',

  totalVolume: 'Volumen Total',
  totalFees: 'Comisiones Totales',
  successRate: 'Tasa de Éxito',
  averageExecutionTime: 'Tiempo Promedio de Ejecución',

  // Filters
  filterByStatus: 'Filtrar por Estado',
  filterByType: 'Filtrar por Tipo',
  filterByAccount: 'Filtrar por Cuenta',
  filterByGoal: 'Filtrar por Objetivo',
  filterByDate: 'Filtrar por Fecha',

  allOrders: 'Todas las Órdenes',
  myOrders: 'Mis Órdenes',
  recentOrders: 'Órdenes Recientes',

  // Tooltips & Help
  whatIsTransactionExecution: '¿Qué es la ejecución de transacciones?',
  transactionExecutionExplanation:
    'La ejecución de transacciones te permite comprar, vender y transferir activos automáticamente a través de proveedores conectados.',

  idempotencyHelp:
    'La clave de idempotencia previene órdenes duplicadas accidentales. Usa la misma clave para reintentar una solicitud fallida.',
  slippageHelp:
    'El deslizamiento es la diferencia entre el precio esperado y el precio de ejecución. Establece un máximo para protegerte de cambios de precio.',
  dryRunHelp:
    'El modo de prueba simula la ejecución sin realizar transacciones reales. Úsalo para probar tu estrategia.',
  autoExecuteHelp:
    'Cuando está habilitado, la orden se ejecutará automáticamente después de la verificación sin necesidad de acción manual.',
  targetPriceHelp:
    'Precio límite: La orden solo se ejecutará a este precio o mejor. Déjalo en blanco para orden de mercado.',

  // Premium Features
  premiumFeature: 'Característica Premium',
  premiumRequired: 'Esta característica requiere una suscripción premium',
  upgradeToExecute: 'Actualizar a Premium para ejecutar transacciones',
  upgradeToPremium: 'Actualizar a Premium',

  // Regulatory
  regulatoryDisclaimer: 'Aviso Regulatorio',
  regulatoryDisclaimerText:
    'La ejecución de transacciones está sujeta a términos y condiciones. Las transacciones pueden tardar en procesarse y están sujetas a comisiones del proveedor.',
  acceptDisclaimer: 'Acepto el aviso regulatorio',

  tradingRisks: 'Riesgos de Comercio',
  tradingRisksText:
    'El comercio conlleva riesgos. Los valores pueden subir o bajar. Puede perder parte o la totalidad de su inversión.',

  // Notifications
  orderPending: 'Tu orden está pendiente de verificación',
  orderExecuting: 'Tu orden se está ejecutando',
  orderCompleted: 'Tu orden se completó exitosamente',
  orderFailed: 'Tu orden falló. Revisa los detalles para más información.',
  orderCancelled: 'Tu orden fue cancelada',

  // Time & Date
  submittedAt: 'Enviada',
  verifiedAt: 'Verificada',
  executedAt: 'Ejecutada',
  completedAt: 'Completada',
  cancelledAt: 'Cancelada',
  expiresAt: 'Expira',

  // Currencies & Assets
  fiatCurrency: 'Moneda Fiat',
  cryptocurrency: 'Criptomoneda',
  stock: 'Acción',
  etf: 'ETF',
};
