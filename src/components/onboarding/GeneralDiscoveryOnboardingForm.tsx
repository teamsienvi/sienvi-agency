import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clipboard, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  // Section 1: Basic Business Information
  businessName: z.string().min(1, "Business name is required"),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  roleTitle: z.string().min(1, "Role/Title is required"),
  emailAddress: z.string().email("Valid email is required"),
  phoneWhatsapp: z.string().optional(),
  websiteUrl: z.string().optional(),
  socialMediaLinks: z.string().optional(),
  locationTimeZone: z.string().min(1, "Location/Time Zone is required"),
  preferredCommunication: z.string().min(1, "Preferred communication is required"),
  mainPointOfContact: z.string().min(1, "Main point of contact is required"),
  decisionMaker: z.string().min(1, "Please specify decision maker status"),

  // Section 2: Business Overview
  businessDescription: z.string().min(10, "Please describe your business"),
  industryNiche: z.string().min(1, "Industry/Niche is required"),
  yearsOperating: z.string().optional(),
  businessStage: z.string().min(1, "Business stage is required"),
  currentOffers: z.string().min(5, "Offers list is required"),
  revenueStreams: z.string().optional(),
  pricingStructure: z.string().optional(),
  competitorDifferentiation: z.string().optional(),

  // Section 3: Goals & Vision
  top3Goals: z.string().min(10, "Top 3 goals are required"),
  primaryGoal: z.string().min(5, "Primary goal is required"),
  smartSpecific: z.string().min(5, "Please specify smart goal details"),
  smartMeasurable: z.string().min(5, "Please specify smart goal metrics"),
  smartAchievable: z.string().min(5, "Please evaluate resources"),
  smartRelevant: z.string().min(5, "Please evaluate relevance"),
  smartTimebound: z.string().min(5, "Please specify timeline"),
  bigWin: z.string().min(10, "Big win description is required"),
  longTermVision: z.string().optional(),
  upcomingLaunches: z.string().optional(),

  // Section 4: Current Challenges & Bottlenecks
  biggestChallenges: z.string().min(10, "Biggest challenges are required"),
  stuckOverwhelmed: z.string().min(10, "Stuck areas details are required"),
  speedPrevention: z.string().optional(),
  timeSinks: z.string().optional(),
  inconsistencies: z.string().optional(),
  pastSupportExperience: z.string().optional(),
  thingsToAvoid: z.string().optional(),

  // Section 5: Target Audience & Customer Profile
  idealCustomer: z.string().min(5, "Ideal customer profile is required"),
  audienceType: z.string().optional(),
  demographics: z.string().optional(),
  audienceGoals: z.string().optional(),
  painPoints: z.string().min(5, "Audience pain points are required"),
  fears: z.string().optional(),
  objections: z.string().optional(),
  onlineHangouts: z.string().optional(),
  currentDiscovery: z.string().optional(),
  valuableClientType: z.string().min(5, "Valuable client details required"),
  avoidClients: z.string().optional(),

  // Section 6: Offers, Products, Services & Positioning
  coreOffersDetails: z.string().min(5, "Core offers details are required"),
  growPriorityOffer: z.string().min(5, "Growth offer is required"),
  profitableOffer: z.string().optional(),
  easySellOffer: z.string().optional(),
  improvementOffer: z.string().optional(),
  transformationOutcome: z.string().optional(),
  sellingPoints: z.string().optional(),
  proofOfWork: z.string().optional(),
  guaranteesBonuses: z.string().optional(),
  claimsToAvoid: z.string().optional(),

  // Section 7: Marketing & Sales
  leadAcquisition: z.string().min(5, "Lead acquisition details are required"),
  bestChannels: z.string().optional(),
  inconsistentChannels: z.string().optional(),
  paidAdsStatus: z.string().optional(),
  paidAdsPlatforms: z.string().optional(),
  existingFunnels: z.string().optional(),
  salesProcess: z.string().optional(),
  dropoffPoints: z.string().optional(),
  trackConversions: z.string().optional(),
  promoOffers: z.string().optional(),
  topCompetitors: z.string().optional(),
  differentiation: z.string().optional(),

  // Section 8: Brand, Messaging & Creative Direction
  brandIdentityStatus: z.string().min(1, "Brand identity status is required"),
  brandVoice: z.string().min(1, "Brand voice is required"),
  brandAssociations: z.string().optional(),
  brandAvoidWords: z.string().optional(),
  admiredBrands: z.string().optional(),
  creativeAssets: z.string().optional(),
  contentCreated: z.string().optional(),
  importantPlatforms: z.string().optional(),
  designHelpNeeded: z.string().optional(),

  // Section 9: Operations, Admin & Systems
  pmTools: z.string().optional(),
  crmTools: z.string().optional(),
  schedulingTools: z.string().optional(),
  emailTools: z.string().optional(),
  fileStorageTools: z.string().optional(),
  financeTools: z.string().optional(),
  automationTools: z.string().optional(),
  messySystems: z.string().optional(),
  documentedSOPsStatus: z.string().optional(),
  recurringTasks: z.string().optional(),
  manualAutomate: z.string().optional(),
  adminSupportNeeds: z.string().optional(),

  // Section 10: Project Scope & Support Needed
  selectedSupportTypes: z.array(z.string()).min(1, "Select at least one support type"),
  top3Priorities: z.string().min(5, "Top 3 priorities are required"),
  first7Days: z.string().optional(),
  first30Days: z.string().optional(),
  month1Success: z.string().optional(),
  urgentFires: z.string().optional(),

  // Section 11: Assets, Access & Links
  websiteLink: z.string().optional(),
  driveFolder: z.string().optional(),
  brandAssets: z.string().optional(),
  logoFiles: z.string().optional(),
  styleGuide: z.string().optional(),
  currentAds: z.string().optional(),
  landingPages: z.string().optional(),
  crmLogin: z.string().optional(),
  pmWorkspace: z.string().optional(),
  socialAccounts: z.string().optional(),
  emailPlatform: z.string().optional(),
  analyticsDashboard: z.string().optional(),
  serviceDocs: z.string().optional(),
  testimonialsDocs: z.string().optional(),
  otherLinks: z.string().optional(),
  platformsAccessList: z.string().min(5, "Required access details are required"),
  accessMethod: z.string().optional(),
  passwordManager: z.string().optional(),
  complianceRules: z.string().optional(),

  // Section 12: Communication, Collaboration & Approvals
  collabPreference: z.string().min(1, "Collaboration preference is required"),
  updateFrequency: z.string().optional(),
  workApprover: z.string().min(1, "Approver details are required"),
  feedbackTurnaround: z.string().optional(),
  agencyTurnaround: z.string().optional(),
  urgentRequests: z.string().optional(),
  idealRelationship: z.string().optional(),
  providerFrustrations: z.string().optional(),
  boundariesPreferences: z.string().optional(),

  // Section 13: Budget, Timeline & Expectations
  startDate: z.string().min(1, "Start date is required"),
  deadline: z.string().optional(),
  projectTimeline: z.string().optional(),
  budgetRange: z.string().optional(),
  resultTimeline: z.string().optional(),
  successConfidence: z.string().optional(),
  startingConcerns: z.string().optional(),

  // Section 14: Final Notes
  finalNotes: z.string().optional(),
  excitedToImprove: z.string().optional(),
  worriedAbout: z.string().optional(),
  finalInstructions: z.string().optional(),

  // Internal Agency Review Checklist (Filled by Sienvi Team, normally editable by admin only)
  internalClientType: z.string().optional(),
  internalPrimaryGoal: z.string().optional(),
  internalTopPriorities: z.string().optional(),
  internalMainBottleneck: z.string().optional(),
  internalRevenueOpportunity: z.string().optional(),
  internalOperationalProblem: z.string().optional(),
  internalAudienceClarity: z.string().optional(),
  internalOfferClarity: z.string().optional(),
  internalBrandClarity: z.string().optional(),
  internalSystemsReadiness: z.string().optional(),
  internalAccessReadiness: z.string().optional(),
  internalFirst7DaysRec: z.string().optional(),
  internalFirst30DaysRec: z.string().optional(),
  internalRisksRedFlags: z.string().optional(),
  internalUpsellOpportunities: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface GeneralDiscoveryOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
  isAdmin?: boolean;
}

const supportTypeOptions = [
  { id: "strategy", label: "Business strategy" },
  { id: "marketing_strategy", label: "Marketing strategy" },
  { id: "advertising", label: "Advertising campaigns" },
  { id: "social_media", label: "Social media management" },
  { id: "content", label: "Content creation" },
  { id: "design", label: "Graphic design" },
  { id: "web_dev", label: "Website or landing page support" },
  { id: "copywriting", label: "Copywriting" },
  { id: "email_marketing", label: "Email marketing" },
  { id: "funnel", label: "Funnel building" },
  { id: "crm", label: "CRM setup" },
  { id: "automation", label: "Automation" },
  { id: "admin", label: "Admin support" },
  { id: "executive_assistant", label: "Executive assistant support" },
  { id: "onboarding", label: "Client onboarding" },
  { id: "ops_cleanup", label: "Operations cleanup" },
  { id: "branding", label: "Branding" },
  { id: "product_opt", label: "Product/listing optimization" },
  { id: "lead_gen", label: "Lead generation" },
  { id: "sales_support", label: "Sales support" },
  { id: "reporting", label: "Reporting/dashboard setup" },
];

const steps = [
  { id: "info", title: "1. Info & Overview" },
  { id: "goals", title: "2. SMART Goals" },
  { id: "challenges", title: "3. Bottlenecks & Audience" },
  { id: "offers", title: "4. Offers & Sales" },
  { id: "brand", title: "5. Brand & Systems" },
  { id: "scope", title: "6. Scope & Access" },
  { id: "collab", title: "7. Collab & Finish" },
  { id: "internal", title: "Internal Review" }
];

export const GeneralDiscoveryOnboardingForm = ({ clientProfileId, onComplete, initialData, isAdmin = false }: GeneralDiscoveryOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      primaryContactName: initialData.primary_contact_name || "",
      roleTitle: initialData.role_title || "",
      emailAddress: initialData.email_address || "",
      phoneWhatsapp: initialData.phone_whatsapp || "",
      websiteUrl: initialData.website_url || "",
      socialMediaLinks: initialData.social_media_links || "",
      locationTimeZone: initialData.location_time_zone || "",
      preferredCommunication: initialData.preferred_communication || "",
      mainPointOfContact: initialData.main_point_of_contact || "",
      decisionMaker: initialData.decision_maker || "",
      businessDescription: initialData.business_description || "",
      industryNiche: initialData.industry_niche || "",
      yearsOperating: initialData.years_operating || "",
      businessStage: initialData.business_stage || "",
      currentOffers: initialData.current_offers || "",
      revenueStreams: initialData.revenue_streams || "",
      pricingStructure: initialData.pricing_structure || "",
      competitorDifferentiation: initialData.competitor_differentiation || "",
      top3Goals: initialData.top_3_goals || "",
      primaryGoal: initialData.primary_goal || "",
      smartSpecific: initialData.smart_specific || "",
      smartMeasurable: initialData.smart_measurable || "",
      smartAchievable: initialData.smart_achievable || "",
      smartRelevant: initialData.smart_relevant || "",
      smartTimebound: initialData.smart_timebound || "",
      bigWin: initialData.big_win || "",
      longTermVision: initialData.long_term_vision || "",
      upcomingLaunches: initialData.upcoming_launches || "",
      biggestChallenges: initialData.biggest_challenges || "",
      stuckOverwhelmed: initialData.stuck_overwhelmed || "",
      speedPrevention: initialData.speed_prevention || "",
      timeSinks: initialData.time_sinks || "",
      inconsistencies: initialData.inconsistencies || "",
      pastSupportExperience: initialData.past_support_experience || "",
      thingsToAvoid: initialData.things_to_avoid || "",
      idealCustomer: initialData.ideal_customer || "",
      audienceType: initialData.audience_type || "",
      demographics: initialData.demographics || "",
      audienceGoals: initialData.audience_goals || "",
      painPoints: initialData.pain_points || "",
      fears: initialData.fears || "",
      objections: initialData.objections || "",
      onlineHangouts: initialData.online_hangouts || "",
      currentDiscovery: initialData.current_discovery || "",
      valuableClientType: initialData.valuable_client_type || "",
      avoidClients: initialData.avoid_clients || "",
      coreOffersDetails: initialData.core_offers_details || "",
      growPriorityOffer: initialData.grow_priority_offer || "",
      profitableOffer: initialData.profitable_offer || "",
      easySellOffer: initialData.easy_sell_offer || "",
      improvementOffer: initialData.improvement_offer || "",
      transformationOutcome: initialData.transformation_outcome || "",
      sellingPoints: initialData.selling_points || "",
      proofOfWork: initialData.proof_of_work || "",
      guaranteesBonuses: initialData.guarantees_bonuses || "",
      claimsToAvoid: initialData.claims_to_avoid || "",
      leadAcquisition: initialData.lead_acquisition || "",
      bestChannels: initialData.best_channels || "",
      inconsistentChannels: initialData.inconsistent_channels || "",
      paidAdsStatus: initialData.paid_ads_status || "",
      paidAdsPlatforms: initialData.paid_ads_platforms || "",
      existingFunnels: initialData.existing_funnels || "",
      salesProcess: initialData.sales_process || "",
      dropoffPoints: initialData.dropoff_points || "",
      trackConversions: initialData.track_conversions || "",
      promoOffers: initialData.promo_offers || "",
      topCompetitors: initialData.top_competitors || "",
      differentiation: initialData.differentiation || "",
      brandIdentityStatus: initialData.brand_identity_status || "",
      brandVoice: initialData.brand_voice || "",
      brandAssociations: initialData.brand_associations || "",
      brandAvoidWords: initialData.brand_avoid_words || "",
      admiredBrands: initialData.admired_brands || "",
      creativeAssets: initialData.creative_assets || "",
      contentCreated: initialData.content_created || "",
      importantPlatforms: initialData.important_platforms || "",
      designHelpNeeded: initialData.design_help_needed || "",
      pmTools: initialData.pm_tools || "",
      crmTools: initialData.crm_tools || "",
      schedulingTools: initialData.scheduling_tools || "",
      emailTools: initialData.email_tools || "",
      fileStorageTools: initialData.file_storage_tools || "",
      financeTools: initialData.finance_tools || "",
      automationTools: initialData.automation_tools || "",
      messySystems: initialData.messy_systems || "",
      documentedSOPsStatus: initialData.documented_sops_status || "",
      recurringTasks: initialData.recurring_tasks || "",
      manualAutomate: initialData.manual_automate || "",
      adminSupportNeeds: initialData.admin_support_needs || "",
      selectedSupportTypes: initialData.selected_support_types || [],
      top3Priorities: initialData.top_3_priorities || "",
      first7Days: initialData.first_7_days || "",
      first30Days: initialData.first_30_days || "",
      month1Success: initialData.month_1_success || "",
      urgentFires: initialData.urgent_fires || "",
      websiteLink: initialData.website_link || "",
      driveFolder: initialData.drive_folder || "",
      brandAssets: initialData.brand_assets || "",
      logoFiles: initialData.logo_files || "",
      styleGuide: initialData.style_guide || "",
      currentAds: initialData.current_ads || "",
      landingPages: initialData.landing_pages || "",
      crmLogin: initialData.crm_login || "",
      pmWorkspace: initialData.pm_workspace || "",
      socialAccounts: initialData.social_accounts || "",
      emailPlatform: initialData.email_platform || "",
      analyticsDashboard: initialData.analytics_dashboard || "",
      serviceDocs: initialData.service_docs || "",
      testimonialsDocs: initialData.testimonials_docs || "",
      otherLinks: initialData.other_links || "",
      platformsAccessList: initialData.platforms_access_list || "",
      accessMethod: initialData.access_method || "",
      passwordManager: initialData.password_manager || "",
      complianceRules: initialData.compliance_rules || "",
      collabPreference: initialData.collab_preference || "",
      updateFrequency: initialData.update_frequency || "",
      workApprover: initialData.work_approver || "",
      feedbackTurnaround: initialData.feedback_turnaround || "",
      agencyTurnaround: initialData.agency_turnaround || "",
      urgentRequests: initialData.urgent_requests || "",
      idealRelationship: initialData.ideal_relationship || "",
      providerFrustrations: initialData.provider_frustrations || "",
      boundariesPreferences: initialData.boundaries_preferences || "",
      startDate: initialData.start_date || "",
      deadline: initialData.deadline || "",
      projectTimeline: initialData.project_timeline || "",
      budgetRange: initialData.budget_range || "",
      resultTimeline: initialData.result_timeline || "",
      successConfidence: initialData.success_confidence || "",
      startingConcerns: initialData.starting_concerns || "",
      finalNotes: initialData.final_notes || "",
      excitedToImprove: initialData.excited_to_improve || "",
      worriedAbout: initialData.worried_about || "",
      finalInstructions: initialData.final_instructions || "",
      internalClientType: initialData.internal_client_type || "",
      internalPrimaryGoal: initialData.internal_primary_goal || "",
      internalTopPriorities: initialData.internal_top_priorities || "",
      internalMainBottleneck: initialData.internal_main_bottleneck || "",
      internalRevenueOpportunity: initialData.internal_revenue_opportunity || "",
      internalOperationalProblem: initialData.internal_operational_problem || "",
      internalAudienceClarity: initialData.internal_audience_clarity || "",
      internalOfferClarity: initialData.internal_offer_clarity || "",
      internalBrandClarity: initialData.internal_brand_clarity || "",
      internalSystemsReadiness: initialData.internal_systems_readiness || "",
      internalAccessReadiness: initialData.internal_access_readiness || "",
      internalFirst7DaysRec: initialData.internal_first_7_days_rec || "",
      internalFirst30DaysRec: initialData.internal_first_30_days_rec || "",
      internalRisksRedFlags: initialData.internal_risks_red_flags || "",
      internalUpsellOpportunities: initialData.internal_upsell_opportunities || [],
    } : {
      selectedSupportTypes: [],
    },
  });

  const selectedSupportTypes = watch("selectedSupportTypes") || [];

  const toggleSupportType = (supportId: string) => {
    const current = selectedSupportTypes;
    const updated = current.includes(supportId)
      ? current.filter(id => id !== supportId)
      : [...current, supportId];
    setValue("selectedSupportTypes", updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const values = getValues();
      console.log("Mock Saving General Discovery draft:", values);
      toast.success("Draft saved successfully! (Dev Mode)");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      console.log("Mock Submitting General Discovery Form:", data);
      toast.success("Discovery Questionnaire completed successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit questionnaire");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  const prevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-emerald-500/20 bg-emerald-50/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clipboard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">General Client Onboarding & Discovery Questionnaire</CardTitle>
              <CardDescription>
                Helps Sienvi outline strategy, targets, and execution parameters.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            This comprehensive form covers basic parameters, business stage, goals & vision, target audience, positioning, operations, and links.
            It takes approximately 30–60 minutes to complete.
          </p>
        </CardContent>
      </Card>

      {/* Progress wizard tabs */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-4">
        {steps.map((step, idx) => {
          if (step.id === "internal" && !isAdmin) return null;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all font-medium ${
                activeStep === idx
                  ? "bg-emerald-600 text-white shadow-sm"
                  : idx < activeStep
                  ? "text-green-600 hover:bg-slate-100"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {step.title}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* STEP 1: INFO & OVERVIEW */}
            {activeStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 1 & 2: Basic Business Info & Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input id="businessName" {...register("businessName")} placeholder="Legal / Operating Name" />
                      {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                      <Input id="primaryContactName" {...register("primaryContactName")} placeholder="Full Name" />
                      {errors.primaryContactName && <p className="text-xs text-destructive">{errors.primaryContactName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleTitle">Role / Title *</Label>
                      <Input id="roleTitle" {...register("roleTitle")} placeholder="Founder, CEO, Ops Manager, etc." />
                      {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAddress">Email Address *</Label>
                      <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="yourname@domain.com" />
                      {errors.emailAddress && <p className="text-xs text-destructive">{errors.emailAddress.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneWhatsapp">Phone Number / WhatsApp Number</Label>
                      <Input id="phoneWhatsapp" {...register("phoneWhatsapp")} placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Website URL</Label>
                      <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://domain.com" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationTimeZone">Business Location / Time Zone *</Label>
                      <Input id="locationTimeZone" {...register("locationTimeZone")} placeholder="e.g. New York (EST)" />
                      {errors.locationTimeZone && <p className="text-xs text-destructive">{errors.locationTimeZone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredCommunication">Preferred Communication Method *</Label>
                      <Input id="preferredCommunication" {...register("preferredCommunication")} placeholder="e.g. Slack, Email, WhatsApp" />
                      {errors.preferredCommunication && <p className="text-xs text-destructive">{errors.preferredCommunication.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mainPointOfContact">Who will be the main point of contact? *</Label>
                      <Input id="mainPointOfContact" {...register("mainPointOfContact")} placeholder="Name, role, & email" />
                      {errors.mainPointOfContact && <p className="text-xs text-destructive">{errors.mainPointOfContact.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decisionMaker">Are you the final decision-maker? *</Label>
                      <Input id="decisionMaker" {...register("decisionMaker")} placeholder="Yes/No (list others if no)" />
                      {errors.decisionMaker && <p className="text-xs text-destructive">{errors.decisionMaker.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="businessDescription">How would you describe your business? *</Label>
                    <Textarea id="businessDescription" {...register("businessDescription")} placeholder="What you do, who you serve, value prop..." rows={3} />
                    {errors.businessDescription && <p className="text-xs text-destructive">{errors.businessDescription.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industryNiche">What industry or niche are you in? *</Label>
                      <Input id="industryNiche" {...register("industryNiche")} placeholder="e.g. SaaS, E-commerce, Consulting" />
                      {errors.industryNiche && <p className="text-xs text-destructive">{errors.industryNiche.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessStage">What stage is your business currently in? *</Label>
                      <Input id="businessStage" {...register("businessStage")} placeholder="Startup, early growth, scaling..." />
                      {errors.businessStage && <p className="text-xs text-destructive">{errors.businessStage.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentOffers">What do you currently sell or offer? *</Label>
                    <Textarea id="currentOffers" {...register("currentOffers")} placeholder="List products, packages, retainers, programs..." rows={2} />
                    {errors.currentOffers && <p className="text-xs text-destructive">{errors.currentOffers.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: GOALS & VISION */}
            {activeStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 3: Goals & Vision (SMART Framework)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="top3Goals">What are your top 3 goals for the next 6–12 months? *</Label>
                    <Textarea id="top3Goals" {...register("top3Goals")} placeholder="1. ...\n2. ...\n3. ..." rows={3} />
                    {errors.top3Goals && <p className="text-xs text-destructive">{errors.top3Goals.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryGoal">What is your primary goal from working with Sienvi Agency? *</Label>
                    <Textarea id="primaryGoal" {...register("primaryGoal")} placeholder="Increase leads, improve conversion, save time, organize ops..." rows={2} />
                    {errors.primaryGoal && <p className="text-xs text-destructive">{errors.primaryGoal.message}</p>}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-slate-700">Define your primary goal using the SMART framework:</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smartSpecific">Specific: What exactly do you want to achieve? *</Label>
                      <Textarea id="smartSpecific" {...register("smartSpecific")} placeholder="Specific goal parameters..." rows={2} />
                      {errors.smartSpecific && <p className="text-xs text-destructive">{errors.smartSpecific.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smartMeasurable">Measurable: What numbers or KPIs define success? *</Label>
                      <Textarea id="smartMeasurable" {...register("smartMeasurable")} placeholder="Quantifiable metrics..." rows={2} />
                      {errors.smartMeasurable && <p className="text-xs text-destructive">{errors.smartMeasurable.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smartAchievable">Achievable: What resources, budget, or team do you have? *</Label>
                      <Textarea id="smartAchievable" {...register("smartAchievable")} placeholder="Available resources..." rows={2} />
                      {errors.smartAchievable && <p className="text-xs text-destructive">{errors.smartAchievable.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smartRelevant">Relevant: Why does this goal matter right now? *</Label>
                      <Textarea id="smartRelevant" {...register("smartRelevant")} placeholder="Relevance to business..." rows={2} />
                      {errors.smartRelevant && <p className="text-xs text-destructive">{errors.smartRelevant.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smartTimebound">Time-bound: What is your deadline or ideal timeline? *</Label>
                      <Input id="smartTimebound" {...register("smartTimebound")} placeholder="Target completion date..." />
                      {errors.smartTimebound && <p className="text-xs text-destructive">{errors.smartTimebound.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="bigWin">What would a “big win” from this partnership look like? *</Label>
                    <Textarea id="bigWin" {...register("bigWin")} placeholder="Define specific major successes..." rows={2} />
                    {errors.bigWin && <p className="text-xs text-destructive">{errors.bigWin.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: CHALLENGES & AUDIENCE */}
            {activeStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 4 & 5: Challenges, Bottlenecks & Audience Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="biggestChallenges">What are the biggest challenges in your business right now? *</Label>
                    <Textarea id="biggestChallenges" {...register("biggestChallenges")} placeholder="Marketing, sales, operations, systems..." rows={3} />
                    {errors.biggestChallenges && <p className="text-xs text-destructive">{errors.biggestChallenges.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stuckOverwhelmed">Where do you feel stuck or overwhelmed? *</Label>
                    <Textarea id="stuckOverwhelmed" {...register("stuckOverwhelmed")} placeholder="Describe the pain points..." rows={3} />
                    {errors.stuckOverwhelmed && <p className="text-xs text-destructive">{errors.stuckOverwhelmed.message}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="idealCustomer">Who is your ideal customer or client? *</Label>
                    <Textarea id="idealCustomer" {...register("idealCustomer")} placeholder="Describe the ideal buyer/persona..." rows={3} />
                    {errors.idealCustomer && <p className="text-xs text-destructive">{errors.idealCustomer.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="painPoints">What problems, frustrations, or pain points do they have? *</Label>
                    <Textarea id="painPoints" {...register("painPoints")} placeholder="Audience problems..." rows={3} />
                    {errors.painPoints && <p className="text-xs text-destructive">{errors.painPoints.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valuableClientType">Which customer/client type is most valuable to your business? *</Label>
                    <Textarea id="valuableClientType" {...register("valuableClientType")} placeholder="Highest profit, easiest to close, best fit..." rows={2} />
                    {errors.valuableClientType && <p className="text-xs text-destructive">{errors.valuableClientType.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: OFFERS & SALES */}
            {activeStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 6 & 7: Offers, Positioning, Marketing & Sales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="coreOffersDetails">What are your core offers, products, or services? *</Label>
                    <Textarea id="coreOffersDetails" {...register("coreOffersDetails")} placeholder="List each with a short description..." rows={3} />
                    {errors.coreOffersDetails && <p className="text-xs text-destructive">{errors.coreOffersDetails.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="growPriorityOffer">Which offer is most important to grow right now? *</Label>
                    <Textarea id="growPriorityOffer" {...register("growPriorityOffer")} placeholder="Focus offer details..." rows={2} />
                    {errors.growPriorityOffer && <p className="text-xs text-destructive">{errors.growPriorityOffer.message}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="leadAcquisition">How are you currently acquiring leads or customers? *</Label>
                    <Textarea id="leadAcquisition" {...register("leadAcquisition")} placeholder="Paid ads, organic social, SEO, referrals..." rows={3} />
                    {errors.leadAcquisition && <p className="text-xs text-destructive">{errors.leadAcquisition.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bestChannels">Best performing marketing channels?</Label>
                      <Input id="bestChannels" {...register("bestChannels")} placeholder="e.g. Referrals, Instagram..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inconsistentChannels">Inconsistent / failed marketing channels?</Label>
                      <Input id="inconsistentChannels" {...register("inconsistentChannels")} placeholder="Channels to adjust..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5: BRAND & SYSTEMS */}
            {activeStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 8 & 9: Brand Direction & Operations/Systems</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brandIdentityStatus">Do you have a clear brand identity? *</Label>
                      <Input id="brandIdentityStatus" {...register("brandIdentityStatus")} placeholder="Logo, colors, style guide status..." />
                      {errors.brandIdentityStatus && <p className="text-xs text-destructive">{errors.brandIdentityStatus.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandVoice">How would you describe your brand voice? *</Label>
                      <Input id="brandVoice" {...register("brandVoice")} placeholder="e.g. Professional, friendly, bold, minimal..." />
                      {errors.brandVoice && <p className="text-xs text-destructive">{errors.brandVoice.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-slate-700">What tools or platforms do you currently use?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pmTools">Project Management</Label>
                        <Input id="pmTools" {...register("pmTools")} placeholder="ClickUp, Asana, Notion..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="crmTools">CRM</Label>
                        <Input id="crmTools" {...register("crmTools")} placeholder="HubSpot, Salesforce, GHL..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedulingTools">Scheduling</Label>
                        <Input id="schedulingTools" {...register("schedulingTools")} placeholder="Calendly, Acuity..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTools">Email / Communication</Label>
                        <Input id="emailTools" {...register("emailTools")} placeholder="Slack, Teams, WhatsApp, Gmail..." />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 6: SCOPE & ACCESS */}
            {activeStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 10 & 11: Scope of Work, Assets & System Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="block mb-2 font-semibold">What type of support are you looking for? Select all that apply. *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {supportTypeOptions.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sup-${option.id}`}
                            checked={selectedSupportTypes.includes(option.id)}
                            onCheckedChange={() => toggleSupportType(option.id)}
                          />
                          <Label htmlFor={`sup-${option.id}`} className="text-xs font-normal cursor-pointer select-none">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.selectedSupportTypes && <p className="text-xs text-destructive">{errors.selectedSupportTypes.message}</p>}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="top3Priorities">What are the top 3 priorities Sienvi should focus on first? *</Label>
                    <Textarea id="top3Priorities" {...register("top3Priorities")} placeholder="1. Priority one\n2. Priority two\n3. Priority three" rows={3} />
                    {errors.top3Priorities && <p className="text-xs text-destructive">{errors.top3Priorities.message}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="platformsAccessList">What platforms will Sienvi need access to? *</Label>
                    <Textarea id="platformsAccessList" {...register("platformsAccessList")} placeholder="List CRM, social profiles, email hosts, etc..." rows={2} />
                    {errors.platformsAccessList && <p className="text-xs text-destructive">{errors.platformsAccessList.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 7: COLLAB & FINALIZE */}
            {activeStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 12, 13 & 14: Collaboration, Timeline & Finalization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collabPreference">How do you prefer to collaborate? *</Label>
                      <Input id="collabPreference" {...register("collabPreference")} placeholder="Async Slack, Weekly zoom, Loom updates..." />
                      {errors.collabPreference && <p className="text-xs text-destructive">{errors.collabPreference.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workApprover">Who approves work before it goes live? *</Label>
                      <Input id="workApprover" {...register("workApprover")} placeholder="Name and role of final approver" />
                      {errors.workApprover && <p className="text-xs text-destructive">{errors.workApprover.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">When would you like to get started? *</Label>
                      <Input id="startDate" {...register("startDate")} placeholder="e.g. Immediately, Next month..." />
                      {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Launch deadline or campaign timeline?</Label>
                      <Input id="deadline" {...register("deadline")} placeholder="e.g. Target product launch date..." />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="finalNotes">Final Notes / Excitements / Worries</Label>
                    <Textarea id="finalNotes" {...register("finalNotes")} placeholder="Any final details or instructions..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 8: INTERNAL REVIEW (ADMIN ONLY) */}
            {activeStep === 7 && isAdmin && (
              <Card className="border-indigo-600 bg-indigo-50/20 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <CardTitle className="text-lg text-indigo-900 font-bold">Internal Agency Review Checklist</CardTitle>
                  </div>
                  <CardDescription className="text-indigo-700">Checklist for Sienvi team review post-submission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="internalClientType">Client Type</Label>
                      <Input id="internalClientType" {...register("internalClientType")} placeholder="e.g. Ecomm, SaaS, Coaching..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalPrimaryGoal">Primary Goal Identified</Label>
                      <Input id="internalPrimaryGoal" {...register("internalPrimaryGoal")} placeholder="Core target..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internalTopPriorities">Top 3 Priorities</Label>
                    <Textarea id="internalTopPriorities" {...register("internalTopPriorities")} placeholder="Check priority alignment..." rows={2} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="internalMainBottleneck">Main Bottleneck</Label>
                      <Input id="internalMainBottleneck" {...register("internalMainBottleneck")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalRevenueOpportunity">Revenue Opportunity</Label>
                      <Input id="internalRevenueOpportunity" {...register("internalRevenueOpportunity")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="internalAudienceClarity">Audience Clarity</Label>
                      <Input id="internalAudienceClarity" {...register("internalAudienceClarity")} placeholder="Strong / Moderate / Weak" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalOfferClarity">Offer Clarity</Label>
                      <Input id="internalOfferClarity" {...register("internalOfferClarity")} placeholder="Strong / Moderate / Weak" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="internalBrandClarity">Brand Clarity</Label>
                      <Input id="internalBrandClarity" {...register("internalBrandClarity")} placeholder="Strong / Moderate / Weak" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={activeStep === 0 || saving}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>

          {activeStep < (isAdmin ? steps.length - 1 : steps.length - 2) ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Onboarding
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
