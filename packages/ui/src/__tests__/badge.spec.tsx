import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge, badgeVariants } from '../components/badge';

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render as a div element', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge.tagName.toLowerCase()).toBe('div');
    });

    it('should apply base classes', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('border');
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary');
      expect(badge).toHaveClass('text-primary-foreground');
    });

    it('should apply secondary variant classes', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
      expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('should apply destructive variant classes', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass('bg-destructive');
      expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('should apply outline variant classes', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground');
    });

    it('should use default variant when no variant is specified', () => {
      render(<Badge>No Variant</Badge>);
      const badge = screen.getByText('No Variant');
      expect(badge).toHaveClass('bg-primary');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex');
    });

    it('should allow overriding default classes', () => {
      render(<Badge className="rounded-none">Badge</Badge>);
      const badge = screen.getByText('Badge');
      // The cn function with tailwind-merge should handle conflicting classes
      expect(badge).toHaveClass('rounded-none');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Badge data-testid="badge" aria-label="Test badge">
          Badge
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('aria-label', 'Test badge');
    });

    it('should support onClick handler', () => {
      const handleClick = jest.fn();
      render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = screen.getByText('Clickable');
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support id attribute', () => {
      render(<Badge id="my-badge">Badge</Badge>);
      expect(document.getElementById('my-badge')).toBeInTheDocument();
    });
  });

  describe('badgeVariants function', () => {
    it('should return classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('should return classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    it('should return classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
    });

    it('should return classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });

    it('should return default variant classes when called with no arguments', () => {
      const classes = badgeVariants({});
      expect(classes).toContain('bg-primary');
    });
  });

  describe('Styling Details', () => {
    it('should have font-semibold class', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('font-semibold');
    });

    it('should have text-xs class', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('text-xs');
    });

    it('should have transition-colors class', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('transition-colors');
    });

    it('should have padding classes', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
    });
  });

  describe('Focus States', () => {
    it('should have focus ring classes', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge.className).toContain('focus:outline-none');
      expect(badge.className).toContain('focus:ring-2');
    });
  });
});
