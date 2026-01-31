import { UUID, Locale } from './common.types';

export type SubscriptionTier = 'community' | 'essentials' | 'pro';

export interface User {
  id: UUID;
  email: string;
  name: string;
  locale: Locale;
  timezone: string;
  totpEnabled: boolean;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionTier?: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  name?: string;
  locale?: Locale;
  timezone?: string;
}

export interface UserProfile extends User {
  spaces: Array<{
    id: UUID;
    name: string;
    type: 'personal' | 'business';
    role: SpaceRole;
  }>;
}

export type SpaceRole = 'owner' | 'admin' | 'member' | 'viewer';