-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_usd NUMERIC NOT NULL,
  price_ttd NUMERIC NOT NULL,
  download_file_path TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create download_purchases table
CREATE TABLE public.download_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  user_email TEXT NOT NULL,
  user_name TEXT,
  payment_method TEXT NOT NULL, -- 'paypal' or 'bank_transfer'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL, -- 'USD' or 'TTD'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pending_paypal', 'pending_bank_transfer', 'completed', 'failed'
  order_reference TEXT UNIQUE,
  paypal_order_id TEXT,
  paypal_payment_id TEXT,
  download_expires_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_purchases ENABLE ROW LEVEL SECURITY;

-- Products policies - anyone can view active products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Download purchases policies - users can view their own purchases
CREATE POLICY "Users can view their own download purchases" 
ON public.download_purchases 
FOR SELECT 
USING (user_email = auth.jwt() ->> 'email' OR auth.role() = 'service_role');

CREATE POLICY "Anyone can create download purchases" 
ON public.download_purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update download purchases" 
ON public.download_purchases 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Create storage bucket for downloads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('downloads', 'downloads', false);

-- Storage policies for downloads bucket - only completed purchases can access
CREATE POLICY "Completed purchases can access downloads" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'downloads' AND 
  EXISTS (
    SELECT 1 FROM public.download_purchases 
    WHERE status = 'completed' 
    AND user_email = auth.jwt() ->> 'email'
    AND download_expires_at > now()
  )
);

-- Service role can manage download files
CREATE POLICY "Service role can manage download files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'downloads' AND auth.role() = 'service_role');

-- Insert the Download & Self-Host product
INSERT INTO public.products (
  name, 
  description, 
  price_usd, 
  price_ttd, 
  download_file_path,
  features
) VALUES (
  'Nuacha Auth Download & Self-Host',
  'Complete authentication system source code with advanced features for self-hosting',
  149.00,
  1010.62,
  'nuacha-auth-complete.zip',
  '[
    "Full source code with advanced features",
    "Deploy to your own infrastructure", 
    "Extend and customize as you grow",
    "Complete documentation bundle",
    "Email templates and UI components",
    "Database setup scripts",
    "30-day download access"
  ]'::jsonb
);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_download_purchases_updated_at
BEFORE UPDATE ON public.download_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();