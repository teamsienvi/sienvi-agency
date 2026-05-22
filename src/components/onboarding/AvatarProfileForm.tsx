import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, User, CheckCircle2 } from "lucide-react";

const avatarSchema = z.object({
  name: z.string().min(1, "Avatar name is required"),
  ageRange: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  education: z.string().optional(),
  relationship: z.string().optional(),
  occupation: z.string().optional(),
  goals: z.string().optional(),
  painPoints: z.string().optional(),
  fears: z.string().optional(),
  beliefs: z.string().optional(),
  onlineHangouts: z.string().optional(),
  contentStyle: z.string().optional(),
  objections: z.string().optional(),
  buyingTriggers: z.string().optional(),
  journeyStage: z.string().optional(),
  howTheyFind: z.string().optional(),
  desiredTransformation: z.string().optional(),
});

const formSchema = z.object({
  productsServices: z.string().min(10, "Please describe your products/services"),
  mostImportantAvatar: z.string().optional(),
  mostImportantReason: z.string().optional(),
  existingDataAvailable: z.boolean().default(false),
  customersToAvoid: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type AvatarData = z.infer<typeof avatarSchema>;

interface AvatarProfileFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

export const AvatarProfileForm = ({ clientProfileId, onComplete, initialData }: AvatarProfileFormProps) => {
  const [saving, setSaving] = useState(false);
  const [avatars, setAvatars] = useState<AvatarData[]>(
    initialData?.avatars?.length > 0 
      ? initialData.avatars 
      : [
          { name: "Avatar 1", ageRange: "", gender: "", location: "", education: "", relationship: "", occupation: "", goals: "", painPoints: "", fears: "", beliefs: "", onlineHangouts: "", contentStyle: "", objections: "", buyingTriggers: "", journeyStage: "", howTheyFind: "", desiredTransformation: "" },
          { name: "Avatar 2", ageRange: "", gender: "", location: "", education: "", relationship: "", occupation: "", goals: "", painPoints: "", fears: "", beliefs: "", onlineHangouts: "", contentStyle: "", objections: "", buyingTriggers: "", journeyStage: "", howTheyFind: "", desiredTransformation: "" },
          { name: "Avatar 3", ageRange: "", gender: "", location: "", education: "", relationship: "", occupation: "", goals: "", painPoints: "", fears: "", beliefs: "", onlineHangouts: "", contentStyle: "", objections: "", buyingTriggers: "", journeyStage: "", howTheyFind: "", desiredTransformation: "" },
        ]
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      productsServices: initialData.products_services || "",
      mostImportantAvatar: initialData.most_important_avatar || "",
      mostImportantReason: initialData.most_important_reason || "",
      existingDataAvailable: initialData.existing_data_available || false,
      customersToAvoid: initialData.customers_to_avoid || "",
    } : undefined,
  });

  const existingDataAvailable = watch("existingDataAvailable");

  const updateAvatar = (index: number, field: keyof AvatarData, value: string) => {
    const updated = [...avatars];
    updated[index] = { ...updated[index], [field]: value };
    setAvatars(updated);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const avatarData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        products_services: data.productsServices,
        avatars: avatars.filter(a => a.name.trim()),
        most_important_avatar: data.mostImportantAvatar,
        most_important_reason: data.mostImportantReason,
        existing_data_available: data.existingDataAvailable,
        customers_to_avoid: data.customersToAvoid,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("onboarding_avatars")
        .upsert(avatarData as any);

      if (error) throw error;

      toast.success("Avatar Profile saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving avatar profile:", error);
      toast.error(error.message || "Failed to save avatar profile");
    } finally {
      setSaving(false);
    }
  };

  const renderAvatarFields = (avatar: AvatarData, index: number) => (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="space-y-4">
        <h4 className="font-semibold text-primary border-b pb-2">Demographics</h4>
        <div className="space-y-2">
          <Label>Avatar Name/Label *</Label>
          <Input
            value={avatar.name}
            onChange={(e) => updateAvatar(index, "name", e.target.value)}
            placeholder="e.g., 'Busy Mom', 'Tech Startup Founder'"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Age Range</Label>
            <Input
              value={avatar.ageRange}
              onChange={(e) => updateAvatar(index, "ageRange", e.target.value)}
              placeholder="e.g., 25-35"
            />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Input
              value={avatar.gender}
              onChange={(e) => updateAvatar(index, "gender", e.target.value)}
              placeholder="e.g., Female, Male, All"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={avatar.location}
              onChange={(e) => updateAvatar(index, "location", e.target.value)}
              placeholder="City/State/Country or Remote"
            />
          </div>
          <div className="space-y-2">
            <Label>Education Level</Label>
            <Input
              value={avatar.education}
              onChange={(e) => updateAvatar(index, "education", e.target.value)}
              placeholder="e.g., College Graduate"
            />
          </div>
          <div className="space-y-2">
            <Label>Relationship/Family Status</Label>
            <Input
              value={avatar.relationship}
              onChange={(e) => updateAvatar(index, "relationship", e.target.value)}
              placeholder="e.g., Married with kids"
            />
          </div>
          <div className="space-y-2">
            <Label>Occupation & Income Level</Label>
            <Input
              value={avatar.occupation}
              onChange={(e) => updateAvatar(index, "occupation", e.target.value)}
              placeholder="e.g., Marketing Manager, $80-120k"
            />
          </div>
        </div>
      </div>

      {/* Psychographics */}
      <div className="space-y-4">
        <h4 className="font-semibold text-primary border-b pb-2">Psychographics</h4>
        <div className="space-y-2">
          <Label>What are their biggest goals or aspirations?</Label>
          <Textarea
            value={avatar.goals}
            onChange={(e) => updateAvatar(index, "goals", e.target.value)}
            placeholder="What do they want to achieve?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What problems, frustrations, or pain points are they experiencing?</Label>
          <Textarea
            value={avatar.painPoints}
            onChange={(e) => updateAvatar(index, "painPoints", e.target.value)}
            placeholder="Related to your offer..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What are they afraid of if they don't solve this problem?</Label>
          <Textarea
            value={avatar.fears}
            onChange={(e) => updateAvatar(index, "fears", e.target.value)}
            placeholder="Their fears and concerns..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What do they believe about solving this problem?</Label>
          <Textarea
            value={avatar.beliefs}
            onChange={(e) => updateAvatar(index, "beliefs", e.target.value)}
            placeholder="Right or wrong beliefs..."
            rows={2}
          />
        </div>
      </div>

      {/* Buying Behavior */}
      <div className="space-y-4">
        <h4 className="font-semibold text-primary border-b pb-2">Buying Behavior</h4>
        <div className="space-y-2">
          <Label>Where do they typically hang out online?</Label>
          <Textarea
            value={avatar.onlineHangouts}
            onChange={(e) => updateAvatar(index, "onlineHangouts", e.target.value)}
            placeholder="Social media, websites, podcasts, influencers..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What kind of content or language resonates with them?</Label>
          <Textarea
            value={avatar.contentStyle}
            onChange={(e) => updateAvatar(index, "contentStyle", e.target.value)}
            placeholder="Direct, emotional, funny, data-driven..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What objections or hesitations might they have before buying?</Label>
          <Textarea
            value={avatar.objections}
            onChange={(e) => updateAvatar(index, "objections", e.target.value)}
            placeholder="Common objections..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What would make them say "yes" faster?</Label>
          <Textarea
            value={avatar.buyingTriggers}
            onChange={(e) => updateAvatar(index, "buyingTriggers", e.target.value)}
            placeholder="Buying triggers..."
            rows={2}
          />
        </div>
      </div>

      {/* Customer Journey */}
      <div className="space-y-4">
        <h4 className="font-semibold text-primary border-b pb-2">Customer Journey</h4>
        <div className="space-y-2">
          <Label>Where are they in their journey when they first find you?</Label>
          <Textarea
            value={avatar.journeyStage}
            onChange={(e) => updateAvatar(index, "journeyStage", e.target.value)}
            placeholder="Just researching? Ready to buy? Lost and confused?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>How do they usually find you or your type of business?</Label>
          <Textarea
            value={avatar.howTheyFind}
            onChange={(e) => updateAvatar(index, "howTheyFind", e.target.value)}
            placeholder="Referral, search, ads, social..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>What transformation or outcome do they want most?</Label>
          <Textarea
            value={avatar.desiredTransformation}
            onChange={(e) => updateAvatar(index, "desiredTransformation", e.target.value)}
            placeholder="Their ideal end result..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Customer Avatar Profile</CardTitle>
              <CardDescription>
                Help us understand your ideal customers
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This profile helps us create brand-aligned content, campaigns, and website experiences that speak directly to the people who matter most to your business.
          </p>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overview of Your Audience</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="productsServices">What product(s) or service(s) are you currently selling? *</Label>
            <Textarea
              id="productsServices"
              {...register("productsServices")}
              placeholder="Brief overview of your current offers..."
              rows={3}
            />
            {errors.productsServices && (
              <p className="text-sm text-destructive">{errors.productsServices.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Avatars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Top 3 Customer Avatars</CardTitle>
          <CardDescription>
            Think: your most profitable, most engaged, or most ideal buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="avatar-0" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {avatars.map((avatar, index) => (
                <TabsTrigger key={index} value={`avatar-${index}`}>
                  {avatar.name || `Avatar ${index + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {avatars.map((avatar, index) => (
              <TabsContent key={index} value={`avatar-${index}`}>
                {renderAvatarFields(avatar, index)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mostImportantAvatar">Which avatar is MOST important for your business right now?</Label>
            <Input
              id="mostImportantAvatar"
              {...register("mostImportantAvatar")}
              placeholder="Avatar name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mostImportantReason">Why is this avatar most important?</Label>
            <Textarea
              id="mostImportantReason"
              {...register("mostImportantReason")}
              placeholder="Explain why..."
              rows={2}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="existingDataAvailable"
              checked={existingDataAvailable}
              onCheckedChange={(checked) => setValue("existingDataAvailable", checked as boolean)}
            />
            <Label htmlFor="existingDataAvailable" className="text-sm font-normal">
              I have existing customer data, testimonials, or case studies that reflect these avatars
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customersToAvoid">Are there any customers you want to AVOID attracting?</Label>
            <Textarea
              id="customersToAvoid"
              {...register("customersToAvoid")}
              placeholder="Describe the type of client or customer you don't want..."
              rows={2}
            />
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
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
