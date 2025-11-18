/**
 * Spanish Transactions Translations
 * Transaction management, categorization, filters
 */
export const transactions = {
  // Main
  transactions: 'Transacciones',
  transaction: 'Transacción',
  newTransaction: 'Nueva transacción',
  addTransaction: 'Agregar transacción',
  editTransaction: 'Editar transacción',
  deleteTransaction: 'Eliminar transacción',
  transactionDetails: 'Detalles de transacción',

  // Types
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',

  // Fields
  amount: 'Monto',
  date: 'Fecha',
  description: 'Descripción',
  merchant: 'Comercio',
  category: 'Categoría',
  account: 'Cuenta',
  notes: 'Notas',
  metadata: 'Metadatos',
  pending: 'Pendiente',
  cleared: 'Liquidada',
  reconciled: 'Conciliada',

  // Filters
  filterTransactions: 'Filtrar transacciones',
  allTransactions: 'Todas las transacciones',
  incomeOnly: 'Solo ingresos',
  expensesOnly: 'Solo gastos',
  uncategorized: 'Sin categorizar',
  dateRange: 'Rango de fechas',
  amountRange: 'Rango de monto',
  selectAccount: 'Seleccionar cuenta',
  selectCategory: 'Seleccionar categoría',
  selectMerchant: 'Seleccionar comercio',

  // Sorting
  sortBy: 'Ordenar por',
  sortByDate: 'Fecha',
  sortByAmount: 'Monto',
  sortByMerchant: 'Comercio',
  sortByCategory: 'Categoría',
  newest: 'Más reciente',
  oldest: 'Más antiguo',
  highest: 'Mayor monto',
  lowest: 'Menor monto',

  // Categorization
  categorize: 'Categorizar',
  bulkCategorize: 'Categorizar en masa',
  autoCategorize: 'Categorización automática',
  categorizeSelected: 'Categorizar seleccionadas',
  categoryRules: 'Reglas de categorización',
  createRule: 'Crear regla',
  applyRules: 'Aplicar reglas',
  rulesApplied: 'Reglas aplicadas',

  // Actions
  split: 'Dividir',
  merge: 'Combinar',
  duplicate: 'Duplicar',
  markAsReconciled: 'Marcar como conciliada',
  markAsPending: 'Marcar como pendiente',
  attachReceipt: 'Adjuntar recibo',
  viewReceipt: 'Ver recibo',

  // Bulk operations
  bulkEdit: 'Edición masiva',
  bulkDelete: 'Eliminación masiva',
  selectedTransactions: '{{count}} transacciones seleccionadas',
  selectAll: 'Seleccionar todas',
  deselectAll: 'Deseleccionar todas',

  // Messages
  noTransactions: 'No hay transacciones',
  noTransactionsInRange: 'No hay transacciones en este rango',
  transactionCreated: 'Transacción creada',
  transactionUpdated: 'Transacción actualizada',
  transactionDeleted: 'Transacción eliminada',
  transactionsCategorized: '{{count}} transacciones categorizadas',
  transactionsImported: '{{count}} transacciones importadas',

  // Import/Export
  importTransactions: 'Importar transacciones',
  exportTransactions: 'Exportar transacciones',
  downloadCSV: 'Descargar CSV',
  downloadPDF: 'Descargar PDF',
  uploadFile: 'Subir archivo',
  selectFile: 'Seleccionar archivo',
  supportedFormats: 'Formatos soportados: CSV, OFX, QFX',

  // Search
  searchTransactions: 'Buscar transacciones',
  searchByDescription: 'Buscar por descripción',
  searchByMerchant: 'Buscar por comercio',

  // Stats
  totalIncome: 'Ingresos totales',
  totalExpenses: 'Gastos totales',
  netIncome: 'Ingreso neto',
  averageTransaction: 'Transacción promedio',
  transactionCount: 'Cantidad de transacciones',
  largestExpense: 'Mayor gasto',
  largestIncome: 'Mayor ingreso',

  // Errors
  transactionNotFound: 'Transacción no encontrada',
  invalidAmount: 'Monto inválido',
  invalidDate: 'Fecha inválida',
  accountRequired: 'La cuenta es requerida',
  amountRequired: 'El monto es requerido',
  dateRequired: 'La fecha es requerida',
  descriptionRequired: 'La descripción es requerida',
} as const;
