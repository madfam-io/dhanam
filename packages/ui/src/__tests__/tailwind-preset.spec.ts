import { madfamPreset } from '../tokens/tailwind-preset';
import {
  goldenSpacing,
  goldenTypography,
  goldenBorderRadius,
  goldenShadows,
  goldenDurations,
  goldenSizing,
} from '../tokens/golden-ratio';

describe('MADFAM Tailwind Preset', () => {
  describe('preset structure', () => {
    it('should export a valid preset configuration', () => {
      expect(madfamPreset).toBeDefined();
      expect(madfamPreset.theme).toBeDefined();
      expect(madfamPreset.theme?.extend).toBeDefined();
    });

    it('should have all required extend properties', () => {
      const extend = madfamPreset.theme?.extend;
      expect(extend).toHaveProperty('spacing');
      expect(extend).toHaveProperty('fontSize');
      expect(extend).toHaveProperty('borderRadius');
      expect(extend).toHaveProperty('boxShadow');
      expect(extend).toHaveProperty('transitionDuration');
      expect(extend).toHaveProperty('width');
      expect(extend).toHaveProperty('maxWidth');
      expect(extend).toHaveProperty('colors');
      expect(extend).toHaveProperty('aspectRatio');
      expect(extend).toHaveProperty('backdropBlur');
      expect(extend).toHaveProperty('keyframes');
      expect(extend).toHaveProperty('animation');
    });
  });

  describe('golden ratio integration', () => {
    it('should include golden spacing', () => {
      const spacing = madfamPreset.theme?.extend?.spacing;
      expect(spacing).toEqual(expect.objectContaining(goldenSpacing));
    });

    it('should include golden typography', () => {
      const fontSize = madfamPreset.theme?.extend?.fontSize;
      expect(fontSize).toEqual(goldenTypography);
    });

    it('should include golden border radius', () => {
      const borderRadius = madfamPreset.theme?.extend?.borderRadius;
      expect(borderRadius).toEqual(expect.objectContaining(goldenBorderRadius));
    });

    it('should include golden shadows', () => {
      const boxShadow = madfamPreset.theme?.extend?.boxShadow;
      expect(boxShadow).toEqual(expect.objectContaining(goldenShadows));
    });

    it('should include golden durations', () => {
      const durations = madfamPreset.theme?.extend?.transitionDuration;
      expect(durations).toEqual(expect.objectContaining(goldenDurations));
    });

    it('should include golden sizing in width', () => {
      const width = madfamPreset.theme?.extend?.width;
      expect(width).toEqual(expect.objectContaining(goldenSizing));
    });
  });

  describe('MADFAM colors', () => {
    it('should have solarpunk color palette', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      expect(colors).toHaveProperty('solarpunk');
      expect(colors.solarpunk).toHaveProperty('50');
      expect(colors.solarpunk).toHaveProperty('500');
      expect(colors.solarpunk).toHaveProperty('950');
    });

    it('should have golden color palette', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      expect(colors).toHaveProperty('golden');
      expect(colors.golden).toHaveProperty('50');
      expect(colors.golden).toHaveProperty('500');
      expect(colors.golden).toHaveProperty('950');
    });

    it('should have earth color palette', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      expect(colors).toHaveProperty('earth');
      expect(colors.earth).toHaveProperty('50');
      expect(colors.earth).toHaveProperty('500');
      expect(colors.earth).toHaveProperty('950');
    });

    it('solarpunk colors should be valid hex values', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      Object.values(colors.solarpunk).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('golden colors should be valid hex values', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      Object.values(colors.golden).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('earth colors should be valid hex values', () => {
      const colors = madfamPreset.theme?.extend?.colors as Record<string, any>;
      Object.values(colors.earth).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('glass morphism', () => {
    it('should have glass shadow variants', () => {
      const shadows = madfamPreset.theme?.extend?.boxShadow as Record<string, string>;
      expect(shadows).toHaveProperty('glass');
      expect(shadows).toHaveProperty('glass-lg');
    });

    it('should have glass blur variants', () => {
      const blur = madfamPreset.theme?.extend?.backdropBlur as Record<string, string>;
      expect(blur).toHaveProperty('glass');
      expect(blur).toHaveProperty('glass-lg');
      expect(blur.glass).toBe('16px');
      expect(blur['glass-lg']).toBe('24px');
    });
  });

  describe('aspect ratios', () => {
    it('should have golden aspect ratios', () => {
      const aspectRatio = madfamPreset.theme?.extend?.aspectRatio as Record<string, string>;
      expect(aspectRatio).toHaveProperty('golden');
      expect(aspectRatio).toHaveProperty('golden-portrait');
    });

    it('golden ratio should be 1.618 / 1', () => {
      const aspectRatio = madfamPreset.theme?.extend?.aspectRatio as Record<string, string>;
      expect(aspectRatio.golden).toBe('1.618 / 1');
    });

    it('golden portrait should be inverted', () => {
      const aspectRatio = madfamPreset.theme?.extend?.aspectRatio as Record<string, string>;
      expect(aspectRatio['golden-portrait']).toBe('1 / 1.618');
    });
  });

  describe('animations', () => {
    it('should have all keyframes defined', () => {
      const keyframes = madfamPreset.theme?.extend?.keyframes;
      expect(keyframes).toHaveProperty('fade-in');
      expect(keyframes).toHaveProperty('fade-out');
      expect(keyframes).toHaveProperty('slide-in-up');
      expect(keyframes).toHaveProperty('slide-in-down');
      expect(keyframes).toHaveProperty('scale-in');
      expect(keyframes).toHaveProperty('spin-slow');
    });

    it('should have corresponding animation utilities', () => {
      const animation = madfamPreset.theme?.extend?.animation as Record<string, string>;
      expect(animation).toHaveProperty('fade-in');
      expect(animation).toHaveProperty('fade-out');
      expect(animation).toHaveProperty('slide-in-up');
      expect(animation).toHaveProperty('slide-in-down');
      expect(animation).toHaveProperty('scale-in');
      expect(animation).toHaveProperty('spin-slow');
    });

    it('fade-in keyframe should go from 0 to 1 opacity', () => {
      const keyframes = madfamPreset.theme?.extend?.keyframes as Record<string, any>;
      expect(keyframes['fade-in']['0%'].opacity).toBe('0');
      expect(keyframes['fade-in']['100%'].opacity).toBe('1');
    });

    it('slide-in-up should animate transform and opacity', () => {
      const keyframes = madfamPreset.theme?.extend?.keyframes as Record<string, any>;
      expect(keyframes['slide-in-up']['0%']).toHaveProperty('transform');
      expect(keyframes['slide-in-up']['0%']).toHaveProperty('opacity');
      expect(keyframes['slide-in-up']['100%'].transform).toBe('translateY(0)');
    });
  });

  describe('maxWidth', () => {
    it('should have phi container max widths', () => {
      const maxWidth = madfamPreset.theme?.extend?.maxWidth as Record<string, string>;
      expect(maxWidth).toHaveProperty('phi-sm');
      expect(maxWidth).toHaveProperty('phi');
      expect(maxWidth).toHaveProperty('phi-lg');
    });

    it('max widths should reference golden sizing containers', () => {
      const maxWidth = madfamPreset.theme?.extend?.maxWidth as Record<string, string>;
      expect(maxWidth['phi-sm']).toBe(goldenSizing['phi-container-sm']);
      expect(maxWidth['phi']).toBe(goldenSizing['phi-container']);
      expect(maxWidth['phi-lg']).toBe(goldenSizing['phi-container-lg']);
    });
  });
});
