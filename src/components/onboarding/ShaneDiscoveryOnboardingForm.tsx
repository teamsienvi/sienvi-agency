import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clipboard, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  top3Outcomes: z.string().min(5, "Please provide your top three business outcomes."),
  rebrandTimeline: z.string().min(5, "Please provide the timeline for the rebrand, formulas, packaging, and website."),
  preRebrandWork: z.string().min(5, "Please share what work would be valuable to start early."),
  targetSegment: z.string().min(5, "Please specify your target segment."),
  proofAssets: z.string().min(5, "Please detail the proof assets that can be used."),
  currentNumbers: z.string().optional(),
  valuableToOwn: z.string().min(5, "Please rank what would be most valuable for Sienvi to own."),
  oneProblem90Days: z.string().min(5, "Please answer the closing question."),
});

type FormData = z.infer<typeof formSchema>;

interface ShaneDiscoveryOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

export const ShaneDiscoveryOnboardingForm = ({ clientProfileId, onComplete, initialData }: ShaneDiscoveryOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      top3Outcomes: initialData.top3Outcomes || "",
      rebrandTimeline: initialData.rebrandTimeline || "",
      preRebrandWork: initialData.preRebrandWork || "",
      targetSegment: initialData.targetSegment || "",
      proofAssets: initialData.proofAssets || "",
      currentNumbers: initialData.currentNumbers || "",
      valuableToOwn: initialData.valuableToOwn || "",
      oneProblem90Days: initialData.oneProblem90Days || "",
    } : {},
  });

  const buildPayload = (data: Partial<FormData>, isDraft: boolean) => {
    const enrichedNotes = { ...data };

    return {
      ...(initialData?.id ? { id: initialData.id } : {}),
      client_profile_id: clientProfileId,
      additional_notes: JSON.stringify(enrichedNotes),
      completed_at: isDraft ? null : new Date().toISOString(),
    };
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const values = getValues();
      const payload = buildPayload(values, true);
      
      const { error } = await supabase
        .from("onboarding_questionnaire")
        .upsert(payload as any, { onConflict: "client_profile_id" });

      if (error) throw error;
      toast.success("Draft saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = buildPayload(data, false);
      
      const { error } = await supabase
        .from("onboarding_questionnaire")
        .upsert(payload as any, { onConflict: "client_profile_id" });

      if (error) throw error;
      toast.success("Discovery Questionnaire completed successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit questionnaire");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card className="border-emerald-500/20 bg-emerald-50/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clipboard className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Shane Follow-Up Questions</CardTitle>
              <CardDescription>
                Help us identify where Sienvi Agency can create the most value outside of Amazon, while Piranha owns Amazon operations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Off-Amazon Services and Scaling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-3">
            <Label htmlFor="top3Outcomes" className="text-base font-semibold">1. What are the top three business outcomes you want to achieve over the next 12 months? *</Label>
            <p className="text-sm text-slate-500">Examples: DTC growth, rebrand launch, customer acquisition, content engine, subscription growth, investor readiness, team sales expansion, automation, reporting.</p>
            <Textarea id="top3Outcomes" {...register("top3Outcomes")} rows={3} />
            {errors.top3Outcomes && <p className="text-xs text-destructive">{errors.top3Outcomes.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="rebrandTimeline" className="text-base font-semibold">2. What is the current timeline for the rebrand, upgraded formulas, packaging, and new website? *</Label>
            <Textarea id="rebrandTimeline" {...register("rebrandTimeline")} rows={2} />
            {errors.rebrandTimeline && <p className="text-xs text-destructive">{errors.rebrandTimeline.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="preRebrandWork" className="text-base font-semibold">3. What work would be valuable to start before the rebrand is fully live? *</Label>
            <p className="text-sm text-slate-500">Examples: positioning, customer journey, content strategy, website structure, data setup, automation, dashboard planning, audience testing.</p>
            <Textarea id="preRebrandWork" {...register("preRebrandWork")} rows={3} />
            {errors.preRebrandWork && <p className="text-xs text-destructive">{errors.preRebrandWork.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="targetSegment" className="text-base font-semibold">4. Outside of pro athletes and teams, which customer segment should the new brand target first? *</Label>
            <p className="text-sm text-slate-500">Examples: serious amateur athletes, executives, founders, high-performers, military/tactical communities, golfers, students, wellness consumers, gamers, or another segment.</p>
            <Textarea id="targetSegment" {...register("targetSegment")} rows={3} />
            {errors.targetSegment && <p className="text-xs text-destructive">{errors.targetSegment.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="proofAssets" className="text-base font-semibold">5. Which athlete, team, military, or customer proof assets can be used publicly after the rebrand? *</Label>
            <p className="text-sm text-slate-500">Examples: names, testimonials, photos, videos, stories, case studies, interviews, reviews, team references, or anonymous proof.</p>
            <Textarea id="proofAssets" {...register("proofAssets")} rows={3} />
            {errors.proofAssets && <p className="text-xs text-destructive">{errors.proofAssets.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="currentNumbers" className="text-base font-semibold">6. What current numbers should we understand before recommending a scaling plan?</Label>
            <p className="text-sm text-slate-500">Please share whatever is available: Average order value, Repeat-purchase rate, Subscription percentage, Customer lifetime value (if known), Monthly website traffic, Email/SMS list size, Current monthly DTC revenue, Current monthly team/pro sports revenue, Current conversion rate, Budget available for a 90-day test.</p>
            <Textarea id="currentNumbers" {...register("currentNumbers")} rows={4} />
            {errors.currentNumbers && <p className="text-xs text-destructive">{errors.currentNumbers.message}</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="valuableToOwn" className="text-base font-semibold">7. What would be most valuable for Sienvi Agency to own outside of Amazon? *</Label>
            <p className="text-sm text-slate-500">Please rank the most relevant options: Off-Amazon growth strategy, Website and conversion support, Content strategy and production, Paid traffic testing outside Amazon, Email/SMS retention, Affiliate/ambassador/athlete activation, Dashboards and reporting, AI agents and automation, Company operating system/source of truth, Cross-channel coordination with Piranha, Fractional growth and technology support.</p>
            <Textarea id="valuableToOwn" {...register("valuableToOwn")} rows={4} />
            {errors.valuableToOwn && <p className="text-xs text-destructive">{errors.valuableToOwn.message}</p>}
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Closing Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="oneProblem90Days" className="text-base font-semibold">If we could solve only one problem for you in the next 90 days, what should it be? *</Label>
            <Textarea id="oneProblem90Days" {...register("oneProblem90Days")} rows={3} />
            {errors.oneProblem90Days && <p className="text-xs text-destructive">{errors.oneProblem90Days.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 sticky bottom-4 p-4 bg-white/80 backdrop-blur-md rounded-xl border shadow-sm z-10">
        <Button 
          type="button" 
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saving}
          className="bg-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Draft
        </Button>
        
        <Button 
          type="submit" 
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Submit Questionnaire
        </Button>
      </div>
    </form>
  );
};
