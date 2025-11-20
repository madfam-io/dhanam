/**
 * @dhanam/simulations
 *
 * Statistical simulation engines for wealth planning and financial projections
 */

// Statistical utilities
export * from './utils/statistics.util';

// Monte Carlo engine
export * from './engines/monte-carlo.engine';

// Re-export for convenience
export { monteCarloEngine as default } from './engines/monte-carlo.engine';
