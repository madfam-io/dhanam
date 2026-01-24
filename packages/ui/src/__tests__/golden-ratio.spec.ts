import {
  PHI,
  PHI_INVERSE,
  goldenSpacing,
  goldenTypography,
  goldenBorderRadius,
  goldenSizing,
  goldenShadows,
  goldenDurations,
  goldenGrid,
  goldenRatioTailwindExtend,
  goldenCSSVariables,
} from '../tokens/golden-ratio';

describe('Golden Ratio Tokens', () => {
  describe('PHI constant', () => {
    it('should export the golden ratio constant', () => {
      expect(PHI).toBeCloseTo(1.618033988749895, 10);
    });

    it('should export the inverse golden ratio', () => {
      expect(PHI_INVERSE).toBeCloseTo(0.618033988749895, 10);
    });

    it('PHI * PHI_INVERSE should equal 1', () => {
      expect(PHI * PHI_INVERSE).toBeCloseTo(1, 10);
    });

    it('1/PHI should equal PHI_INVERSE', () => {
      expect(1 / PHI).toBeCloseTo(PHI_INVERSE, 10);
    });
  });

  describe('goldenSpacing', () => {
    it('should have all expected spacing keys', () => {
      expect(goldenSpacing).toHaveProperty('phi-3xs');
      expect(goldenSpacing).toHaveProperty('phi-2xs');
      expect(goldenSpacing).toHaveProperty('phi-xs');
      expect(goldenSpacing).toHaveProperty('phi-sm');
      expect(goldenSpacing).toHaveProperty('phi-md');
      expect(goldenSpacing).toHaveProperty('phi-base');
      expect(goldenSpacing).toHaveProperty('phi-lg');
      expect(goldenSpacing).toHaveProperty('phi-xl');
      expect(goldenSpacing).toHaveProperty('phi-2xl');
      expect(goldenSpacing).toHaveProperty('phi-3xl');
    });

    it('phi-md should be 1rem (base unit)', () => {
      expect(goldenSpacing['phi-md']).toBe('1rem');
    });

    it('phi-base should alias phi-md', () => {
      expect(goldenSpacing['phi-base']).toBe('1rem');
    });

    it('phi-lg should be PHI rem', () => {
      expect(goldenSpacing['phi-lg']).toBe(`${PHI}rem`);
    });

    it('phi-xl should be PHI squared rem', () => {
      expect(goldenSpacing['phi-xl']).toBe(`${PHI * PHI}rem`);
    });

    it('phi-xs should be 1/PHI rem', () => {
      expect(goldenSpacing['phi-xs']).toBe(`${1 / PHI}rem`);
    });

    it('spacing values should be valid CSS', () => {
      Object.values(goldenSpacing).forEach((value) => {
        expect(value).toMatch(/^[\d.]+rem$/);
      });
    });
  });

  describe('goldenTypography', () => {
    it('should have all expected typography keys', () => {
      expect(goldenTypography).toHaveProperty('phi-3xs');
      expect(goldenTypography).toHaveProperty('phi-2xs');
      expect(goldenTypography).toHaveProperty('phi-xs');
      expect(goldenTypography).toHaveProperty('phi-sm');
      expect(goldenTypography).toHaveProperty('phi-base');
      expect(goldenTypography).toHaveProperty('phi-lg');
      expect(goldenTypography).toHaveProperty('phi-xl');
      expect(goldenTypography).toHaveProperty('phi-2xl');
      expect(goldenTypography).toHaveProperty('phi-3xl');
      expect(goldenTypography).toHaveProperty('phi-4xl');
    });

    it('typography values should be [fontSize, config] format', () => {
      Object.values(goldenTypography).forEach((value) => {
        expect(Array.isArray(value)).toBe(true);
        expect(value.length).toBe(2);
        expect(typeof value[0]).toBe('string');
        expect(typeof value[1]).toBe('object');
        expect(value[1]).toHaveProperty('lineHeight');
      });
    });

    it('phi-base should be 1rem with golden line height', () => {
      expect(goldenTypography['phi-base'][0]).toBe('1rem');
      expect(goldenTypography['phi-base'][1].lineHeight).toBe(`${PHI}rem`);
    });
  });

  describe('goldenBorderRadius', () => {
    it('should have all expected border radius keys', () => {
      expect(goldenBorderRadius).toHaveProperty('phi-none');
      expect(goldenBorderRadius).toHaveProperty('phi-sm');
      expect(goldenBorderRadius).toHaveProperty('phi');
      expect(goldenBorderRadius).toHaveProperty('phi-md');
      expect(goldenBorderRadius).toHaveProperty('phi-lg');
      expect(goldenBorderRadius).toHaveProperty('phi-xl');
      expect(goldenBorderRadius).toHaveProperty('phi-2xl');
      expect(goldenBorderRadius).toHaveProperty('phi-full');
    });

    it('phi-none should be 0', () => {
      expect(goldenBorderRadius['phi-none']).toBe('0');
    });

    it('phi-full should be 9999px', () => {
      expect(goldenBorderRadius['phi-full']).toBe('9999px');
    });

    it('phi should be 1/PHI rem', () => {
      expect(goldenBorderRadius['phi']).toBe(`${1 / PHI}rem`);
    });
  });

  describe('goldenSizing', () => {
    it('should have card sizes', () => {
      expect(goldenSizing).toHaveProperty('phi-card-sm');
      expect(goldenSizing).toHaveProperty('phi-card');
      expect(goldenSizing).toHaveProperty('phi-card-lg');
    });

    it('should have container sizes', () => {
      expect(goldenSizing).toHaveProperty('phi-container-sm');
      expect(goldenSizing).toHaveProperty('phi-container');
      expect(goldenSizing).toHaveProperty('phi-container-lg');
    });

    it('should have ratio helpers', () => {
      expect(goldenSizing['phi-ratio']).toBe(`${PHI}`);
      expect(goldenSizing['phi-ratio-inverse']).toBe(`${1 / PHI}`);
    });

    it('card sizes should follow golden progression', () => {
      expect(goldenSizing['phi-card-sm']).toBe('16rem');
      expect(goldenSizing['phi-card']).toBe(`${16 * PHI}rem`);
      expect(goldenSizing['phi-card-lg']).toBe(`${16 * PHI * PHI}rem`);
    });
  });

  describe('goldenShadows', () => {
    it('should have all shadow sizes', () => {
      expect(goldenShadows).toHaveProperty('phi-sm');
      expect(goldenShadows).toHaveProperty('phi');
      expect(goldenShadows).toHaveProperty('phi-md');
      expect(goldenShadows).toHaveProperty('phi-lg');
      expect(goldenShadows).toHaveProperty('phi-xl');
    });

    it('shadows should be valid CSS box-shadow format', () => {
      Object.values(goldenShadows).forEach((value) => {
        expect(value).toMatch(/^0 [\d.]+rem [\d.]+rem rgba\(0, 0, 0, [\d.]+\)$/);
      });
    });
  });

  describe('goldenDurations', () => {
    it('should have all duration sizes', () => {
      expect(goldenDurations).toHaveProperty('phi-instant');
      expect(goldenDurations).toHaveProperty('phi-fast');
      expect(goldenDurations).toHaveProperty('phi-base');
      expect(goldenDurations).toHaveProperty('phi-normal');
      expect(goldenDurations).toHaveProperty('phi-slow');
      expect(goldenDurations).toHaveProperty('phi-slower');
    });

    it('phi-base should be 200ms', () => {
      expect(goldenDurations['phi-base']).toBe('200ms');
    });

    it('phi-instant should be 100ms', () => {
      expect(goldenDurations['phi-instant']).toBe('100ms');
    });

    it('durations should end with ms', () => {
      Object.values(goldenDurations).forEach((value) => {
        expect(value).toMatch(/^\d+(\.\d+)?ms$/);
      });
    });
  });

  describe('goldenGrid', () => {
    it('should have gap sizes', () => {
      expect(goldenGrid).toHaveProperty('gap-phi-xs');
      expect(goldenGrid).toHaveProperty('gap-phi-sm');
      expect(goldenGrid).toHaveProperty('gap-phi');
      expect(goldenGrid).toHaveProperty('gap-phi-lg');
      expect(goldenGrid).toHaveProperty('gap-phi-xl');
    });

    it('should have column splits', () => {
      expect(goldenGrid['col-phi-main']).toBe('61.8%');
      expect(goldenGrid['col-phi-side']).toBe('38.2%');
    });

    it('column splits should approximately add to 100%', () => {
      const main = parseFloat(goldenGrid['col-phi-main']);
      const side = parseFloat(goldenGrid['col-phi-side']);
      expect(main + side).toBeCloseTo(100, 0);
    });

    it('column ratio should follow golden proportion', () => {
      const main = parseFloat(goldenGrid['col-phi-main']);
      const side = parseFloat(goldenGrid['col-phi-side']);
      expect(main / side).toBeCloseTo(PHI, 1);
    });
  });

  describe('goldenRatioTailwindExtend', () => {
    it('should include spacing', () => {
      expect(goldenRatioTailwindExtend.spacing).toBe(goldenSpacing);
    });

    it('should include fontSize', () => {
      expect(goldenRatioTailwindExtend.fontSize).toBe(goldenTypography);
    });

    it('should include borderRadius', () => {
      expect(goldenRatioTailwindExtend.borderRadius).toBe(goldenBorderRadius);
    });

    it('should include boxShadow', () => {
      expect(goldenRatioTailwindExtend.boxShadow).toBe(goldenShadows);
    });

    it('should include transitionDuration', () => {
      expect(goldenRatioTailwindExtend.transitionDuration).toBe(goldenDurations);
    });

    it('should include maxWidth configurations', () => {
      expect(goldenRatioTailwindExtend.maxWidth).toHaveProperty('phi-sm');
      expect(goldenRatioTailwindExtend.maxWidth).toHaveProperty('phi');
      expect(goldenRatioTailwindExtend.maxWidth).toHaveProperty('phi-lg');
    });
  });

  describe('goldenCSSVariables', () => {
    it('should be a non-empty string', () => {
      expect(typeof goldenCSSVariables).toBe('string');
      expect(goldenCSSVariables.length).toBeGreaterThan(0);
    });

    it('should include :root selector', () => {
      expect(goldenCSSVariables).toContain(':root');
    });

    it('should include PHI constant', () => {
      expect(goldenCSSVariables).toContain(`--phi: ${PHI}`);
    });

    it('should include PHI inverse', () => {
      expect(goldenCSSVariables).toContain(`--phi-inverse: ${PHI_INVERSE}`);
    });

    it('should include spacing variables', () => {
      expect(goldenCSSVariables).toContain('--phi-md:');
      expect(goldenCSSVariables).toContain('--phi-lg:');
    });

    it('should include border radius variables', () => {
      expect(goldenCSSVariables).toContain('--phi-radius:');
      expect(goldenCSSVariables).toContain('--phi-radius-lg:');
    });

    it('should include shadow variables', () => {
      expect(goldenCSSVariables).toContain('--phi-shadow:');
      expect(goldenCSSVariables).toContain('--phi-shadow-lg:');
    });

    it('should include grid variables', () => {
      expect(goldenCSSVariables).toContain('--phi-col-main:');
      expect(goldenCSSVariables).toContain('--phi-col-side:');
    });
  });
});
