import { ESGScore, ESGMetrics } from '../types/esg.types';

export class ESGScoringUtils {
  /**
   * Calculate composite ESG score from individual components
   */
  static calculateCompositeScore(
    environmental: number,
    social: number,
    governance: number,
    weights: { environmental: number; social: number; governance: number } = {
      environmental: 0.4,
      social: 0.3,
      governance: 0.3,
    }
  ): number {
    const totalWeight = weights.environmental + weights.social + weights.governance;
    
    return Math.round(
      (environmental * weights.environmental +
       social * weights.social +
       governance * weights.governance) / totalWeight
    );
  }

  /**
   * Calculate environmental score based on energy and carbon metrics
   */
  static calculateEnvironmentalScore(metrics: ESGMetrics): number {
    let score = 50; // Base score

    // Consensus mechanism impact
    switch (metrics.consensusMechanism) {
      case 'pow':
        score -= 30; // Proof of Work penalty
        break;
      case 'pos':
        score += 20; // Proof of Stake bonus
        break;
      case 'dpos':
        score += 15; // Delegated Proof of Stake bonus
        break;
      case 'hybrid':
        score += 5; // Small bonus for hybrid
        break;
    }

    // Energy intensity impact (if available)
    if (metrics.energyIntensity !== undefined) {
      if (metrics.energyIntensity < 0.1) score += 20;
      else if (metrics.energyIntensity < 1) score += 10;
      else if (metrics.energyIntensity > 100) score -= 20;
      else if (metrics.energyIntensity > 10) score -= 10;
    }

    // Carbon intensity impact (if available)
    if (metrics.carbonIntensity !== undefined) {
      if (metrics.carbonIntensity < 10) score += 15;
      else if (metrics.carbonIntensity < 50) score += 5;
      else if (metrics.carbonIntensity > 500) score -= 20;
      else if (metrics.carbonIntensity > 100) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate social score based on community and adoption metrics
   */
  static calculateSocialScore(metrics: ESGMetrics): number {
    let score = 50; // Base score

    // Community engagement impact
    if (metrics.communityEngagement !== undefined) {
      score += (metrics.communityEngagement - 50) * 0.5;
    }

    // Developer activity impact
    if (metrics.developerActivity !== undefined) {
      score += (metrics.developerActivity - 50) * 0.3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate governance score based on decentralization and transparency
   */
  static calculateGovernanceScore(metrics: ESGMetrics): number {
    let score = 50; // Base score

    // Decentralization impact
    if (metrics.decentralizationScore !== undefined) {
      score += (metrics.decentralizationScore - 50) * 0.4;
    }

    // Transparency impact
    if (metrics.transparencyScore !== undefined) {
      score += (metrics.transparencyScore - 50) * 0.3;
    }

    // Regulatory compliance impact
    if (metrics.regulatoryCompliance !== undefined) {
      score += (metrics.regulatoryCompliance - 50) * 0.3;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate confidence score based on data availability and quality
   */
  static calculateConfidenceScore(metrics: ESGMetrics): number {
    let score = 30; // Base confidence

    // Add confidence based on available metrics
    const availableMetrics = [
      metrics.energyIntensity,
      metrics.carbonIntensity,
      metrics.decentralizationScore,
      metrics.developerActivity,
      metrics.communityEngagement,
      metrics.transparencyScore,
      metrics.regulatoryCompliance,
    ].filter(metric => metric !== undefined).length;

    score += availableMetrics * 10; // 10 points per available metric

    // Consensus mechanism is always available, add base confidence
    score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate complete ESG score from metrics
   */
  static generateESGScore(
    metrics: ESGMetrics,
    weights?: { environmental: number; social: number; governance: number }
  ): ESGScore {
    const environmental = this.calculateEnvironmentalScore(metrics);
    const social = this.calculateSocialScore(metrics);
    const governance = this.calculateGovernanceScore(metrics);
    const confidence = this.calculateConfidenceScore(metrics);
    
    const overall = this.calculateCompositeScore(environmental, social, governance, weights);

    return {
      overall,
      environmental,
      social,
      governance,
      confidence,
      lastUpdated: new Date(),
      methodology: 'Dhanam Composite v2.0',
      sources: ['Metrics-based calculation'],
    };
  }

  /**
   * Compare two ESG scores and provide insight
   */
  static compareScores(scoreA: ESGScore, scoreB: ESGScore): {
    better: 'A' | 'B' | 'tie';
    difference: number;
    improvementAreas: string[];
  } {
    const diff = scoreA.overall - scoreB.overall;
    let better: 'A' | 'B' | 'tie' = 'tie';
    
    if (Math.abs(diff) > 2) {
      better = diff > 0 ? 'A' : 'B';
    }

    const improvementAreas = [];
    if (scoreA.environmental < scoreB.environmental - 5) {
      improvementAreas.push('Environmental');
    }
    if (scoreA.social < scoreB.social - 5) {
      improvementAreas.push('Social');
    }
    if (scoreA.governance < scoreB.governance - 5) {
      improvementAreas.push('Governance');
    }

    return {
      better,
      difference: Math.abs(diff),
      improvementAreas,
    };
  }

  /**
   * Validate ESG score data integrity
   */
  static validateScore(score: ESGScore): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check score ranges
    if (score.overall < 0 || score.overall > 100) {
      errors.push('Overall score must be between 0-100');
    }
    if (score.environmental < 0 || score.environmental > 100) {
      errors.push('Environmental score must be between 0-100');
    }
    if (score.social < 0 || score.social > 100) {
      errors.push('Social score must be between 0-100');
    }
    if (score.governance < 0 || score.governance > 100) {
      errors.push('Governance score must be between 0-100');
    }
    if (score.confidence < 0 || score.confidence > 100) {
      errors.push('Confidence score must be between 0-100');
    }

    // Check timestamp
    if (score.lastUpdated > new Date()) {
      errors.push('Last updated cannot be in the future');
    }

    // Check data age (warn if older than 7 days)
    const age = Date.now() - score.lastUpdated.getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) {
      errors.push('ESG data is older than 7 days');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}