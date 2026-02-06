import { ML_THRESHOLDS } from '@dhanam/shared';
import { Injectable } from '@nestjs/common';

/**
 * Fuzzy string matching service using Levenshtein distance algorithm
 * Provides intelligent matching for merchant names and descriptions
 */
@Injectable()
export class FuzzyMatcherService {
  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of single-character edits needed to transform one string into the other
   */
  levenshteinDistance(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // Create distance matrix
    const matrix: number[][] = [];

    // Initialize first row and column
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[s1.length][s2.length];
  }

  /**
   * Calculate similarity ratio between two strings (0 to 1)
   * 1 = identical, 0 = completely different
   */
  similarityRatio(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1;

    return 1 - distance / maxLength;
  }

  /**
   * Find the best match for a target string from a list of candidates
   * Returns the best match and its similarity score
   */
  findBestMatch(
    target: string,
    candidates: string[]
  ): { match: string | null; similarity: number; index: number } {
    if (!target || candidates.length === 0) {
      return { match: null, similarity: 0, index: -1 };
    }

    let bestMatch: string | null = null;
    let bestSimilarity = 0;
    let bestIndex = -1;

    for (let i = 0; i < candidates.length; i++) {
      const similarity = this.similarityRatio(target, candidates[i]);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = candidates[i];
        bestIndex = i;
      }
    }

    return { match: bestMatch, similarity: bestSimilarity, index: bestIndex };
  }

  /**
   * Find all matches above a certain similarity threshold
   */
  findAllMatches(
    target: string,
    candidates: string[],
    threshold: number = ML_THRESHOLDS.FUZZY_MATCH_SCORE
  ): Array<{ match: string; similarity: number; index: number }> {
    if (!target || candidates.length === 0) {
      return [];
    }

    const matches: Array<{ match: string; similarity: number; index: number }> = [];

    for (let i = 0; i < candidates.length; i++) {
      const similarity = this.similarityRatio(target, candidates[i]);
      if (similarity >= threshold) {
        matches.push({ match: candidates[i], similarity, index: i });
      }
    }

    // Sort by similarity descending
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Check if two strings are similar enough to be considered a match
   */
  isMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    return this.similarityRatio(str1, str2) >= threshold;
  }

  /**
   * Calculate Jaro-Winkler similarity (good for short strings like names)
   * Returns value between 0 and 1
   */
  jaroWinklerSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;

    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0 || len2 === 0) return 0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matching characters
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

    // Calculate common prefix length (max 4 characters)
    let prefixLength = 0;
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
      if (s1[i] === s2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    // Jaro-Winkler uses a scaling factor of 0.1
    return jaro + prefixLength * 0.1 * (1 - jaro);
  }

  /**
   * Get token-based similarity (good for longer strings with multiple words)
   * Uses Jaccard similarity on word tokens
   */
  tokenSimilarity(str1: string, str2: string): number {
    const tokens1 = this.tokenize(str1);
    const tokens2 = this.tokenize(str2);

    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize a string into words, removing common stop words and noise
   */
  private tokenize(str: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'as',
      'is',
      'it',
      'that',
      'this',
    ]);

    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));
  }

  /**
   * Combined similarity score using multiple algorithms
   * Useful for merchant name matching where we want robust matching
   */
  combinedSimilarity(str1: string, str2: string): number {
    const levenshtein = this.similarityRatio(str1, str2);
    const jaroWinkler = this.jaroWinklerSimilarity(str1, str2);
    const tokenBased = this.tokenSimilarity(str1, str2);

    // Weight: Levenshtein 40%, Jaro-Winkler 40%, Token 20%
    return levenshtein * 0.4 + jaroWinkler * 0.4 + tokenBased * 0.2;
  }
}
