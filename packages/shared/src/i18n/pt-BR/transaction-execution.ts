/**
 * Brazilian Portuguese Transaction Execution Translations
 * Terms for autonomous trade execution and order management
 */
export const transactionExecution = {
  // General Terms
  transactionExecution: 'Execução de Transações',
  order: 'Ordem',
  orders: 'Ordens',
  tradeOrder: 'Ordem de Negociação',
  tradeOrders: 'Ordens de Negociação',
  execution: 'Execução',
  executions: 'Execuções',

  // Order Types
  orderTypes: {
    buy: 'Comprar',
    sell: 'Vender',
    transfer: 'Transferir',
    deposit: 'Depositar',
    withdraw: 'Sacar',
  },

  // Order Status
  status: {
    pending_verification: 'Pendente de Verificação',
    pending_execution: 'Pendente de Execução',
    executing: 'Executando',
    completed: 'Concluído',
    failed: 'Falhou',
    cancelled: 'Cancelado',
    rejected: 'Rejeitado',
  },

  // Order Priority
  priority: {
    low: 'Baixa',
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
  createOrder: 'Criar Ordem',
  placeOrder: 'Colocar Ordem',
  updateOrder: 'Atualizar Ordem',
  cancelOrder: 'Cancelar Ordem',
  executeOrder: 'Executar Ordem',
  retryOrder: 'Tentar Ordem Novamente',
  verifyOrder: 'Verificar Ordem',
  viewOrder: 'Ver Ordem',
  viewExecutions: 'Ver Execuções',

  // Form Fields
  orderType: 'Tipo de Ordem',
  amount: 'Valor',
  amountPlaceholder: 'ex., 1000.00',
  currency: 'Moeda',
  assetSymbol: 'Símbolo do Ativo',
  assetSymbolPlaceholder: 'ex., BTC, ETH',
  targetPrice: 'Preço Alvo',
  targetPriceOptional: 'Preço Alvo (Opcional)',
  targetPricePlaceholder: 'ex., 50000.00',

  fromAccount: 'Da Conta',
  toAccount: 'Para Conta',
  selectAccount: 'Selecionar Conta',

  provider: 'Provedor de Execução',
  maxSlippage: 'Slippage Máximo',
  maxSlippagePlaceholder: 'ex., 3 (3%)',

  dryRunMode: 'Modo de Teste',
  dryRunDescription: 'Simular execução sem realizar transações reais',

  autoExecute: 'Executar Automaticamente',
  autoExecuteDescription: 'Executar automaticamente após a verificação',

  otpCode: 'Código OTP',
  otpCodePlaceholder: '000000',

  notes: 'Notas',
  notesOptional: 'Notas (Opcional)',
  notesPlaceholder: 'Notas adicionais sobre esta ordem',

  idempotencyKey: 'Chave de Idempotência',
  idempotencyKeyDescription: 'Previne ordens duplicadas',

  // Labels & Headers
  orderDetails: 'Detalhes da Ordem',
  orderSummary: 'Resumo da Ordem',
  executionDetails: 'Detalhes da Execução',
  executionHistory: 'Histórico de Execução',
  orderManagement: 'Gestão de Ordens',

  orderNumber: 'Número da Ordem',
  orderDate: 'Data da Ordem',
  executionDate: 'Data de Execução',
  executionTime: 'Tempo de Execução',

  executedAmount: 'Valor Executado',
  executedPrice: 'Preço Executado',
  executionFees: 'Taxas de Execução',
  totalCost: 'Custo Total',

  providerOrderId: 'ID da Ordem do Provedor',
  attemptNumber: 'Número da Tentativa',

  // Order Limits
  orderLimits: 'Limites de Ordem',
  dailyLimit: 'Limite Diário',
  weeklyLimit: 'Limite Semanal',
  monthlyLimit: 'Limite Mensal',
  perTransactionLimit: 'Limite por Transação',

  limitsRemaining: 'Limites Restantes',
  limitUsed: 'Usado',
  limitAvailable: 'Disponível',
  limitResets: 'Reinicia',

  // Verification
  verificationRequired: 'Verificação Necessária',
  verificationPending: 'Pendente de Verificação',
  verificationComplete: 'Verificação Concluída',
  otpVerification: 'Verificação OTP',
  enterOtpCode: 'Digite o código de 6 dígitos do seu aplicativo de autenticação',

  // Execution Messages
  orderCreatedSuccess: 'Ordem criada com sucesso',
  orderUpdatedSuccess: 'Ordem atualizada com sucesso',
  orderCancelledSuccess: 'Ordem cancelada com sucesso',
  orderVerifiedSuccess: 'Ordem verificada com sucesso',
  orderExecutedSuccess: 'Ordem executada com sucesso',
  orderExecutionStarted: 'Execução da ordem iniciada',

  // Errors
  orderNotFound: 'Ordem não encontrada',
  noAccessToOrder: 'Você não tem acesso a esta ordem',
  invalidOrderStatus: 'Status de ordem inválido para esta ação',
  orderExpired: 'A ordem expirou',
  orderAlreadyExecuted: 'A ordem já foi executada',
  cannotCancelExecutingOrder: 'Não é possível cancelar uma ordem em execução',
  cannotUpdateExecutingOrder: 'Não é possível atualizar uma ordem em execução',

  insufficientBalance: 'Saldo insuficiente na conta',
  exceedsOrderLimit: 'Excede o limite de ordem',
  exceedsDailyLimit: 'Excede o limite diário',
  exceedsWeeklyLimit: 'Excede o limite semanal',
  exceedsMonthlyLimit: 'Excede o limite mensal',

  invalidOtpCode: 'Código OTP inválido',
  otpVerificationFailed: 'Verificação OTP falhou',
  tooManyOtpAttempts: 'Muitas tentativas de OTP. Tente novamente mais tarde.',

  executionFailed: 'Execução da ordem falhou',
  providerUnavailable: 'Provedor de execução indisponível',
  marketClosed: 'O mercado está fechado',
  priceLimitExceeded: 'Limite de preço excedido',
  slippageExceeded: 'Slippage excedido',

  idempotencyKeyConflict: 'Chave de idempotência já utilizada com requisição diferente',

  // Descriptions
  createOrderDescription: 'Crie uma nova ordem de transação para execução',
  highValueWarning: 'Esta é uma transação de alto valor e requer verificação OTP',
  dryRunWarning: 'Modo de teste: Nenhuma transação real será realizada',

  buyOrderDescription: 'Comprar ativos com fundos da sua conta',
  sellOrderDescription: 'Vender ativos e depositar fundos na sua conta',
  transferOrderDescription: 'Transferir fundos entre suas contas',
  depositOrderDescription: 'Depositar fundos de fonte externa',
  withdrawOrderDescription: 'Sacar fundos para conta externa',

  // Goal-Driven Execution
  goalDrivenExecution: 'Execução Orientada por Objetivos',
  linkedToGoal: 'Vinculado a Objetivo',
  goalName: 'Nome do Objetivo',
  goalProgress: 'Progresso do Objetivo',
  autoRebalancing: 'Rebalanceamento Automático',

  // Audit & Security
  auditTrail: 'Trilha de Auditoria',
  securityVerification: 'Verificação de Segurança',
  ipAddress: 'Endereço IP',
  userAgent: 'Agente do Usuário',
  requestTimestamp: 'Data/Hora da Solicitação',
  verificationTimestamp: 'Data/Hora da Verificação',
  executionTimestamp: 'Data/Hora da Execução',

  // Provider Responses
  providerResponse: 'Resposta do Provedor',
  providerRequest: 'Solicitação ao Provedor',
  errorCode: 'Código de Erro',
  errorMessage: 'Mensagem de Erro',
  rawResponse: 'Resposta Bruta',

  // Dry Run Results
  dryRunResults: 'Resultados do Teste',
  simulatedExecution: 'Execução Simulada',
  simulatedPrice: 'Preço Simulado',
  simulatedFees: 'Taxas Simuladas',
  simulatedSlippage: 'Slippage Simulado',
  estimatedTotal: 'Total Estimado',

  // Statistics
  totalOrders: 'Total de Ordens',
  pendingOrders: 'Ordens Pendentes',
  completedOrders: 'Ordens Concluídas',
  failedOrders: 'Ordens com Falha',
  cancelledOrders: 'Ordens Canceladas',

  totalVolume: 'Volume Total',
  totalFees: 'Taxas Totais',
  successRate: 'Taxa de Sucesso',
  averageExecutionTime: 'Tempo Médio de Execução',

  // Filters
  filterByStatus: 'Filtrar por Status',
  filterByType: 'Filtrar por Tipo',
  filterByAccount: 'Filtrar por Conta',
  filterByGoal: 'Filtrar por Objetivo',
  filterByDate: 'Filtrar por Data',

  allOrders: 'Todas as Ordens',
  myOrders: 'Minhas Ordens',
  recentOrders: 'Ordens Recentes',

  // Tooltips & Help
  whatIsTransactionExecution: 'O que é execução de transações?',
  transactionExecutionExplanation:
    'A execução de transações permite comprar, vender e transferir ativos automaticamente através de provedores conectados.',

  idempotencyHelp:
    'A chave de idempotência previne ordens duplicadas acidentais. Use a mesma chave para tentar novamente uma solicitação que falhou.',
  slippageHelp:
    'O slippage é a diferença entre o preço esperado e o preço de execução. Defina um máximo para se proteger de mudanças de preço.',
  dryRunHelp:
    'O modo de teste simula a execução sem realizar transações reais. Use para testar sua estratégia.',
  autoExecuteHelp:
    'Quando habilitado, a ordem será executada automaticamente após a verificação sem necessidade de ação manual.',
  targetPriceHelp:
    'Preço limite: A ordem só será executada a este preço ou melhor. Deixe em branco para ordem a mercado.',

  // Premium Features
  premiumFeature: 'Recurso Premium',
  premiumRequired: 'Este recurso requer uma assinatura premium',
  upgradeToExecute: 'Upgrade para Premium para executar transações',
  upgradeToPremium: 'Upgrade para Premium',

  // Regulatory
  regulatoryDisclaimer: 'Aviso Regulatório',
  regulatoryDisclaimerText:
    'A execução de transações está sujeita a termos e condições. As transações podem levar tempo para serem processadas e estão sujeitas a taxas do provedor.',
  acceptDisclaimer: 'Aceito o aviso regulatório',

  tradingRisks: 'Riscos de Negociação',
  tradingRisksText:
    'A negociação envolve riscos. Os valores podem subir ou descer. Você pode perder parte ou todo o seu investimento.',

  // Notifications
  orderPending: 'Sua ordem está pendente de verificação',
  orderExecuting: 'Sua ordem está sendo executada',
  orderCompleted: 'Sua ordem foi concluída com sucesso',
  orderFailed: 'Sua ordem falhou. Verifique os detalhes para mais informações.',
  orderCancelled: 'Sua ordem foi cancelada',

  // Time & Date
  submittedAt: 'Enviada',
  verifiedAt: 'Verificada',
  executedAt: 'Executada',
  completedAt: 'Concluída',
  cancelledAt: 'Cancelada',
  expiresAt: 'Expira',

  // Currencies & Assets
  fiatCurrency: 'Moeda Fiat',
  cryptocurrency: 'Criptomoeda',
  stock: 'Ação',
  etf: 'ETF',
};
