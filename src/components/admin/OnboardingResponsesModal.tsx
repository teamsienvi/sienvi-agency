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
import { Loader2, Target, User, ClipboardList, CheckCircle2, Clock, ShoppingBag, Megaphone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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

      setGoals(goalsRes.data);
      setAvatars(avatarsRes.data);
      setQuestionnaire(questionnaireRes.data);
      setAmazon(amazonRes.data);
      setAdvertising(advertisingRes.data);

      if (profileRes.data) {
        const services = profileRes.data.selected_services || [];
        const plan = profileRes.data.plan;
        if (services.includes("amazon-design") || plan === "amazon") {
          setOnboardingType("amazon");
        } else if (services.includes("advertising-package") || services.some((s: string) => s.startsWith("channel-")) || plan === "advertising") {
          setOnboardingType("advertising");
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
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Onboarding Responses - {clientName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue={onboardingType === "amazon" ? "amazon" : "goals"} className="w-full">
            <TabsList className={`grid w-full ${onboardingType === "amazon" ? "grid-cols-1" : "grid-cols-3"}`}>
              {onboardingType === "amazon" ? (
                <TabsTrigger value="amazon" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Amazon Listing Design
                  {renderStatus(amazon)}
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
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
