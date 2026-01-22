export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Ai_Whop_Chatbot: {
        Row: {
          bot_enabled: boolean | null
          company_id: string | null
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          bot_enabled?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          bot_enabled?: boolean | null
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      analytics_clicks: {
        Row: {
          created_at: string | null
          element_class: string | null
          element_id: string | null
          element_tag: string | null
          element_text: string | null
          id: string
          path: string
          session_id: string
          visitor_id: string
          x_coord: number | null
          x_percent: number | null
          y_coord: number | null
          y_percent: number | null
        }
        Insert: {
          created_at?: string | null
          element_class?: string | null
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path: string
          session_id: string
          visitor_id: string
          x_coord?: number | null
          x_percent?: number | null
          y_coord?: number | null
          y_percent?: number | null
        }
        Update: {
          created_at?: string | null
          element_class?: string | null
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path?: string
          session_id?: string
          visitor_id?: string
          x_coord?: number | null
          x_percent?: number | null
          y_coord?: number | null
          y_percent?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          path: string
          referrer: string | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          path: string
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          path?: string
          referrer?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          created_at: string | null
          id: string
          load_time_ms: number | null
          path: string
          scroll_depth: number | null
          session_id: string
          time_on_page_ms: number | null
          title: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          load_time_ms?: number | null
          path: string
          scroll_depth?: number | null
          session_id: string
          time_on_page_ms?: number | null
          title?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          load_time_ms?: number | null
          path?: string
          scroll_depth?: number | null
          session_id?: string
          time_on_page_ms?: number | null
          title?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          is_bounce: boolean | null
          os: string | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          started_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_bounce?: boolean | null
          os?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          started_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_bounce?: boolean | null
          os?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          started_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      analytics_user_flows: {
        Row: {
          created_at: string | null
          from_path: string | null
          id: string
          session_id: string
          to_path: string
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          from_path?: string | null
          id?: string
          session_id: string
          to_path: string
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          from_path?: string | null
          id?: string
          session_id?: string
          to_path?: string
          visitor_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          answers: Json
          created_at: string
          date_of_birth: string
          email: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          created_at?: string
          date_of_birth: string
          email: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          date_of_birth?: string
          email?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posting: {
        Row: {
          blog_content: string
          blog_topic: string
          Category: string | null
          created_at: string | null
          image_url: string | null
          Status: string
        }
        Insert: {
          blog_content?: string
          blog_topic: string
          Category?: string | null
          created_at?: string | null
          image_url?: string | null
          Status?: string
        }
        Update: {
          blog_content?: string
          blog_topic?: string
          Category?: string | null
          created_at?: string | null
          image_url?: string | null
          Status?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          account_status: string
          contract_signed_at: string | null
          contract_status: string
          created_at: string
          custom_price: number | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          max_services: number | null
          notes: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          plan: string | null
          role: string
          selected_services: string[] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_status?: string
          contract_signed_at?: string | null
          contract_status?: string
          created_at?: string
          custom_price?: number | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_services?: number | null
          notes?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          plan?: string | null
          role?: string
          selected_services?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_status?: string
          contract_signed_at?: string | null
          contract_status?: string
          created_at?: string
          custom_price?: number | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_services?: number | null
          notes?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          plan?: string | null
          role?: string
          selected_services?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coach_credentials: {
        Row: {
          created_at: string | null
          id: string
          last_login: string | null
          password_hash: string
          role: Database["public"]["Enums"]["coach_role"]
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["coach_role"]
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["coach_role"]
          username?: string
        }
        Relationships: []
      }
      Company: {
        Row: {
          config: Json
          id: string
          name: string
        }
        Insert: {
          config: Json
          id: string
          name: string
        }
        Update: {
          config?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          id: string
          signed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ExperienceMapping: {
        Row: {
          companyId: string
          createdAt: string
          experienceId: string
          id: string
          updatedAt: string
        }
        Insert: {
          companyId: string
          createdAt?: string
          experienceId: string
          id: string
          updatedAt: string
        }
        Update: {
          companyId?: string
          createdAt?: string
          experienceId?: string
          id?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ExperienceMapping_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
        ]
      }
      FFFColorSheet: {
        Row: {
          created_at: string
          id: number
          prompts: string | null
          submissions: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          prompts?: string | null
          submissions?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          prompts?: string | null
          submissions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FFFColorSheet_submissions_fkey"
            columns: ["submissions"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          module_id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          module_id: string
          order_index?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_advertising: {
        Row: {
          ad_account_access_details: string | null
          additional_notes: string | null
          audience_personas: string | null
          brand_voice: string | null
          business_name: string | null
          campaign_duration: string | null
          campaign_start_date: string | null
          client_profile_id: string
          competitor_ad_examples: string | null
          completed_at: string | null
          confirmed_accurate: boolean | null
          conversion_actions: string | null
          conversion_tracking_setup: boolean | null
          created_at: string
          creative_assets_available: string | null
          current_ad_accounts: string | null
          differentiation_strategy: string | null
          email_address: string | null
          existing_ad_creatives: boolean | null
          expected_results_timeline: string | null
          has_ad_accounts: boolean | null
          historical_performance: string | null
          id: string
          industry_niche: string | null
          key_messaging_points: string | null
          landing_page_urls: string | null
          main_competitors: string | null
          monthly_budget_range: string | null
          previous_advertising_experience: string | null
          primary_campaign_goal: string | null
          primary_contact_name: string | null
          promotional_offers: string | null
          reporting_preferences: string | null
          retargeting_audiences: string | null
          secondary_goals: string[] | null
          selected_channels: string[] | null
          target_demographics: string | null
          target_interests: string | null
          target_kpis: string | null
          target_locations: string | null
          unique_selling_propositions: string | null
          updated_at: string
          what_didnt_work: string | null
          what_worked: string | null
        }
        Insert: {
          ad_account_access_details?: string | null
          additional_notes?: string | null
          audience_personas?: string | null
          brand_voice?: string | null
          business_name?: string | null
          campaign_duration?: string | null
          campaign_start_date?: string | null
          client_profile_id: string
          competitor_ad_examples?: string | null
          completed_at?: string | null
          confirmed_accurate?: boolean | null
          conversion_actions?: string | null
          conversion_tracking_setup?: boolean | null
          created_at?: string
          creative_assets_available?: string | null
          current_ad_accounts?: string | null
          differentiation_strategy?: string | null
          email_address?: string | null
          existing_ad_creatives?: boolean | null
          expected_results_timeline?: string | null
          has_ad_accounts?: boolean | null
          historical_performance?: string | null
          id?: string
          industry_niche?: string | null
          key_messaging_points?: string | null
          landing_page_urls?: string | null
          main_competitors?: string | null
          monthly_budget_range?: string | null
          previous_advertising_experience?: string | null
          primary_campaign_goal?: string | null
          primary_contact_name?: string | null
          promotional_offers?: string | null
          reporting_preferences?: string | null
          retargeting_audiences?: string | null
          secondary_goals?: string[] | null
          selected_channels?: string[] | null
          target_demographics?: string | null
          target_interests?: string | null
          target_kpis?: string | null
          target_locations?: string | null
          unique_selling_propositions?: string | null
          updated_at?: string
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Update: {
          ad_account_access_details?: string | null
          additional_notes?: string | null
          audience_personas?: string | null
          brand_voice?: string | null
          business_name?: string | null
          campaign_duration?: string | null
          campaign_start_date?: string | null
          client_profile_id?: string
          competitor_ad_examples?: string | null
          completed_at?: string | null
          confirmed_accurate?: boolean | null
          conversion_actions?: string | null
          conversion_tracking_setup?: boolean | null
          created_at?: string
          creative_assets_available?: string | null
          current_ad_accounts?: string | null
          differentiation_strategy?: string | null
          email_address?: string | null
          existing_ad_creatives?: boolean | null
          expected_results_timeline?: string | null
          has_ad_accounts?: boolean | null
          historical_performance?: string | null
          id?: string
          industry_niche?: string | null
          key_messaging_points?: string | null
          landing_page_urls?: string | null
          main_competitors?: string | null
          monthly_budget_range?: string | null
          previous_advertising_experience?: string | null
          primary_campaign_goal?: string | null
          primary_contact_name?: string | null
          promotional_offers?: string | null
          reporting_preferences?: string | null
          retargeting_audiences?: string | null
          secondary_goals?: string[] | null
          selected_channels?: string[] | null
          target_demographics?: string | null
          target_interests?: string | null
          target_kpis?: string | null
          target_locations?: string | null
          unique_selling_propositions?: string | null
          updated_at?: string
          what_didnt_work?: string | null
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_advertising_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_amazon: {
        Row: {
          additional_notes: string | null
          asin: string | null
          brand_voice: string | null
          brand_voice_other: string | null
          brands_admired: string | null
          business_name: string | null
          client_profile_id: string
          competitor_asins: string | null
          competitor_dislikes: string | null
          competitor_likes: string | null
          completed_at: string | null
          compliance_restrictions: string | null
          confirmed_accurate: boolean | null
          created_at: string
          customer_objections: string | null
          customer_pain_points: string | null
          desired_outcome: string | null
          dimensions_weight: string | null
          email_address: string | null
          example_listings: string | null
          features_to_highlight: string | null
          has_brand_guidelines: boolean | null
          id: string
          ideal_customer: string | null
          image_styles_to_avoid: string | null
          key_features: string | null
          mandatory_claims: string | null
          materials_specs: string | null
          preferred_colors: string | null
          preferred_fonts: string | null
          primary_contact_name: string | null
          problem_solved: string | null
          product_category: string | null
          product_description: string | null
          product_name: string | null
          product_status: string | null
          product_variations: string | null
          seller_account_type: string | null
          style_preference: string | null
          target_marketplaces: string[] | null
          top_3_benefits: string | null
          turnaround_preference: string | null
          updated_at: string
          uploaded_assets: Json | null
          video_examples: string | null
          video_messaging: string | null
          video_primary_goal: string | null
          video_tone: string | null
          words_to_associate: string | null
          words_to_avoid: string | null
          work_approver: string | null
        }
        Insert: {
          additional_notes?: string | null
          asin?: string | null
          brand_voice?: string | null
          brand_voice_other?: string | null
          brands_admired?: string | null
          business_name?: string | null
          client_profile_id: string
          competitor_asins?: string | null
          competitor_dislikes?: string | null
          competitor_likes?: string | null
          completed_at?: string | null
          compliance_restrictions?: string | null
          confirmed_accurate?: boolean | null
          created_at?: string
          customer_objections?: string | null
          customer_pain_points?: string | null
          desired_outcome?: string | null
          dimensions_weight?: string | null
          email_address?: string | null
          example_listings?: string | null
          features_to_highlight?: string | null
          has_brand_guidelines?: boolean | null
          id?: string
          ideal_customer?: string | null
          image_styles_to_avoid?: string | null
          key_features?: string | null
          mandatory_claims?: string | null
          materials_specs?: string | null
          preferred_colors?: string | null
          preferred_fonts?: string | null
          primary_contact_name?: string | null
          problem_solved?: string | null
          product_category?: string | null
          product_description?: string | null
          product_name?: string | null
          product_status?: string | null
          product_variations?: string | null
          seller_account_type?: string | null
          style_preference?: string | null
          target_marketplaces?: string[] | null
          top_3_benefits?: string | null
          turnaround_preference?: string | null
          updated_at?: string
          uploaded_assets?: Json | null
          video_examples?: string | null
          video_messaging?: string | null
          video_primary_goal?: string | null
          video_tone?: string | null
          words_to_associate?: string | null
          words_to_avoid?: string | null
          work_approver?: string | null
        }
        Update: {
          additional_notes?: string | null
          asin?: string | null
          brand_voice?: string | null
          brand_voice_other?: string | null
          brands_admired?: string | null
          business_name?: string | null
          client_profile_id?: string
          competitor_asins?: string | null
          competitor_dislikes?: string | null
          competitor_likes?: string | null
          completed_at?: string | null
          compliance_restrictions?: string | null
          confirmed_accurate?: boolean | null
          created_at?: string
          customer_objections?: string | null
          customer_pain_points?: string | null
          desired_outcome?: string | null
          dimensions_weight?: string | null
          email_address?: string | null
          example_listings?: string | null
          features_to_highlight?: string | null
          has_brand_guidelines?: boolean | null
          id?: string
          ideal_customer?: string | null
          image_styles_to_avoid?: string | null
          key_features?: string | null
          mandatory_claims?: string | null
          materials_specs?: string | null
          preferred_colors?: string | null
          preferred_fonts?: string | null
          primary_contact_name?: string | null
          problem_solved?: string | null
          product_category?: string | null
          product_description?: string | null
          product_name?: string | null
          product_status?: string | null
          product_variations?: string | null
          seller_account_type?: string | null
          style_preference?: string | null
          target_marketplaces?: string[] | null
          top_3_benefits?: string | null
          turnaround_preference?: string | null
          updated_at?: string
          uploaded_assets?: Json | null
          video_examples?: string | null
          video_messaging?: string | null
          video_primary_goal?: string | null
          video_tone?: string | null
          words_to_associate?: string | null
          words_to_avoid?: string | null
          work_approver?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_amazon_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_avatars: {
        Row: {
          avatars: Json | null
          client_profile_id: string
          completed_at: string | null
          created_at: string
          customers_to_avoid: string | null
          existing_data_available: boolean | null
          id: string
          most_important_avatar: string | null
          most_important_reason: string | null
          products_services: string | null
          updated_at: string
        }
        Insert: {
          avatars?: Json | null
          client_profile_id: string
          completed_at?: string | null
          created_at?: string
          customers_to_avoid?: string | null
          existing_data_available?: boolean | null
          id?: string
          most_important_avatar?: string | null
          most_important_reason?: string | null
          products_services?: string | null
          updated_at?: string
        }
        Update: {
          avatars?: Json | null
          client_profile_id?: string
          completed_at?: string | null
          created_at?: string
          customers_to_avoid?: string | null
          existing_data_available?: boolean | null
          id?: string
          most_important_avatar?: string | null
          most_important_reason?: string | null
          products_services?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_avatars_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_goals: {
        Row: {
          achievable_goal_summary: string | null
          achievable_realistic: string | null
          achievable_steps: string | null
          action_plan: Json | null
          client_profile_id: string
          completed_at: string | null
          created_at: string
          goal_narrative: string | null
          id: string
          measurable_goal_summary: string | null
          measurable_metrics: string | null
          measurable_target: string | null
          obstacles_solutions: Json | null
          primary_goal: string | null
          relevant_alignment: string | null
          relevant_goal_summary: string | null
          relevant_worthwhile: string | null
          specific_goal_summary: string | null
          specific_what: string | null
          specific_where: string | null
          specific_who: string | null
          specific_why: string | null
          timebound_deadline: string | null
          timebound_goal_summary: string | null
          timebound_milestones: string | null
          updated_at: string
        }
        Insert: {
          achievable_goal_summary?: string | null
          achievable_realistic?: string | null
          achievable_steps?: string | null
          action_plan?: Json | null
          client_profile_id: string
          completed_at?: string | null
          created_at?: string
          goal_narrative?: string | null
          id?: string
          measurable_goal_summary?: string | null
          measurable_metrics?: string | null
          measurable_target?: string | null
          obstacles_solutions?: Json | null
          primary_goal?: string | null
          relevant_alignment?: string | null
          relevant_goal_summary?: string | null
          relevant_worthwhile?: string | null
          specific_goal_summary?: string | null
          specific_what?: string | null
          specific_where?: string | null
          specific_who?: string | null
          specific_why?: string | null
          timebound_deadline?: string | null
          timebound_goal_summary?: string | null
          timebound_milestones?: string | null
          updated_at?: string
        }
        Update: {
          achievable_goal_summary?: string | null
          achievable_realistic?: string | null
          achievable_steps?: string | null
          action_plan?: Json | null
          client_profile_id?: string
          completed_at?: string | null
          created_at?: string
          goal_narrative?: string | null
          id?: string
          measurable_goal_summary?: string | null
          measurable_metrics?: string | null
          measurable_target?: string | null
          obstacles_solutions?: Json | null
          primary_goal?: string | null
          relevant_alignment?: string | null
          relevant_goal_summary?: string | null
          relevant_worthwhile?: string | null
          specific_goal_summary?: string | null
          specific_what?: string | null
          specific_where?: string | null
          specific_who?: string | null
          specific_why?: string | null
          timebound_deadline?: string | null
          timebound_goal_summary?: string | null
          timebound_milestones?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_goals_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_questionnaire: {
        Row: {
          additional_notes: string | null
          assets_to_review: string | null
          automation_needs: string | null
          big_win_expectation: string | null
          biggest_challenges: string | null
          brand_identity: string | null
          budget_timeline: string | null
          business_description: string | null
          business_name: string | null
          client_profile_id: string
          communication_preference: string | null
          completed_at: string | null
          content_creation: string | null
          core_offers: string | null
          created_at: string
          crm_email_tools: string | null
          decision_maker: string | null
          existing_funnels: string | null
          goal_blockers: string | null
          id: string
          ideal_collaboration: string | null
          important_platforms: string | null
          industry_niche: string | null
          lead_acquisition: string | null
          marketing_not_working: string | null
          marketing_tools: string | null
          marketing_working: string | null
          past_agencies_experience: string | null
          performance_tracking: string | null
          planned_launches: string | null
          primary_contact: string | null
          project_management_tools: string | null
          revenue_goals: string | null
          revenue_streams: string | null
          sales_funnel_tools: string | null
          start_timeline: string | null
          stuck_areas: string | null
          target_audience: string | null
          team_structure: string | null
          top_3_goals: string | null
          updated_at: string
          vision_3_5_years: string | null
          years_operating: string | null
        }
        Insert: {
          additional_notes?: string | null
          assets_to_review?: string | null
          automation_needs?: string | null
          big_win_expectation?: string | null
          biggest_challenges?: string | null
          brand_identity?: string | null
          budget_timeline?: string | null
          business_description?: string | null
          business_name?: string | null
          client_profile_id: string
          communication_preference?: string | null
          completed_at?: string | null
          content_creation?: string | null
          core_offers?: string | null
          created_at?: string
          crm_email_tools?: string | null
          decision_maker?: string | null
          existing_funnels?: string | null
          goal_blockers?: string | null
          id?: string
          ideal_collaboration?: string | null
          important_platforms?: string | null
          industry_niche?: string | null
          lead_acquisition?: string | null
          marketing_not_working?: string | null
          marketing_tools?: string | null
          marketing_working?: string | null
          past_agencies_experience?: string | null
          performance_tracking?: string | null
          planned_launches?: string | null
          primary_contact?: string | null
          project_management_tools?: string | null
          revenue_goals?: string | null
          revenue_streams?: string | null
          sales_funnel_tools?: string | null
          start_timeline?: string | null
          stuck_areas?: string | null
          target_audience?: string | null
          team_structure?: string | null
          top_3_goals?: string | null
          updated_at?: string
          vision_3_5_years?: string | null
          years_operating?: string | null
        }
        Update: {
          additional_notes?: string | null
          assets_to_review?: string | null
          automation_needs?: string | null
          big_win_expectation?: string | null
          biggest_challenges?: string | null
          brand_identity?: string | null
          budget_timeline?: string | null
          business_description?: string | null
          business_name?: string | null
          client_profile_id?: string
          communication_preference?: string | null
          completed_at?: string | null
          content_creation?: string | null
          core_offers?: string | null
          created_at?: string
          crm_email_tools?: string | null
          decision_maker?: string | null
          existing_funnels?: string | null
          goal_blockers?: string | null
          id?: string
          ideal_collaboration?: string | null
          important_platforms?: string | null
          industry_niche?: string | null
          lead_acquisition?: string | null
          marketing_not_working?: string | null
          marketing_tools?: string | null
          marketing_working?: string | null
          past_agencies_experience?: string | null
          performance_tracking?: string | null
          planned_launches?: string | null
          primary_contact?: string | null
          project_management_tools?: string | null
          revenue_goals?: string | null
          revenue_streams?: string | null
          sales_funnel_tools?: string | null
          start_timeline?: string | null
          stuck_areas?: string | null
          target_audience?: string | null
          team_structure?: string | null
          top_3_goals?: string | null
          updated_at?: string
          vision_3_5_years?: string | null
          years_operating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_questionnaire_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          payment_method: string | null
          promo_code_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          promo_code_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_method?: string | null
          promo_code_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          expires_at: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          prompt_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          approved: boolean | null
          id: string
          image_url: string | null
          points_awarded: number | null
          prompt_id: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          approved?: boolean | null
          id?: string
          image_url?: string | null
          points_awarded?: number | null
          prompt_id?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved?: boolean | null
          id?: string
          image_url?: string | null
          points_awarded?: number | null
          prompt_id?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          billing_day: number | null
          billing_reminder_enabled: boolean | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_manual: boolean | null
          last_billed_date: string | null
          metadata: Json | null
          migration_status: string | null
          next_billing_date: string | null
          onboarding_completed: boolean | null
          payment_method: string | null
          plan: string | null
          selected_services: string[] | null
          stripe_customer_id: string
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          billing_day?: number | null
          billing_reminder_enabled?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_manual?: boolean | null
          last_billed_date?: string | null
          metadata?: Json | null
          migration_status?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          payment_method?: string | null
          plan?: string | null
          selected_services?: string[] | null
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          billing_day?: number | null
          billing_reminder_enabled?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_manual?: boolean | null
          last_billed_date?: string | null
          metadata?: Json | null
          migration_status?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          payment_method?: string | null
          plan?: string | null
          selected_services?: string[] | null
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          joined_at: string | null
          points: number | null
          telegram_id: number | null
          username: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          points?: number | null
          telegram_id?: number | null
          username?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          points?: number | null
          telegram_id?: number | null
          username?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          customer_email: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          metadata: Json | null
          processed_at: string
          status: string
        }
        Insert: {
          customer_email?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          processed_at?: string
          status?: string
        }
        Update: {
          customer_email?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          processed_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_coach_credentials: {
        Args: { p_password_hash: string; p_username: string }
        Returns: {
          id: string
          last_login: string
          role: Database["public"]["Enums"]["coach_role"]
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "student" | "coach"
      coach_role: "head_coach" | "assistant_coach"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "student", "coach"],
      coach_role: ["head_coach", "assistant_coach"],
    },
  },
} as const
