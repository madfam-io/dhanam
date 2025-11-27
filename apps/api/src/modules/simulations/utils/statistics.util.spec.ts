import { StatisticsUtil } from './statistics.util';

describe('StatisticsUtil', () => {
  describe('Basic Statistics', () => {
    const data = [10, 20, 30, 40, 50];

    it('should calculate mean correctly', () => {
      expect(StatisticsUtil.mean(data)).toBe(30);
    });

    it('should calculate median correctly for odd length array', () => {
      expect(StatisticsUtil.median(data)).toBe(30);
    });

    it('should calculate median correctly for even length array', () => {
      const evenData = [10, 20, 30, 40];
      expect(StatisticsUtil.median(evenData)).toBe(25);
    });

    it('should calculate standard deviation correctly', () => {
      const result = StatisticsUtil.stdDev(data);
      expect(result).toBeCloseTo(15.811, 2); // Sample std dev
    });

    it('should calculate variance correctly', () => {
      const result = StatisticsUtil.variance(data);
      expect(result).toBeCloseTo(250, 0); // Sample variance
    });

    it('should calculate min correctly', () => {
      expect(StatisticsUtil.min(data)).toBe(10);
    });

    it('should calculate max correctly', () => {
      expect(StatisticsUtil.max(data)).toBe(50);
    });

    it('should calculate sum correctly', () => {
      expect(StatisticsUtil.sum(data)).toBe(150);
    });
  });

  describe('Percentiles', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100

    it('should calculate 10th percentile correctly', () => {
      const result = StatisticsUtil.percentile(data, 0.1);
      // Linear interpolation gives ~10.9 for 10th percentile of 1-100
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(11);
    });

    it('should calculate 25th percentile correctly', () => {
      const result = StatisticsUtil.percentile(data, 0.25);
      expect(result).toBeGreaterThanOrEqual(25);
      expect(result).toBeLessThanOrEqual(26);
    });

    it('should calculate 50th percentile (median) correctly', () => {
      const result = StatisticsUtil.percentile(data, 0.5);
      expect(result).toBeGreaterThanOrEqual(50);
      expect(result).toBeLessThanOrEqual(51);
    });

    it('should calculate 75th percentile correctly', () => {
      const result = StatisticsUtil.percentile(data, 0.75);
      expect(result).toBeGreaterThanOrEqual(75);
      expect(result).toBeLessThanOrEqual(76);
    });

    it('should calculate 90th percentile correctly', () => {
      const result = StatisticsUtil.percentile(data, 0.9);
      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(91);
    });
  });

  describe('Summary Statistics', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);

    it('should return comprehensive summary', () => {
      const summary = StatisticsUtil.summary(data);

      expect(summary.mean).toBeCloseTo(50.5, 1);
      expect(summary.median).toBeCloseTo(50.5, 1);
      expect(summary.stdDev).toBeGreaterThan(0);
      expect(summary.min).toBe(1);
      expect(summary.max).toBe(100);
      // Percentiles use linear interpolation, so values may not be exact integers
      expect(summary.p10).toBeGreaterThanOrEqual(10);
      expect(summary.p10).toBeLessThanOrEqual(11);
      expect(summary.p25).toBeGreaterThanOrEqual(25);
      expect(summary.p25).toBeLessThanOrEqual(26);
      expect(summary.p75).toBeGreaterThanOrEqual(75);
      expect(summary.p75).toBeLessThanOrEqual(76);
      expect(summary.p90).toBeGreaterThanOrEqual(90);
      expect(summary.p90).toBeLessThanOrEqual(91);
    });
  });

  describe('Correlation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = StatisticsUtil.correlation(x, y);
      expect(result).toBeCloseTo(1.0, 2);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const result = StatisticsUtil.correlation(x, y);
      expect(result).toBeCloseTo(-1.0, 2);
    });

    it('should calculate zero correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 3, 3, 3, 3]; // Constant
      const result = StatisticsUtil.correlation(x, y);
      expect(result).toBe(0);
    });

    it('should throw error for arrays of different lengths', () => {
      const x = [1, 2, 3];
      const y = [1, 2];
      expect(() => StatisticsUtil.correlation(x, y)).toThrow();
    });
  });

  describe('Random Number Generation', () => {
    it('should generate random normal numbers with correct distribution', () => {
      const samples = 10000;
      const mean = 0;
      const stdDev = 1;
      const values: number[] = [];

      for (let i = 0; i < samples; i++) {
        values.push(StatisticsUtil.randomNormal(mean, stdDev));
      }

      const sampleMean = StatisticsUtil.mean(values);
      const sampleStdDev = StatisticsUtil.stdDev(values);

      // With 10000 samples, should be close to target
      expect(sampleMean).toBeCloseTo(mean, 0.1);
      expect(sampleStdDev).toBeCloseTo(stdDev, 0.1);
    });

    it('should generate uniform random numbers between 0 and 1', () => {
      const samples = 1000;
      for (let i = 0; i < samples; i++) {
        const value = StatisticsUtil.randomUniform();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('Normal Distribution CDF', () => {
    it('should calculate CDF for standard normal at mean', () => {
      const result = StatisticsUtil.normalCDF(0, 0, 1);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should calculate CDF for standard normal at +1 std dev', () => {
      const result = StatisticsUtil.normalCDF(1, 0, 1);
      expect(result).toBeCloseTo(0.8413, 2); // ~84.13%
    });

    it('should calculate CDF for standard normal at -1 std dev', () => {
      const result = StatisticsUtil.normalCDF(-1, 0, 1);
      expect(result).toBeCloseTo(0.1587, 2); // ~15.87%
    });
  });

  describe('Return Conversions', () => {
    it('should convert annual return to monthly correctly', () => {
      const annualReturn = 0.1; // 10% annual
      const monthlyReturn = StatisticsUtil.monthlyReturn(annualReturn);

      // (1 + 0.10)^(1/12) - 1 ≈ 0.00797
      expect(monthlyReturn).toBeCloseTo(0.00797, 4);
    });

    it('should convert monthly return to annual correctly', () => {
      const monthlyReturn = 0.00797;
      const annualReturn = StatisticsUtil.annualizeReturn(monthlyReturn);

      // (1 + 0.00797)^12 - 1 ≈ 0.10
      expect(annualReturn).toBeCloseTo(0.1, 2);
    });

    it('should convert annual volatility to monthly correctly', () => {
      const annualVolatility = 0.2; // 20% annual
      const monthlyVolatility = StatisticsUtil.monthlyVolatility(annualVolatility);

      // 0.20 / sqrt(12) ≈ 0.0577
      expect(monthlyVolatility).toBeCloseTo(0.0577, 3);
    });

    it('should convert monthly volatility to annual correctly', () => {
      const monthlyVolatility = 0.0577;
      const annualVolatility = StatisticsUtil.annualizeVolatility(monthlyVolatility);

      // 0.0577 * sqrt(12) ≈ 0.20
      expect(annualVolatility).toBeCloseTo(0.2, 2);
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate CAGR correctly', () => {
      const beginningValue = 10000;
      const endingValue = 20000;
      const years = 10;

      const cagr = StatisticsUtil.cagr(beginningValue, endingValue, years);

      // (20000/10000)^(1/10) - 1 ≈ 0.0718 (7.18%)
      expect(cagr).toBeCloseTo(0.0718, 3);
    });

    it('should calculate future value correctly', () => {
      const presentValue = 10000;
      const rate = 0.07;
      const periods = 10;

      const fv = StatisticsUtil.futureValue(presentValue, rate, periods);

      // 10000 * (1.07)^10 ≈ 19671.51
      expect(fv).toBeCloseTo(19671.51, 0);
    });

    it('should calculate present value correctly', () => {
      const futureValue = 19671.51;
      const rate = 0.07;
      const periods = 10;

      const pv = StatisticsUtil.presentValue(futureValue, rate, periods);

      // 19671.51 / (1.07)^10 ≈ 10000
      expect(pv).toBeCloseTo(10000, 0);
    });

    it('should calculate annuity payment correctly', () => {
      const presentValue = 100000;
      const rate = 0.05 / 12; // 5% annual, monthly payments
      const periods = 360; // 30 years

      const payment = StatisticsUtil.annuityPayment(presentValue, rate, periods);

      // Standard mortgage formula
      expect(payment).toBeCloseTo(536.82, 1);
    });
  });

  describe('Risk Metrics', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const returns = [0.1, 0.12, 0.08, 0.15, 0.05];
      const riskFreeRate = 0.03;

      const sharpe = StatisticsUtil.sharpeRatio(returns, riskFreeRate);

      // (mean - rf) / stdDev
      expect(sharpe).toBeGreaterThan(0);
      expect(sharpe).toBeLessThan(5); // Sanity check
    });

    it('should calculate Value at Risk correctly', () => {
      // Using return rates, not absolute values
      const meanReturn = 0.08; // 8% expected return
      const stdDevReturn = 0.15; // 15% volatility
      const confidenceLevel = 0.95;
      const initialValue = 100000;

      const var95 = StatisticsUtil.valueAtRisk(
        meanReturn,
        stdDevReturn,
        confidenceLevel,
        initialValue
      );

      // At 95% confidence with positive expected return and reasonable volatility
      // VaR should be a positive number representing potential loss
      expect(var95).toBeGreaterThan(0);
      expect(var95).toBeLessThan(initialValue);
    });

    it('should calculate maximum drawdown correctly', () => {
      const values = [100, 110, 105, 120, 90, 95, 115];
      const maxDD = StatisticsUtil.maxDrawdown(values);

      // Peak at 120, trough at 90: (90-120)/120 = -0.25
      expect(maxDD).toBeCloseTo(-0.25, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays gracefully', () => {
      // Empty arrays return 0 instead of throwing for graceful degradation
      expect(StatisticsUtil.mean([])).toBe(0);
      expect(StatisticsUtil.sum([])).toBe(0);
      expect(StatisticsUtil.min([])).toBe(0);
      expect(StatisticsUtil.max([])).toBe(0);
    });

    it('should handle single value arrays', () => {
      const single = [42];
      expect(StatisticsUtil.mean(single)).toBe(42);
      expect(StatisticsUtil.median(single)).toBe(42);
      expect(StatisticsUtil.stdDev(single)).toBe(0);
    });

    it('should handle negative values correctly', () => {
      const negatives = [-10, -20, -30];
      expect(StatisticsUtil.mean(negatives)).toBe(-20);
      expect(StatisticsUtil.median(negatives)).toBe(-20);
    });

    it('should handle very large numbers', () => {
      const largeNumbers = [1e10, 2e10, 3e10];
      expect(StatisticsUtil.mean(largeNumbers)).toBe(2e10);
    });
  });

  describe('Sorting Invariance', () => {
    it('should produce same results regardless of input order for mean', () => {
      const sorted = [1, 2, 3, 4, 5];
      const unsorted = [3, 1, 5, 2, 4];

      expect(StatisticsUtil.mean(sorted)).toBe(StatisticsUtil.mean(unsorted));
    });

    it('should produce same results regardless of input order for median', () => {
      const sorted = [1, 2, 3, 4, 5];
      const unsorted = [3, 1, 5, 2, 4];

      expect(StatisticsUtil.median(sorted)).toBe(StatisticsUtil.median(unsorted));
    });

    it('should produce same results regardless of input order for percentiles', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const unsorted = [7, 3, 9, 1, 5, 2, 10, 4, 6, 8];

      expect(StatisticsUtil.percentile(sorted, 0.75)).toBeCloseTo(
        StatisticsUtil.percentile(unsorted, 0.75),
        2
      );
    });
  });
});
