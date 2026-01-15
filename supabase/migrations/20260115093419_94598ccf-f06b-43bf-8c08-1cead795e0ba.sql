-- Create webhook_logs table to track webhook health
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Add index for quick lookups
CREATE INDEX idx_webhook_logs_processed_at ON public.webhook_logs (processed_at DESC);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs (status);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert logs
CREATE POLICY "Service role can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);