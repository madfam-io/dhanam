/**
 * @dhanam/simulations
 *
 * Statistical simulation engines for wealth planning and financial projections
 */

// Statistical utilities
export * from './utils/statistics.util';

// Monte Carlo engine
export * from './engines/monte-carlo.engine';

// Scenario Analysis engine
export * from './engines/scenario-analysis.engine';

// Re-export for convenience
export { monteCarloEngine as default } from './engines/monte-carlo.engine';
export { scenarioAnalysisEngine } from './engines/scenario-analysis.engine';
