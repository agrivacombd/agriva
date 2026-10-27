-- Expand the profile role enum for AGRIVA's public user types.
-- Admin is deliberately excluded from self-service signup options.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'buyer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'transport_provider';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'agronomist';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'gardener';
