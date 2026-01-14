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
import { Loader2, Target, User, ClipboardList, CheckCircle2, Clock } from "lucide-react";
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

  useEffect(() => {
    if (open && clientId) {
      fetchOnboardingData();
    }
  }, [open, clientId]);

  const fetchOnboardingData = async () => {
    setLoading(true);
    try {
      const [goalsRes, avatarsRes, questionnaireRes] = await Promise.all([
        supabase.from("onboarding_goals").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_avatars").select("*").eq("client_profile_id", clientId).maybeSingle(),
        supabase.from("onboarding_questionnaire").select("*").eq("client_profile_id", clientId).maybeSingle(),
      ]);

      setGoals(goalsRes.data);
      setAvatars(avatarsRes.data);
      setQuestionnaire(questionnaireRes.data);
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
          <Tabs defaultValue="goals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
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
              <TabsTrigger value="questionnaire" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Questionnaire
                {renderStatus(questionnaire)}
              </TabsTrigger>
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
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
