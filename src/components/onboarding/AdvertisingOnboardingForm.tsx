import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  // Section 1: Business & Campaign Overview
  businessName: z.string().min(1, "Business name is required"),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  emailAddress: z.string().email("Valid email is required"),
  industryNiche: z.string().min(1, "Industry/niche is required"),
  
  // Section 2: Advertising Channels
  selectedChannels: z.array(z.string()).min(1, "Select at least one channel"),
  
  // Section 3: Campaign Goals
  primaryCampaignGoal: z.string().min(1, "Select a primary goal"),
  secondaryGoals: z.array(z.string()).optional(),
  targetKpis: z.string().min(5, "Please describe your target KPIs"),
  monthlyBudgetRange: z.string().min(1, "Budget range is required"),
  
  // Section 4: Target Audience
  targetDemographics: z.string().min(5, "Please describe your target demographics"),
  targetLocations: z.string().min(1, "Target locations required"),
  targetInterests: z.string().optional(),
  audiencePersonas: z.string().optional(),
  retargetingAudiences: z.string().optional(),
  
  // Section 5: Current Advertising Status
  previousAdvertisingExperience: z.string().optional(),
  currentAdAccounts: z.string().optional(),
  historicalPerformance: z.string().optional(),
  whatWorked: z.string().optional(),
  whatDidntWork: z.string().optional(),
  
  // Section 6: Creative & Messaging
  existingAdCreatives: z.boolean().default(false),
  brandVoice: z.string().optional(),
  keyMessagingPoints: z.string().min(5, "Please describe key messaging points"),
  uniqueSellingPropositions: z.string().min(5, "Please describe your USPs"),
  promotionalOffers: z.string().optional(),
  
  // Section 7: Landing Pages & Conversion
  landingPageUrls: z.string().optional(),
  conversionTrackingSetup: z.boolean().default(false),
  conversionActions: z.string().optional(),
  
  // Section 8: Competitor Analysis
  mainCompetitors: z.string().optional(),
  competitorAdExamples: z.string().optional(),
  differentiationStrategy: z.string().optional(),
  
  // Section 9: Timeline & Expectations
  campaignStartDate: z.string().optional(),
  campaignDuration: z.string().optional(),
  expectedResultsTimeline: z.string().optional(),
  reportingPreferences: z.string().optional(),
  
  // Section 10: Assets & Access
  hasAdAccounts: z.boolean().default(false),
  adAccountAccessDetails: z.string().optional(),
  creativeAssetsAvailable: z.string().optional(),
  
  // Section 11: Additional Information
  additionalNotes: z.string().optional(),
  
  // Confirmation
  confirmedAccurate: z.boolean().refine(val => val === true, "You must confirm the information is accurate"),
});

type FormData = z.infer<typeof formSchema>;

interface AdvertisingOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
  selectedChannels?: string[];
}

const channelOptions = [
  { id: "amazon", label: "Amazon Advertising" },
  { id: "google", label: "Google Ads" },
  { id: "meta", label: "Meta (Facebook/Instagram)" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "reddit", label: "Reddit" },
  { id: "linkedin", label: "LinkedIn" },
];

const goalOptions = [
  { id: "brand_awareness", label: "Brand Awareness" },
  { id: "lead_generation", label: "Lead Generation" },
  { id: "sales_conversions", label: "Sales/Conversions" },
  { id: "traffic", label: "Website Traffic" },
  { id: "engagement", label: "Engagement" },
];

const budgetOptions = [
  { id: "under_1k", label: "Under $1,000/month" },
  { id: "1k_5k", label: "$1,000 - $5,000/month" },
  { id: "5k_10k", label: "$5,000 - $10,000/month" },
  { id: "10k_25k", label: "$10,000 - $25,000/month" },
  { id: "25k_50k", label: "$25,000 - $50,000/month" },
  { id: "over_50k", label: "Over $50,000/month" },
];

export const AdvertisingOnboardingForm = ({ 
  clientProfileId, 
  onComplete, 
  initialData,
  selectedChannels: preselectedChannels = []
}: AdvertisingOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      primaryContactName: initialData.primary_contact_name || "",
      emailAddress: initialData.email_address || "",
      industryNiche: initialData.industry_niche || "",
      selectedChannels: initialData.selected_channels || preselectedChannels,
      primaryCampaignGoal: initialData.primary_campaign_goal || "",
      secondaryGoals: initialData.secondary_goals || [],
      targetKpis: initialData.target_kpis || "",
      monthlyBudgetRange: initialData.monthly_budget_range || "",
      targetDemographics: initialData.target_demographics || "",
      targetLocations: initialData.target_locations || "",
      targetInterests: initialData.target_interests || "",
      audiencePersonas: initialData.audience_personas || "",
      retargetingAudiences: initialData.retargeting_audiences || "",
      previousAdvertisingExperience: initialData.previous_advertising_experience || "",
      currentAdAccounts: initialData.current_ad_accounts || "",
      historicalPerformance: initialData.historical_performance || "",
      whatWorked: initialData.what_worked || "",
      whatDidntWork: initialData.what_didnt_work || "",
      existingAdCreatives: initialData.existing_ad_creatives || false,
      brandVoice: initialData.brand_voice || "",
      keyMessagingPoints: initialData.key_messaging_points || "",
      uniqueSellingPropositions: initialData.unique_selling_propositions || "",
      promotionalOffers: initialData.promotional_offers || "",
      landingPageUrls: initialData.landing_page_urls || "",
      conversionTrackingSetup: initialData.conversion_tracking_setup || false,
      conversionActions: initialData.conversion_actions || "",
      mainCompetitors: initialData.main_competitors || "",
      competitorAdExamples: initialData.competitor_ad_examples || "",
      differentiationStrategy: initialData.differentiation_strategy || "",
      campaignStartDate: initialData.campaign_start_date || "",
      campaignDuration: initialData.campaign_duration || "",
      expectedResultsTimeline: initialData.expected_results_timeline || "",
      reportingPreferences: initialData.reporting_preferences || "",
      hasAdAccounts: initialData.has_ad_accounts || false,
      adAccountAccessDetails: initialData.ad_account_access_details || "",
      creativeAssetsAvailable: initialData.creative_assets_available || "",
      additionalNotes: initialData.additional_notes || "",
      confirmedAccurate: initialData.confirmed_accurate || false,
    } : {
      selectedChannels: preselectedChannels,
      secondaryGoals: [],
      existingAdCreatives: false,
      conversionTrackingSetup: false,
      hasAdAccounts: false,
      confirmedAccurate: false,
    },
  });

  const channels = watch("selectedChannels") || [];
  const secondaryGoals = watch("secondaryGoals") || [];

  const toggleChannel = (channel: string) => {
    const current = channels;
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    setValue("selectedChannels", updated);
  };

  const toggleSecondaryGoal = (goal: string) => {
    const current = secondaryGoals;
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal];
    setValue("secondaryGoals", updated);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const advertisingData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        business_name: data.businessName,
        primary_contact_name: data.primaryContactName,
        email_address: data.emailAddress,
        industry_niche: data.industryNiche,
        selected_channels: data.selectedChannels,
        primary_campaign_goal: data.primaryCampaignGoal,
        secondary_goals: data.secondaryGoals,
        target_kpis: data.targetKpis,
        monthly_budget_range: data.monthlyBudgetRange,
        target_demographics: data.targetDemographics,
        target_locations: data.targetLocations,
        target_interests: data.targetInterests,
        audience_personas: data.audiencePersonas,
        retargeting_audiences: data.retargetingAudiences,
        previous_advertising_experience: data.previousAdvertisingExperience,
        current_ad_accounts: data.currentAdAccounts,
        historical_performance: data.historicalPerformance,
        what_worked: data.whatWorked,
        what_didnt_work: data.whatDidntWork,
        existing_ad_creatives: data.existingAdCreatives,
        brand_voice: data.brandVoice,
        key_messaging_points: data.keyMessagingPoints,
        unique_selling_propositions: data.uniqueSellingPropositions,
        promotional_offers: data.promotionalOffers,
        landing_page_urls: data.landingPageUrls,
        conversion_tracking_setup: data.conversionTrackingSetup,
        conversion_actions: data.conversionActions,
        main_competitors: data.mainCompetitors,
        competitor_ad_examples: data.competitorAdExamples,
        differentiation_strategy: data.differentiationStrategy,
        campaign_start_date: data.campaignStartDate,
        campaign_duration: data.campaignDuration,
        expected_results_timeline: data.expectedResultsTimeline,
        reporting_preferences: data.reportingPreferences,
        has_ad_accounts: data.hasAdAccounts,
        ad_account_access_details: data.adAccountAccessDetails,
        creative_assets_available: data.creativeAssetsAvailable,
        additional_notes: data.additionalNotes,
        confirmed_accurate: data.confirmedAccurate,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("onboarding_advertising")
        .upsert(advertisingData as any);

      if (error) throw error;

      toast.success("Advertising questionnaire saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving advertising questionnaire:", error);
      toast.error(error.message || "Failed to save questionnaire");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-blue-500/20 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Advertising Campaign Questionnaire</CardTitle>
              <CardDescription>
                Help us understand your advertising goals and requirements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This questionnaire helps us create effective advertising campaigns tailored to your 
            business goals, target audience, and budget.
          </p>
        </CardContent>
      </Card>

      {/* Section 1: Business & Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 1: Business & Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" {...register("businessName")} placeholder="Your business name" />
              {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
              <Input id="primaryContactName" {...register("primaryContactName")} placeholder="Your name" />
              {errors.primaryContactName && <p className="text-sm text-destructive">{errors.primaryContactName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailAddress">Email Address *</Label>
              <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="your@email.com" />
              {errors.emailAddress && <p className="text-sm text-destructive">{errors.emailAddress.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryNiche">Industry/Niche *</Label>
              <Input id="industryNiche" {...register("industryNiche")} placeholder="e.g., E-commerce, SaaS" />
              {errors.industryNiche && <p className="text-sm text-destructive">{errors.industryNiche.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Advertising Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 2: Advertising Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Which Advertising Channels Are You Interested In? *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {channelOptions.map((channel) => (
                <div key={channel.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`channel-${channel.id}`}
                    checked={channels.includes(channel.id)}
                    onCheckedChange={() => toggleChannel(channel.id)}
                  />
                  <Label htmlFor={`channel-${channel.id}`} className="text-sm">{channel.label}</Label>
                </div>
              ))}
            </div>
            {errors.selectedChannels && <p className="text-sm text-destructive">{errors.selectedChannels.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Campaign Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 3: Campaign Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Campaign Goal *</Label>
            <RadioGroup
              defaultValue={initialData?.primary_campaign_goal || ""}
              onValueChange={(value) => setValue("primaryCampaignGoal", value)}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {goalOptions.map((goal) => (
                  <div key={goal.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={goal.id} id={`goal-${goal.id}`} />
                    <Label htmlFor={`goal-${goal.id}`}>{goal.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {errors.primaryCampaignGoal && <p className="text-sm text-destructive">{errors.primaryCampaignGoal.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Secondary Goals (optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {goalOptions.map((goal) => (
                <div key={goal.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`secondary-${goal.id}`}
                    checked={secondaryGoals.includes(goal.id)}
                    onCheckedChange={() => toggleSecondaryGoal(goal.id)}
                  />
                  <Label htmlFor={`secondary-${goal.id}`} className="text-sm">{goal.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetKpis">Target KPIs *</Label>
            <Textarea id="targetKpis" {...register("targetKpis")} placeholder="e.g., 100 leads/month, 5x ROAS, $50 CPA..." rows={2} />
            {errors.targetKpis && <p className="text-sm text-destructive">{errors.targetKpis.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Monthly Advertising Budget Range *</Label>
            <RadioGroup
              defaultValue={initialData?.monthly_budget_range || ""}
              onValueChange={(value) => setValue("monthlyBudgetRange", value)}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {budgetOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`budget-${option.id}`} />
                    <Label htmlFor={`budget-${option.id}`} className="text-sm">{option.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {errors.monthlyBudgetRange && <p className="text-sm text-destructive">{errors.monthlyBudgetRange.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 4: Target Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetDemographics">Target Demographics *</Label>
            <Textarea id="targetDemographics" {...register("targetDemographics")} placeholder="Age, gender, income level, occupation..." rows={2} />
            {errors.targetDemographics && <p className="text-sm text-destructive">{errors.targetDemographics.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetLocations">Target Locations *</Label>
            <Input id="targetLocations" {...register("targetLocations")} placeholder="e.g., United States, California, New York City" />
            {errors.targetLocations && <p className="text-sm text-destructive">{errors.targetLocations.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetInterests">Target Interests & Behaviors</Label>
            <Textarea id="targetInterests" {...register("targetInterests")} placeholder="Interests, hobbies, purchase behaviors..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audiencePersonas">Existing Audience Personas (if any)</Label>
            <Textarea id="audiencePersonas" {...register("audiencePersonas")} placeholder="Describe your buyer personas..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retargetingAudiences">Retargeting Audiences</Label>
            <Textarea id="retargetingAudiences" {...register("retargetingAudiences")} placeholder="Website visitors, email lists, past customers..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Current Advertising Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 5: Current Advertising Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="previousAdvertisingExperience">Previous Advertising Experience</Label>
            <Textarea id="previousAdvertisingExperience" {...register("previousAdvertisingExperience")} placeholder="What platforms have you advertised on before?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentAdAccounts">Current Ad Accounts</Label>
            <Textarea id="currentAdAccounts" {...register("currentAdAccounts")} placeholder="List existing ad accounts..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="historicalPerformance">Historical Performance Summary</Label>
            <Textarea id="historicalPerformance" {...register("historicalPerformance")} placeholder="Past campaign results, ROAS, CPAs..." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatWorked">What Has Worked Well?</Label>
              <Textarea id="whatWorked" {...register("whatWorked")} placeholder="Successful strategies..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatDidntWork">What Hasn't Worked?</Label>
              <Textarea id="whatDidntWork" {...register("whatDidntWork")} placeholder="Strategies to avoid..." rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Creative & Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 6: Creative & Messaging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="existingAdCreatives"
              checked={watch("existingAdCreatives")}
              onCheckedChange={(checked) => setValue("existingAdCreatives", !!checked)}
            />
            <Label htmlFor="existingAdCreatives">I have existing ad creatives to use</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandVoice">Brand Voice & Tone</Label>
            <Input id="brandVoice" {...register("brandVoice")} placeholder="e.g., Professional, Friendly, Bold" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyMessagingPoints">Key Messaging Points *</Label>
            <Textarea id="keyMessagingPoints" {...register("keyMessagingPoints")} placeholder="Main messages to communicate..." rows={3} />
            {errors.keyMessagingPoints && <p className="text-sm text-destructive">{errors.keyMessagingPoints.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="uniqueSellingPropositions">Unique Selling Propositions (USPs) *</Label>
            <Textarea id="uniqueSellingPropositions" {...register("uniqueSellingPropositions")} placeholder="What makes you different?" rows={2} />
            {errors.uniqueSellingPropositions && <p className="text-sm text-destructive">{errors.uniqueSellingPropositions.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="promotionalOffers">Promotional Offers or Incentives</Label>
            <Textarea id="promotionalOffers" {...register("promotionalOffers")} placeholder="Discounts, free trials, bonuses..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Landing Pages & Conversion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 7: Landing Pages & Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="landingPageUrls">Landing Page URLs</Label>
            <Textarea id="landingPageUrls" {...register("landingPageUrls")} placeholder="URLs where ads will direct traffic..." rows={2} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="conversionTrackingSetup"
              checked={watch("conversionTrackingSetup")}
              onCheckedChange={(checked) => setValue("conversionTrackingSetup", !!checked)}
            />
            <Label htmlFor="conversionTrackingSetup">Conversion tracking is already set up</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conversionActions">Conversion Actions to Track</Label>
            <Textarea id="conversionActions" {...register("conversionActions")} placeholder="Purchases, sign-ups, leads, calls..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Competitor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 8: Competitor Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainCompetitors">Main Competitors</Label>
            <Textarea id="mainCompetitors" {...register("mainCompetitors")} placeholder="List your top competitors..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competitorAdExamples">Competitor Ad Examples (links)</Label>
            <Textarea id="competitorAdExamples" {...register("competitorAdExamples")} placeholder="Links to competitor ads you've seen..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="differentiationStrategy">How Do You Want to Differentiate?</Label>
            <Textarea id="differentiationStrategy" {...register("differentiationStrategy")} placeholder="Your competitive advantage..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 9: Timeline & Expectations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 9: Timeline & Expectations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignStartDate">Desired Campaign Start Date</Label>
              <Input id="campaignStartDate" {...register("campaignStartDate")} placeholder="e.g., February 1, 2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignDuration">Campaign Duration</Label>
              <Input id="campaignDuration" {...register("campaignDuration")} placeholder="e.g., Ongoing, 3 months" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedResultsTimeline">Expected Results Timeline</Label>
            <Input id="expectedResultsTimeline" {...register("expectedResultsTimeline")} placeholder="e.g., See results within 30 days" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportingPreferences">Reporting Preferences</Label>
            <Input id="reportingPreferences" {...register("reportingPreferences")} placeholder="e.g., Weekly reports, monthly calls" />
          </div>
        </CardContent>
      </Card>

      {/* Section 10: Assets & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 10: Assets & Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasAdAccounts"
              checked={watch("hasAdAccounts")}
              onCheckedChange={(checked) => setValue("hasAdAccounts", !!checked)}
            />
            <Label htmlFor="hasAdAccounts">I have existing ad accounts to grant access to</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adAccountAccessDetails">Ad Account Access Details</Label>
            <Textarea id="adAccountAccessDetails" {...register("adAccountAccessDetails")} placeholder="How will you provide access? Admin emails, etc..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creativeAssetsAvailable">Creative Assets Available</Label>
            <Textarea id="creativeAssetsAvailable" {...register("creativeAssetsAvailable")} placeholder="Images, videos, logos you can provide..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 11: Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 11: Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Anything Else We Should Know?</Label>
            <Textarea id="additionalNotes" {...register("additionalNotes")} placeholder="Any additional information, special requirements, or notes..." rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirmedAccurate"
              checked={watch("confirmedAccurate")}
              onCheckedChange={(checked) => setValue("confirmedAccurate", !!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="confirmedAccurate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I confirm that all provided information is accurate and approved for use *
              </Label>
            </div>
          </div>
          {errors.confirmedAccurate && <p className="text-sm text-destructive">{errors.confirmedAccurate.message}</p>}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Advertising Questionnaire
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
