export type UserRole = 'user' | 'provider' | 'advertiser' | 'affiliate' | 'admin' | 'super_admin';

export type AuthUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  email_verified_at?: string | null;
  phone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  preferred_language?: string | null;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  phone_verified_at?: string | null;
  roles?: UserRole[];
  requires_background_check?: boolean;
};

