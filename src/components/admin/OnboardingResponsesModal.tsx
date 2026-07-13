import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, User, ClipboardList, CheckCircle2, Clock, ShoppingBag, Megaphone, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OnboardingResponsesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export const OnboardingResponsesModal = ({
  open,
  onOpenChange,
  clientId,
  clientName,
}: OnboardingResponsesModalProps) => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any>(null);
  const [avatars, setAvatars] = useState<any>(null);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [amazon, setAmazon] = useState<any>(null);
  const [advertising, setAdvertising] = useState<any>(null);
  const [onboardingType, setOnboardingType] = useState<string>("standard");

  useEffect(() => {
    if (open && clientId) {
      fetchOnboardingData();
    } else {
      setGoals(null);
      setAvatars(null);
      setQuestionnaire(null);
      setAmazon(null);
      setAdvertising(null);
      setOnboardingType("standard");
    }
  }, [open, clientId]);

  const fetchOnboardingData = async () => {
    setLoading(true);
    try {
      const [goalsRes, avatarsRes, questionnaireRes, amazonRes, advertisingRes, profileRes] = await Promise.all([
        supabase.from("onboarding_goals").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_avatars").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_questionnaire").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_amazon").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_advertising").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("client_profiles").select("plan, selected_services").eq("id", clientId).maybeSingle(),
      ]);

      let qData = questionnaireRes.data;
      if (qData && qData.additional_notes) {
        try {
          const parsed = JSON.parse(qData.additional_notes);
          if (parsed && typeof parsed === "object") {
            qData = { ...qData, ...parsed };
          }
        } catch (e) {
          console.error("Error parsing questionnaire additional_notes:", e);
        }
      }

      let adData = advertisingRes.data;
      if (adData && adData.additional_notes) {
        try {
          const parsed = JSON.parse(adData.additional_notes);
          if (parsed && typeof parsed === "object") {
            adData = { ...adData, ...parsed };
          }
        } catch (e) {
          console.error("Error parsing advertising additional_notes:", e);
        }
      }

      setGoals(goalsRes.data);
      setAvatars(avatarsRes.data);
      setQuestionnaire(qData);
      setAmazon(amazonRes.data);
      setAdvertising(adData);

      if (profileRes.data) {
        const services = profileRes.data.selected_services || [];
        const plan = profileRes.data.plan;
        if (services.includes("amazon-design") || plan === "amazon") {
          setOnboardingType("amazon");
        } else if (services.includes("advertising-package") || services.some((s: string) => s.startsWith("channel-")) || plan === "advertising") {
          setOnboardingType("advertising");
        } else if (services.includes("custom-tool") || plan === "custom-lms" || plan === "discovery") {
          setOnboardingType("discovery");
        } else {
          setOnboardingType("standard");
        }
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window. Please allow popups.");
      return;
    }

    let reportContent = "";

    const reportHeader = `
      <div class="header">
        <div>
          <div class="logo">SIENVI</div>
          <div class="header-meta">Support, Coaching & AI Automation</div>
        </div>
        <div style="text-align: right;">
          <h1>Onboarding Report</h1>
          <div class="header-meta">Client: <strong>${clientName}</strong></div>
          <div class="header-meta">Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
    `;

    const renderPrintField = (label: string, value: any) => {
      if (!value) return "";
      const formattedValue = typeof value === "string" ? value.replace(/\n/g, "<br/>") : JSON.stringify(value);
      return `
        <div class="field">
          <div class="field-label">${label}</div>
          <div class="field-value">${formattedValue}</div>
        </div>
      `;
    };

    const renderPrintCard = (title: string, content: string) => {
      if (!content.trim()) return "";
      return `
        <div class="card">
          <div class="card-title">${title}</div>
          ${content}
        </div>
      `;
    };

    if (goals) {
      let goalsHtml = "";
      goalsHtml += renderPrintField("Primary Goal", goals.primary_goal);
      
      let specific = "";
      specific += renderPrintField("What exactly do you want to achieve?", goals.specific_what);
      specific += renderPrintField("Who is involved?", goals.specific_who);
      specific += renderPrintField("Where will this be achieved?", goals.specific_where);
      specific += renderPrintField("Why is this important?", goals.specific_why);
      specific += renderPrintField("Specific Goal Summary", goals.specific_goal_summary);
      goalsHtml += renderPrintCard("Specific (S)", specific);

      let measurable = "";
      measurable += renderPrintField("How will you measure progress?", goals.measurable_metrics);
      measurable += renderPrintField("Quantifiable Target", goals.measurable_target);
      measurable += renderPrintField("Measurable Goal Summary", goals.measurable_goal_summary);
      goalsHtml += renderPrintCard("Measurable (M)", measurable);

      let achievable = "";
      achievable += renderPrintField("Is the goal realistic?", goals.achievable_realistic);
      achievable += renderPrintField("Steps needed", goals.achievable_steps);
      achievable += renderPrintField("Achievable Goal Summary", goals.achievable_goal_summary);
      goalsHtml += renderPrintCard("Achievable (A)", achievable);

      let relevant = "";
      relevant += renderPrintField("Alignment with objectives", goals.relevant_alignment);
      relevant += renderPrintField("Why is it worthwhile?", goals.relevant_worthwhile);
      relevant += renderPrintField("Relevant Goal Summary", goals.relevant_goal_summary);
      goalsHtml += renderPrintCard("Relevant (R)", relevant);

      let timebound = "";
      timebound += renderPrintField("Deadline", goals.timebound_deadline);
      timebound += renderPrintField("Milestones", goals.timebound_milestones);
      timebound += renderPrintField("Time-bound Goal Summary", goals.timebound_goal_summary);
      goalsHtml += renderPrintCard("Time-bound (T)", timebound);

      goalsHtml += renderPrintField("Complete Goal Narrative", goals.goal_narrative);

      if (goals.action_plan?.length > 0) {
        let actions = "";
        goals.action_plan.forEach((step: any, i: number) => {
          actions += `
            <div style="margin-bottom: 10px; padding: 10px; background-color: #f1f5f9; border-radius: 4px;">
              <strong style="color: #0f172a;">Step ${i + 1}: ${step.actionItem}</strong><br/>
              ${step.responsiblePerson ? `<span style="font-size: 13px; color: #475569;">Responsible: ${step.responsiblePerson}</span> &middot; ` : ""}
              ${step.deadline ? `<span style="font-size: 13px; color: #475569;">Deadline: ${step.deadline}</span> &middot; ` : ""}
              ${step.resourcesNeeded ? `<span style="font-size: 13px; color: #475569;">Resources: ${step.resourcesNeeded}</span>` : ""}
            </div>
          `;
        });
        goalsHtml += renderPrintCard("Action Plan", actions);
      }

      if (goals.obstacles_solutions?.length > 0) {
        let obstacles = "";
        goals.obstacles_solutions.forEach((obs: any, i: number) => {
          obstacles += `
            <div style="margin-bottom: 10px; padding: 10px; background-color: #f1f5f9; border-radius: 4px;">
              <strong style="color: #0f172a;">Obstacle: ${obs.obstacle}</strong><br/>
              ${obs.solution ? `<span style="font-size: 13px; color: #475569;">Solution: ${obs.solution}</span>` : ""}
            </div>
          `;
        });
        goalsHtml += renderPrintCard("Obstacles & Solutions", obstacles);
      }

      reportContent += `
        <div class="section-title">SMART Goal Sheet</div>
        ${goalsHtml}
      `;
    }

    if (avatars) {
      let avatarsHtml = "";
      avatarsHtml += renderPrintField("Products/Services Overview", avatars.products_services);

      avatars.avatars?.forEach((avatar: any, i: number) => {
        let avatarDetails = "";
        avatarDetails += `
          <div class="grid-2">
            ${renderPrintField("Age Range", avatar.ageRange)}
            ${renderPrintField("Gender", avatar.gender)}
            ${renderPrintField("Location", avatar.location)}
            ${renderPrintField("Education", avatar.education)}
            ${renderPrintField("Relationship/Family", avatar.relationship)}
            ${renderPrintField("Occupation & Income", avatar.occupation)}
          </div>
          <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            ${renderPrintField("Goals & Aspirations", avatar.goals)}
            ${renderPrintField("Pain Points", avatar.painPoints)}
            ${renderPrintField("Fears", avatar.fears)}
            ${renderPrintField("Beliefs", avatar.beliefs)}
            ${renderPrintField("Online Hangouts", avatar.onlineHangouts)}
            ${renderPrintField("Content Style", avatar.contentStyle)}
            ${renderPrintField("Objections", avatar.objections)}
            ${renderPrintField("Buying Triggers", avatar.buyingTriggers)}
            ${renderPrintField("Journey Stage", avatar.journeyStage)}
            ${renderPrintField("How They Find You", avatar.howTheyFind)}
            ${renderPrintField("Desired Transformation", avatar.desiredTransformation)}
          </div>
        `;
        avatarsHtml += renderPrintCard(`Avatar ${i + 1}: ${avatar.name}`, avatarDetails);
      });

      let finalNotes = "";
      finalNotes += renderPrintField("Most Important Avatar", avatars.most_important_avatar);
      finalNotes += renderPrintField("Reason", avatars.most_important_reason);
      finalNotes += renderPrintField("Customers to Avoid", avatars.customers_to_avoid);
      if (avatars.existing_data_available) {
        finalNotes += `<div class="field"><div class="badge">Has existing customer data/testimonials</div></div>`;
      }
      avatarsHtml += renderPrintCard("Final Notes", finalNotes);

      reportContent += `
        <div class="section-title page-break">Customer Avatar Profiles</div>
        ${avatarsHtml}
      `;
    }

    if (onboardingType === "amazon" && amazon) {
      let amazonHtml = "";
      
      let bizInfo = "";
      bizInfo += renderPrintField("Business Name", amazon.business_name);
      bizInfo += renderPrintField("Primary Contact Name", amazon.primary_contact_name);
      bizInfo += renderPrintField("Email Address", amazon.email_address);
      bizInfo += renderPrintField("Amazon Seller Account Type", amazon.seller_account_type === "seller_central" ? "Seller Central" : amazon.seller_account_type === "vendor_central" ? "Vendor Central" : amazon.seller_account_type);
      if (amazon.target_marketplaces?.length > 0) {
        bizInfo += renderPrintField("Target Marketplace(s)", amazon.target_marketplaces.join(", "));
      }
      amazonHtml += renderPrintCard("Business & Brand Information", bizInfo);

      let prodOverview = "";
      prodOverview += renderPrintField("Product Name", amazon.product_name);
      prodOverview += renderPrintField("Product Category", amazon.product_category);
      prodOverview += renderPrintField("ASIN", amazon.asin);
      prodOverview += renderPrintField("Product Status", amazon.product_status === "new" ? "New Product" : amazon.product_status === "existing" ? "Existing Listing" : amazon.product_status);
      prodOverview += renderPrintField("Product Variations", amazon.product_variations);
      amazonHtml += renderPrintCard("Product Overview", prodOverview);

      let prodDetails = "";
      prodDetails += renderPrintField("Brief Description of Your Product", amazon.product_description);
      prodDetails += renderPrintField("Key Features", amazon.key_features);
      prodDetails += renderPrintField("Top 3 Benefits", amazon.top_3_benefits);
      prodDetails += renderPrintField("What Problem Does This Product Solve?", amazon.problem_solved);
      prodDetails += renderPrintField("Materials, Ingredients, or Technical Specs", amazon.materials_specs);
      prodDetails += renderPrintField("Dimensions and Weight", amazon.dimensions_weight);
      amazonHtml += renderPrintCard("Product Details", prodDetails);

      let customer = "";
      customer += renderPrintField("Who is Your Ideal Customer?", amazon.ideal_customer);
      customer += renderPrintField("Demographics, Interests & Behaviors", amazon.customer_pain_points);
      customer += renderPrintField("Desired Outcome", amazon.desired_outcome);
      customer += renderPrintField("Customer Objections/Hesitations", amazon.customer_objections);
      amazonHtml += renderPrintCard("Target Customer", customer);

      let brandVoice = "";
      brandVoice += renderPrintField("Brand Voice", amazon.brand_voice === "other" ? `Other: ${amazon.brand_voice_other || ""}` : amazon.brand_voice);
      brandVoice += renderPrintField("Brands Admired", amazon.brands_admired);
      brandVoice += renderPrintField("Words to Associate", amazon.words_to_associate);
      brandVoice += renderPrintField("Words to Avoid", amazon.words_to_avoid);
      amazonHtml += renderPrintCard("Brand Voice & Positioning", brandVoice);

      let visual = "";
      visual += renderPrintField("Has Brand Guidelines", amazon.has_brand_guidelines ? "Yes" : "No");
      visual += renderPrintField("Preferred Colors", amazon.preferred_colors);
      visual += renderPrintField("Preferred Fonts", amazon.preferred_fonts);
      visual += renderPrintField("Style Preference", amazon.style_preference);
      visual += renderPrintField("Listing Examples Liked", amazon.example_listings);
      amazonHtml += renderPrintCard("Visual Style Preferences", visual);

      let competitor = "";
      competitor += renderPrintField("Top 3–5 Competitor ASINs or Links", amazon.competitor_asins);
      competitor += renderPrintField("What Do You Like About Their Listings?", amazon.competitor_likes);
      competitor += renderPrintField("What Do You Dislike or Want to Avoid?", amazon.competitor_dislikes);
      amazonHtml += renderPrintCard("Competitors & Market Research", competitor);

      let creative = "";
      creative += renderPrintField("Features to Highlight Visually", amazon.features_to_highlight);
      creative += renderPrintField("Mandatory Claims/Certifications", amazon.mandatory_claims);
      creative += renderPrintField("Legal or Compliance Restrictions", amazon.compliance_restrictions);
      creative += renderPrintField("Image Styles/Concepts to Avoid", amazon.image_styles_to_avoid);
      amazonHtml += renderPrintCard("Image & Creative Direction", creative);

      let video = "";
      video += renderPrintField("Primary Goal of the Videos", amazon.video_primary_goal);
      video += renderPrintField("Messaging/Offers to Include", amazon.video_messaging);
      video += renderPrintField("Tone Preference", amazon.video_tone);
      video += renderPrintField("Competitor/Brand Videos Liked", amazon.video_examples);
      amazonHtml += renderPrintCard("Video Ad Preferences", video);

      let approval = "";
      approval += renderPrintField("Who Will Be Approving the Work?", amazon.work_approver);
      approval += renderPrintField("Preferred Turnaround Time", amazon.turnaround_preference);
      approval += renderPrintField("Additional Notes", amazon.additional_notes);
      amazonHtml += renderPrintCard("Approvals & Final Notes", approval);

      reportContent += `
        <div class="section-title page-break">Amazon Listing Design Questionnaire</div>
        ${amazonHtml}
      `;
    }

    if (onboardingType === "advertising" && advertising) {
      let adHtml = "";
      const isAmazonAds = advertising.selected_channels?.includes("amazon") || advertising.products_list_asin_sku || advertising.daily_budget;

      if (isAmazonAds) {
        let contact = "";
        contact += renderPrintField("Brand Name", advertising.business_name);
        contact += renderPrintField("Contact Name", advertising.primary_contact_name);
        contact += renderPrintField("Email Address", advertising.email_address);
        contact += renderPrintField("Website or Social Media", advertising.website_or_social_page);
        contact += renderPrintField("Amazon Marketplace", advertising.target_locations);
        adHtml += renderPrintCard("Contact Information", contact);

        let goals = "";
        goals += renderPrintField("Main Goal with Amazon Ads", advertising.primary_campaign_goal);
        goals += renderPrintField("Outcome in 2-3 Months", advertising.expected_results_timeline);
        adHtml += renderPrintCard("Goals", goals);

        let products = "";
        products += renderPrintField("Products List (Link | ASIN | SKU)", advertising.products_list_asin_sku);
        products += renderPrintField("Products to Advertise First", advertising.products_to_advertise_first);
        products += renderPrintField("Top Priority Products", advertising.top_priority_products);
        products += renderPrintField("Are Products Live?", advertising.are_products_live_on_amazon);
        adHtml += renderPrintCard("Products", products);

        let budget = "";
        budget += renderPrintField("Monthly Ad Budget", advertising.monthly_budget_range);
        budget += renderPrintField("Daily Budget", advertising.daily_budget);
        budget += renderPrintField("Start Strategy", advertising.how_do_you_want_to_start);
        adHtml += renderPrintCard("Budget & Strategy", budget);

        let pricing = "";
        pricing += renderPrintField("Selling Price of Main Product", advertising.selling_price_of_main_product);
        pricing += renderPrintField("Units in Stock", advertising.units_in_stock);
        pricing += renderPrintField("Products Low on Stock?", advertising.products_low_on_stock);
        adHtml += renderPrintCard("Pricing & Inventory", pricing);

        let keywords = "";
        keywords += renderPrintField("Suggested Search Keywords", advertising.suggested_search_keywords);
        keywords += renderPrintField("Main Competitors", advertising.main_competitors);
        adHtml += renderPrintCard("Keywords & Competitors", keywords);

        let positioning = "";
        positioning += renderPrintField("What makes product different/better?", advertising.differentiation_strategy);
        positioning += renderPrintField("Ideal Customer", advertising.ideal_customer);
        adHtml += renderPrintCard("Product Positioning", positioning);

        let notes = "";
        notes += renderPrintField("Running Coupons or Promotions?", advertising.running_coupons_or_promotions);
        notes += renderPrintField("Anything Important to Know?", advertising.anything_important_to_know);
        adHtml += renderPrintCard("Final Notes", notes);
        
        reportContent += `
          <div class="section-title page-break">Amazon Advertising Onboarding Questionnaire</div>
          ${adHtml}
        `;
      } else {
        let overview = "";
        overview += renderPrintField("Business Name", advertising.business_name);
        overview += renderPrintField("Primary Contact Name", advertising.primary_contact_name);
        overview += renderPrintField("Email Address", advertising.email_address);
        overview += renderPrintField("Industry/Niche", advertising.industry_niche);
        if (advertising.selected_channels?.length > 0) {
          overview += renderPrintField("Advertising Channels", advertising.selected_channels.join(", "));
        }
        adHtml += renderPrintCard("Business & Campaign Overview", overview);

        let goalsSec = "";
        goalsSec += renderPrintField("Primary Campaign Goal", advertising.primary_campaign_goal);
        if (advertising.secondary_goals?.length > 0) {
          goalsSec += renderPrintField("Secondary Goals", advertising.secondary_goals.join(", "));
        }
        goalsSec += renderPrintField("Target KPIs", advertising.target_kpis);
        goalsSec += renderPrintField("Monthly Advertising Budget Range", advertising.monthly_budget_range);
        adHtml += renderPrintCard("Campaign Goals", goalsSec);

        let aud = "";
        aud += renderPrintField("Target Demographics", advertising.target_demographics);
        aud += renderPrintField("Target Locations", advertising.target_locations);
        aud += renderPrintField("Target Interests & Behaviors", advertising.target_interests);
        aud += renderPrintField("Audience Personas", advertising.audience_personas);
        aud += renderPrintField("Retargeting Audiences", advertising.retargeting_audiences);
        adHtml += renderPrintCard("Target Audience", aud);

        let statusSec = "";
        statusSec += renderPrintField("Previous Advertising Experience", advertising.previous_advertising_experience);
        statusSec += renderPrintField("Current Ad Accounts", advertising.current_ad_accounts);
        statusSec += renderPrintField("Historical Performance Summary", advertising.historical_performance);
        statusSec += renderPrintField("What Has Worked Well?", advertising.what_worked);
        statusSec += renderPrintField("What Hasn't Worked?", advertising.what_didnt_work);
        adHtml += renderPrintCard("Current Advertising Status", statusSec);

        let creativeSec = "";
        creativeSec += renderPrintField("Has Existing Ad Creatives", advertising.existing_ad_creatives ? "Yes" : "No");
        creativeSec += renderPrintField("Brand Voice", advertising.brand_voice);
        creativeSec += renderPrintField("Key Messaging Points", advertising.key_messaging_points);
        creativeSec += renderPrintField("Unique Selling Propositions (USPs)", advertising.unique_selling_propositions);
        creativeSec += renderPrintField("Promotional Offers or Incentives", advertising.promotional_offers);
        adHtml += renderPrintCard("Creative & Messaging", creativeSec);

        let landing = "";
        landing += renderPrintField("Landing Page URLs", advertising.landing_page_urls);
        landing += renderPrintField("Conversion Tracking Setup", advertising.conversion_tracking_setup ? "Yes" : "No");
        landing += renderPrintField("Conversion Actions to Track", advertising.conversion_actions);
        adHtml += renderPrintCard("Landing Pages & Conversion", landing);

        let comp = "";
        comp += renderPrintField("Main Competitors", advertising.main_competitors);
        comp += renderPrintField("Competitor Ad Examples", advertising.competitor_ad_examples);
        comp += renderPrintField("How You Want to Differentiate", advertising.differentiation_strategy);
        adHtml += renderPrintCard("Competitor Analysis", comp);

        let timeline = "";
        timeline += renderPrintField("Desired Start Date", advertising.campaign_start_date);
        timeline += renderPrintField("Campaign Duration", advertising.campaign_duration);
        timeline += renderPrintField("Expected Results Timeline", advertising.expected_results_timeline);
        timeline += renderPrintField("Reporting Preferences", advertising.reporting_preferences);
        adHtml += renderPrintCard("Timeline & Expectations", timeline);

        let assets = "";
        assets += renderPrintField("Has Ad Accounts to Grant Access", advertising.has_ad_accounts ? "Yes" : "No");
        assets += renderPrintField("Ad Account Access Details", advertising.ad_account_access_details);
        assets += renderPrintField("Creative Assets Available", advertising.creative_assets_available);
        adHtml += renderPrintCard("Assets & Access", assets);

        adHtml += renderPrintField("Additional Notes", advertising.additional_notes);

        reportContent += `
          <div class="section-title page-break">Advertising Campaign Questionnaire</div>
          ${adHtml}
        `;
      }
    }

    if (onboardingType !== "amazon" && onboardingType !== "advertising" && questionnaire) {
      if (onboardingType === "discovery") {
        let bizAdminHtml = "";
        
        let sect1 = "";
        sect1 += renderPrintField("Business Name", questionnaire.business_name);
        sect1 += renderPrintField("Primary Contact Name", questionnaire.primary_contact_name);
        sect1 += renderPrintField("Role/Title", questionnaire.role_title);
        sect1 += renderPrintField("Email Address", questionnaire.email_address);
        sect1 += renderPrintField("Phone/WhatsApp", questionnaire.phone_whatsapp);
        sect1 += renderPrintField("Website", questionnaire.website);
        sect1 += renderPrintField("Social Media Links", questionnaire.social_media_links);
        sect1 += renderPrintField("Location/Time Zone", questionnaire.location_time_zone);
        sect1 += renderPrintField("Preferred Communication", questionnaire.preferred_communication);
        sect1 += renderPrintField("Preferred Meeting Frequency", questionnaire.preferred_meeting_frequency);
        bizAdminHtml += renderPrintCard("1. Business & Contact Info", sect1);

        let sect2 = "";
        sect2 += renderPrintField("Business Description", questionnaire.business_description);
        sect2 += renderPrintField("Industry/Niche", questionnaire.industry_niche);
        sect2 += renderPrintField("Years Operating", questionnaire.years_operating);
        sect2 += renderPrintField("Primary Services", questionnaire.primary_services);
        sect2 += renderPrintField("Primary Clients", questionnaire.primary_clients);
        sect2 += renderPrintField("Revenue Streams", questionnaire.revenue_streams);
        sect2 += renderPrintField("Business Stage", questionnaire.business_stage);
        bizAdminHtml += renderPrintCard("2. Business Overview", sect2);

        let sect3 = "";
        sect3 += renderPrintField("Top 3 Goals (6-12 months)", questionnaire.top_3_goals);
        sect3 += renderPrintField("Successful Partnership definition", questionnaire.successful_partnership);
        sect3 += renderPrintField("Specific Outcomes Needed", questionnaire.specific_outcomes);
        sect3 += renderPrintField("How to Measure Success", questionnaire.measure_success);
        sect3 += renderPrintField("Deadlines & Priorities", questionnaire.deadlines_priorities);
        sect3 += renderPrintField("Long-Term Vision", questionnaire.long_term_vision);
        bizAdminHtml += renderPrintCard("3. Goals & Vision", sect3);

        let sect4 = "";
        sect4 += renderPrintField("Administrative Challenges", questionnaire.admin_challenges);
        sect4 += renderPrintField("Personal Time Sinks", questionnaire.personal_time_sinks);
        sect4 += renderPrintField("Tasks Falling Through Cracks", questionnaire.tasks_falling_through_cracks);
        sect4 += renderPrintField("Unclear Processes", questionnaire.unclear_processes);
        sect4 += renderPrintField("Prevention Factors", questionnaire.prevention_factors);
        sect4 += renderPrintField("Past Support Experience", questionnaire.past_support_experience);
        sect4 += renderPrintField("Immediate Delegation Tasks", questionnaire.immediate_delegation);
        bizAdminHtml += renderPrintCard("4. Challenges & Bottlenecks", sect4);

        let sect5 = "";
        if (questionnaire.selected_admin_services?.length > 0) {
          sect5 += renderPrintField("Selected Admin Services", questionnaire.selected_admin_services.join(", "));
        }
        sect5 += renderPrintField("Highest Priority Tasks", questionnaire.highest_priority_tasks);
        sect5 += renderPrintField("Recurring Tasks", questionnaire.recurring_tasks);
        sect5 += renderPrintField("One-Time Cleanup Tasks", questionnaire.one_time_cleanup);
        sect5 += renderPrintField("Tasks NOT to Handle", questionnaire.tasks_not_to_handle);
        bizAdminHtml += renderPrintCard("5. Admin Support Needs", sect5);

        let sect6 = "";
        sect6 += renderPrintField("Current Workflow Description", questionnaire.current_workflow);
        sect6 += renderPrintField("Documented SOPs status", questionnaire.documented_sops);
        sect6 += renderPrintField("SOP Storage", questionnaire.sop_storage);
        sect6 += renderPrintField("Document Priority", questionnaire.document_priority);
        sect6 += renderPrintField("Task Tracking Method", questionnaire.task_tracking_method);
        sect6 += renderPrintField("Recurring Meetings", questionnaire.recurring_meetings);
        sect6 += renderPrintField("Approval Steps", questionnaire.approval_steps);
        sect6 += renderPrintField("Decision Maker", questionnaire.decision_maker);
        bizAdminHtml += renderPrintCard("6. Workflow & Operations", sect6);

        let sect7 = "";
        if (questionnaire.selected_tools?.length > 0) {
          sect7 += renderPrintField("Selected Tools", questionnaire.selected_tools.join(", "));
        }
        sect7 += renderPrintField("Tools to Clean up", questionnaire.tools_to_clean);
        sect7 += renderPrintField("Access Prepared status", questionnaire.access_prepared);
        sect7 += renderPrintField("Access Method", questionnaire.access_method);
        sect7 += renderPrintField("Password Manager", questionnaire.password_manager);
        bizAdminHtml += renderPrintCard("7. Tools, Platforms & Access", sect7);

        let sect8 = "";
        sect8 += renderPrintField("Regular Communication", questionnaire.regular_communication);
        sect8 += renderPrintField("Message Types", questionnaire.message_types);
        sect8 += renderPrintField("Email Templates", questionnaire.email_templates);
        sect8 += renderPrintField("Communication Tone", questionnaire.communication_tone);
        sect8 += renderPrintField("Phrases to Avoid", questionnaire.phrases_to_avoid);
        sect8 += renderPrintField("Approval Situations", questionnaire.approval_situations);
        sect8 += renderPrintField("Desired Response Time", questionnaire.desired_response_time);
        bizAdminHtml += renderPrintCard("8. Client / Customer Communication", sect8);

        let sect9 = "";
        sect9 += renderPrintField("Lead Sources", questionnaire.lead_sources);
        sect9 += renderPrintField("Lead Tracking", questionnaire.lead_tracking);
        sect9 += renderPrintField("Lead Follow-Up", questionnaire.lead_follow_up);
        sect9 += renderPrintField("Sales Pipeline", questionnaire.sales_pipeline);
        sect9 += renderPrintField("Lead Cracks", questionnaire.lead_cracks);
        sect9 += renderPrintField("Help with Lead Follow-Up", questionnaire.help_lead_follow_up);
        sect9 += renderPrintField("Help Materials", questionnaire.help_materials);
        sect9 += renderPrintField("Good Lead Criteria", questionnaire.good_lead_criteria);
        sect9 += renderPrintField("Avoid Clients Criteria", questionnaire.avoid_clients);
        bizAdminHtml += renderPrintCard("9. Sales, Leads & Follow-Up", sect9);

        let sect10 = "";
        sect10 += renderPrintField("Calendar Manager", questionnaire.calendar_manager);
        sect10 += renderPrintField("Appointment Types", questionnaire.appointment_types);
        sect10 += renderPrintField("Working Hours", questionnaire.working_hours);
        sect10 += renderPrintField("Protected Times", questionnaire.protected_times);
        sect10 += renderPrintField("Prep Meetings", questionnaire.prep_meetings);
        sect10 += renderPrintField("Meeting Notes", questionnaire.meeting_notes);
        sect10 += renderPrintField("Scheduling Links", questionnaire.scheduling_links);
        sect10 += renderPrintField("Scheduling Preferences", questionnaire.scheduling_preferences);
        bizAdminHtml += renderPrintCard("10. Calendar & Scheduling", sect10);

        let sect11 = "";
        sect11 += renderPrintField("File Storage", questionnaire.file_storage);
        sect11 += renderPrintField("File Organization", questionnaire.file_organization);
        sect11 += renderPrintField("File Categories", questionnaire.file_categories);
        sect11 += renderPrintField("New Folder Structure", questionnaire.new_folder_structure);
        sect11 += renderPrintField("Repeated Documents", questionnaire.repeated_documents);
        sect11 += renderPrintField("Document Formatting", questionnaire.document_formatting);
        sect11 += renderPrintField("Naming Conventions", questionnaire.naming_conventions);
        bizAdminHtml += renderPrintCard("11. Documents, Files & Organization", sect11);

        let sect12 = "";
        sect12 += renderPrintField("Numbers Tracked", questionnaire.numbers_tracked);
        sect12 += renderPrintField("Tracking Location", questionnaire.tracking_location);
        sect12 += renderPrintField("Reports Needed", questionnaire.reports_needed);
        sect12 += renderPrintField("Report Recipients", questionnaire.report_recipients);
        sect12 += renderPrintField("Report Frequency", questionnaire.report_frequency);
        sect12 += renderPrintField("Leadership Overview", questionnaire.leadership_overview);
        bizAdminHtml += renderPrintCard("12. Reporting & Performance Tracking", sect12);

        let sect13 = "";
        sect13 += renderPrintField("Invoice Support", questionnaire.invoice_support);
        sect13 += renderPrintField("Finance Tools", questionnaire.finance_tools);
        sect13 += renderPrintField("Invoice Approver", questionnaire.invoice_approver);
        sect13 += renderPrintField("Invoice Templates", questionnaire.invoice_templates);
        sect13 += renderPrintField("Invoice Frequency", questionnaire.invoice_frequency);
        sect13 += renderPrintField("Overdue Handling", questionnaire.overdue_handling);
        sect13 += renderPrintField("Excluded Financial Tasks", questionnaire.excluded_financial_tasks);
        bizAdminHtml += renderPrintCard("13. Finance & Billing Support", sect13);

        let sect14 = "";
        sect14 += renderPrintField("Team Structure", questionnaire.team_structure);
        sect14 += renderPrintField("Contractors/Vendors", questionnaire.contractors_vendors);
        sect14 += renderPrintField("Communication Inclusion", questionnaire.communication_inclusion);
        sect14 += renderPrintField("Team Tasks Coordination", questionnaire.team_tasks_coordination);
        sect14 += renderPrintField("Task Assignment Support", questionnaire.task_assignment_support);
        sect14 += renderPrintField("Internal Comm Rules", questionnaire.internal_comm_rules);
        bizAdminHtml += renderPrintCard("14. Team & Vendor Coordination", sect14);

        let sect15 = "";
        sect15 += renderPrintField("Brand Guidelines", questionnaire.brand_guidelines);
        sect15 += renderPrintField("Brand Sound/Voice", questionnaire.brand_sound);
        sect15 += renderPrintField("Liked Examples", questionnaire.liked_examples);
        sect15 += renderPrintField("Disliked Examples", questionnaire.disliked_examples);
        sect15 += renderPrintField("Standards That Matter Most", questionnaire.standards_mattered_most);
        sect15 += renderPrintField("Legal/Compliance", questionnaire.legal_compliance);
        bizAdminHtml += renderPrintCard("15. Brand, Voice & Professional Standards", sect15);

        let sect16 = "";
        sect16 += renderPrintField("Systems Access Needed", questionnaire.systems_access_needed);
        sect16 += renderPrintField("Access Inviters", questionnaire.access_inviters);
        sect16 += renderPrintField("NDA Required", questionnaire.nda_required);
        sect16 += renderPrintField("Restricted Access", questionnaire.restricted_access);
        sect16 += renderPrintField("Two-Factor Auth", questionnaire.two_factor_auth);
        sect16 += renderPrintField("Revoking Process", questionnaire.revoking_process);
        sect16 += renderPrintField("Privacy Rules", questionnaire.privacy_rules);
        bizAdminHtml += renderPrintCard("16. Access, Security & Confidentiality", sect16);

        let sect17 = "";
        sect17 += renderPrintField("Final Decision Maker", questionnaire.final_decision_maker);
        sect17 += renderPrintField("Work Approver", questionnaire.work_approver);
        sect17 += renderPrintField("Feedback Preference", questionnaire.feedback_preference);
        sect17 += renderPrintField("Client Feedback Turnaround", questionnaire.client_feedback_turnaround);
        sect17 += renderPrintField("Agency Feedback Turnaround", questionnaire.agency_feedback_turnaround);
        sect17 += renderPrintField("Urgent Requests Handling", questionnaire.urgent_requests);
        sect17 += renderPrintField("Ideal Working Relationship", questionnaire.ideal_working_relationship);
        sect17 += renderPrintField("Provider Frustrations", questionnaire.provider_frustrations);
        bizAdminHtml += renderPrintCard("17. Collaboration & Feedback", sect17);

        let sect18 = "";
        sect18 += renderPrintField("First Priority Fix", questionnaire.first_priority_fix);
        sect18 += renderPrintField("First 7 Days Priorities", questionnaire.first_7_days);
        sect18 += renderPrintField("First 30 Days Priorities", questionnaire.first_30_days);
        sect18 += renderPrintField("Success Indicator at 30 Days", questionnaire.success_indicator_30_days);
        sect18 += renderPrintField("Immediate Fires to Put Out", questionnaire.immediate_fires);
        sect18 += renderPrintField("Upcoming Deadlines", questionnaire.upcoming_deadlines);
        bizAdminHtml += renderPrintCard("18. Priorities & First 30 Days", sect18);

        let sect19 = "";
        sect19 += renderPrintField("Google Drive Folder Link", questionnaire.drive_folder);
        sect19 += renderPrintField("Project Management Workspace", questionnaire.pm_workspace);
        sect19 += renderPrintField("CRM Login/Link", questionnaire.crm_login);
        sect19 += renderPrintField("Scheduling Link", questionnaire.scheduling_link);
        sect19 += renderPrintField("Website Link", questionnaire.website_link);
        sect19 += renderPrintField("Brand Assets Folder Link", questionnaire.brand_assets);
        sect19 += renderPrintField("Templates/SOPs Link", questionnaire.templates_sops);
        sect19 += renderPrintField("Reports/Dashboards Link", questionnaire.reports_dashboards);
        sect19 += renderPrintField("Client Comm Templates Link", questionnaire.client_comm_templates);
        sect19 += renderPrintField("Other Links", questionnaire.other_links);
        bizAdminHtml += renderPrintCard("19. Assets & Links", sect19);

        let sect20 = "";
        sect20 += renderPrintField("Outsourcing Worries", questionnaire.outsourcing_worries);
        sect20 += renderPrintField("Partnership Ease Factors", questionnaire.partnership_ease);
        sect20 += renderPrintField("Boundaries & Preferences", questionnaire.boundaries_preferences);
        sect20 += renderPrintField("Additional Notes", questionnaire.final_notes);
        bizAdminHtml += renderPrintCard("20. Final Notes", sect20);

        reportContent += `
          <div class="section-title page-break">Business Admin Onboarding Questionnaire</div>
          ${bizAdminHtml}
        `;
      } else {
        let generalHtml = "";
        
        let overview = "";
        overview += renderPrintField("Business Name", questionnaire.business_name);
        overview += renderPrintField("Description", questionnaire.business_description);
        overview += renderPrintField("Industry/Niche", questionnaire.industry_niche);
        overview += renderPrintField("Years Operating", questionnaire.years_operating);
        overview += renderPrintField("Target Audience", questionnaire.target_audience);
        overview += renderPrintField("Revenue Streams", questionnaire.revenue_streams);
        overview += renderPrintField("Revenue Goals", questionnaire.revenue_goals);
        generalHtml += renderPrintCard("Business Overview", overview);

        let goalsSec = "";
        goalsSec += renderPrintField("Top 3 Goals (6-12 months)", questionnaire.top_3_goals);
        goalsSec += renderPrintField("3-5 Year Vision", questionnaire.vision_3_5_years);
        goalsSec += renderPrintField("Planned Launches", questionnaire.planned_launches);
        goalsSec += renderPrintField("Big Win Expectation", questionnaire.big_win_expectation);
        generalHtml += renderPrintCard("Goals & Vision", goalsSec);

        let challenges = "";
        challenges += renderPrintField("Biggest Challenges", questionnaire.biggest_challenges);
        challenges += renderPrintField("Stuck Areas", questionnaire.stuck_areas);
        challenges += renderPrintField("Goal Blockers", questionnaire.goal_blockers);
        challenges += renderPrintField("Past Agency Experience", questionnaire.past_agencies_experience);
        generalHtml += renderPrintCard("Challenges & Bottlenecks", challenges);

        let systems = "";
        systems += renderPrintField("Team Structure", questionnaire.team_structure);
        systems += renderPrintField("Marketing Tools", questionnaire.marketing_tools);
        systems += renderPrintField("CRM/Email Tools", questionnaire.crm_email_tools);
        systems += renderPrintField("Sales/Funnel Tools", questionnaire.sales_funnel_tools);
        systems += renderPrintField("Project Management", questionnaire.project_management_tools);
        systems += renderPrintField("Performance Tracking", questionnaire.performance_tracking);
        systems += renderPrintField("Automation Needs", questionnaire.automation_needs);
        generalHtml += renderPrintCard("Team, Tools & Systems", systems);

        let offers = "";
        offers += renderPrintField("Core Offers", questionnaire.core_offers);
        offers += renderPrintField("Lead Acquisition", questionnaire.lead_acquisition);
        offers += renderPrintField("What's Working", questionnaire.marketing_working);
        offers += renderPrintField("What's Not Working", questionnaire.marketing_not_working);
        offers += renderPrintField("Existing Funnels", questionnaire.existing_funnels);
        generalHtml += renderPrintCard("Offers, Marketing & Sales", offers);

        let branding = "";
        branding += renderPrintField("Brand Identity", questionnaire.brand_identity);
        branding += renderPrintField("Content Creation", questionnaire.content_creation);
        branding += renderPrintField("Important Platforms", questionnaire.important_platforms);
        branding += renderPrintField("Assets to Review", questionnaire.assets_to_review);
        generalHtml += renderPrintCard("Content & Branding", branding);

        let coll = "";
        coll += renderPrintField("Primary Contact", questionnaire.primary_contact);
        coll += renderPrintField("Communication Preference", questionnaire.communication_preference);
        coll += renderPrintField("Decision Maker", questionnaire.decision_maker);
        coll += renderPrintField("Ideal Collaboration", questionnaire.ideal_collaboration);
        generalHtml += renderPrintCard("Decision-Making & Collaboration", coll);

        let readiness = "";
        readiness += renderPrintField("Start Timeline", questionnaire.start_timeline);
        readiness += renderPrintField("Budget/Timeline", questionnaire.budget_timeline);
        readiness += renderPrintField("Additional Notes", questionnaire.additional_notes);
        generalHtml += renderPrintCard("Readiness & Expectations", readiness);

        reportContent += `
          <div class="section-title page-break">General Onboarding Questionnaire</div>
          ${generalHtml}
        `;
      }
    }

    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Onboarding Report - ${clientName}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header h1 {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 5px 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .header .logo {
              font-size: 28px;
              font-weight: 900;
              color: #6366f1;
              letter-spacing: -0.025em;
              line-height: 1;
            }
            .header-meta {
              color: #64748b;
              font-size: 14px;
              margin-top: 4px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e1b4b;
              background-color: #e0e7ff;
              padding: 8px 16px;
              border-radius: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #6366f1;
              page-break-after: avoid;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
              background-color: #f8fafc;
              page-break-inside: avoid;
            }
            .card-title {
              font-size: 15px;
              font-weight: 600;
              color: #0f172a;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .field {
              margin-bottom: 12px;
            }
            .field-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .field-value {
              font-size: 14px;
              color: #334155;
              white-space: pre-wrap;
              word-break: break-word;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              font-size: 12px;
              font-weight: 500;
              border-radius: 9999px;
              background-color: #e2e8f0;
              color: #334155;
            }
            .page-break {
              page-break-before: always;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            @media print {
              body {
                padding: 0;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          ${reportHeader}
          ${reportContent || '<div class="card" style="text-align: center; padding: 40px; color: #64748b;">No completed onboarding responses found.</div>'}
          <div class="footer">
            Generated by Sienvi Agency Portal &middot; Confidentially compiled
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlString);
    printWindow.document.close();
  };

  const renderField = (label: string, value: any) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
  };

  const renderStatus = (data: any) => {
    if (!data) return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Not Started</Badge>;
    if (data.completed_at) return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto text-slate-900">
        <DialogHeader className="flex flex-row items-center justify-between pr-6 border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold">Onboarding Responses - {clientName}</DialogTitle>
          {!loading && (
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5 hover:text-primary-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue={onboardingType === "amazon" ? "amazon" : onboardingType === "discovery" ? "questionnaire" : "goals"} className="w-full">
            <TabsList className={`grid w-full ${onboardingType === "amazon" || onboardingType === "discovery" ? "grid-cols-1" : "grid-cols-3"}`}>
              {onboardingType === "amazon" ? (
                <TabsTrigger value="amazon" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Amazon Listing Design
                  {renderStatus(amazon)}
                </TabsTrigger>
              ) : onboardingType === "discovery" ? (
                <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Business Admin Onboarding
                  {renderStatus(questionnaire)}
                </TabsTrigger>
              ) : (
                <>
                  <TabsTrigger value="goals" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Goal Sheet
                    {renderStatus(goals)}
                  </TabsTrigger>
                  <TabsTrigger value="avatars" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Avatars
                    {renderStatus(avatars)}
                  </TabsTrigger>
                  {onboardingType === "advertising" ? (
                    <TabsTrigger value="advertising" className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4" />
                      Advertising Questionnaire
                      {renderStatus(advertising)}
                    </TabsTrigger>
                  ) : (
                    <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Questionnaire
                      {renderStatus(questionnaire)}
                    </TabsTrigger>
                  )}
                </>
              )}
            </TabsList>

            <ScrollArea className="h-[60vh] mt-4">
              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-4">
                {!goals ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No goal sheet submitted yet</CardContent></Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Primary Goal</CardTitle></CardHeader>
                      <CardContent>{renderField("", goals.primary_goal)}</CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">S</span>Specific</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("What exactly do you want to achieve?", goals.specific_what)}
                        {renderField("Who is involved?", goals.specific_who)}
                        {renderField("Where will this be achieved?", goals.specific_where)}
                        {renderField("Why is this important?", goals.specific_why)}
                        {renderField("Specific Goal Summary", goals.specific_goal_summary)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">M</span>Measurable</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("How will you measure progress?", goals.measurable_metrics)}
                        {renderField("Quantifiable Target", goals.measurable_target)}
                        {renderField("Measurable Goal Summary", goals.measurable_goal_summary)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">A</span>Achievable</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Is the goal realistic?", goals.achievable_realistic)}
                        {renderField("Steps needed", goals.achievable_steps)}
                        {renderField("Achievable Goal Summary", goals.achievable_goal_summary)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">R</span>Relevant</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Alignment with objectives", goals.relevant_alignment)}
                        {renderField("Why is it worthwhile?", goals.relevant_worthwhile)}
                        {renderField("Relevant Goal Summary", goals.relevant_goal_summary)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">T</span>Time-bound</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Deadline", goals.timebound_deadline)}
                        {renderField("Milestones", goals.timebound_milestones)}
                        {renderField("Time-bound Goal Summary", goals.timebound_goal_summary)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Complete Goal Narrative</CardTitle></CardHeader>
                      <CardContent>{renderField("", goals.goal_narrative)}</CardContent>
                    </Card>

                    {goals.action_plan?.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Action Plan</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {goals.action_plan.map((step: any, i: number) => (
                            <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                              <p className="font-medium">Step {i + 1}: {step.actionItem}</p>
                              {step.responsiblePerson && <p className="text-sm">Responsible: {step.responsiblePerson}</p>}
                              {step.deadline && <p className="text-sm">Deadline: {step.deadline}</p>}
                              {step.resourcesNeeded && <p className="text-sm">Resources: {step.resourcesNeeded}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {goals.obstacles_solutions?.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Obstacles & Solutions</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {goals.obstacles_solutions.map((obs: any, i: number) => (
                            <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                              <p className="font-medium">Obstacle: {obs.obstacle}</p>
                              {obs.solution && <p className="text-sm">Solution: {obs.solution}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Avatars Tab */}
              <TabsContent value="avatars" className="space-y-4">
                {!avatars ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No avatar profile submitted yet</CardContent></Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Products/Services Overview</CardTitle></CardHeader>
                      <CardContent>{renderField("", avatars.products_services)}</CardContent>
                    </Card>

                    {avatars.avatars?.map((avatar: any, i: number) => (
                      <Card key={i}>
                        <CardHeader><CardTitle className="text-base">Avatar {i + 1}: {avatar.name}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {renderField("Age Range", avatar.ageRange)}
                            {renderField("Gender", avatar.gender)}
                            {renderField("Location", avatar.location)}
                            {renderField("Education", avatar.education)}
                            {renderField("Relationship/Family", avatar.relationship)}
                            {renderField("Occupation & Income", avatar.occupation)}
                          </div>
                          <div className="space-y-3 pt-2 border-t">
                            {renderField("Goals & Aspirations", avatar.goals)}
                            {renderField("Pain Points", avatar.painPoints)}
                            {renderField("Fears", avatar.fears)}
                            {renderField("Beliefs", avatar.beliefs)}
                            {renderField("Online Hangouts", avatar.onlineHangouts)}
                            {renderField("Content Style", avatar.contentStyle)}
                            {renderField("Objections", avatar.objections)}
                            {renderField("Buying Triggers", avatar.buyingTriggers)}
                            {renderField("Journey Stage", avatar.journeyStage)}
                            {renderField("How They Find You", avatar.howTheyFind)}
                            {renderField("Desired Transformation", avatar.desiredTransformation)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Card>
                      <CardHeader><CardTitle className="text-base">Final Notes</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Most Important Avatar", avatars.most_important_avatar)}
                        {renderField("Reason", avatars.most_important_reason)}
                        {avatars.existing_data_available && <p className="text-sm"><Badge variant="outline">Has existing customer data/testimonials</Badge></p>}
                        {renderField("Customers to Avoid", avatars.customers_to_avoid)}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Questionnaire Tab */}
              <TabsContent value="questionnaire" className="space-y-4">
                {!questionnaire ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No questionnaire submitted yet</CardContent></Card>
                ) : onboardingType === "discovery" ? (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">1. Business & Contact Info</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Business Name", questionnaire.business_name)}
                        {renderField("Primary Contact Name", questionnaire.primary_contact_name)}
                        {renderField("Role/Title", questionnaire.role_title)}
                        {renderField("Email Address", questionnaire.email_address)}
                        {renderField("Phone/WhatsApp", questionnaire.phone_whatsapp)}
                        {renderField("Website", questionnaire.website)}
                        {renderField("Social Media Links", questionnaire.social_media_links)}
                        {renderField("Location/Time Zone", questionnaire.location_time_zone)}
                        {renderField("Preferred Communication", questionnaire.preferred_communication)}
                        {renderField("Preferred Meeting Frequency", questionnaire.preferred_meeting_frequency)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">2. Business Overview</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Business Description", questionnaire.business_description)}
                        {renderField("Industry/Niche", questionnaire.industry_niche)}
                        {renderField("Years Operating", questionnaire.years_operating)}
                        {renderField("Primary Services", questionnaire.primary_services)}
                        {renderField("Primary Clients", questionnaire.primary_clients)}
                        {renderField("Revenue Streams", questionnaire.revenue_streams)}
                        {renderField("Business Stage", questionnaire.business_stage)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">3. Goals & Vision</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Top 3 Goals (6-12 months)", questionnaire.top_3_goals)}
                        {renderField("Successful Partnership Success Definition", questionnaire.successful_partnership)}
                        {renderField("Specific Outcomes Needed", questionnaire.specific_outcomes)}
                        {renderField("How to Measure Success", questionnaire.measure_success)}
                        {renderField("Deadlines & Priorities", questionnaire.deadlines_priorities)}
                        {renderField("Long-Term Vision", questionnaire.long_term_vision)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">4. Challenges & Bottlenecks</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Administrative Challenges", questionnaire.admin_challenges)}
                        {renderField("Personal Time Sinks", questionnaire.personal_time_sinks)}
                        {renderField("Tasks Falling Through Cracks", questionnaire.tasks_falling_through_cracks)}
                        {renderField("Unclear Processes", questionnaire.unclear_processes)}
                        {renderField("Prevention Factors", questionnaire.prevention_factors)}
                        {renderField("Past Support Experience", questionnaire.past_support_experience)}
                        {renderField("Immediate Delegation Tasks", questionnaire.immediate_delegation)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">5. Admin Support Needs</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {questionnaire.selected_admin_services?.length > 0 && renderField("Selected Admin Services", questionnaire.selected_admin_services.join(", "))}
                        {renderField("Highest Priority Tasks", questionnaire.highest_priority_tasks)}
                        {renderField("Recurring Tasks", questionnaire.recurring_tasks)}
                        {renderField("One-Time Cleanup Tasks", questionnaire.one_time_cleanup)}
                        {renderField("Tasks NOT to Handle", questionnaire.tasks_not_to_handle)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">6. Workflow & Operations</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Current Workflow Description", questionnaire.current_workflow)}
                        {renderField("Documented SOPs status", questionnaire.documented_sops)}
                        {renderField("SOP Storage", questionnaire.sop_storage)}
                        {renderField("Document Priority", questionnaire.document_priority)}
                        {renderField("Task Tracking Method", questionnaire.task_tracking_method)}
                        {renderField("Recurring Meetings", questionnaire.recurring_meetings)}
                        {renderField("Approval Steps", questionnaire.approval_steps)}
                        {renderField("Decision Maker", questionnaire.decision_maker)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">7. Tools, Platforms & Access</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {questionnaire.selected_tools?.length > 0 && renderField("Selected Tools", questionnaire.selected_tools.join(", "))}
                        {renderField("Tools to Clean up", questionnaire.tools_to_clean)}
                        {renderField("Access Prepared status", questionnaire.access_prepared)}
                        {renderField("Access Method", questionnaire.access_method)}
                        {renderField("Password Manager", questionnaire.password_manager)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">8. Client / Customer Communication</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Regular Communication", questionnaire.regular_communication)}
                        {renderField("Message Types", questionnaire.message_types)}
                        {renderField("Email Templates", questionnaire.email_templates)}
                        {renderField("Communication Tone", questionnaire.communication_tone)}
                        {renderField("Phrases to Avoid", questionnaire.phrases_to_avoid)}
                        {renderField("Approval Situations", questionnaire.approval_situations)}
                        {renderField("Desired Response Time", questionnaire.desired_response_time)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">9. Sales, Leads & Follow-Up</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Lead Sources", questionnaire.lead_sources)}
                        {renderField("Lead Tracking", questionnaire.lead_tracking)}
                        {renderField("Lead Follow-Up", questionnaire.lead_follow_up)}
                        {renderField("Sales Pipeline", questionnaire.sales_pipeline)}
                        {renderField("Lead Cracks", questionnaire.lead_cracks)}
                        {renderField("Help with Lead Follow-Up", questionnaire.help_lead_follow_up)}
                        {renderField("Help Materials", questionnaire.help_materials)}
                        {renderField("Good Lead Criteria", questionnaire.good_lead_criteria)}
                        {renderField("Avoid Clients Criteria", questionnaire.avoid_clients)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">10. Calendar & Scheduling</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Calendar Manager", questionnaire.calendar_manager)}
                        {renderField("Appointment Types", questionnaire.appointment_types)}
                        {renderField("Working Hours", questionnaire.working_hours)}
                        {renderField("Protected Times", questionnaire.protected_times)}
                        {renderField("Prep Meetings", questionnaire.prep_meetings)}
                        {renderField("Meeting Notes", questionnaire.meeting_notes)}
                        {renderField("Scheduling Links", questionnaire.scheduling_links)}
                        {renderField("Scheduling Preferences", questionnaire.scheduling_preferences)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">11. Documents, Files & Organization</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("File Storage", questionnaire.file_storage)}
                        {renderField("File Organization", questionnaire.file_organization)}
                        {renderField("File Categories", questionnaire.file_categories)}
                        {renderField("New Folder Structure", questionnaire.new_folder_structure)}
                        {renderField("Repeated Documents", questionnaire.repeated_documents)}
                        {renderField("Document Formatting", questionnaire.document_formatting)}
                        {renderField("Naming Conventions", questionnaire.naming_conventions)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">12. Reporting & Performance Tracking</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Numbers Tracked", questionnaire.numbers_tracked)}
                        {renderField("Tracking Location", questionnaire.tracking_location)}
                        {renderField("Reports Needed", questionnaire.reports_needed)}
                        {renderField("Report Recipients", questionnaire.report_recipients)}
                        {renderField("Report Frequency", questionnaire.report_frequency)}
                        {renderField("Leadership Overview", questionnaire.leadership_overview)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">13. Finance & Billing Support</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Invoice Support", questionnaire.invoice_support)}
                        {renderField("Finance Tools", questionnaire.finance_tools)}
                        {renderField("Invoice Approver", questionnaire.invoice_approver)}
                        {renderField("Invoice Templates", questionnaire.invoice_templates)}
                        {renderField("Invoice Frequency", questionnaire.invoice_frequency)}
                        {renderField("Overdue Handling", questionnaire.overdue_handling)}
                        {renderField("Excluded Financial Tasks", questionnaire.excluded_financial_tasks)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">14. Team & Vendor Coordination</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Team Structure", questionnaire.team_structure)}
                        {renderField("Contractors/Vendors", questionnaire.contractors_vendors)}
                        {renderField("Communication Inclusion", questionnaire.communication_inclusion)}
                        {renderField("Team Tasks Coordination", questionnaire.team_tasks_coordination)}
                        {renderField("Task Assignment Support", questionnaire.task_assignment_support)}
                        {renderField("Internal Comm Rules", questionnaire.internal_comm_rules)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">15. Brand, Voice & Professional Standards</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Brand Guidelines", questionnaire.brand_guidelines)}
                        {renderField("Brand Sound/Voice", questionnaire.brand_sound)}
                        {renderField("Liked Examples", questionnaire.liked_examples)}
                        {renderField("Disliked Examples", questionnaire.disliked_examples)}
                        {renderField("Standards That Matter Most", questionnaire.standards_mattered_most)}
                        {renderField("Legal/Compliance", questionnaire.legal_compliance)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">16. Access, Security & Confidentiality</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Systems Access Needed", questionnaire.systems_access_needed)}
                        {renderField("Access Inviters", questionnaire.access_inviters)}
                        {renderField("NDA Required", questionnaire.nda_required)}
                        {renderField("Restricted Access", questionnaire.restricted_access)}
                        {renderField("Two-Factor Auth", questionnaire.two_factor_auth)}
                        {renderField("Revoking Process", questionnaire.revoking_process)}
                        {renderField("Privacy Rules", questionnaire.privacy_rules)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">17. Collaboration & Feedback</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Final Decision Maker", questionnaire.final_decision_maker)}
                        {renderField("Work Approver", questionnaire.work_approver)}
                        {renderField("Feedback Preference", questionnaire.feedback_preference)}
                        {renderField("Client Feedback Turnaround", questionnaire.client_feedback_turnaround)}
                        {renderField("Agency Feedback Turnaround", questionnaire.agency_feedback_turnaround)}
                        {renderField("Urgent Requests Handling", questionnaire.urgent_requests)}
                        {renderField("Ideal Working Relationship", questionnaire.ideal_working_relationship)}
                        {renderField("Provider Frustrations", questionnaire.provider_frustrations)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">18. Priorities & First 30 Days</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("First Priority Fix", questionnaire.first_priority_fix)}
                        {renderField("First 7 Days Priorities", questionnaire.first_7_days)}
                        {renderField("First 30 Days Priorities", questionnaire.first_30_days)}
                        {renderField("Success Indicator at 30 Days", questionnaire.success_indicator_30_days)}
                        {renderField("Immediate Fires to Put Out", questionnaire.immediate_fires)}
                        {renderField("Upcoming Deadlines", questionnaire.upcoming_deadlines)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">19. Assets & Links</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Google Drive Folder Link", questionnaire.drive_folder)}
                        {renderField("Project Management Workspace", questionnaire.pm_workspace)}
                        {renderField("CRM Login/Link", questionnaire.crm_login)}
                        {renderField("Scheduling Link", questionnaire.scheduling_link)}
                        {renderField("Website Link", questionnaire.website_link)}
                        {renderField("Brand Assets Folder Link", questionnaire.brand_assets)}
                        {renderField("Templates/SOPs Link", questionnaire.templates_sops)}
                        {renderField("Reports/Dashboards Link", questionnaire.reports_dashboards)}
                        {renderField("Client Comm Templates Link", questionnaire.client_comm_templates)}
                        {renderField("Other Links", questionnaire.other_links)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">20. Final Notes</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Outsourcing Worries", questionnaire.outsourcing_worries)}
                        {renderField("Partnership Ease Factors", questionnaire.partnership_ease)}
                        {renderField("Boundaries & Preferences", questionnaire.boundaries_preferences)}
                        {renderField("Additional Notes", questionnaire.final_notes)}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Business Overview</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Business Name", questionnaire.business_name)}
                        {renderField("Description", questionnaire.business_description)}
                        {renderField("Industry/Niche", questionnaire.industry_niche)}
                        {renderField("Years Operating", questionnaire.years_operating)}
                        {renderField("Target Audience", questionnaire.target_audience)}
                        {renderField("Revenue Streams", questionnaire.revenue_streams)}
                        {renderField("Revenue Goals", questionnaire.revenue_goals)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Goals & Vision</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Top 3 Goals (6-12 months)", questionnaire.top_3_goals)}
                        {renderField("3-5 Year Vision", questionnaire.vision_3_5_years)}
                        {renderField("Planned Launches", questionnaire.planned_launches)}
                        {renderField("Big Win Expectation", questionnaire.big_win_expectation)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Challenges & Bottlenecks</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Biggest Challenges", questionnaire.biggest_challenges)}
                        {renderField("Stuck Areas", questionnaire.stuck_areas)}
                        {renderField("Goal Blockers", questionnaire.goal_blockers)}
                        {renderField("Past Agency Experience", questionnaire.past_agencies_experience)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Team, Tools & Systems</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Team Structure", questionnaire.team_structure)}
                        {renderField("Marketing Tools", questionnaire.marketing_tools)}
                        {renderField("CRM/Email Tools", questionnaire.crm_email_tools)}
                        {renderField("Sales/Funnel Tools", questionnaire.sales_funnel_tools)}
                        {renderField("Project Management", questionnaire.project_management_tools)}
                        {renderField("Performance Tracking", questionnaire.performance_tracking)}
                        {renderField("Automation Needs", questionnaire.automation_needs)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Offers, Marketing & Sales</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Core Offers", questionnaire.core_offers)}
                        {renderField("Lead Acquisition", questionnaire.lead_acquisition)}
                        {renderField("What's Working", questionnaire.marketing_working)}
                        {renderField("What's Not Working", questionnaire.marketing_not_working)}
                        {renderField("Existing Funnels", questionnaire.existing_funnels)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Content & Branding</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Brand Identity", questionnaire.brand_identity)}
                        {renderField("Content Creation", questionnaire.content_creation)}
                        {renderField("Important Platforms", questionnaire.important_platforms)}
                        {renderField("Assets to Review", questionnaire.assets_to_review)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Decision-Making & Collaboration</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Primary Contact", questionnaire.primary_contact)}
                        {renderField("Communication Preference", questionnaire.communication_preference)}
                        {renderField("Decision Maker", questionnaire.decision_maker)}
                        {renderField("Ideal Collaboration", questionnaire.ideal_collaboration)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Readiness & Expectations</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Start Timeline", questionnaire.start_timeline)}
                        {renderField("Budget/Timeline", questionnaire.budget_timeline)}
                        {renderField("Additional Notes", questionnaire.additional_notes)}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Amazon Listing Design Tab */}
              <TabsContent value="amazon" className="space-y-4">
                {!amazon ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No Amazon listing design questionnaire submitted yet</CardContent></Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Business & Brand Information</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Business Name", amazon.business_name)}
                        {renderField("Primary Contact Name", amazon.primary_contact_name)}
                        {renderField("Email Address", amazon.email_address)}
                        {renderField("Amazon Seller Account Type", amazon.seller_account_type === "seller_central" ? "Seller Central" : amazon.seller_account_type === "vendor_central" ? "Vendor Central" : amazon.seller_account_type)}
                        {amazon.target_marketplaces?.length > 0 && renderField("Target Marketplace(s)", amazon.target_marketplaces.join(", "))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Product Overview</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Product Name", amazon.product_name)}
                        {renderField("Product Category", amazon.product_category)}
                        {renderField("ASIN", amazon.asin)}
                        {renderField("Product Status", amazon.product_status === "new" ? "New Product" : amazon.product_status === "existing" ? "Existing Listing" : amazon.product_status)}
                        {renderField("Product Variations", amazon.product_variations)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Brief Description of Your Product", amazon.product_description)}
                        {renderField("Key Features", amazon.key_features)}
                        {renderField("Top 3 Benefits", amazon.top_3_benefits)}
                        {renderField("What Problem Does This Product Solve?", amazon.problem_solved)}
                        {renderField("Materials, Ingredients, or Technical Specs", amazon.materials_specs)}
                        {renderField("Dimensions and Weight", amazon.dimensions_weight)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Target Customer</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Who is Your Ideal Customer?", amazon.ideal_customer)}
                        {renderField("Demographics, Interests & Behaviors", amazon.customer_pain_points)}
                        {renderField("Desired Outcome", amazon.desired_outcome)}
                        {renderField("Customer Objections/Hesitations", amazon.customer_objections)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Brand Voice & Positioning</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Brand Voice", amazon.brand_voice === "other" ? `Other: ${amazon.brand_voice_other || ""}` : amazon.brand_voice)}
                        {renderField("Brands Admired", amazon.brands_admired)}
                        {renderField("Words to Associate", amazon.words_to_associate)}
                        {renderField("Words to Avoid", amazon.words_to_avoid)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Visual Style Preferences</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Has Brand Guidelines</p>
                        <p className="text-sm mb-3">{amazon.has_brand_guidelines ? "Yes" : "No"}</p>
                        {renderField("Preferred Colors", amazon.preferred_colors)}
                        {renderField("Preferred Fonts", amazon.preferred_fonts)}
                        {renderField("Style Preference", amazon.style_preference)}
                        {renderField("Listing Examples Liked", amazon.example_listings)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Competitors & Market Research</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Top 3–5 Competitor ASINs or Links", amazon.competitor_asins)}
                        {renderField("What Do You Like About Their Listings?", amazon.competitor_likes)}
                        {renderField("What Do You Dislike or Want to Avoid?", amazon.competitor_dislikes)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Image & Creative Direction</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Features to Highlight Visually", amazon.features_to_highlight)}
                        {renderField("Mandatory Claims/Certifications", amazon.mandatory_claims)}
                        {renderField("Legal or Compliance Restrictions", amazon.compliance_restrictions)}
                        {renderField("Image Styles/Concepts to Avoid", amazon.image_styles_to_avoid)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Video Ad Preferences</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Primary Goal of the Videos", amazon.video_primary_goal)}
                        {renderField("Messaging/Offers to Include", amazon.video_messaging)}
                        {renderField("Tone Preference", amazon.video_tone)}
                        {renderField("Competitor/Brand Videos Liked", amazon.video_examples)}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-base">Approvals & Final Notes</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {renderField("Who Will Be Approving the Work?", amazon.work_approver)}
                        {renderField("Preferred Turnaround Time", amazon.turnaround_preference)}
                        {renderField("Additional Notes", amazon.additional_notes)}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Advertising Questionnaire Tab */}
              <TabsContent value="advertising" className="space-y-4">
                {!advertising ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">No advertising campaign questionnaire submitted yet</CardContent></Card>
                ) : (
                  (() => {
                    const isAmazonAds = advertising.selected_channels?.includes("amazon") || advertising.products_list_asin_sku || advertising.daily_budget;
                    return isAmazonAds ? (
                      <>
                        <Card>
                          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Brand Name", advertising.business_name)}
                            {renderField("Contact Name", advertising.primary_contact_name)}
                            {renderField("Email Address", advertising.email_address)}
                            {renderField("Website or Social Media", advertising.website_or_social_page)}
                            {renderField("Amazon Marketplace", advertising.target_locations)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Goals</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Main Goal with Amazon Ads", advertising.primary_campaign_goal)}
                            {renderField("Outcome in 2-3 Months", advertising.expected_results_timeline)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Products List (Link | ASIN | SKU)", advertising.products_list_asin_sku)}
                            {renderField("Products to Advertise First", advertising.products_to_advertise_first)}
                            {renderField("Top Priority Products", advertising.top_priority_products)}
                            {renderField("Are Products Live?", advertising.are_products_live_on_amazon)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Budget & Strategy</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Monthly Ad Budget", advertising.monthly_budget_range)}
                            {renderField("Daily Budget", advertising.daily_budget)}
                            {renderField("Start Strategy", advertising.how_do_you_want_to_start)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Pricing & Inventory</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Selling Price of Main Product", advertising.selling_price_of_main_product)}
                            {renderField("Units in Stock", advertising.units_in_stock)}
                            {renderField("Products Low on Stock?", advertising.products_low_on_stock)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Keywords & Competitors</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Suggested Search Keywords", advertising.suggested_search_keywords)}
                            {renderField("Main Competitors", advertising.main_competitors)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Product Positioning</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("What makes product different/better?", advertising.differentiation_strategy)}
                            {renderField("Ideal Customer", advertising.ideal_customer)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Final Notes</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Running Coupons or Promotions?", advertising.running_coupons_or_promotions)}
                            {renderField("Anything Important to Know?", advertising.anything_important_to_know)}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card>
                          <CardHeader><CardTitle className="text-base">Business & Campaign Overview</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Business Name", advertising.business_name)}
                            {renderField("Primary Contact Name", advertising.primary_contact_name)}
                            {renderField("Email Address", advertising.email_address)}
                            {renderField("Industry/Niche", advertising.industry_niche)}
                            {advertising.selected_channels?.length > 0 && renderField("Advertising Channels", advertising.selected_channels.join(", "))}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Campaign Goals</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Primary Campaign Goal", advertising.primary_campaign_goal)}
                            {advertising.secondary_goals?.length > 0 && renderField("Secondary Goals", advertising.secondary_goals.join(", "))}
                            {renderField("Target KPIs", advertising.target_kpis)}
                            {renderField("Monthly Advertising Budget Range", advertising.monthly_budget_range)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Target Audience</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Target Demographics", advertising.target_demographics)}
                            {renderField("Target Locations", advertising.target_locations)}
                            {renderField("Target Interests & Behaviors", advertising.target_interests)}
                            {renderField("Audience Personas", advertising.audience_personas)}
                            {renderField("Retargeting Audiences", advertising.retargeting_audiences)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Current Advertising Status</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Previous Advertising Experience", advertising.previous_advertising_experience)}
                            {renderField("Current Ad Accounts", advertising.current_ad_accounts)}
                            {renderField("Historical Performance Summary", advertising.historical_performance)}
                            {renderField("What Has Worked Well?", advertising.what_worked)}
                            {renderField("What Hasn't Worked?", advertising.what_didnt_work)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Creative & Messaging</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Has Existing Ad Creatives</p>
                            <p className="text-sm mb-3">{advertising.existing_ad_creatives ? "Yes" : "No"}</p>
                            {renderField("Brand Voice", advertising.brand_voice)}
                            {renderField("Key Messaging Points", advertising.key_messaging_points)}
                            {renderField("Unique Selling Propositions (USPs)", advertising.unique_selling_propositions)}
                            {renderField("Promotional Offers or Incentives", advertising.promotional_offers)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Landing Pages & Conversion</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Landing Page URLs", advertising.landing_page_urls)}
                            <p className="text-sm font-medium text-muted-foreground">Conversion Tracking Setup</p>
                            <p className="text-sm mb-3">{advertising.conversion_tracking_setup ? "Yes" : "No"}</p>
                            {renderField("Conversion Actions to Track", advertising.conversion_actions)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Competitor Analysis</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Main Competitors", advertising.main_competitors)}
                            {renderField("Competitor Ad Examples", advertising.competitor_ad_examples)}
                            {renderField("How You Want to Differentiate", advertising.differentiation_strategy)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Timeline & Expectations</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Desired Start Date", advertising.campaign_start_date)}
                            {renderField("Campaign Duration", advertising.campaign_duration)}
                            {renderField("Expected Results Timeline", advertising.expected_results_timeline)}
                            {renderField("Reporting Preferences", advertising.reporting_preferences)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Assets & Access</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">Has Ad Accounts to Grant Access</p>
                            <p className="text-sm mb-3">{advertising.has_ad_accounts ? "Yes" : "No"}</p>
                            {renderField("Ad Account Access Details", advertising.ad_account_access_details)}
                            {renderField("Creative Assets Available", advertising.creative_assets_available)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            {renderField("Additional Notes", advertising.additional_notes)}
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
