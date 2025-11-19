/**
 * Spanish Estate Planning Translations
 * Terms and phrases for digital wills and beneficiary management
 */
export const estatePlanning = {
  // General Terms
  estatePlanning: 'Planificación Patrimonial',
  will: 'Testamento',
  wills: 'Testamentos',
  digitalWill: 'Testamento Digital',
  beneficiary: 'Beneficiario',
  beneficiaries: 'Beneficiarios',
  executor: 'Albacea',
  executors: 'Albaceas',

  // Will Status
  status: {
    draft: 'Borrador',
    active: 'Activo',
    revoked: 'Revocado',
    executed: 'Ejecutado',
  },

  // Asset Types
  assetTypes: {
    bank_account: 'Cuenta Bancaria',
    investment_account: 'Cuenta de Inversión',
    crypto_account: 'Cuenta de Criptomonedas',
    real_estate: 'Bienes Raíces',
    business_interest: 'Participación Empresarial',
    personal_property: 'Propiedad Personal',
    other: 'Otro',
  },

  // Actions
  createWill: 'Crear Testamento',
  updateWill: 'Actualizar Testamento',
  deleteWill: 'Eliminar Testamento',
  activateWill: 'Activar Testamento',
  revokeWill: 'Revocar Testamento',
  viewWill: 'Ver Testamento',

  addBeneficiary: 'Agregar Beneficiario',
  updateBeneficiary: 'Actualizar Beneficiario',
  removeBeneficiary: 'Quitar Beneficiario',

  addExecutor: 'Agregar Albacea',
  updateExecutor: 'Actualizar Albacea',
  removeExecutor: 'Quitar Albacea',

  validate: 'Validar',
  validateWill: 'Validar Testamento',

  // Form Fields
  willName: 'Nombre del Testamento',
  willNamePlaceholder: 'ej., Testamento Familiar Smith 2025',
  notes: 'Notas',
  notesPlaceholder: 'Notas o instrucciones adicionales',
  notesOptional: 'Notas (Opcional)',

  legalDisclaimer: 'Aviso Legal',
  legalDisclaimerText: 'Entiendo que esto es un testamento digital y debo consultar con un asesor legal',
  acceptLegalDisclaimer: 'Acepto el aviso legal',

  percentage: 'Porcentaje',
  percentageAllocation: 'Asignación de Porcentaje',
  assetType: 'Tipo de Activo',
  specificAsset: 'Activo Específico',
  specificAssetOptional: 'Activo Específico (Opcional)',

  primaryExecutor: 'Albacea Principal',
  executorOrder: 'Orden de Ejecución',
  isPrimary: 'Es Principal',

  conditions: 'Condiciones',
  conditionsOptional: 'Condiciones (Opcional)',

  // Labels & Headers
  willDetails: 'Detalles del Testamento',
  willManagement: 'Gestión del Testamento',
  beneficiaryAllocation: 'Asignación de Beneficiarios',
  executorManagement: 'Gestión de Albaceas',

  beneficiaryCount: 'Beneficiarios',
  executorCount: 'Albaceas',

  activatedAt: 'Activado',
  revokedAt: 'Revocado',
  executedAt: 'Ejecutado',
  lastReviewed: 'Última Revisión',

  // Messages & Alerts
  noWillsYet: 'Aún No Hay Testamentos',
  noWillsDescription: 'Crea tu primer testamento para comenzar la planificación patrimonial de tu hogar',

  cannotActivateWill: 'No se puede activar el testamento',
  validationErrors: 'Errores de Validación',

  mustHaveBeneficiaries: 'Debe tener al menos un beneficiario',
  mustHaveExecutors: 'Debe tener al menos un albacea',
  mustAcceptDisclaimer: 'Debes aceptar el aviso legal antes de la activación',

  allocationMustBe100: 'Las asignaciones deben sumar 100% por tipo de activo',
  allocationInvalid: 'Las asignaciones de beneficiarios son inválidas',

  willCreatedSuccess: 'Testamento creado exitosamente',
  willUpdatedSuccess: 'Testamento actualizado exitosamente',
  willDeletedSuccess: 'Testamento eliminado exitosamente',
  willActivatedSuccess: 'Testamento activado exitosamente',
  willRevokedSuccess: 'Testamento revocado exitosamente',

  beneficiaryAddedSuccess: 'Beneficiario agregado exitosamente',
  beneficiaryUpdatedSuccess: 'Beneficiario actualizado exitosamente',
  beneficiaryRemovedSuccess: 'Beneficiario eliminado exitosamente',

  executorAddedSuccess: 'Albacea agregado exitosamente',
  executorUpdatedSuccess: 'Albacea actualizado exitosamente',
  executorRemovedSuccess: 'Albacea eliminado exitosamente',

  // Errors
  willNotFound: 'Testamento no encontrado',
  noAccessToWill: 'No tienes acceso a este testamento',
  beneficiaryNotFound: 'Beneficiario no encontrado',
  executorNotFound: 'Albacea no encontrado',

  cannotUpdateActiveWill: 'No se puede actualizar un testamento activo',
  cannotDeleteActiveWill: 'No se puede eliminar un testamento activo. Revoca los testamentos activos en su lugar.',
  cannotModifyExecutedWill: 'No se puede modificar un testamento ejecutado',

  beneficiaryMustBeHouseholdMember: 'El beneficiario debe ser miembro del hogar',
  executorMustBeHouseholdMember: 'El albacea debe ser miembro del hogar',

  previousWillAutoRevoked: 'El testamento activo anterior fue revocado automáticamente',

  // Premium Features
  premiumFeature: 'Característica Premium',
  premiumRequired: 'Esta característica requiere una suscripción premium',
  upgradeToAccess: 'Actualizar a Premium para acceder a la planificación patrimonial',
  upgradeToPremium: 'Actualizar a Premium',

  // Descriptions
  createWillDescription: 'Crea un borrador de testamento para tu hogar. Puedes agregar beneficiarios y albaceas antes de activarlo.',
  activateWillDescription: 'Activar este testamento lo hará legalmente vinculante (sujeto a revisión legal)',
  revokeWillDescription: 'Revocar este testamento lo hará inválido. Esta acción no se puede deshacer.',

  draftWillsOnly: 'Solo se pueden eliminar testamentos en borrador',
  oneActiveWillPerHousehold: 'Solo un testamento activo por hogar',

  // Validation
  validationPassed: 'Validación aprobada',
  validationFailed: 'Validación fallida',

  // Tooltips & Help
  whatIsDigitalWill: '¿Qué es un testamento digital?',
  digitalWillExplanation: 'Un testamento digital es una herramienta de planificación patrimonial que te ayuda a organizar la distribución de activos. Consulta siempre con un asesor legal para la validez legal.',

  beneficiaryAllocationHelp: 'Las asignaciones de porcentaje deben sumar 100% para cada tipo de activo',
  executorOrderHelp: 'El albacea principal es responsable de ejecutar el testamento. Los albaceas secundarios sirven como respaldo.',
};
