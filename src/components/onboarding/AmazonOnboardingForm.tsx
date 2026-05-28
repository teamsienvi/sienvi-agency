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
import { Loader2, ShoppingBag, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  // Section 1: Business & Brand Information
  businessName: z.string().min(1, "Business name is required"),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  emailAddress: z.string().email("Valid email is required"),
  sellerAccountType: z.enum(["seller_central", "vendor_central"]),
  targetMarketplaces: z.array(z.string()).min(1, "Select at least one marketplace"),
  
  // Section 2: Product Overview
  productName: z.string().min(1, "Product name is required"),
  productCategory: z.string().min(1, "Product category is required"),
  asin: z.string().optional(),
  productStatus: z.enum(["new", "existing"]),
  productVariations: z.string().optional(),
  
  // Section 3: Product Details
  productDescription: z.string().min(10, "Please provide a description"),
  keyFeatures: z.string().min(5, "Please list key features"),
  top3Benefits: z.string().min(5, "Please list top 3 benefits"),
  problemSolved: z.string().min(5, "What problem does this product solve?"),
  materialsSpecs: z.string().optional(),
  dimensionsWeight: z.string().optional(),
  
  // Section 4: Target Customer
  idealCustomer: z.string().min(5, "Describe your ideal customer"),
  customerPainPoints: z.string().optional(),
  desiredOutcome: z.string().optional(),
  customerObjections: z.string().optional(),
  
  // Section 5: Brand Voice & Positioning
  brandVoice: z.string().min(1, "Select your brand voice"),
  brandVoiceOther: z.string().optional(),
  brandsAdmired: z.string().optional(),
  wordsToAssociate: z.string().optional(),
  wordsToAvoid: z.string().optional(),
  
  // Section 6: Visual Style Preferences
  hasBrandGuidelines: z.boolean().default(false),
  preferredColors: z.string().optional(),
  preferredFonts: z.string().optional(),
  stylePreference: z.string().optional(),
  exampleListings: z.string().optional(),
  
  // Section 7: Competitors & Market Research
  competitorAsins: z.string().optional(),
  competitorLikes: z.string().optional(),
  competitorDislikes: z.string().optional(),
  
  // Section 8: Image & Creative Direction
  featuresToHighlight: z.string().optional(),
  mandatoryClaims: z.string().optional(),
  complianceRestrictions: z.string().optional(),
  imageStylesToAvoid: z.string().optional(),
  
  // Section 9: Video Ad Preferences
  videoPrimaryGoal: z.string().optional(),
  videoMessaging: z.string().optional(),
  videoTone: z.string().optional(),
  videoExamples: z.string().optional(),
  
  // Section 11: Approvals & Final Notes
  workApprover: z.string().optional(),
  turnaroundPreference: z.string().optional(),
  additionalNotes: z.string().optional(),
  
  // Section 12: Confirmation
  confirmedAccurate: z.boolean().refine(val => val === true, "You must confirm the information is accurate"),
});

type FormData = z.infer<typeof formSchema>;

interface AmazonOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

const marketplaceOptions = [
  { id: "usa", label: "USA" },
  { id: "canada", label: "Canada" },
  { id: "uk", label: "UK" },
  { id: "eu", label: "EU" },
  { id: "other", label: "Other" },
];

const brandVoiceOptions = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "bold", label: "Bold" },
  { id: "premium", label: "Premium" },
  { id: "minimal", label: "Minimal" },
  { id: "other", label: "Other" },
];

const styleOptions = [
  { id: "clean_minimal", label: "Clean / Minimal" },
  { id: "bold_high_contrast", label: "Bold / High Contrast" },
  { id: "lifestyle_focused", label: "Lifestyle Focused" },
  { id: "technical_detailed", label: "Technical / Detailed" },
];

export const AmazonOnboardingForm = ({ clientProfileId, onComplete, initialData }: AmazonOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      primaryContactName: initialData.primary_contact_name || "",
      emailAddress: initialData.email_address || "",
      sellerAccountType: initialData.seller_account_type || "seller_central",
      targetMarketplaces: initialData.target_marketplaces || [],
      productName: initialData.product_name || "",
      productCategory: initialData.product_category || "",
      asin: initialData.asin || "",
      productStatus: initialData.product_status || "new",
      productVariations: initialData.product_variations || "",
      productDescription: initialData.product_description || "",
      keyFeatures: initialData.key_features || "",
      top3Benefits: initialData.top_3_benefits || "",
      problemSolved: initialData.problem_solved || "",
      materialsSpecs: initialData.materials_specs || "",
      dimensionsWeight: initialData.dimensions_weight || "",
      idealCustomer: initialData.ideal_customer || "",
      customerPainPoints: initialData.customer_pain_points || "",
      desiredOutcome: initialData.desired_outcome || "",
      customerObjections: initialData.customer_objections || "",
      brandVoice: initialData.brand_voice || "professional",
      brandVoiceOther: initialData.brand_voice_other || "",
      brandsAdmired: initialData.brands_admired || "",
      wordsToAssociate: initialData.words_to_associate || "",
      wordsToAvoid: initialData.words_to_avoid || "",
      hasBrandGuidelines: initialData.has_brand_guidelines || false,
      preferredColors: initialData.preferred_colors || "",
      preferredFonts: initialData.preferred_fonts || "",
      stylePreference: initialData.style_preference || "",
      exampleListings: initialData.example_listings || "",
      competitorAsins: initialData.competitor_asins || "",
      competitorLikes: initialData.competitor_likes || "",
      competitorDislikes: initialData.competitor_dislikes || "",
      featuresToHighlight: initialData.features_to_highlight || "",
      mandatoryClaims: initialData.mandatory_claims || "",
      complianceRestrictions: initialData.compliance_restrictions || "",
      imageStylesToAvoid: initialData.image_styles_to_avoid || "",
      videoPrimaryGoal: initialData.video_primary_goal || "",
      videoMessaging: initialData.video_messaging || "",
      videoTone: initialData.video_tone || "",
      videoExamples: initialData.video_examples || "",
      workApprover: initialData.work_approver || "",
      turnaroundPreference: initialData.turnaround_preference || "",
      additionalNotes: initialData.additional_notes || "",
      confirmedAccurate: initialData.confirmed_accurate || false,
    } : {
      sellerAccountType: "seller_central",
      productStatus: "new",
      brandVoice: "professional",
      targetMarketplaces: [],
      hasBrandGuidelines: false,
      confirmedAccurate: false,
    },
  });

  const selectedMarketplaces = watch("targetMarketplaces") || [];
  const brandVoice = watch("brandVoice");

  const toggleMarketplace = (marketplace: string) => {
    const current = selectedMarketplaces;
    const updated = current.includes(marketplace)
      ? current.filter(m => m !== marketplace)
      : [...current, marketplace];
    setValue("targetMarketplaces", updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const values = getValues();

      const amazonData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        business_name: values.businessName || null,
        primary_contact_name: values.primaryContactName || null,
        email_address: values.emailAddress || null,
        seller_account_type: values.sellerAccountType || null,
        target_marketplaces: values.targetMarketplaces || null,
        product_name: values.productName || null,
        product_category: values.productCategory || null,
        asin: values.asin || null,
        product_status: values.productStatus || null,
        product_variations: values.productVariations || null,
        product_description: values.productDescription || null,
        key_features: values.keyFeatures || null,
        top_3_benefits: values.top3Benefits || null,
        problem_solved: values.problemSolved || null,
        materials_specs: values.materialsSpecs || null,
        dimensions_weight: values.dimensionsWeight || null,
        ideal_customer: values.idealCustomer || null,
        customer_pain_points: values.customerPainPoints || null,
        desired_outcome: values.desiredOutcome || null,
        customer_objections: values.customerObjections || null,
        brand_voice: values.brandVoice || null,
        brand_voice_other: values.brandVoiceOther || null,
        brands_admired: values.brandsAdmired || null,
        words_to_associate: values.wordsToAssociate || null,
        words_to_avoid: values.wordsToAvoid || null,
        has_brand_guidelines: values.hasBrandGuidelines || false,
        preferred_colors: values.preferredColors || null,
        preferred_fonts: values.preferredFonts || null,
        style_preference: values.stylePreference || null,
        example_listings: values.exampleListings || null,
        competitor_asins: values.competitorAsins || null,
        competitor_likes: values.competitorLikes || null,
        competitor_dislikes: values.competitorDislikes || null,
        features_to_highlight: values.featuresToHighlight || null,
        mandatory_claims: values.mandatoryClaims || null,
        compliance_restrictions: values.complianceRestrictions || null,
        image_styles_to_avoid: values.imageStylesToAvoid || null,
        video_primary_goal: values.videoPrimaryGoal || null,
        video_messaging: values.videoMessaging || null,
        video_tone: values.videoTone || null,
        video_examples: values.videoExamples || null,
        work_approver: values.workApprover || null,
        turnaround_preference: values.turnaroundPreference || null,
        additional_notes: values.additionalNotes || null,
        confirmed_accurate: values.confirmedAccurate || false,
        completed_at: null,
      };

      const { error } = await supabase
        .from("onboarding_amazon")
        .upsert(amazonData as any);

      if (error) throw error;

      toast.success("Draft saved successfully!");
    } catch (error: any) {
      console.error("Error saving Amazon draft:", error);
      toast.error(error.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const amazonData = {
        ...(initialData?.id ? { id: initialData.id } : {}),
        client_profile_id: clientProfileId,
        business_name: data.businessName,
        primary_contact_name: data.primaryContactName,
        email_address: data.emailAddress,
        seller_account_type: data.sellerAccountType,
        target_marketplaces: data.targetMarketplaces,
        product_name: data.productName,
        product_category: data.productCategory,
        asin: data.asin,
        product_status: data.productStatus,
        product_variations: data.productVariations,
        product_description: data.productDescription,
        key_features: data.keyFeatures,
        top_3_benefits: data.top3Benefits,
        problem_solved: data.problemSolved,
        materials_specs: data.materialsSpecs,
        dimensions_weight: data.dimensionsWeight,
        ideal_customer: data.idealCustomer,
        customer_pain_points: data.customerPainPoints,
        desired_outcome: data.desiredOutcome,
        customer_objections: data.customerObjections,
        brand_voice: data.brandVoice,
        brand_voice_other: data.brandVoiceOther,
        brands_admired: data.brandsAdmired,
        words_to_associate: data.wordsToAssociate,
        words_to_avoid: data.wordsToAvoid,
        has_brand_guidelines: data.hasBrandGuidelines,
        preferred_colors: data.preferredColors,
        preferred_fonts: data.preferredFonts,
        style_preference: data.stylePreference,
        example_listings: data.exampleListings,
        competitor_asins: data.competitorAsins,
        competitor_likes: data.competitorLikes,
        competitor_dislikes: data.competitorDislikes,
        features_to_highlight: data.featuresToHighlight,
        mandatory_claims: data.mandatoryClaims,
        compliance_restrictions: data.complianceRestrictions,
        image_styles_to_avoid: data.imageStylesToAvoid,
        video_primary_goal: data.videoPrimaryGoal,
        video_messaging: data.videoMessaging,
        video_tone: data.videoTone,
        video_examples: data.videoExamples,
        work_approver: data.workApprover,
        turnaround_preference: data.turnaroundPreference,
        additional_notes: data.additionalNotes,
        confirmed_accurate: data.confirmedAccurate,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("onboarding_amazon")
        .upsert(amazonData as any);

      if (error) throw error;

      toast.success("Amazon questionnaire saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving Amazon questionnaire:", error);
      toast.error(error.message || "Failed to save questionnaire");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-orange-500/20 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Amazon Listing Design Questionnaire</CardTitle>
              <CardDescription>
                Help us create the perfect Amazon listing for your product
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This questionnaire helps us understand your product, brand, and goals so we can create 
            high-converting Amazon listings that stand out from the competition.
          </p>
        </CardContent>
      </Card>

      {/* Section 1: Business & Brand Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 1: Business & Brand Information</CardTitle>
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
          
          <div className="space-y-2">
            <Label htmlFor="emailAddress">Email Address *</Label>
            <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="your@email.com" />
            {errors.emailAddress && <p className="text-sm text-destructive">{errors.emailAddress.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Amazon Seller Account Type *</Label>
            <RadioGroup
              defaultValue={initialData?.seller_account_type || "seller_central"}
              onValueChange={(value) => setValue("sellerAccountType", value as "seller_central" | "vendor_central")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seller_central" id="seller_central" />
                <Label htmlFor="seller_central">Seller Central</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendor_central" id="vendor_central" />
                <Label htmlFor="vendor_central">Vendor Central</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Target Marketplace(s) *</Label>
            <div className="flex flex-wrap gap-3">
              {marketplaceOptions.map((marketplace) => (
                <div key={marketplace.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`marketplace-${marketplace.id}`}
                    checked={selectedMarketplaces.includes(marketplace.id)}
                    onCheckedChange={() => toggleMarketplace(marketplace.id)}
                  />
                  <Label htmlFor={`marketplace-${marketplace.id}`}>{marketplace.label}</Label>
                </div>
              ))}
            </div>
            {errors.targetMarketplaces && <p className="text-sm text-destructive">{errors.targetMarketplaces.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Product Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 2: Product Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input id="productName" {...register("productName")} placeholder="Working name is fine" />
              {errors.productName && <p className="text-sm text-destructive">{errors.productName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">Product Category *</Label>
              <Input id="productCategory" {...register("productCategory")} placeholder="e.g., Kitchen, Beauty" />
              {errors.productCategory && <p className="text-sm text-destructive">{errors.productCategory.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asin">ASIN (if live)</Label>
              <Input id="asin" {...register("asin")} placeholder="B0XXXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Is this a new product or existing listing? *</Label>
              <RadioGroup
                defaultValue={initialData?.product_status || "new"}
                onValueChange={(value) => setValue("productStatus", value as "new" | "existing")}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="product_new" />
                    <Label htmlFor="product_new">New</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="product_existing" />
                    <Label htmlFor="product_existing">Existing</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productVariations">Product Variations</Label>
            <Textarea id="productVariations" {...register("productVariations")} placeholder="Size, color, bundle options..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Product Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 3: Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productDescription">Brief Description of Your Product *</Label>
            <Textarea id="productDescription" {...register("productDescription")} placeholder="What is your product?" rows={3} />
            {errors.productDescription && <p className="text-sm text-destructive">{errors.productDescription.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyFeatures">Key Features *</Label>
            <Textarea id="keyFeatures" {...register("keyFeatures")} placeholder="List all key features..." rows={3} />
            {errors.keyFeatures && <p className="text-sm text-destructive">{errors.keyFeatures.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="top3Benefits">Top 3 Benefits Your Customer Cares About Most *</Label>
            <Textarea id="top3Benefits" {...register("top3Benefits")} placeholder="1. ...\n2. ...\n3. ..." rows={3} />
            {errors.top3Benefits && <p className="text-sm text-destructive">{errors.top3Benefits.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="problemSolved">What Problem Does This Product Solve? *</Label>
            <Textarea id="problemSolved" {...register("problemSolved")} placeholder="The main problem your product addresses..." rows={2} />
            {errors.problemSolved && <p className="text-sm text-destructive">{errors.problemSolved.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materialsSpecs">Materials, Ingredients, or Technical Specs</Label>
              <Textarea id="materialsSpecs" {...register("materialsSpecs")} placeholder="Technical details..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensionsWeight">Dimensions and Weight</Label>
              <Input id="dimensionsWeight" {...register("dimensionsWeight")} placeholder="e.g., 10x5x3 inches, 2 lbs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Target Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 4: Target Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idealCustomer">Who is Your Ideal Customer? *</Label>
            <Textarea id="idealCustomer" {...register("idealCustomer")} placeholder="Demographics, interests, behaviors..." rows={3} />
            {errors.idealCustomer && <p className="text-sm text-destructive">{errors.idealCustomer.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPainPoints">What Frustrations or Pain Points Do They Have?</Label>
            <Textarea id="customerPainPoints" {...register("customerPainPoints")} placeholder="Customer frustrations..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desiredOutcome">What Outcome Are They Buying This Product For?</Label>
            <Textarea id="desiredOutcome" {...register("desiredOutcome")} placeholder="The transformation they're seeking..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerObjections">Any Objections or Hesitations Customers Might Have?</Label>
            <Textarea id="customerObjections" {...register("customerObjections")} placeholder="Common objections..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Brand Voice & Positioning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 5: Brand Voice & Positioning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>How Would You Describe Your Brand Voice? *</Label>
            <RadioGroup
              defaultValue={initialData?.brand_voice || "professional"}
              onValueChange={(value) => setValue("brandVoice", value)}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {brandVoiceOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`voice-${option.id}`} />
                    <Label htmlFor={`voice-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          {brandVoice === "other" && (
            <div className="space-y-2">
              <Label htmlFor="brandVoiceOther">Please Describe Your Brand Voice</Label>
              <Input id="brandVoiceOther" {...register("brandVoiceOther")} placeholder="Describe your brand voice..." />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="brandsAdmired">Brands You Admire or Want to Be Compared To</Label>
            <Textarea id="brandsAdmired" {...register("brandsAdmired")} placeholder="Brands that inspire you..." rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wordsToAssociate">Words or Phrases You Want Associated With Your Brand</Label>
              <Textarea id="wordsToAssociate" {...register("wordsToAssociate")} placeholder="Keywords to use..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wordsToAvoid">Words or Phrases You Do NOT Want Used</Label>
              <Textarea id="wordsToAvoid" {...register("wordsToAvoid")} placeholder="Words to avoid..." rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Visual Style Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 6: Visual Style Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasBrandGuidelines"
              checked={watch("hasBrandGuidelines")}
              onCheckedChange={(checked) => setValue("hasBrandGuidelines", !!checked)}
            />
            <Label htmlFor="hasBrandGuidelines">I have brand guidelines (please upload separately)</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredColors">Preferred Colors (if any)</Label>
              <Input id="preferredColors" {...register("preferredColors")} placeholder="e.g., Navy blue, Gold" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredFonts">Preferred Fonts (if any)</Label>
              <Input id="preferredFonts" {...register("preferredFonts")} placeholder="e.g., Montserrat, Open Sans" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Style Preference</Label>
            <RadioGroup
              defaultValue={initialData?.style_preference || ""}
              onValueChange={(value) => setValue("stylePreference", value)}
            >
              <div className="grid grid-cols-2 gap-2">
                {styleOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`style-${option.id}`} />
                    <Label htmlFor={`style-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exampleListings">Examples of Amazon Listings You Like (links)</Label>
            <Textarea id="exampleListings" {...register("exampleListings")} placeholder="Paste Amazon listing URLs..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Competitors & Market Research */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 7: Competitors & Market Research</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competitorAsins">Top 3–5 Competitor ASINs or Listing Links</Label>
            <Textarea id="competitorAsins" {...register("competitorAsins")} placeholder="Paste competitor links or ASINs..." rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competitorLikes">What Do You Like About Their Listings?</Label>
              <Textarea id="competitorLikes" {...register("competitorLikes")} placeholder="Things to emulate..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitorDislikes">What Do You Dislike or Want to Avoid?</Label>
              <Textarea id="competitorDislikes" {...register("competitorDislikes")} placeholder="Things to avoid..." rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Image & Creative Direction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 8: Image & Creative Direction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="featuresToHighlight">Are There Specific Features That Must Be Highlighted Visually?</Label>
            <Textarea id="featuresToHighlight" {...register("featuresToHighlight")} placeholder="Must-show features..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mandatoryClaims">Any Mandatory Claims or Certifications to Include?</Label>
            <Textarea id="mandatoryClaims" {...register("mandatoryClaims")} placeholder="FDA approved, organic, etc..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complianceRestrictions">Any Legal or Compliance Restrictions We Should Know About?</Label>
            <Textarea id="complianceRestrictions" {...register("complianceRestrictions")} placeholder="Restrictions to be aware of..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageStylesToAvoid">Any Image Styles or Concepts You Do NOT Want Used?</Label>
            <Textarea id="imageStylesToAvoid" {...register("imageStylesToAvoid")} placeholder="Styles to avoid..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 9: Video Ad Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 9: Video Ad Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Goal of the Videos</Label>
            <RadioGroup
              defaultValue={initialData?.video_primary_goal || ""}
              onValueChange={(value) => setValue("videoPrimaryGoal", value)}
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conversions" id="video_conversions" />
                  <Label htmlFor="video_conversions">Conversions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="brand_awareness" id="video_brand" />
                  <Label htmlFor="video_brand">Brand Awareness</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="education" id="video_education" />
                  <Label htmlFor="video_education">Education</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoMessaging">Any Messaging or Offers to Include?</Label>
            <Textarea id="videoMessaging" {...register("videoMessaging")} placeholder="Key messages for video..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Tone Preference</Label>
            <RadioGroup
              defaultValue={initialData?.video_tone || ""}
              onValueChange={(value) => setValue("videoTone", value)}
            >
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emotional" id="tone_emotional" />
                  <Label htmlFor="tone_emotional">Emotional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="informational" id="tone_informational" />
                  <Label htmlFor="tone_informational">Informational</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fast_paced" id="tone_fast" />
                  <Label htmlFor="tone_fast">Fast-Paced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="calm" id="tone_calm" />
                  <Label htmlFor="tone_calm">Calm</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoExamples">Competitor or Brand Videos You Like (links)</Label>
            <Textarea id="videoExamples" {...register("videoExamples")} placeholder="Paste video URLs..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 11: Approvals & Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 10: Approvals & Final Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workApprover">Who Will Be Approving the Work?</Label>
              <Input id="workApprover" {...register("workApprover")} placeholder="Name and role" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turnaroundPreference">Preferred Turnaround Time for Feedback</Label>
              <Input id="turnaroundPreference" {...register("turnaroundPreference")} placeholder="e.g., 48 hours" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Anything Else We Should Know to Execute This Perfectly?</Label>
            <Textarea id="additionalNotes" {...register("additionalNotes")} placeholder="Any additional information..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Section 12: Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 11: Confirmation</CardTitle>
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
        <Button type="submit" size="lg" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Amazon Questionnaire
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
