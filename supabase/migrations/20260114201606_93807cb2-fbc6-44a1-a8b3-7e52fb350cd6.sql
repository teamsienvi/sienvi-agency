-- Create table for SMART Goals Sheet data
CREATE TABLE public.onboarding_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  -- Goal Identification
  primary_goal TEXT,
  -- Specific
  specific_what TEXT,
  specific_who TEXT,
  specific_where TEXT,
  specific_why TEXT,
  specific_goal_summary TEXT,
  -- Measurable
  measurable_metrics TEXT,
  measurable_target TEXT,
  measurable_goal_summary TEXT,
  -- Achievable
  achievable_realistic TEXT,
  achievable_steps TEXT,
  achievable_goal_summary TEXT,
  -- Relevant
  relevant_alignment TEXT,
  relevant_worthwhile TEXT,
  relevant_goal_summary TEXT,
  -- Time-bound
  timebound_deadline TEXT,
  timebound_milestones TEXT,
  timebound_goal_summary TEXT,
  -- Goal Summary (Narrative)
  goal_narrative TEXT,
  -- Action Plan (stored as JSON array)
  action_plan JSONB DEFAULT '[]'::jsonb,
  -- Obstacles (stored as JSON array)
  obstacles_solutions JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_profile_id)
);

-- Create table for Customer Avatar Profile data
CREATE TABLE public.onboarding_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  -- Overview
  products_services TEXT,
  -- Avatars (stored as JSON array of up to 3 avatars)
  avatars JSONB DEFAULT '[]'::jsonb,
  -- Final Notes
  most_important_avatar TEXT,
  most_important_reason TEXT,
  existing_data_available BOOLEAN DEFAULT false,
  customers_to_avoid TEXT,
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_profile_id)
);

-- Create table for Onboarding Questionnaire data
CREATE TABLE public.onboarding_questionnaire (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_profile_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  -- Section 1: Business Overview
  business_name TEXT,
  business_description TEXT,
  industry_niche TEXT,
  years_operating TEXT,
  target_audience TEXT,
  revenue_streams TEXT,
  revenue_goals TEXT,
  -- Section 2: Goals & Vision
  top_3_goals TEXT,
  vision_3_5_years TEXT,
  planned_launches TEXT,
  big_win_expectation TEXT,
  -- Section 3: Challenges & Bottlenecks
  biggest_challenges TEXT,
  stuck_areas TEXT,
  goal_blockers TEXT,
  past_agencies_experience TEXT,
  -- Section 4: Team, Tools & Systems
  team_structure TEXT,
  marketing_tools TEXT,
  crm_email_tools TEXT,
  sales_funnel_tools TEXT,
  project_management_tools TEXT,
  performance_tracking TEXT,
  automation_needs TEXT,
  -- Section 5: Offers, Marketing & Sales
  core_offers TEXT,
  lead_acquisition TEXT,
  marketing_working TEXT,
  marketing_not_working TEXT,
  existing_funnels TEXT,
  -- Section 6: Content & Branding
  brand_identity TEXT,
  content_creation TEXT,
  important_platforms TEXT,
  assets_to_review TEXT,
  -- Section 7: Decision-Making & Collaboration
  primary_contact TEXT,
  communication_preference TEXT,
  decision_maker TEXT,
  ideal_collaboration TEXT,
  -- Section 8: Readiness & Expectations
  start_timeline TEXT,
  budget_timeline TEXT,
  additional_notes TEXT,
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_profile_id)
);

-- Enable RLS on all tables
ALTER TABLE public.onboarding_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_questionnaire ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_goals
CREATE POLICY "Users can view their own goals"
  ON public.onboarding_goals
  FOR SELECT
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own goals"
  ON public.onboarding_goals
  FOR INSERT
  WITH CHECK (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own goals"
  ON public.onboarding_goals
  FOR UPDATE
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all goals"
  ON public.onboarding_goals
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all goals"
  ON public.onboarding_goals
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for onboarding_avatars
CREATE POLICY "Users can view their own avatars"
  ON public.onboarding_avatars
  FOR SELECT
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own avatars"
  ON public.onboarding_avatars
  FOR INSERT
  WITH CHECK (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own avatars"
  ON public.onboarding_avatars
  FOR UPDATE
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all avatars"
  ON public.onboarding_avatars
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all avatars"
  ON public.onboarding_avatars
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for onboarding_questionnaire
CREATE POLICY "Users can view their own questionnaire"
  ON public.onboarding_questionnaire
  FOR SELECT
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own questionnaire"
  ON public.onboarding_questionnaire
  FOR INSERT
  WITH CHECK (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own questionnaire"
  ON public.onboarding_questionnaire
  FOR UPDATE
  USING (
    client_profile_id IN (
      SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all questionnaires"
  ON public.onboarding_questionnaire
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all questionnaires"
  ON public.onboarding_questionnaire
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_goals_updated_at
  BEFORE UPDATE ON public.onboarding_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_avatars_updated_at
  BEFORE UPDATE ON public.onboarding_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_questionnaire_updated_at
  BEFORE UPDATE ON public.onboarding_questionnaire
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();