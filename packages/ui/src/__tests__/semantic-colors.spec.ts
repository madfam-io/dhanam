import {
  semanticColorTokens,
  tailwindSemanticColors,
  semanticColorCSSVariables,
  semanticColorCSSVariablesDark,
} from '../tokens/semantic-colors';

describe('Semantic Color Tokens', () => {
  describe('semanticColorTokens', () => {
    describe('light mode', () => {
      it('should have status colors', () => {
        expect(semanticColorTokens.light).toHaveProperty('success');
        expect(semanticColorTokens.light).toHaveProperty('successForeground');
        expect(semanticColorTokens.light).toHaveProperty('warning');
        expect(semanticColorTokens.light).toHaveProperty('warningForeground');
        expect(semanticColorTokens.light).toHaveProperty('info');
        expect(semanticColorTokens.light).toHaveProperty('infoForeground');
      });

      it('should have background variants', () => {
        expect(semanticColorTokens.light).toHaveProperty('successBg');
        expect(semanticColorTokens.light).toHaveProperty('warningBg');
        expect(semanticColorTokens.light).toHaveProperty('infoBg');
        expect(semanticColorTokens.light).toHaveProperty('destructiveBg');
      });

      it('should have financial context colors', () => {
        expect(semanticColorTokens.light).toHaveProperty('income');
        expect(semanticColorTokens.light).toHaveProperty('expense');
        expect(semanticColorTokens.light).toHaveProperty('transfer');
      });

      it('should have goal health indicators', () => {
        expect(semanticColorTokens.light).toHaveProperty('goalExcellent');
        expect(semanticColorTokens.light).toHaveProperty('goalOnTrack');
        expect(semanticColorTokens.light).toHaveProperty('goalAttention');
        expect(semanticColorTokens.light).toHaveProperty('goalAtRisk');
      });

      it('color values should be valid HSL format', () => {
        Object.entries(semanticColorTokens.light).forEach(([_key, value]) => {
          // HSL format: "H S% L%" (e.g., "142.1 76.2% 36.3%")
          expect(value).toMatch(/^[\d.]+ [\d.]+% [\d.]+%$/);
        });
      });

      it('success color should be green (hue ~142)', () => {
        const hue = parseFloat(semanticColorTokens.light.success.split(' ')[0] ?? '0');
        expect(hue).toBeCloseTo(142, 0);
      });

      it('warning color should be yellow/orange (hue ~38)', () => {
        const hue = parseFloat(semanticColorTokens.light.warning.split(' ')[0] ?? '0');
        expect(hue).toBeCloseTo(38, 0);
      });

      it('info color should be blue (hue ~217)', () => {
        const hue = parseFloat(semanticColorTokens.light.info.split(' ')[0] ?? '0');
        expect(hue).toBeCloseTo(217, 0);
      });
    });

    describe('dark mode', () => {
      it('should have all the same keys as light mode', () => {
        const lightKeys = Object.keys(semanticColorTokens.light);
        const darkKeys = Object.keys(semanticColorTokens.dark);
        expect(darkKeys.sort()).toEqual(lightKeys.sort());
      });

      it('dark colors should have higher lightness for main colors', () => {
        const lightSuccess = parseFloat(semanticColorTokens.light.success.split(' ')[2] ?? '0');
        const darkSuccess = parseFloat(semanticColorTokens.dark.success.split(' ')[2] ?? '0');
        expect(darkSuccess).toBeGreaterThan(lightSuccess);
      });

      it('dark background colors should have lower lightness', () => {
        const lightBg = parseFloat(semanticColorTokens.light.successBg.split(' ')[2] ?? '0');
        const darkBg = parseFloat(semanticColorTokens.dark.successBg.split(' ')[2] ?? '0');
        expect(darkBg).toBeLessThan(lightBg);
      });
    });
  });

  describe('tailwindSemanticColors', () => {
    it('should have success color with foreground', () => {
      expect(tailwindSemanticColors.success).toHaveProperty('DEFAULT');
      expect(tailwindSemanticColors.success).toHaveProperty('foreground');
    });

    it('should have warning color with foreground', () => {
      expect(tailwindSemanticColors.warning).toHaveProperty('DEFAULT');
      expect(tailwindSemanticColors.warning).toHaveProperty('foreground');
    });

    it('should have info color with foreground', () => {
      expect(tailwindSemanticColors.info).toHaveProperty('DEFAULT');
      expect(tailwindSemanticColors.info).toHaveProperty('foreground');
    });

    it('should have financial colors', () => {
      expect(tailwindSemanticColors).toHaveProperty('income');
      expect(tailwindSemanticColors).toHaveProperty('expense');
      expect(tailwindSemanticColors).toHaveProperty('transfer');
    });

    it('should have goal health colors', () => {
      expect(tailwindSemanticColors).toHaveProperty('goal-excellent');
      expect(tailwindSemanticColors).toHaveProperty('goal-on-track');
      expect(tailwindSemanticColors).toHaveProperty('goal-attention');
      expect(tailwindSemanticColors).toHaveProperty('goal-at-risk');
    });

    it('color values should use hsl(var()) format', () => {
      expect(tailwindSemanticColors.success.DEFAULT).toContain('hsl(var(--success))');
      expect(tailwindSemanticColors.warning.DEFAULT).toContain('hsl(var(--warning))');
      expect(tailwindSemanticColors.info.DEFAULT).toContain('hsl(var(--info))');
    });
  });

  describe('CSS Variables', () => {
    describe('light mode', () => {
      it('should be a non-empty string', () => {
        expect(typeof semanticColorCSSVariables).toBe('string');
        expect(semanticColorCSSVariables.length).toBeGreaterThan(0);
      });

      it('should include status colors', () => {
        expect(semanticColorCSSVariables).toContain('--success:');
        expect(semanticColorCSSVariables).toContain('--success-foreground:');
        expect(semanticColorCSSVariables).toContain('--warning:');
        expect(semanticColorCSSVariables).toContain('--info:');
      });

      it('should include background variants', () => {
        expect(semanticColorCSSVariables).toContain('--success-bg:');
        expect(semanticColorCSSVariables).toContain('--warning-bg:');
        expect(semanticColorCSSVariables).toContain('--info-bg:');
        expect(semanticColorCSSVariables).toContain('--destructive-bg:');
      });

      it('should include financial colors', () => {
        expect(semanticColorCSSVariables).toContain('--income:');
        expect(semanticColorCSSVariables).toContain('--expense:');
        expect(semanticColorCSSVariables).toContain('--transfer:');
      });

      it('should include goal health colors', () => {
        expect(semanticColorCSSVariables).toContain('--goal-excellent:');
        expect(semanticColorCSSVariables).toContain('--goal-on-track:');
        expect(semanticColorCSSVariables).toContain('--goal-attention:');
        expect(semanticColorCSSVariables).toContain('--goal-at-risk:');
      });
    });

    describe('dark mode', () => {
      it('should be a non-empty string', () => {
        expect(typeof semanticColorCSSVariablesDark).toBe('string');
        expect(semanticColorCSSVariablesDark.length).toBeGreaterThan(0);
      });

      it('should include all the same variables as light mode', () => {
        // Extract variable names from light mode
        const lightVars = semanticColorCSSVariables.match(/--[\w-]+:/g) || [];

        // Check each appears in dark mode
        lightVars.forEach((varName) => {
          expect(semanticColorCSSVariablesDark).toContain(varName);
        });
      });

      it('should have Dark Mode comment', () => {
        expect(semanticColorCSSVariablesDark).toContain('Dark Mode');
      });
    });
  });

  describe('Color Consistency', () => {
    it('income should match success color (positive)', () => {
      expect(semanticColorTokens.light.income).toBe(semanticColorTokens.light.success);
    });

    it('goal excellent should match success color', () => {
      expect(semanticColorTokens.light.goalExcellent).toBe(semanticColorTokens.light.success);
    });

    it('goal at risk should match expense color', () => {
      expect(semanticColorTokens.light.goalAtRisk).toBe(semanticColorTokens.light.expense);
    });

    it('goal attention should match warning color', () => {
      expect(semanticColorTokens.light.goalAttention).toBe(semanticColorTokens.light.warning);
    });

    it('transfer should match info color', () => {
      expect(semanticColorTokens.light.transfer).toBe(semanticColorTokens.light.info);
    });
  });
});
