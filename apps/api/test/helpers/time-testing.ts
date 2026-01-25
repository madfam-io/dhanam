/**
 * Time Testing Utilities
 *
 * Helpers for testing time-dependent functionality like rate limiters,
 * cache expiration, and scheduled tasks.
 */

/**
 * Helper class for manipulating time in tests
 *
 * @example
 * ```typescript
 * describe('RateLimiterService', () => {
 *   let timeHelper: TimeTestHelper;
 *
 *   beforeEach(() => {
 *     timeHelper = new TimeTestHelper();
 *     timeHelper.freezeTime(new Date('2025-01-15T10:00:00Z'));
 *   });
 *
 *   afterEach(() => {
 *     timeHelper.reset();
 *   });
 *
 *   it('resets minute counter after 60 seconds', () => {
 *     // Hit rate limit
 *     timeHelper.advanceTime(61000);
 *     // Verify requests allowed again
 *   });
 * });
 * ```
 */
export class TimeTestHelper {
  private frozen = false;
  private currentTime: Date = new Date();

  /**
   * Freeze time at a specific date
   * Uses jest.useFakeTimers() to control Date.now()
   */
  freezeTime(date: Date): void {
    this.currentTime = date;
    this.frozen = true;
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  /**
   * Advance time by a number of milliseconds
   */
  advanceTime(ms: number): void {
    if (!this.frozen) {
      throw new Error('Time must be frozen before advancing. Call freezeTime() first.');
    }
    this.currentTime = new Date(this.currentTime.getTime() + ms);
    jest.advanceTimersByTime(ms);
  }

  /**
   * Advance time by a number of seconds
   */
  advanceTimeBySeconds(seconds: number): void {
    this.advanceTime(seconds * 1000);
  }

  /**
   * Advance time by a number of minutes
   */
  advanceTimeByMinutes(minutes: number): void {
    this.advanceTime(minutes * 60 * 1000);
  }

  /**
   * Advance time by a number of hours
   */
  advanceTimeByHours(hours: number): void {
    this.advanceTime(hours * 60 * 60 * 1000);
  }

  /**
   * Get the current frozen time
   */
  getCurrentTime(): Date {
    return this.currentTime;
  }

  /**
   * Reset to real timers
   */
  reset(): void {
    if (this.frozen) {
      jest.useRealTimers();
      this.frozen = false;
    }
  }

  /**
   * Check if time is currently frozen
   */
  isFrozen(): boolean {
    return this.frozen;
  }
}

/**
 * Create a timestamp relative to now (or a base date)
 *
 * @example
 * ```typescript
 * // 5 minutes ago
 * const fiveMinutesAgo = relativeTime(-5, 'minutes');
 *
 * // 1 hour from now
 * const oneHourFromNow = relativeTime(1, 'hours');
 *
 * // 30 seconds ago from a specific date
 * const relative = relativeTime(-30, 'seconds', baseDate);
 * ```
 */
export function relativeTime(
  amount: number,
  unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days',
  baseDate: Date = new Date()
): Date {
  const multipliers: Record<typeof unit, number> = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  return new Date(baseDate.getTime() + amount * multipliers[unit]);
}

/**
 * Wait for a condition to be true (useful for async testing)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock date that can be used with Date constructor spying
 */
export function mockDate(date: Date): jest.SpyInstance {
  const spy = jest.spyOn(global, 'Date').mockImplementation((...args: unknown[]) => {
    if (args.length === 0) {
      return date;
    }
    // @ts-expect-error - Date constructor overloads
    return new (Function.prototype.bind.apply(Date, [null, ...args]))();
  });

  // Also mock Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(date.getTime());

  return spy;
}

/**
 * Reset date mocks created by mockDate
 */
export function resetDateMocks(): void {
  jest.restoreAllMocks();
}

/**
 * Execute a function with time frozen at a specific date
 */
export async function withFrozenTime<T>(date: Date, fn: () => T | Promise<T>): Promise<T> {
  const helper = new TimeTestHelper();
  helper.freezeTime(date);
  try {
    return await fn();
  } finally {
    helper.reset();
  }
}
