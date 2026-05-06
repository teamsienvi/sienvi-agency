-- =====================================================================
-- Sienvi — Full Public Schema Recreation Script
-- Source project: ikazuqhukvtdorscoads.supabase.co
-- Run on a fresh Supabase project (in the SQL editor).
-- Order: extensions -> enums -> functions -> tables -> RLS -> policies -> triggers
-- =====================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'student', 'coach');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.coach_role AS ENUM ('head_coach', 'assistant_coach');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- TABLES
-- =====================================================================

-- ---------- user_roles (create early; referenced by has_role) ----------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  first_name text,
  last_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- client_profiles ----------
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'client',
  account_status text NOT NULL DEFAULT 'pending',
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  custom_price numeric,
  subscription_status text NOT NULL DEFAULT 'pending_payment',
  contract_status text NOT NULL DEFAULT 'not_signed',
  contract_signed_at timestamptz,
  onboarding_status text NOT NULL DEFAULT 'not_started',
  onboarding_completed_at timestamptz,
  max_services integer DEFAULT 1,
  selected_services text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_profiles_plan_check
    CHECK (plan IS NULL OR plan IN ('single','triple','full','custom','advertising','amazon'))
);

-- ---------- coach_credentials ----------
CREATE TABLE IF NOT EXISTS public.coach_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password_hash text NOT NULL,
  role public.coach_role NOT NULL DEFAULT 'assistant_coach',
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ---------- contracts ----------
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- subscriptions ----------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  email text,
  plan text,
  subscription_status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  billing_reminder_enabled boolean DEFAULT true,
  billing_cycle text DEFAULT 'monthly',
  billing_day integer,
  next_billing_date date,
  last_billed_date date,
  migration_status text,
  payment_method text DEFAULT 'stripe',
  is_manual boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  selected_services text[] DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- payments ----------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text NOT NULL,
  payment_method text,
  promo_code_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- promo_codes ----------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_percentage integer NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- courses / modules / lessons / enrollments / lesson_progress ----------
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title text NOT NULL,
  video_url text,
  content_type text DEFAULT 'video',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- assessments ----------
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  name text NOT NULL,
  date_of_birth date NOT NULL,
  answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- blog_posting ----------
CREATE TABLE IF NOT EXISTS public.blog_posting (
  blog_topic text NOT NULL,
  blog_content text NOT NULL DEFAULT '',
  "Category" text DEFAULT '',
  "Status" text NOT NULL DEFAULT 'Not Used',
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- ---------- newsletter_subscribers ----------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  is_active boolean DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  last_email_sent_at timestamptz,
  last_newsletter_sent integer DEFAULT 0
);

-- ---------- Analytics ----------
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  device_type text,
  browser text,
  os text,
  screen_width integer,
  screen_height integer,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  country text,
  city text,
  is_bounce boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  path text NOT NULL,
  title text,
  load_time_ms integer,
  time_on_page_ms integer,
  scroll_depth integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  path text NOT NULL,
  x_coord integer,
  y_coord integer,
  x_percent numeric,
  y_percent numeric,
  element_tag text,
  element_id text,
  element_class text,
  element_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_user_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  from_path text,
  to_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  path text NOT NULL,
  page_path text,
  session_id text,
  user_agent text,
  referrer text,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- ---------- Onboarding tables ----------
CREATE TABLE IF NOT EXISTS public.onboarding_questionnaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL,
  business_name text, business_description text, industry_niche text, years_operating text,
  important_platforms text, content_creation text, brand_identity text, existing_funnels text,
  marketing_not_working text, marketing_working text, lead_acquisition text, core_offers text,
  automation_needs text, target_audience text, project_management_tools text, sales_funnel_tools text,
  crm_email_tools text, marketing_tools text, team_structure text, past_agencies_experience text,
  goal_blockers text, stuck_areas text, biggest_challenges text, big_win_expectation text,
  planned_launches text, vision_3_5_years text, top_3_goals text, revenue_goals text,
  revenue_streams text, performance_tracking text, additional_notes text,
  budget_timeline text, start_timeline text, ideal_collaboration text, decision_maker text,
  communication_preference text, primary_contact text, assets_to_review text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL,
  products_services text,
  avatars jsonb DEFAULT '[]'::jsonb,
  most_important_avatar text,
  most_important_reason text,
  existing_data_available boolean DEFAULT false,
  customers_to_avoid text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL,
  primary_goal text, goal_narrative text,
  specific_who text, specific_what text, specific_where text, specific_why text, specific_goal_summary text,
  measurable_metrics text, measurable_target text, measurable_goal_summary text,
  achievable_realistic text, achievable_steps text, achievable_goal_summary text,
  relevant_alignment text, relevant_worthwhile text, relevant_goal_summary text,
  timebound_deadline text, timebound_milestones text, timebound_goal_summary text,
  action_plan jsonb DEFAULT '[]'::jsonb,
  obstacles_solutions jsonb DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_advertising (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL,
  business_name text, primary_contact_name text, email_address text, industry_niche text,
  selected_channels text[], primary_campaign_goal text, secondary_goals text[],
  monthly_budget_range text, target_demographics text, target_locations text,
  target_interests text, audience_personas text, retargeting_audiences text,
  previous_advertising_experience text, current_ad_accounts text, historical_performance text,
  what_worked text, what_didnt_work text, existing_ad_creatives boolean DEFAULT false,
  brand_voice text, key_messaging_points text, unique_selling_propositions text,
  promotional_offers text, landing_page_urls text, conversion_tracking_setup boolean DEFAULT false,
  conversion_actions text, main_competitors text, competitor_ad_examples text,
  differentiation_strategy text, campaign_start_date text, campaign_duration text,
  expected_results_timeline text, target_kpis text, reporting_preferences text,
  has_ad_accounts boolean DEFAULT false, ad_account_access_details text,
  creative_assets_available text, additional_notes text, confirmed_accurate boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_amazon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL,
  business_name text, primary_contact_name text, email_address text,
  seller_account_type text, target_marketplaces text[],
  product_name text, asin text, product_status text, product_category text,
  dimensions_weight text, materials_specs text, product_variations text, product_description text,
  key_features text, top_3_benefits text, problem_solved text,
  ideal_customer text, customer_pain_points text, desired_outcome text, customer_objections text,
  brand_voice text, brand_voice_other text, brands_admired text,
  words_to_associate text, words_to_avoid text,
  has_brand_guidelines boolean DEFAULT false, preferred_colors text, preferred_fonts text,
  style_preference text, example_listings text,
  competitor_asins text, competitor_likes text, competitor_dislikes text,
  features_to_highlight text, mandatory_claims text, compliance_restrictions text,
  image_styles_to_avoid text,
  video_primary_goal text, video_messaging text, video_tone text, video_examples text,
  uploaded_assets jsonb DEFAULT '[]'::jsonb,
  work_approver text, turnaround_preference text,
  additional_notes text, confirmed_accurate boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ---------- Helper Functions ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_client_profile_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.assign_admin_for_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email = 'admin@sienvi.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.verify_coach_credentials(p_username text, p_password_hash text)
RETURNS TABLE(id uuid, username text, role public.coach_role, last_login timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT cc.id, cc.username, cc.role, cc.last_login
  FROM public.coach_credentials cc
  WHERE cc.username = p_username AND cc.password_hash = p_password_hash;
END; $$;


-- =====================================================================
-- Enable RLS
-- =====================================================================
ALTER TABLE public.user_roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_credentials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posting             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_clicks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_flows     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_avatars       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_advertising   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_amazon        ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Policies
-- =====================================================================

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- client_profiles
CREATE POLICY "Users can view own client profile" ON public.client_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own client profile" ON public.client_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages client profiles" ON public.client_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- coach_credentials
CREATE POLICY "System can update coach credentials" ON public.coach_credentials
  FOR UPDATE USING (true) WITH CHECK (true);

-- contracts
CREATE POLICY "Users can view their own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- promo_codes
CREATE POLICY "Authenticated users can read active promo codes" ON public.promo_codes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- courses
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- modules
CREATE POLICY "Anyone can view modules" ON public.modules
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = modules.course_id AND courses.is_active = true
  ));
CREATE POLICY "Admins can manage modules" ON public.modules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- lessons
CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- lesson_progress
CREATE POLICY "Users can view own progress" ON public.lesson_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.lesson_progress
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- assessments
CREATE POLICY "Allow anonymous assessment submissions" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);
CREATE POLICY "Users can insert their own assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own assessments by user_id" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read their own assessments by email" ON public.assessments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id IS NULL
    AND email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can update their own assessments" ON public.assessments
  FOR UPDATE USING (
    auth.uid() = user_id OR (
      auth.uid() IS NOT NULL AND user_id IS NULL
      AND email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "Users can delete their own assessments" ON public.assessments
  FOR DELETE USING (
    auth.uid() = user_id OR (
      auth.uid() IS NOT NULL AND user_id IS NULL
      AND email IN (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
  );

-- blog_posting
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posting
  FOR SELECT USING ("Status" = 'Published');
CREATE POLICY "Authenticated users can insert blog posts" ON public.blog_posting
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update blog posts" ON public.blog_posting
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- newsletter_subscribers
CREATE POLICY "Allow anonymous inserts" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON public.newsletter_subscribers
  FOR ALL USING (true) WITH CHECK (true);

-- analytics_sessions
CREATE POLICY "Anyone can insert analytics_sessions" ON public.analytics_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update analytics_sessions" ON public.analytics_sessions
  FOR UPDATE USING (true);
CREATE POLICY "Admins can read analytics_sessions" ON public.analytics_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- analytics_page_views
CREATE POLICY "Anyone can insert analytics_page_views" ON public.analytics_page_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update analytics_page_views" ON public.analytics_page_views
  FOR UPDATE USING (true);
CREATE POLICY "Admins can read analytics_page_views" ON public.analytics_page_views
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- analytics_clicks
CREATE POLICY "Anyone can insert analytics_clicks" ON public.analytics_clicks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read analytics_clicks" ON public.analytics_clicks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- analytics_user_flows
CREATE POLICY "Anyone can insert analytics_user_flows" ON public.analytics_user_flows
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read analytics_user_flows" ON public.analytics_user_flows
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- analytics_events
CREATE POLICY "Anyone can insert analytics_events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can select analytics_events" ON public.analytics_events
  FOR SELECT TO authenticated USING (true);

-- onboarding_questionnaire
CREATE POLICY "Users view own questionnaire" ON public.onboarding_questionnaire
  FOR SELECT USING (client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users insert own questionnaire" ON public.onboarding_questionnaire
  FOR INSERT WITH CHECK (client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users update own questionnaire" ON public.onboarding_questionnaire
  FOR UPDATE USING (client_profile_id IN (
    SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Admins manage all questionnaires" ON public.onboarding_questionnaire
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- onboarding_avatars
CREATE POLICY "Users view own avatars" ON public.onboarding_avatars
  FOR SELECT USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users insert own avatars" ON public.onboarding_avatars
  FOR INSERT WITH CHECK (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own avatars" ON public.onboarding_avatars
  FOR UPDATE USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all avatars" ON public.onboarding_avatars
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- onboarding_goals
CREATE POLICY "Users view own goals" ON public.onboarding_goals
  FOR SELECT USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users insert own goals" ON public.onboarding_goals
  FOR INSERT WITH CHECK (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own goals" ON public.onboarding_goals
  FOR UPDATE USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all goals" ON public.onboarding_goals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- onboarding_advertising
CREATE POLICY "Users view own advertising onboarding" ON public.onboarding_advertising
  FOR SELECT USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users insert own advertising onboarding" ON public.onboarding_advertising
  FOR INSERT WITH CHECK (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own advertising onboarding" ON public.onboarding_advertising
  FOR UPDATE USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins view all advertising onboarding" ON public.onboarding_advertising
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- onboarding_amazon
CREATE POLICY "Users view own amazon onboarding" ON public.onboarding_amazon
  FOR SELECT USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users insert own amazon onboarding" ON public.onboarding_amazon
  FOR INSERT WITH CHECK (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users update own amazon onboarding" ON public.onboarding_amazon
  FOR UPDATE USING (client_profile_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins view all amazon onboarding" ON public.onboarding_amazon
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- Triggers
-- =====================================================================

-- Auto-create profile + assign default role on new auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_for_email();

-- updated_at maintenance
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_client_profile_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_q_updated_at
  BEFORE UPDATE ON public.onboarding_questionnaire
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_av_updated_at
  BEFORE UPDATE ON public.onboarding_avatars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_goals_updated_at
  BEFORE UPDATE ON public.onboarding_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_ads_updated_at
  BEFORE UPDATE ON public.onboarding_advertising
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_amz_updated_at
  BEFORE UPDATE ON public.onboarding_amazon
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- Storage bucket (submissions)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- End of script
