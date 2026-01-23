import { ESGScoringUtils } from '../utils/scoring';
import { ESGMetrics, ESGScore } from '../types/esg.types';

describe('ESGScoringUtils', () => {
  describe('calculateCompositeScore', () => {
    it('should calculate weighted average with default weights', () => {
      const score = ESGScoringUtils.calculateCompositeScore(80, 70, 60);
      // Default weights: env=0.4, soc=0.3, gov=0.3
      // (80*0.4 + 70*0.3 + 60*0.3) / 1.0 = 32 + 21 + 18 = 71
      expect(score).toBe(71);
    });

    it('should calculate with custom weights', () => {
      const score = ESGScoringUtils.calculateCompositeScore(100, 50, 50, {
        environmental: 0.5,
        social: 0.25,
        governance: 0.25,
      });
      // (100*0.5 + 50*0.25 + 50*0.25) / 1.0 = 50 + 12.5 + 12.5 = 75
      expect(score).toBe(75);
    });

    it('should handle all zeros', () => {
      const score = ESGScoringUtils.calculateCompositeScore(0, 0, 0);
      expect(score).toBe(0);
    });

    it('should handle all perfect scores', () => {
      const score = ESGScoringUtils.calculateCompositeScore(100, 100, 100);
      expect(score).toBe(100);
    });
  });

  describe('calculateEnvironmentalScore', () => {
    it('should penalize Proof of Work consensus', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pow' };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 - 30 (PoW penalty) = 20
      expect(score).toBe(20);
    });

    it('should reward Proof of Stake consensus', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos' };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 + 20 (PoS bonus) = 70
      expect(score).toBe(70);
    });

    it('should reward Delegated Proof of Stake', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'dpos' };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 + 15 (DPoS bonus) = 65
      expect(score).toBe(65);
    });

    it('should give small bonus for hybrid consensus', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'hybrid' };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 + 5 (hybrid bonus) = 55
      expect(score).toBe(55);
    });

    it('should reward low energy intensity', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos', energyIntensity: 0.05 };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 + 20 (PoS) + 20 (low energy) = 90
      expect(score).toBe(90);
    });

    it('should penalize high energy intensity', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pow', energyIntensity: 150 };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 - 30 (PoW) - 20 (high energy) = 0
      expect(score).toBe(0);
    });

    it('should reward low carbon intensity', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos', carbonIntensity: 5 };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 + 20 (PoS) + 15 (low carbon) = 85
      expect(score).toBe(85);
    });

    it('should penalize high carbon intensity', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pow', carbonIntensity: 600 };
      const score = ESGScoringUtils.calculateEnvironmentalScore(metrics);
      // Base 50 - 30 (PoW) - 20 (high carbon) = 0
      expect(score).toBe(0);
    });

    it('should clamp score to 0-100 range', () => {
      // Very good metrics
      const goodMetrics: ESGMetrics = {
        consensusMechanism: 'pos',
        energyIntensity: 0.01,
        carbonIntensity: 1,
      };
      expect(ESGScoringUtils.calculateEnvironmentalScore(goodMetrics)).toBeLessThanOrEqual(100);

      // Very bad metrics
      const badMetrics: ESGMetrics = {
        consensusMechanism: 'pow',
        energyIntensity: 200,
        carbonIntensity: 1000,
      };
      expect(ESGScoringUtils.calculateEnvironmentalScore(badMetrics)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateSocialScore', () => {
    it('should return base score with no metrics', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos' };
      const score = ESGScoringUtils.calculateSocialScore(metrics);
      expect(score).toBe(50);
    });

    it('should increase score with high community engagement', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        communityEngagement: 80,
      };
      const score = ESGScoringUtils.calculateSocialScore(metrics);
      // Base 50 + (80-50)*0.5 = 50 + 15 = 65
      expect(score).toBe(65);
    });

    it('should decrease score with low community engagement', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        communityEngagement: 20,
      };
      const score = ESGScoringUtils.calculateSocialScore(metrics);
      // Base 50 + (20-50)*0.5 = 50 - 15 = 35
      expect(score).toBe(35);
    });

    it('should factor in developer activity', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        developerActivity: 90,
      };
      const score = ESGScoringUtils.calculateSocialScore(metrics);
      // Base 50 + (90-50)*0.3 = 50 + 12 = 62
      expect(score).toBe(62);
    });

    it('should combine community and developer metrics', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        communityEngagement: 80,
        developerActivity: 90,
      };
      const score = ESGScoringUtils.calculateSocialScore(metrics);
      // Base 50 + (80-50)*0.5 + (90-50)*0.3 = 50 + 15 + 12 = 77
      expect(score).toBe(77);
    });
  });

  describe('calculateGovernanceScore', () => {
    it('should return base score with no metrics', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos' };
      const score = ESGScoringUtils.calculateGovernanceScore(metrics);
      expect(score).toBe(50);
    });

    it('should factor in decentralization score', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        decentralizationScore: 80,
      };
      const score = ESGScoringUtils.calculateGovernanceScore(metrics);
      // Base 50 + (80-50)*0.4 = 50 + 12 = 62
      expect(score).toBe(62);
    });

    it('should factor in transparency score', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        transparencyScore: 90,
      };
      const score = ESGScoringUtils.calculateGovernanceScore(metrics);
      // Base 50 + (90-50)*0.3 = 50 + 12 = 62
      expect(score).toBe(62);
    });

    it('should factor in regulatory compliance', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        regulatoryCompliance: 100,
      };
      const score = ESGScoringUtils.calculateGovernanceScore(metrics);
      // Base 50 + (100-50)*0.3 = 50 + 15 = 65
      expect(score).toBe(65);
    });

    it('should combine all governance metrics', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        decentralizationScore: 80,
        transparencyScore: 90,
        regulatoryCompliance: 100,
      };
      const score = ESGScoringUtils.calculateGovernanceScore(metrics);
      // Base 50 + (80-50)*0.4 + (90-50)*0.3 + (100-50)*0.3 = 50 + 12 + 12 + 15 = 89
      expect(score).toBe(89);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should have base confidence for minimal data', () => {
      const metrics: ESGMetrics = { consensusMechanism: 'pos' };
      const score = ESGScoringUtils.calculateConfidenceScore(metrics);
      // Base 30 + 10 (consensus mechanism) = 40
      expect(score).toBe(40);
    });

    it('should increase confidence with more metrics', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        energyIntensity: 1,
        carbonIntensity: 10,
        decentralizationScore: 70,
        developerActivity: 80,
        communityEngagement: 75,
        transparencyScore: 85,
        regulatoryCompliance: 90,
      };
      const score = ESGScoringUtils.calculateConfidenceScore(metrics);
      // Base 30 + 7*10 (all metrics) + 10 (consensus) = 30 + 70 + 10 = 110 → clamped to 100
      expect(score).toBe(100);
    });

    it('should clamp confidence to 100', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        energyIntensity: 1,
        carbonIntensity: 10,
        decentralizationScore: 70,
        developerActivity: 80,
        communityEngagement: 75,
        transparencyScore: 85,
        regulatoryCompliance: 90,
      };
      const score = ESGScoringUtils.calculateConfidenceScore(metrics);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateESGScore', () => {
    it('should generate complete ESG score object', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
        energyIntensity: 0.1,
        carbonIntensity: 20,
        communityEngagement: 75,
        developerActivity: 80,
        decentralizationScore: 70,
        transparencyScore: 85,
      };

      const score = ESGScoringUtils.generateESGScore(metrics);

      expect(score.overall).toBeDefined();
      expect(score.environmental).toBeDefined();
      expect(score.social).toBeDefined();
      expect(score.governance).toBeDefined();
      expect(score.confidence).toBeDefined();
      expect(score.lastUpdated).toBeInstanceOf(Date);
      expect(score.methodology).toBe('Dhanam Composite v2.0');
      expect(score.sources).toContain('Metrics-based calculation');
    });

    it('should use custom weights when provided', () => {
      const metrics: ESGMetrics = {
        consensusMechanism: 'pos',
      };

      const customWeights = {
        environmental: 0.6,
        social: 0.2,
        governance: 0.2,
      };

      const defaultScore = ESGScoringUtils.generateESGScore(metrics);
      const customScore = ESGScoringUtils.generateESGScore(metrics, customWeights);

      // Environmental is higher for PoS, so custom weights should produce different overall
      expect(customScore.overall).not.toBe(defaultScore.overall);
    });
  });

  describe('compareScores', () => {
    const scoreA: ESGScore = {
      overall: 75,
      environmental: 80,
      social: 70,
      governance: 75,
      confidence: 85,
      lastUpdated: new Date(),
      methodology: 'Test',
      sources: [],
    };

    const scoreB: ESGScore = {
      overall: 65,
      environmental: 60,
      social: 70,
      governance: 65,
      confidence: 80,
      lastUpdated: new Date(),
      methodology: 'Test',
      sources: [],
    };

    it('should identify A as better when difference > 2', () => {
      const result = ESGScoringUtils.compareScores(scoreA, scoreB);
      expect(result.better).toBe('A');
      expect(result.difference).toBe(10);
    });

    it('should identify B as better when B has higher score', () => {
      const result = ESGScoringUtils.compareScores(scoreB, scoreA);
      expect(result.better).toBe('B');
    });

    it('should return tie for similar scores', () => {
      const similarScore: ESGScore = { ...scoreA, overall: 74 };
      const result = ESGScoringUtils.compareScores(scoreA, similarScore);
      expect(result.better).toBe('tie');
    });

    it('should identify improvement areas', () => {
      const lowEnvScore: ESGScore = { ...scoreA, environmental: 50 };
      const result = ESGScoringUtils.compareScores(lowEnvScore, scoreB);
      expect(result.improvementAreas).toContain('Environmental');
    });
  });

  describe('validateScore', () => {
    it('should pass for valid score', () => {
      const validScore: ESGScore = {
        overall: 75,
        environmental: 80,
        social: 70,
        governance: 75,
        confidence: 85,
        lastUpdated: new Date(),
        methodology: 'Test',
        sources: [],
      };

      const result = ESGScoringUtils.validateScore(validScore);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for out-of-range overall score', () => {
      const invalidScore: ESGScore = {
        overall: 150,
        environmental: 80,
        social: 70,
        governance: 75,
        confidence: 85,
        lastUpdated: new Date(),
        methodology: 'Test',
        sources: [],
      };

      const result = ESGScoringUtils.validateScore(invalidScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Overall score must be between 0-100');
    });

    it('should fail for negative scores', () => {
      const invalidScore: ESGScore = {
        overall: 50,
        environmental: -10,
        social: 70,
        governance: 75,
        confidence: 85,
        lastUpdated: new Date(),
        methodology: 'Test',
        sources: [],
      };

      const result = ESGScoringUtils.validateScore(invalidScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Environmental score must be between 0-100');
    });

    it('should fail for future lastUpdated date', () => {
      const invalidScore: ESGScore = {
        overall: 75,
        environmental: 80,
        social: 70,
        governance: 75,
        confidence: 85,
        lastUpdated: new Date(Date.now() + 100000),
        methodology: 'Test',
        sources: [],
      };

      const result = ESGScoringUtils.validateScore(invalidScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Last updated cannot be in the future');
    });

    it('should warn for stale data (older than 7 days)', () => {
      const staleScore: ESGScore = {
        overall: 75,
        environmental: 80,
        social: 70,
        governance: 75,
        confidence: 85,
        lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        methodology: 'Test',
        sources: [],
      };

      const result = ESGScoringUtils.validateScore(staleScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ESG data is older than 7 days');
    });
  });
});
