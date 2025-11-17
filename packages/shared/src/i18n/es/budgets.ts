/**
 * Spanish Budget Translations
 * Budget management, categories, tracking
 */
export const budgets = {
  // Main
  budgets: 'Presupuestos',
  budget: 'Presupuesto',
  newBudget: 'Nuevo presupuesto',
  createBudget: 'Crear presupuesto',
  editBudget: 'Editar presupuesto',
  deleteBudget: 'Eliminar presupuesto',
  budgetDetails: 'Detalles del presupuesto',
  myBudgets: 'Mis presupuestos',

  // Fields
  budgetName: 'Nombre del presupuesto',
  budgetPeriod: 'Período',
  budgetAmount: 'Monto presupuestado',
  spentAmount: 'Monto gastado',
  remainingAmount: 'Monto restante',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  rolloverUnused: 'Transferir sobrante',

  // Periods
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  custom: 'Personalizado',
  currentPeriod: 'Período actual',
  nextPeriod: 'Próximo período',
  previousPeriod: 'Período anterior',

  // Categories
  categories: 'Categorías',
  category: 'Categoría',
  newCategory: 'Nueva categoría',
  addCategory: 'Agregar categoría',
  editCategory: 'Editar categoría',
  deleteCategory: 'Eliminar categoría',
  categoryName: 'Nombre de categoría',
  categoryBudget: 'Presupuesto de categoría',
  categorySpent: 'Gastado en categoría',
  categoryRemaining: 'Restante en categoría',
  uncategorized: 'Sin categorizar',
  allCategories: 'Todas las categorías',

  // Predefined categories
  groceries: 'Supermercado',
  restaurants: 'Restaurantes',
  transportation: 'Transporte',
  utilities: 'Servicios',
  rent: 'Renta',
  mortgage: 'Hipoteca',
  entertainment: 'Entretenimiento',
  healthcare: 'Salud',
  insurance: 'Seguros',
  education: 'Educación',
  shopping: 'Compras',
  personal: 'Personal',
  gifts: 'Regalos',
  travel: 'Viajes',
  savings: 'Ahorros',
  investments: 'Inversiones',
  debt: 'Deudas',
  other: 'Otros',

  // Status
  onTrack: 'En ruta',
  overBudget: 'Sobre presupuesto',
  underBudget: 'Bajo presupuesto',
  budgetExceeded: 'Presupuesto excedido',
  warningThreshold: 'Umbral de advertencia',

  // Progress
  progress: 'Progreso',
  percentUsed: '{{percent}}% utilizado',
  percentRemaining: '{{percent}}% restante',
  daysRemaining: '{{days}} días restantes',
  daysInPeriod: '{{days}} días en el período',

  // Alerts
  budgetAlert: 'Alerta de presupuesto',
  budgetAlerts: 'Alertas de presupuesto',
  enableAlerts: 'Habilitar alertas',
  alertThreshold: 'Umbral de alerta',
  alertAt80Percent: 'Alerta al 80%',
  alertAt90Percent: 'Alerta al 90%',
  alertAt100Percent: 'Alerta al 100%',
  customThreshold: 'Umbral personalizado',

  // Actions
  viewBudget: 'Ver presupuesto',
  adjustBudget: 'Ajustar presupuesto',
  resetBudget: 'Restablecer presupuesto',
  duplicateBudget: 'Duplicar presupuesto',
  archiveBudget: 'Archivar presupuesto',
  restoreBudget: 'Restaurar presupuesto',

  // Reports
  budgetReport: 'Reporte de presupuesto',
  spendingBreakdown: 'Desglose de gastos',
  categoryBreakdown: 'Desglose por categoría',
  monthlyComparison: 'Comparación mensual',
  yearlyComparison: 'Comparación anual',
  trend: 'Tendencia',
  insights: 'Perspectivas',

  // Goals
  budgetGoals: 'Metas de presupuesto',
  savingsGoal: 'Meta de ahorro',
  spendingLimit: 'Límite de gasto',
  goalProgress: 'Progreso de meta',
  goalAchieved: 'Meta alcanzada',
  onTrackToGoal: 'En camino a la meta',

  // Messages
  noBudgets: 'No tienes presupuestos',
  createFirstBudget: 'Crea tu primer presupuesto',
  budgetCreated: 'Presupuesto creado',
  budgetUpdated: 'Presupuesto actualizado',
  budgetDeleted: 'Presupuesto eliminado',
  categoryAdded: 'Categoría agregada',
  categoryUpdated: 'Categoría actualizada',
  categoryDeleted: 'Categoría eliminada',

  // Warnings
  approachingLimit: 'Acercándose al límite',
  exceededLimit: 'Límite excedido',
  youHaveSpent: 'Has gastado {{amount}} de {{budget}}',
  remainingForPeriod: 'Te quedan {{amount}} para este período',
  overspentBy: 'Has excedido por {{amount}}',

  // Errors
  budgetNotFound: 'Presupuesto no encontrado',
  categoryNotFound: 'Categoría no encontrada',
  invalidBudgetAmount: 'Monto de presupuesto inválido',
  budgetNameRequired: 'El nombre del presupuesto es requerido',
  budgetAmountRequired: 'El monto del presupuesto es requerido',
  categoryNameRequired: 'El nombre de la categoría es requerido',
  categoryBudgetRequired: 'El presupuesto de la categoría es requerido',
  periodRequired: 'El período es requerido',
  startDateRequired: 'La fecha de inicio es requerida',
} as const;
