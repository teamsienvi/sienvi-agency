import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clipboard, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  // Section 1: Basic Info
  businessName: z.string().min(1, "Business name is required"),
  websiteUrl: z.string().min(1, "Website is required"),
  primaryContactInfo: z.string().min(1, "Contact info is required"),
  bestCommunication: z.string().min(1, "Preferred communication is required"),
  timeZoneAndHours: z.string().min(1, "Time zone and hours are required"),

  // Section 2: Business Snapshot
  businessDescription: z.string().min(1, "Business description is required"),
  mainServices: z.string().min(1, "Main services are required"),
  businessStage: z.string().min(1, "Business stage is required"),

  // Section 3: Goals & Success
  topGoals: z.string().min(1, "Top goals are required"),
  clearWin: z.string().min(1, "Clear win definition is required"),
  measureSuccess: z.string().min(1, "Success measurement is required"),

  // Section 4: Current Bottlenecks
  bottlenecks: z.string().min(1, "Bottlenecks are required"),
  fallingThroughCracks: z.string().min(1, "Tasks falling through cracks are required"),
  helpNext30Days: z.string().min(1, "Help for next 30 days is required"),

  // Section 5: Support Needs
  recurringTasks: z.string().min(1, "Recurring tasks are required"),
  areasToAvoid: z.string().min(1, "Areas to avoid are required"),
  toolsAccess: z.string().min(1, "Tools access is required"),

  // Section 6: Workflow & Approval
  decisionMaker: z.string().min(1, "Decision maker is required"),
  approvalNeeds: z.string().min(1, "Approval needs are required"),
  deadlinesLaunches: z.string().min(1, "Deadlines and launches are required"),

  // Section 7: Brand, Communication & Boundaries
  brandVoice: z.string().min(1, "Brand voice is required"),
  topicsToAvoid: z.string().min(1, "Topics to avoid are required"),
  anythingElse: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConciseOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

const SECTIONS = [
  { id: 0, title: "Basic Info" },
  { id: 1, title: "Business Snapshot" },
  { id: 2, title: "Goals & Success" },
  { id: 3, title: "Current Bottlenecks" },
  { id: 4, title: "Support Needs" },
  { id: 5, title: "Workflow & Approval" },
  { id: 6, title: "Brand & Boundaries" }
];

export const ConciseOnboardingForm = ({ clientProfileId, onComplete, initialData }: ConciseOnboardingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: initialData?.business_name || "",
      websiteUrl: initialData?.additional_notes?.websiteUrl || "",
      primaryContactInfo: initialData?.primary_contact || "",
      bestCommunication: initialData?.communication_preference || "",
      timeZoneAndHours: initialData?.additional_notes?.timeZoneAndHours || "",
      
      businessDescription: initialData?.business_description || "",
      mainServices: initialData?.core_offers || "",
      businessStage: initialData?.additional_notes?.businessStage || "",
      
      topGoals: initialData?.top_3_goals || "",
      clearWin: initialData?.big_win_expectation || "",
      measureSuccess: initialData?.performance_tracking || "",
      
      bottlenecks: initialData?.biggest_challenges || "",
      fallingThroughCracks: initialData?.stuck_areas || "",
      helpNext30Days: initialData?.additional_notes?.helpNext30Days || "",
      
      recurringTasks: initialData?.additional_notes?.recurringTasks || "",
      areasToAvoid: initialData?.additional_notes?.areasToAvoid || "",
      toolsAccess: initialData?.additional_notes?.toolsAccess || "",
      
      decisionMaker: initialData?.decision_maker || "",
      approvalNeeds: initialData?.additional_notes?.approvalNeeds || "",
      deadlinesLaunches: initialData?.planned_launches || "",
      
      brandVoice: initialData?.brand_identity || "",
      topicsToAvoid: initialData?.additional_notes?.topicsToAvoid || "",
      anythingElse: initialData?.additional_notes?.anythingElse || "",
    },
  });

  const getSectionFields = (sectionId: number): (keyof FormValues)[] => {
    switch (sectionId) {
      case 0: return ["businessName", "websiteUrl", "primaryContactInfo", "bestCommunication", "timeZoneAndHours"];
      case 1: return ["businessDescription", "mainServices", "businessStage"];
      case 2: return ["topGoals", "clearWin", "measureSuccess"];
      case 3: return ["bottlenecks", "fallingThroughCracks", "helpNext30Days"];
      case 4: return ["recurringTasks", "areasToAvoid", "toolsAccess"];
      case 5: return ["decisionMaker", "approvalNeeds", "deadlinesLaunches"];
      case 6: return ["brandVoice", "topicsToAvoid", "anythingElse"];
      default: return [];
    }
  };

  const nextSection = async () => {
    const fields = getSectionFields(currentSection);
    const isValid = await form.trigger(fields);
    
    if (isValid) {
      setCurrentSection(prev => Math.min(prev + 1, SECTIONS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        client_profile_id: clientProfileId,
        business_name: values.businessName,
        primary_contact: values.primaryContactInfo,
        communication_preference: values.bestCommunication,
        business_description: values.businessDescription,
        core_offers: values.mainServices,
        top_3_goals: values.topGoals,
        big_win_expectation: values.clearWin,
        performance_tracking: values.measureSuccess,
        biggest_challenges: values.bottlenecks,
        stuck_areas: values.fallingThroughCracks,
        decision_maker: values.decisionMaker,
        planned_launches: values.deadlinesLaunches,
        brand_identity: values.brandVoice,
        
        additional_notes: JSON.stringify({
          // Preserve other additional_notes if any exist outside of this form
          ...(initialData?.additional_notes || {}),
          concise_version: true,
          websiteUrl: values.websiteUrl,
          timeZoneAndHours: values.timeZoneAndHours,
          businessStage: values.businessStage,
          helpNext30Days: values.helpNext30Days,
          recurringTasks: values.recurringTasks,
          areasToAvoid: values.areasToAvoid,
          toolsAccess: values.toolsAccess,
          approvalNeeds: values.approvalNeeds,
          topicsToAvoid: values.topicsToAvoid,
          anythingElse: values.anythingElse,
        }),
        completed_at: new Date().toISOString()
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("onboarding_questionnaire")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("onboarding_questionnaire")
          .insert([payload]);
        if (error) throw error;
      }

      toast.success("Questionnaire submitted successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      toast.error(error.message || "Failed to submit questionnaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="text-center pb-8 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-t-xl">
        <div className="mx-auto bg-primary/10 w-16 h-16 flex items-center justify-center rounded-full mb-4">
          <Clipboard className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Concise Discovery Form</CardTitle>
        <CardDescription className="text-base">
          Help us understand your business quickly so we can get started right away.
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2 px-1">
            <span>Section {currentSection + 1} of {SECTIONS.length}</span>
            <span>{Math.round(((currentSection + 1) / SECTIONS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            {SECTIONS.map((section, idx) => (
              <div 
                key={section.id}
                className={`h-full transition-all duration-300 ${
                  idx < currentSection ? 'bg-primary' : 
                  idx === currentSection ? 'bg-primary/80' : 
                  'bg-transparent'
                }`}
                style={{ width: `${100 / SECTIONS.length}%` }}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-primary border-b pb-2 mb-6">
                {SECTIONS[currentSection].title}
              </h3>

              {currentSection === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What is your business name?</Label>
                    <Input {...form.register("businessName")} placeholder="e.g. Acme Corp" />
                    {form.formState.errors.businessName && <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What is your website URL?</Label>
                    <Input {...form.register("websiteUrl")} placeholder="https://..." />
                    {form.formState.errors.websiteUrl && <p className="text-sm text-destructive">{form.formState.errors.websiteUrl.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Primary contact info (Name & Role)</Label>
                    <Input {...form.register("primaryContactInfo")} placeholder="e.g. Jane Doe, CEO" />
                    {form.formState.errors.primaryContactInfo && <p className="text-sm text-destructive">{form.formState.errors.primaryContactInfo.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What is the best way to communicate with you?</Label>
                    <p className="text-sm text-muted-foreground">Email, WhatsApp, Slack, text, other?</p>
                    <Input {...form.register("bestCommunication")} />
                    {form.formState.errors.bestCommunication && <p className="text-sm text-destructive">{form.formState.errors.bestCommunication.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What time zone are you in, and what are your usual working hours?</Label>
                    <Input {...form.register("timeZoneAndHours")} placeholder="e.g. EST, 9am - 5pm" />
                    {form.formState.errors.timeZoneAndHours && <p className="text-sm text-destructive">{form.formState.errors.timeZoneAndHours.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Briefly describe what your business does and who you serve.</Label>
                    <Textarea {...form.register("businessDescription")} className="min-h-[100px]" />
                    {form.formState.errors.businessDescription && <p className="text-sm text-destructive">{form.formState.errors.businessDescription.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What are your main services, offers, or revenue streams?</Label>
                    <Textarea {...form.register("mainServices")} className="min-h-[100px]" />
                    {form.formState.errors.mainServices && <p className="text-sm text-destructive">{form.formState.errors.mainServices.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What stage is your business currently in?</Label>
                    <p className="text-sm text-muted-foreground">Starting, growing, scaling, overwhelmed, restructuring, other?</p>
                    <Input {...form.register("businessStage")} />
                    {form.formState.errors.businessStage && <p className="text-sm text-destructive">{form.formState.errors.businessStage.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What are your top 1–3 goals for the next 3–6 months?</Label>
                    <Textarea {...form.register("topGoals")} className="min-h-[100px]" />
                    {form.formState.errors.topGoals && <p className="text-sm text-destructive">{form.formState.errors.topGoals.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What would make this partnership a clear win for you?</Label>
                    <Textarea {...form.register("clearWin")} className="min-h-[100px]" />
                    {form.formState.errors.clearWin && <p className="text-sm text-destructive">{form.formState.errors.clearWin.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">How should we measure success?</Label>
                    <p className="text-sm text-muted-foreground">Examples: time saved, leads followed up, tasks completed, revenue, response time, fewer missed details.</p>
                    <Textarea {...form.register("measureSuccess")} className="min-h-[100px]" />
                    {form.formState.errors.measureSuccess && <p className="text-sm text-destructive">{form.formState.errors.measureSuccess.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What is currently taking too much of your time or slowing the business down?</Label>
                    <Textarea {...form.register("bottlenecks")} className="min-h-[100px]" />
                    {form.formState.errors.bottlenecks && <p className="text-sm text-destructive">{form.formState.errors.bottlenecks.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What tasks are falling through the cracks right now?</Label>
                    <Textarea {...form.register("fallingThroughCracks")} className="min-h-[100px]" />
                    {form.formState.errors.fallingThroughCracks && <p className="text-sm text-destructive">{form.formState.errors.fallingThroughCracks.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What do you want help with first in the next 7–30 days?</Label>
                    <Textarea {...form.register("helpNext30Days")} className="min-h-[100px]" />
                    {form.formState.errors.helpNext30Days && <p className="text-sm text-destructive">{form.formState.errors.helpNext30Days.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What recurring tasks do you want us to handle?</Label>
                    <Textarea {...form.register("recurringTasks")} className="min-h-[100px]" />
                    {form.formState.errors.recurringTasks && <p className="text-sm text-destructive">{form.formState.errors.recurringTasks.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Are there any tasks, decisions, or areas you do not want us to touch?</Label>
                    <Textarea {...form.register("areasToAvoid")} className="min-h-[100px]" />
                    {form.formState.errors.areasToAvoid && <p className="text-sm text-destructive">{form.formState.errors.areasToAvoid.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What tools, platforms, files, or links will we need access to?</Label>
                    <Textarea {...form.register("toolsAccess")} className="min-h-[100px]" />
                    {form.formState.errors.toolsAccess && <p className="text-sm text-destructive">{form.formState.errors.toolsAccess.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Who makes final decisions and approves work?</Label>
                    <Input {...form.register("decisionMaker")} />
                    {form.formState.errors.decisionMaker && <p className="text-sm text-destructive">{form.formState.errors.decisionMaker.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">What needs your approval before we send, publish, submit, or change anything?</Label>
                    <Textarea {...form.register("approvalNeeds")} className="min-h-[100px]" />
                    {form.formState.errors.approvalNeeds && <p className="text-sm text-destructive">{form.formState.errors.approvalNeeds.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Are there any important deadlines, upcoming launches, meetings, or urgent fires we should know about?</Label>
                    <Textarea {...form.register("deadlinesLaunches")} className="min-h-[100px]" />
                    {form.formState.errors.deadlinesLaunches && <p className="text-sm text-destructive">{form.formState.errors.deadlinesLaunches.message}</p>}
                  </div>
                </div>
              )}

              {currentSection === 6 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">How should your business sound when communicating with clients or customers?</Label>
                    <p className="text-sm text-muted-foreground">Professional, warm, casual, direct, luxury, playful, other?</p>
                    <Input {...form.register("brandVoice")} />
                    {form.formState.errors.brandVoice && <p className="text-sm text-destructive">{form.formState.errors.brandVoice.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Are there any phrases, topics, clients, or situations we should avoid?</Label>
                    <Textarea {...form.register("topicsToAvoid")} className="min-h-[100px]" />
                    {form.formState.errors.topicsToAvoid && <p className="text-sm text-destructive">{form.formState.errors.topicsToAvoid.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Is there anything else that would make working together easier, smoother, or more effective?</Label>
                    <Textarea {...form.register("anythingElse")} className="min-h-[100px]" />
                    {form.formState.errors.anythingElse && <p className="text-sm text-destructive">{form.formState.errors.anythingElse.message}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center pt-8 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevSection}
              disabled={currentSection === 0 || isSubmitting}
              className="w-32"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentSection < SECTIONS.length - 1 ? (
              <Button type="button" onClick={nextSection} className="w-32" disabled={isSubmitting}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="w-40 bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Submit form
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
