import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Target, CheckCircle2 } from "lucide-react";

const actionPlanSchema = z.object({
  actionItem: z.string().min(1, "Action item is required"),
  responsiblePerson: z.string().optional(),
  deadline: z.string().optional(),
  resourcesNeeded: z.string().optional(),
});

const obstacleSchema = z.object({
  obstacle: z.string().min(1, "Obstacle description is required"),
  solution: z.string().optional(),
});

const goalSheetSchema = z.object({
  primaryGoal: z.string().min(10, "Please describe your primary goal (at least 10 characters)"),
  specificWhat: z.string().min(10, "Please provide a detailed description"),
  specificWho: z.string().optional(),
  specificWhere: z.string().optional(),
  specificWhy: z.string().min(10, "Please explain why this goal is important"),
  specificGoalSummary: z.string().optional(),
  measurableMetrics: z.string().min(5, "Please describe how you'll measure progress"),
  measurableTarget: z.string().min(1, "Please define your quantifiable target"),
  measurableGoalSummary: z.string().optional(),
  achievableRealistic: z.string().min(10, "Please evaluate if the goal is realistic"),
  achievableSteps: z.string().min(10, "Please list the steps needed"),
  achievableGoalSummary: z.string().optional(),
  relevantAlignment: z.string().min(10, "Please explain how this aligns with your objectives"),
  relevantWorthwhile: z.string().min(10, "Please explain why this goal is worthwhile"),
  relevantGoalSummary: z.string().optional(),
  timeboundDeadline: z.string().min(1, "Please set a deadline"),
  timeboundMilestones: z.string().min(5, "Please define milestones"),
  timeboundGoalSummary: z.string().optional(),
  goalNarrative: z.string().min(50, "Please provide a comprehensive goal summary (at least 50 characters)"),
});

type GoalSheetFormData = z.infer<typeof goalSheetSchema>;

interface ActionPlan {
  actionItem: string;
  responsiblePerson: string;
  deadline: string;
  resourcesNeeded: string;
}

interface Obstacle {
  obstacle: string;
  solution: string;
}

interface GoalSheetFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

export const GoalSheetForm = ({ clientProfileId, onComplete, initialData }: GoalSheetFormProps) => {
  const [saving, setSaving] = useState(false);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(
    initialData?.action_plan || [{ actionItem: "", responsiblePerson: "", deadline: "", resourcesNeeded: "" }]
  );
  const [obstacles, setObstacles] = useState<Obstacle[]>(
    initialData?.obstacles_solutions || [{ obstacle: "", solution: "" }]
  );

  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<GoalSheetFormData>({
    resolver: zodResolver(goalSheetSchema),
    defaultValues: initialData ? {
      primaryGoal: initialData.primary_goal || "",
      specificWhat: initialData.specific_what || "",
      specificWho: initialData.specific_who || "",
      specificWhere: initialData.specific_where || "",
      specificWhy: initialData.specific_why || "",
      specificGoalSummary: initialData.specific_goal_summary || "",
      measurableMetrics: initialData.measurable_metrics || "",
      measurableTarget: initialData.measurable_target || "",
      measurableGoalSummary: initialData.measurable_goal_summary || "",
      achievableRealistic: initialData.achievable_realistic || "",
      achievableSteps: initialData.achievable_steps || "",
      achievableGoalSummary: initialData.achievable_goal_summary || "",
      relevantAlignment: initialData.relevant_alignment || "",
      relevantWorthwhile: initialData.relevant_worthwhile || "",
      relevantGoalSummary: initialData.relevant_goal_summary || "",
      timeboundDeadline: initialData.timebound_deadline || "",
      timeboundMilestones: initialData.timebound_milestones || "",
      timeboundGoalSummary: initialData.timebound_goal_summary || "",
      goalNarrative: initialData.goal_narrative || "",
    } : undefined,
  });

  const addActionPlan = () => {
    setActionPlans([...actionPlans, { actionItem: "", responsiblePerson: "", deadline: "", resourcesNeeded: "" }]);
  };

  const removeActionPlan = (index: number) => {
    if (actionPlans.length > 1) {
      setActionPlans(actionPlans.filter((_, i) => i !== index));
    }
  };

  const updateActionPlan = (index: number, field: keyof ActionPlan, value: string) => {
    const updated = [...actionPlans];
    updated[index][field] = value;
    setActionPlans(updated);
  };

  const addObstacle = () => {
    setObstacles([...obstacles, { obstacle: "", solution: "" }]);
  };

  const removeObstacle = (index: number) => {
    if (obstacles.length > 1) {
      setObstacles(obstacles.filter((_, i) => i !== index));
    }
  };

  const updateObstacle = (index: number, field: keyof Obstacle, value: string) => {
    const updated = [...obstacles];
    updated[index][field] = value;
    setObstacles(updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const values = getValues();

      const goalData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        primary_goal: values.primaryGoal || null,
        specific_what: values.specificWhat || null,
        specific_who: values.specificWho || null,
        specific_where: values.specificWhere || null,
        specific_why: values.specificWhy || null,
        specific_goal_summary: values.specificGoalSummary || null,
        measurable_metrics: values.measurableMetrics || null,
        measurable_target: values.measurableTarget || null,
        measurable_goal_summary: values.measurableGoalSummary || null,
        achievable_realistic: values.achievableRealistic || null,
        achievable_steps: values.achievableSteps || null,
        achievable_goal_summary: values.achievableGoalSummary || null,
        relevant_alignment: values.relevantAlignment || null,
        relevant_worthwhile: values.relevantWorthwhile || null,
        relevant_goal_summary: values.relevantGoalSummary || null,
        timebound_deadline: values.timeboundDeadline || null,
        timebound_milestones: values.timeboundMilestones || null,
        timebound_goal_summary: values.timeboundGoalSummary || null,
        goal_narrative: values.goalNarrative || null,
        action_plan: actionPlans.filter(a => a.actionItem.trim()),
        obstacles_solutions: obstacles.filter(o => o.obstacle.trim()),
        completed_at: null,
      };

      const { error } = await supabase
        .from("onboarding_goals")
        .upsert(goalData as any);

      if (error) throw error;

      toast.success("Draft saved successfully!");
    } catch (error: any) {
      console.error("Error saving goal sheet draft:", error);
      toast.error(error.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: GoalSheetFormData) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const goalData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        primary_goal: data.primaryGoal,
        specific_what: data.specificWhat,
        specific_who: data.specificWho,
        specific_where: data.specificWhere,
        specific_why: data.specificWhy,
        specific_goal_summary: data.specificGoalSummary,
        measurable_metrics: data.measurableMetrics,
        measurable_target: data.measurableTarget,
        measurable_goal_summary: data.measurableGoalSummary,
        achievable_realistic: data.achievableRealistic,
        achievable_steps: data.achievableSteps,
        achievable_goal_summary: data.achievableGoalSummary,
        relevant_alignment: data.relevantAlignment,
        relevant_worthwhile: data.relevantWorthwhile,
        relevant_goal_summary: data.relevantGoalSummary,
        timebound_deadline: data.timeboundDeadline,
        timebound_milestones: data.timeboundMilestones,
        timebound_goal_summary: data.timeboundGoalSummary,
        goal_narrative: data.goalNarrative,
        action_plan: actionPlans.filter(a => a.actionItem.trim()),
        obstacles_solutions: obstacles.filter(o => o.obstacle.trim()),
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("onboarding_goals")
        .upsert(goalData as any);

      if (error) throw error;

      toast.success("Goal Sheet saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving goal sheet:", error);
      toast.error(error.message || "Failed to save goal sheet");
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
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>SMART Goals Sheet</CardTitle>
              <CardDescription>
                Define clear, actionable goals using the SMART framework
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This worksheet helps you set goals that are <strong>Specific</strong>, <strong>Measurable</strong>, <strong>Achievable</strong>, <strong>Relevant</strong>, and <strong>Time-bound</strong>. 
            Take approximately 30-60 minutes to complete this thoughtfully.
          </p>
        </CardContent>
      </Card>

      {/* Goal Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Identification</CardTitle>
          <CardDescription>What is the main objective you want to achieve?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="primaryGoal">Describe Your Primary Goal *</Label>
            <Textarea
              id="primaryGoal"
              {...register("primaryGoal")}
              placeholder="e.g., Increase monthly sales by 20% through improved marketing automation"
              rows={3}
            />
            {errors.primaryGoal && (
              <p className="text-sm text-destructive">{errors.primaryGoal.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specific */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">S</span>
            Specific
          </CardTitle>
          <CardDescription>What exactly do you want to achieve?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specificWhat">What exactly do you want to achieve? *</Label>
            <Textarea id="specificWhat" {...register("specificWhat")} placeholder="Provide a clear, detailed description..." rows={3} />
            {errors.specificWhat && <p className="text-sm text-destructive">{errors.specificWhat.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specificWho">Who is involved?</Label>
              <Input id="specificWho" {...register("specificWho")} placeholder="People or organizations..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specificWhere">Where will this be achieved?</Label>
              <Input id="specificWhere" {...register("specificWhere")} placeholder="Location or context..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specificWhy">Why is this goal important? *</Label>
            <Textarea id="specificWhy" {...register("specificWhy")} placeholder="Purpose and benefits..." rows={2} />
            {errors.specificWhy && <p className="text-sm text-destructive">{errors.specificWhy.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="specificGoalSummary">Your Specific Goal Summary</Label>
            <Textarea id="specificGoalSummary" {...register("specificGoalSummary")} placeholder="Summarize your specific goal..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Measurable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">M</span>
            Measurable
          </CardTitle>
          <CardDescription>How will you track progress?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="measurableMetrics">How will you measure progress? *</Label>
            <Textarea id="measurableMetrics" {...register("measurableMetrics")} placeholder="Metrics or indicators of success..." rows={2} />
            {errors.measurableMetrics && <p className="text-sm text-destructive">{errors.measurableMetrics.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="measurableTarget">What is the quantifiable outcome? *</Label>
            <Input id="measurableTarget" {...register("measurableTarget")} placeholder="e.g., 20% increase, 100 new customers..." />
            {errors.measurableTarget && <p className="text-sm text-destructive">{errors.measurableTarget.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="measurableGoalSummary">Your Measurable Goal Summary</Label>
            <Textarea id="measurableGoalSummary" {...register("measurableGoalSummary")} placeholder="Summarize..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Achievable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">A</span>
            Achievable
          </CardTitle>
          <CardDescription>Is this goal realistic?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="achievableRealistic">Is the goal realistic? *</Label>
            <Textarea id="achievableRealistic" {...register("achievableRealistic")} placeholder="Evaluate your resources and constraints..." rows={2} />
            {errors.achievableRealistic && <p className="text-sm text-destructive">{errors.achievableRealistic.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="achievableSteps">What steps are necessary? *</Label>
            <Textarea id="achievableSteps" {...register("achievableSteps")} placeholder="List specific actions required..." rows={3} />
            {errors.achievableSteps && <p className="text-sm text-destructive">{errors.achievableSteps.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="achievableGoalSummary">Your Achievable Goal Summary</Label>
            <Textarea id="achievableGoalSummary" {...register("achievableGoalSummary")} placeholder="Summarize..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Relevant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">R</span>
            Relevant
          </CardTitle>
          <CardDescription>Does this align with your broader objectives?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relevantAlignment">Does this goal align with your broader objectives? *</Label>
            <Textarea id="relevantAlignment" {...register("relevantAlignment")} placeholder="Connect to your long-term plans..." rows={2} />
            {errors.relevantAlignment && <p className="text-sm text-destructive">{errors.relevantAlignment.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="relevantWorthwhile">Why is it worthwhile? *</Label>
            <Textarea id="relevantWorthwhile" {...register("relevantWorthwhile")} placeholder="Connect to your values, vision, or mission..." rows={2} />
            {errors.relevantWorthwhile && <p className="text-sm text-destructive">{errors.relevantWorthwhile.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="relevantGoalSummary">Your Relevant Goal Summary</Label>
            <Textarea id="relevantGoalSummary" {...register("relevantGoalSummary")} placeholder="Summarize..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Time-bound */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">T</span>
            Time-bound
          </CardTitle>
          <CardDescription>What's your deadline?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeboundDeadline">What is the deadline for achieving this goal? *</Label>
            <Input id="timeboundDeadline" {...register("timeboundDeadline")} placeholder="e.g., December 31, 2024" />
            {errors.timeboundDeadline && <p className="text-sm text-destructive">{errors.timeboundDeadline.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeboundMilestones">What milestones will you set? *</Label>
            <Textarea id="timeboundMilestones" {...register("timeboundMilestones")} placeholder="Break down into smaller steps..." rows={2} />
            {errors.timeboundMilestones && <p className="text-sm text-destructive">{errors.timeboundMilestones.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeboundGoalSummary">Your Time-bound Goal Summary</Label>
            <Textarea id="timeboundGoalSummary" {...register("timeboundGoalSummary")} placeholder="Summarize..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Goal Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Summary (Narrative Format)</CardTitle>
          <CardDescription>Summarize your complete SMART goal in a concise paragraph</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="goalNarrative">Your Complete Goal Summary *</Label>
            <Textarea
              id="goalNarrative"
              {...register("goalNarrative")}
              placeholder="Write a clear summary addressing each SMART criterion..."
              rows={5}
            />
            {errors.goalNarrative && <p className="text-sm text-destructive">{errors.goalNarrative.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Action Plan</CardTitle>
          <CardDescription>Outline each step required to achieve your goal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionPlans.map((plan, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Step {index + 1}</Label>
                {actionPlans.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeActionPlan(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-sm">Action Item</Label>
                  <Input
                    value={plan.actionItem}
                    onChange={(e) => updateActionPlan(index, "actionItem", e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>
                <div>
                  <Label className="text-sm">Responsible Person</Label>
                  <Input
                    value={plan.responsiblePerson}
                    onChange={(e) => updateActionPlan(index, "responsiblePerson", e.target.value)}
                    placeholder="Who is responsible?"
                  />
                </div>
                <div>
                  <Label className="text-sm">Deadline</Label>
                  <Input
                    value={plan.deadline}
                    onChange={(e) => updateActionPlan(index, "deadline", e.target.value)}
                    placeholder="When is it due?"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm">Resources Needed</Label>
                  <Input
                    value={plan.resourcesNeeded}
                    onChange={(e) => updateActionPlan(index, "resourcesNeeded", e.target.value)}
                    placeholder="What resources are required?"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addActionPlan} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Step
          </Button>
        </CardContent>
      </Card>

      {/* Obstacles and Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Potential Obstacles and Solutions</CardTitle>
          <CardDescription>Anticipate challenges and plan how to overcome them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {obstacles.map((obs, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Obstacle {index + 1}</Label>
                {obstacles.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeObstacle(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Describe the Obstacle</Label>
                  <Textarea
                    value={obs.obstacle}
                    onChange={(e) => updateObstacle(index, "obstacle", e.target.value)}
                    placeholder="What obstacle do you anticipate?"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm">Possible Solution</Label>
                  <Textarea
                    value={obs.solution}
                    onChange={(e) => updateObstacle(index, "solution", e.target.value)}
                    placeholder="How will you overcome it?"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addObstacle} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Obstacle
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          size="lg" 
          disabled={saving} 
          onClick={handleSaveDraft}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Draft"
          )}
        </Button>
        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
