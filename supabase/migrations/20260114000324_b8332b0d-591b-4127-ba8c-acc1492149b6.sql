-- Add new columns to subscriptions table for manual client support
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS migration_status text DEFAULT NULL;

-- Add constraint for payment_method values
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_payment_method_check 
CHECK (payment_method IN ('manual', 'stripe', 'invoice'));

-- Add constraint for migration_status values
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_migration_status_check 
CHECK (migration_status IS NULL OR migration_status IN ('pending_migration', 'migrated'));

-- Update existing records to have stripe payment method
UPDATE public.subscriptions 
SET payment_method = 'stripe', is_manual = false 
WHERE stripe_customer_id IS NOT NULL AND stripe_subscription_id IS NOT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_manual ON public.subscriptions(is_manual);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_method ON public.subscriptions(payment_method);