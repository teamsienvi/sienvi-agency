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
import { toast } from "sonner";
import { Loader2, ClipboardList, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  // Section 1: Business Overview
  businessName: z.string().min(1, "Business name is required"),
  businessDescription: z.string().min(10, "Please provide a description"),
  industryNiche: z.string().min(1, "Industry/niche is required"),
  yearsOperating: z.string().optional(),
  targetAudience: z.string().min(5, "Please describe your target audience"),
  revenueStreams: z.string().optional(),
  revenueGoals: z.string().optional(),
  // Section 2: Goals & Vision
  top3Goals: z.string().min(10, "Please describe your top goals"),
  vision3To5Years: z.string().optional(),
  plannedLaunches: z.string().optional(),
  bigWinExpectation: z.string().min(10, "Please describe what a big win looks like"),
  // Section 3: Challenges & Bottlenecks
  biggestChallenges: z.string().min(10, "Please describe your challenges"),
  stuckAreas: z.string().optional(),
  goalBlockers: z.string().optional(),
  pastAgenciesExperience: z.string().optional(),
  // Section 4: Team, Tools & Systems
  teamStructure: z.string().optional(),
  marketingTools: z.string().optional(),
  crmEmailTools: z.string().optional(),
  salesFunnelTools: z.string().optional(),
  projectManagementTools: z.string().optional(),
  performanceTracking: z.string().optional(),
  automationNeeds: z.string().optional(),
  // Section 5: Offers, Marketing & Sales
  coreOffers: z.string().min(5, "Please describe your core offers"),
  leadAcquisition: z.string().optional(),
  marketingWorking: z.string().optional(),
  marketingNotWorking: z.string().optional(),
  existingFunnels: z.string().optional(),
  // Section 6: Content & Branding
  brandIdentity: z.string().optional(),
  contentCreation: z.string().optional(),
  importantPlatforms: z.string().optional(),
  assetsToReview: z.string().optional(),
  // Section 7: Decision-Making & Collaboration
  primaryContact: z.string().min(1, "Primary contact is required"),
  communicationPreference: z.string().optional(),
  decisionMaker: z.string().optional(),
  idealCollaboration: z.string().optional(),
  // Section 8: Readiness & Expectations
  startTimeline: z.string().optional(),
  budgetTimeline: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface QuestionnaireFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

export const QuestionnaireForm = ({ clientProfileId, onComplete, initialData }: QuestionnaireFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      businessDescription: initialData.business_description || "",
      industryNiche: initialData.industry_niche || "",
      yearsOperating: initialData.years_operating || "",
      targetAudience: initialData.target_audience || "",
      revenueStreams: initialData.revenue_streams || "",
      revenueGoals: initialData.revenue_goals || "",
      top3Goals: initialData.top_3_goals || "",
      vision3To5Years: initialData.vision_3_5_years || "",
      plannedLaunches: initialData.planned_launches || "",
      bigWinExpectation: initialData.big_win_expectation || "",
      biggestChallenges: initialData.biggest_challenges || "",
      stuckAreas: initialData.stuck_areas || "",
      goalBlockers: initialData.goal_blockers || "",
      pastAgenciesExperience: initialData.past_agencies_experience || "",
      teamStructure: initialData.team_structure || "",
      marketingTools: initialData.marketing_tools || "",
      crmEmailTools: initialData.crm_email_tools || "",
      salesFunnelTools: initialData.sales_funnel_tools || "",
      projectManagementTools: initialData.project_management_tools || "",
      performanceTracking: initialData.performance_tracking || "",
      automationNeeds: initialData.automation_needs || "",
      coreOffers: initialData.core_offers || "",
      leadAcquisition: initialData.lead_acquisition || "",
      marketingWorking: initialData.marketing_working || "",
      marketingNotWorking: initialData.marketing_not_working || "",
      existingFunnels: initialData.existing_funnels || "",
      brandIdentity: initialData.brand_identity || "",
      contentCreation: initialData.content_creation || "",
      importantPlatforms: initialData.important_platforms || "",
      assetsToReview: initialData.assets_to_review || "",
      primaryContact: initialData.primary_contact || "",
      communicationPreference: initialData.communication_preference || "",
      decisionMaker: initialData.decision_maker || "",
      idealCollaboration: initialData.ideal_collaboration || "",
      startTimeline: initialData.start_timeline || "",
      budgetTimeline: initialData.budget_timeline || "",
      additionalNotes: initialData.additional_notes || "",
    } : undefined,
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const questionnaireData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        business_name: data.businessName,
        business_description: data.businessDescription,
        industry_niche: data.industryNiche,
        years_operating: data.yearsOperating,
        target_audience: data.targetAudience,
        revenue_streams: data.revenueStreams,
        revenue_goals: data.revenueGoals,
        top_3_goals: data.top3Goals,
        vision_3_5_years: data.vision3To5Years,
        planned_launches: data.plannedLaunches,
        big_win_expectation: data.bigWinExpectation,
        biggest_challenges: data.biggestChallenges,
        stuck_areas: data.stuckAreas,
        goal_blockers: data.goalBlockers,
        past_agencies_experience: data.pastAgenciesExperience,
        team_structure: data.teamStructure,
        marketing_tools: data.marketingTools,
        crm_email_tools: data.crmEmailTools,
        sales_funnel_tools: data.salesFunnelTools,
        project_management_tools: data.projectManagementTools,
        performance_tracking: data.performanceTracking,
        automation_needs: data.automationNeeds,
        core_offers: data.coreOffers,
        lead_acquisition: data.leadAcquisition,
        marketing_working: data.marketingWorking,
        marketing_not_working: data.marketingNotWorking,
        existing_funnels: data.existingFunnels,
        brand_identity: data.brandIdentity,
        content_creation: data.contentCreation,
        important_platforms: data.importantPlatforms,
        assets_to_review: data.assetsToReview,
        primary_contact: data.primaryContact,
        communication_preference: data.communicationPreference,
        decision_maker: data.decisionMaker,
        ideal_collaboration: data.idealCollaboration,
        start_timeline: data.startTimeline,
        budget_timeline: data.budgetTimeline,
        additional_notes: data.additionalNotes,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("onboarding_questionnaire")
        .upsert(questionnaireData as any);

      if (error) throw error;

      toast.success("Questionnaire saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving questionnaire:", error);
      toast.error(error.message || "Failed to save questionnaire");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Onboarding Questionnaire</CardTitle>
              <CardDescription>
                Help us understand your business inside and out
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This comprehensive questionnaire helps us tailor our services to your specific needs. Take your time to provide detailed answers - the more we know, the better we can serve you.
          </p>
        </CardContent>
      </Card>

      {/* Section 1: Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 1: Business Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" {...register("businessName")} placeholder="Your business name" />
              {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryNiche">Industry or Niche *</Label>
              <Input id="industryNiche" {...register("industryNiche")} placeholder="e.g., E-commerce, SaaS, Coaching" />
              {errors.industryNiche && <p className="text-sm text-destructive">{errors.industryNiche.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessDescription">How would you describe your business? *</Label>
            <Textarea id="businessDescription" {...register("businessDescription")} placeholder="One or two sentences..." rows={2} />
            {errors.businessDescription && <p className="text-sm text-destructive">{errors.businessDescription.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsOperating">How long have you been operating?</Label>
              <Input id="yearsOperating" {...register("yearsOperating")} placeholder="e.g., 3 years" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenueGoals">Monthly/Annual revenue goals?</Label>
              <Input id="revenueGoals" {...register("revenueGoals")} placeholder="e.g., $50k/month" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Who is your target audience? *</Label>
            <Textarea id="targetAudience" {...register("targetAudience")} placeholder="Describe your ideal customer..." rows={2} />
            {errors.targetAudience && <p className="text-sm text-destructive">{errors.targetAudience.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="revenueStreams">What are your primary revenue streams?</Label>
            <Textarea id="revenueStreams" {...register("revenueStreams")} placeholder="List your main income sources..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Goals & Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 2: Goals & Vision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="top3Goals">What are your top 3 business goals for the next 6–12 months? *</Label>
            <Textarea id="top3Goals" {...register("top3Goals")} placeholder="1. ...\n2. ...\n3. ..." rows={4} />
            {errors.top3Goals && <p className="text-sm text-destructive">{errors.top3Goals.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vision3To5Years">What's the bigger vision for your business over the next 3–5 years?</Label>
            <Textarea id="vision3To5Years" {...register("vision3To5Years")} placeholder="Your long-term vision..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plannedLaunches">Are there any new products, services, or launches you're planning?</Label>
            <Textarea id="plannedLaunches" {...register("plannedLaunches")} placeholder="Upcoming launches..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bigWinExpectation">What would a "big win" from working with us look like? *</Label>
            <Textarea id="bigWinExpectation" {...register("bigWinExpectation")} placeholder="Describe your ideal outcome..." rows={3} />
            {errors.bigWinExpectation && <p className="text-sm text-destructive">{errors.bigWinExpectation.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Challenges & Bottlenecks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 3: Challenges & Bottlenecks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biggestChallenges">What are the biggest challenges in your business right now? *</Label>
            <Textarea id="biggestChallenges" {...register("biggestChallenges")} placeholder="Your main pain points..." rows={3} />
            {errors.biggestChallenges && <p className="text-sm text-destructive">{errors.biggestChallenges.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stuckAreas">Where do you feel stuck or overwhelmed?</Label>
            <Textarea id="stuckAreas" {...register("stuckAreas")} placeholder="Areas where you need help..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goalBlockers">What's preventing you from reaching your goals faster?</Label>
            <Textarea id="goalBlockers" {...register("goalBlockers")} placeholder="Blockers and obstacles..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pastAgenciesExperience">Have you worked with agencies/consultants before? What worked and didn't?</Label>
            <Textarea id="pastAgenciesExperience" {...register("pastAgenciesExperience")} placeholder="Past experiences..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Team, Tools & Systems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 4: Team, Tools & Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamStructure">Do you have a team? What roles are filled?</Label>
            <Textarea id="teamStructure" {...register("teamStructure")} placeholder="Internal or outsourced..." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marketingTools">Marketing & content tools?</Label>
              <Input id="marketingTools" {...register("marketingTools")} placeholder="e.g., Canva, Buffer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crmEmailTools">CRM & email tools?</Label>
              <Input id="crmEmailTools" {...register("crmEmailTools")} placeholder="e.g., HubSpot, Mailchimp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesFunnelTools">Sales & funnel tools?</Label>
              <Input id="salesFunnelTools" {...register("salesFunnelTools")} placeholder="e.g., ClickFunnels, Stripe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectManagementTools">Project management tools?</Label>
              <Input id="projectManagementTools" {...register("projectManagementTools")} placeholder="e.g., Asana, Notion" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="performanceTracking">How do you currently track performance?</Label>
            <Textarea id="performanceTracking" {...register("performanceTracking")} placeholder="Metrics and analytics..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="automationNeeds">Any manual tasks you'd like to automate?</Label>
            <Textarea id="automationNeeds" {...register("automationNeeds")} placeholder="Repetitive tasks..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Offers, Marketing & Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 5: Offers, Marketing & Sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coreOffers">What are your current core offers or services? *</Label>
            <Textarea id="coreOffers" {...register("coreOffers")} placeholder="Your main offerings..." rows={2} />
            {errors.coreOffers && <p className="text-sm text-destructive">{errors.coreOffers.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadAcquisition">How are you currently acquiring leads?</Label>
            <Textarea id="leadAcquisition" {...register("leadAcquisition")} placeholder="Lead generation methods..." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marketingWorking">What's working best in marketing?</Label>
              <Textarea id="marketingWorking" {...register("marketingWorking")} placeholder="Successful strategies..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketingNotWorking">What's not working or inconsistent?</Label>
              <Textarea id="marketingNotWorking" {...register("marketingNotWorking")} placeholder="Problem areas..." rows={2} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="existingFunnels">Do you have existing funnels, email sequences, or ads running?</Label>
            <Textarea id="existingFunnels" {...register("existingFunnels")} placeholder="Current campaigns..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Content & Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 6: Content & Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandIdentity">Do you have a clear brand identity (messaging, visuals, tone)?</Label>
            <Textarea id="brandIdentity" {...register("brandIdentity")} placeholder="Your brand elements..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contentCreation">Do you currently create content? What kind?</Label>
            <Textarea id="contentCreation" {...register("contentCreation")} placeholder="Email, blog, video, social..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="importantPlatforms">Which platforms are most important for your brand?</Label>
            <Input id="importantPlatforms" {...register("importantPlatforms")} placeholder="e.g., Instagram, LinkedIn, YouTube" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetsToReview">Any assets you'd like us to review or optimize?</Label>
            <Textarea id="assetsToReview" {...register("assetsToReview")} placeholder="Website, sales page, pitch deck..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Decision-Making & Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 7: Decision-Making & Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary point of contact? *</Label>
              <Input id="primaryContact" {...register("primaryContact")} placeholder="Name and role" />
              {errors.primaryContact && <p className="text-sm text-destructive">{errors.primaryContact.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="communicationPreference">Preferred communication method?</Label>
              <Input id="communicationPreference" {...register("communicationPreference")} placeholder="Slack, email, calls..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="decisionMaker">Are you the final decision-maker?</Label>
            <Input id="decisionMaker" {...register("decisionMaker")} placeholder="Yes, or list others involved..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idealCollaboration">What does your ideal collaboration look like?</Label>
            <Textarea id="idealCollaboration" {...register("idealCollaboration")} placeholder="How you prefer to work together..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Readiness & Expectations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 8: Readiness & Expectations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTimeline">When would you like to get started?</Label>
              <Input id="startTimeline" {...register("startTimeline")} placeholder="e.g., Immediately, Next month" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetTimeline">Do you have a set budget or timeline?</Label>
              <Input id="budgetTimeline" {...register("budgetTimeline")} placeholder="Budget range or deadline" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Anything else you want us to know?</Label>
            <Textarea id="additionalNotes" {...register("additionalNotes")} placeholder="Additional context, goals, or expectations..." rows={4} />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={saving} size="lg">
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
      </div>
    </form>
  );
};
