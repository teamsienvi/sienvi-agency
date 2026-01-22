-- Create Amazon Design Package onboarding questionnaire table
CREATE TABLE public.onboarding_amazon (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL UNIQUE REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  
  -- Section 1: Business & Brand Information
  business_name TEXT,
  primary_contact_name TEXT,
  email_address TEXT,
  seller_account_type TEXT, -- 'seller_central' or 'vendor_central'
  target_marketplaces TEXT[], -- Array of marketplace codes
  
  -- Section 2: Product Overview
  product_name TEXT,
  product_category TEXT,
  asin TEXT,
  product_status TEXT, -- 'new' or 'existing'
  product_variations TEXT,
  
  -- Section 3: Product Details
  product_description TEXT,
  key_features TEXT,
  top_3_benefits TEXT,
  problem_solved TEXT,
  materials_specs TEXT,
  dimensions_weight TEXT,
  
  -- Section 4: Target Customer
  ideal_customer TEXT,
  customer_pain_points TEXT,
  desired_outcome TEXT,
  customer_objections TEXT,
  
  -- Section 5: Brand Voice & Positioning
  brand_voice TEXT, -- 'professional', 'friendly', 'bold', 'premium', 'minimal', 'other'
  brand_voice_other TEXT,
  brands_admired TEXT,
  words_to_associate TEXT,
  words_to_avoid TEXT,
  
  -- Section 6: Visual Style Preferences
  has_brand_guidelines BOOLEAN DEFAULT false,
  preferred_colors TEXT,
  preferred_fonts TEXT,
  style_preference TEXT, -- 'clean_minimal', 'bold_high_contrast', 'lifestyle_focused', 'technical_detailed'
  example_listings TEXT,
  
  -- Section 7: Competitors & Market Research
  competitor_asins TEXT,
  competitor_likes TEXT,
  competitor_dislikes TEXT,
  
  -- Section 8: Image & Creative Direction
  features_to_highlight TEXT,
  mandatory_claims TEXT,
  compliance_restrictions TEXT,
  image_styles_to_avoid TEXT,
  
  -- Section 9: Video Ad Preferences
  video_primary_goal TEXT, -- 'conversions', 'brand_awareness', 'education'
  video_messaging TEXT,
  video_tone TEXT, -- 'emotional', 'informational', 'fast_paced', 'calm'
  video_examples TEXT,
  
  -- Section 10: Assets Upload (stored as JSON array of file URLs)
  uploaded_assets JSONB DEFAULT '[]'::jsonb,
  
  -- Section 11: Approvals & Final Notes
  work_approver TEXT,
  turnaround_preference TEXT,
  additional_notes TEXT,
  
  -- Section 12: Confirmation
  confirmed_accurate BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Advertising onboarding questionnaire table
CREATE TABLE public.onboarding_advertising (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL UNIQUE REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  
  -- Section 1: Business & Campaign Overview
  business_name TEXT,
  primary_contact_name TEXT,
  email_address TEXT,
  industry_niche TEXT,
  
  -- Section 2: Advertising Channels
  selected_channels TEXT[], -- Array of channel IDs
  
  -- Section 3: Campaign Goals
  primary_campaign_goal TEXT, -- 'brand_awareness', 'lead_generation', 'sales_conversions', 'traffic', 'engagement'
  secondary_goals TEXT[],
  target_kpis TEXT,
  monthly_budget_range TEXT,
  
  -- Section 4: Target Audience
  target_demographics TEXT,
  target_locations TEXT,
  target_interests TEXT,
  audience_personas TEXT,
  retargeting_audiences TEXT,
  
  -- Section 5: Current Advertising Status
  previous_advertising_experience TEXT,
  current_ad_accounts TEXT,
  historical_performance TEXT,
  what_worked TEXT,
  what_didnt_work TEXT,
  
  -- Section 6: Creative & Messaging
  existing_ad_creatives BOOLEAN DEFAULT false,
  brand_voice TEXT,
  key_messaging_points TEXT,
  unique_selling_propositions TEXT,
  promotional_offers TEXT,
  
  -- Section 7: Landing Pages & Conversion
  landing_page_urls TEXT,
  conversion_tracking_setup BOOLEAN DEFAULT false,
  conversion_actions TEXT,
  
  -- Section 8: Competitor Analysis
  main_competitors TEXT,
  competitor_ad_examples TEXT,
  differentiation_strategy TEXT,
  
  -- Section 9: Timeline & Expectations
  campaign_start_date TEXT,
  campaign_duration TEXT,
  expected_results_timeline TEXT,
  reporting_preferences TEXT,
  
  -- Section 10: Assets & Access
  has_ad_accounts BOOLEAN DEFAULT false,
  ad_account_access_details TEXT,
  creative_assets_available TEXT,
  
  -- Section 11: Additional Information
  additional_notes TEXT,
  
  -- Confirmation
  confirmed_accurate BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.onboarding_amazon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_advertising ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Amazon onboarding
CREATE POLICY "Users can view their own Amazon onboarding data"
ON public.onboarding_amazon FOR SELECT
USING (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own Amazon onboarding data"
ON public.onboarding_amazon FOR INSERT
WITH CHECK (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own Amazon onboarding data"
ON public.onboarding_amazon FOR UPDATE
USING (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for Advertising onboarding
CREATE POLICY "Users can view their own Advertising onboarding data"
ON public.onboarding_advertising FOR SELECT
USING (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own Advertising onboarding data"
ON public.onboarding_advertising FOR INSERT
WITH CHECK (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own Advertising onboarding data"
ON public.onboarding_advertising FOR UPDATE
USING (
  client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);

-- Admin policies for both tables
CREATE POLICY "Admins can view all Amazon onboarding data"
ON public.onboarding_amazon FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all Advertising onboarding data"
ON public.onboarding_advertising FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_amazon_updated_at
BEFORE UPDATE ON public.onboarding_amazon
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_advertising_updated_at
BEFORE UPDATE ON public.onboarding_advertising
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();