'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, Label } from '@dhanam/ui';
import { RegisterDto } from '@dhanam/shared';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGeoDefaults } from '@/lib/hooks/use-geo-defaults';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  locale: z.enum(['en', 'es', 'pt-BR']).optional(),
  timezone: z.string().optional(),
});

interface RegisterFormProps {
  onSubmit: (data: RegisterDto) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const geo = useGeoDefaults();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      locale: geo.locale === 'pt-BR' ? 'es' : geo.locale, // pt-BR falls back to es for registration locale
      timezone: geo.timezone,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        <p className="text-xs text-muted-foreground">
          Must contain at least 8 characters, one uppercase letter, and one number
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
