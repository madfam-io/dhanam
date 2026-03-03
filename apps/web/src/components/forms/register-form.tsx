'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Checkbox, Input, Label } from '@dhanam/ui';
import { RegisterDto, useTranslation } from '@dhanam/shared';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGeoDefaults } from '@/lib/hooks/use-geo-defaults';

interface RegisterFormProps {
  onSubmit: (data: RegisterDto) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const geo = useGeoDefaults();
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { t: tv } = useTranslation('validations');

  const registerSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(tv('emailInvalid')),
        password: z
          .string()
          .min(8, tv('passwordMinLength', { min: '8' }))
          .regex(/[A-Z]/, tv('passwordUppercase'))
          .regex(/[0-9]/, tv('passwordNumber')),
        name: z.string().min(2, tv('nameMinLength', { min: '2' })),
        locale: z.enum(['en', 'es', 'pt-BR']).optional(),
        timezone: z.string().optional(),
        acceptTerms: z.literal(true, {
          message: tv('termsRequired'),
        }),
      }),
    [tv]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterDto & { acceptTerms: boolean }>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      locale: geo.locale,
      timezone: geo.timezone,
      acceptTerms: false,
    },
  });

  const acceptTerms = watch('acceptTerms');

  return (
    <form
      onSubmit={handleSubmit(({ acceptTerms: _accept, ...data }) => onSubmit(data))}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('fullName')}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t('placeholders.fullName')}
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('placeholders.email')}
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('placeholders.password')}
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
        <p className="text-xs text-muted-foreground">{t('passwordHelp')}</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('creatingAccount')}
          </>
        ) : (
          t('createAccount')
        )}
      </Button>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) =>
              setValue('acceptTerms', checked === true, { shouldValidate: true })
            }
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label
            htmlFor="acceptTerms"
            className="text-xs text-muted-foreground font-normal leading-tight cursor-pointer"
          >
            {t('agreementPrefix')}{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              {t('termsOfService')}
            </Link>{' '}
            {tc('and')}{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              {t('privacyPolicy')}
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
        )}
      </div>
    </form>
  );
}
