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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Megaphone, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  // Section 1: Contact Info
  primaryContactName: z.string().min(1, "Contact name is required"),
  businessName: z.string().min(1, "Brand name is required"),
  emailAddress: z.string().email("Valid email is required"),
  websiteOrSocial: z.string().min(1, "Website/social page is required"),
  targetLocations: z.string().min(1, "Amazon marketplace selection is required"),

  // Section 2: Goals
  primaryCampaignGoal: z.string().min(1, "Primary goal selection is required"),
  expectedResultsTimeline: z.string().min(1, "Outcome description is required"),

  // Section 3: Products
  productsList: z.string().min(1, "Product list with links/ASINs/SKUs is required"),
  productsToAdvertise: z.string().min(1, "Products to advertise first is required"),
  topPriorityProducts: z.string().min(1, "Top priority products list is required"),
  productsLiveStatus: z.enum(["Yes", "No", "Some are live and some are not"], {
    required_error: "Please select whether products are live",
  }),

  // Section 4: Budget
  monthlyBudgetRange: z.string().min(1, "Monthly budget is required"),
  dailyBudget: z.string().min(1, "Daily budget is required"),
  startStrategy: z.enum(["Slow and careful", "Balanced", "Fast and aggressive"], {
    required_error: "Please select how you want to start",
  }),

  // Section 5: Pricing and Inventory
  mainProductPrice: z.string().min(1, "Selling price is required"),
  stockEstimate: z.string().min(1, "Stock estimate is required"),
  lowStockStatus: z.enum(["Yes", "No", "Not sure"], {
    required_error: "Please select low stock status",
  }),

  // Section 6: Keywords and Competitors
  suggestedKeywords: z.string().min(1, "Suggested keywords are required"),
  mainCompetitors: z.string().min(1, "Main competitors description is required"),

  // Section 7: Product Positioning
  differentiationStrategy: z.string().min(1, "Product differentiator details are required"),
  idealCustomer: z.string().min(1, "Ideal customer description is required"),

  // Section 8: Final Notes
  runningPromotions: z.enum(["Yes", "No", "Not sure"], {
    required_error: "Please select running promotions status",
  }),
  additionalNotes: z.string().min(1, "Please provide final notes or write 'None'"),

  // Confirmation
  confirmedAccurate: z.boolean().refine(val => val === true, "You must confirm the information is accurate"),
});

type FormData = z.infer<typeof formSchema>;

interface AmazonAdsOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

const marketplaceOptions = [
  { id: "United States", label: "United States" },
  { id: "Canada", label: "Canada" },
  { id: "United Kingdom", label: "United Kingdom" },
  { id: "Europe", label: "Europe" },
  { id: "Other", label: "Other" },
];

const mainGoalOptions = [
  { id: "Get my first sales", label: "Get my first sales" },
  { id: "Launch a new product", label: "Launch a new product" },
  { id: "Grow sales", label: "Grow sales" },
  { id: "Show up in Amazon search results", label: "Show up in Amazon search results" },
  { id: "Build brand awareness", label: "Build brand awareness" },
  { id: "Clear inventory", label: "Clear inventory" },
  { id: "Other", label: "Other" },
];

const startOptions = [
  { id: "Slow and careful", label: "Slow and careful" },
  { id: "Balanced", label: "Balanced" },
  { id: "Fast and aggressive", label: "Fast and aggressive" },
];

const stockOptions = [
  { id: "Yes", label: "Yes" },
  { id: "No", label: "No" },
  { id: "Not sure", label: "Not sure" },
];

const liveOptions = [
  { id: "Yes", label: "Yes" },
  { id: "No", label: "No" },
  { id: "Some are live and some are not", label: "Some are live and some are not" },
];

export const AmazonAdsOnboardingForm = ({ clientProfileId, onComplete, initialData }: AmazonAdsOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, getValues, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      primaryContactName: initialData.primary_contact_name || "",
      emailAddress: initialData.email_address || "",
      websiteOrSocial: initialData.website_or_social_page || "",
      targetLocations: initialData.target_locations || "",
      primaryCampaignGoal: initialData.primary_campaign_goal || "",
      expectedResultsTimeline: initialData.expected_results_timeline || "",
      productsList: initialData.products_list_asin_sku || "",
      productsToAdvertise: initialData.products_to_advertise_first || "",
      topPriorityProducts: initialData.top_priority_products || "",
      productsLiveStatus: initialData.are_products_live_on_amazon || undefined,
      monthlyBudgetRange: initialData.monthly_budget_range || "",
      dailyBudget: initialData.daily_budget || "",
      startStrategy: initialData.how_do_you_want_to_start || undefined,
      mainProductPrice: initialData.selling_price_of_main_product || "",
      stockEstimate: initialData.units_in_stock || "",
      lowStockStatus: initialData.products_low_on_stock || undefined,
      suggestedKeywords: initialData.suggested_search_keywords || "",
      mainCompetitors: initialData.main_competitors || "",
      differentiationStrategy: initialData.differentiation_strategy || "",
      idealCustomer: initialData.ideal_customer || "",
      runningPromotions: initialData.running_coupons_or_promotions || undefined,
      additionalNotes: initialData.anything_important_to_know || "",
      confirmedAccurate: initialData.confirmed_accurate || false,
    } : {
      confirmedAccurate: false,
    },
  });

  const liveStatusVal = watch("productsLiveStatus");
  const startStrategyVal = watch("startStrategy");
  const lowStockStatusVal = watch("lowStockStatus");
  const runningPromotionsVal = watch("runningPromotions");

  const saveDraftData = async (isSubmit = false, formData?: FormData) => {
    const values = formData || getValues();
    
    // Map standard fields to columns, and put everything in additional_notes as JSON
    const snakeCaseResponse: Record<string, any> = {
      website_or_social_page: values.websiteOrSocial,
      products_list_asin_sku: values.productsList,
      products_to_advertise_first: values.productsToAdvertise,
      top_priority_products: values.topPriorityProducts,
      are_products_live_on_amazon: values.productsLiveStatus,
      daily_budget: values.dailyBudget,
      how_do_you_want_to_start: values.startStrategy,
      selling_price_of_main_product: values.mainProductPrice,
      units_in_stock: values.stockEstimate,
      products_low_on_stock: values.lowStockStatus,
      suggested_search_keywords: values.suggestedKeywords,
      running_coupons_or_promotions: values.runningPromotions,
      anything_important_to_know: values.additionalNotes,
    };

    const advertisingData = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      client_profile_id: clientProfileId,
      business_name: values.businessName || null,
      primary_contact_name: values.primaryContactName || null,
      email_address: values.emailAddress || null,
      selected_channels: ["amazon"],
      primary_campaign_goal: values.primaryCampaignGoal || null,
      monthly_budget_range: values.monthlyBudgetRange || null,
      target_locations: values.targetLocations || null,
      expected_results_timeline: values.expectedResultsTimeline || null,
      differentiation_strategy: values.differentiationStrategy || null,
      target_demographics: values.idealCustomer || null,
      main_competitors: values.mainCompetitors || null,
      additional_notes: JSON.stringify(snakeCaseResponse),
      confirmed_accurate: values.confirmedAccurate || false,
      completed_at: isSubmit ? new Date().toISOString() : (initialData?.completed_at || null),
    };

    const { error } = await supabase
      .from("onboarding_advertising")
      .upsert(advertisingData as any);

    if (error) throw error;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      await saveDraftData(false);
      toast.success("Draft saved successfully!");
    } catch (error: any) {
      console.error("Error saving draft:", error);
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

      await saveDraftData(true, data);
      toast.success("Amazon Ads onboarding completed successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error submitting onboarding:", error);
      toast.error(error.message || "Failed to submit onboarding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Intro Card */}
      <Card className="border-yellow-500/20 bg-yellow-50/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Megaphone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle>New Amazon Ads Client Intake Form</CardTitle>
              <CardDescription>
                Please fill this out as best you can. If you are not sure about an answer, just write "Not sure".
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This form helps us understand your products, goals, and budget so we can plan your Amazon advertising the right way.
          </p>
        </CardContent>
      </Card>

      {/* Section 1: Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 1: Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryContactName">Your name *</Label>
              <Input id="primaryContactName" {...register("primaryContactName")} placeholder="Your name" />
              {errors.primaryContactName && <p className="text-sm text-destructive">{errors.primaryContactName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Brand name *</Label>
              <Input id="businessName" {...register("businessName")} placeholder="Brand name" />
              {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailAddress">Best email address *</Label>
              <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="your@email.com" />
              {errors.emailAddress && <p className="text-sm text-destructive">{errors.emailAddress.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteOrSocial">Website or social media page *</Label>
              <Input id="websiteOrSocial" {...register("websiteOrSocial")} placeholder="https://example.com" />
              {errors.websiteOrSocial && <p className="text-sm text-destructive">{errors.websiteOrSocial.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Which Amazon marketplace are you selling in? *</Label>
            <RadioGroup
              defaultValue={getValues("targetLocations")}
              onValueChange={(value) => setValue("targetLocations", value, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {marketplaceOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`mkt-${opt.id}`} />
                  <Label htmlFor={`mkt-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.targetLocations && <p className="text-sm text-destructive">{errors.targetLocations.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 2: Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>What is your main goal with Amazon ads right now? *</Label>
            <RadioGroup
              defaultValue={getValues("primaryCampaignGoal")}
              onValueChange={(value) => setValue("primaryCampaignGoal", value, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {mainGoalOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`goal-${opt.id}`} />
                  <Label htmlFor={`goal-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.primaryCampaignGoal && <p className="text-sm text-destructive">{errors.primaryCampaignGoal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedResultsTimeline">What would a good result look like in the next 2 to 3 months? (Example: “Get our first 25 sales” or “Increase weekly sales.”) *</Label>
            <Textarea id="expectedResultsTimeline" {...register("expectedResultsTimeline")} placeholder="Describe what success looks like in 2-3 months..." rows={3} />
            {errors.expectedResultsTimeline && <p className="text-sm text-destructive">{errors.expectedResultsTimeline.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 3: Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productsList">Please list each product you want to advertise first, along with its Amazon link, ASIN, and SKU. (Example: Product Name | Amazon Link | ASIN | SKU) *</Label>
            <Textarea id="productsList" {...register("productsList")} placeholder="Product Name | Link | ASIN | SKU" rows={4} />
            {errors.productsList && <p className="text-sm text-destructive">{errors.productsList.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productsToAdvertise">What products do you want to advertise first? (Please list the product names and Amazon links if possible.) *</Label>
            <Textarea id="productsToAdvertise" {...register("productsToAdvertise")} placeholder="List products names and links..." rows={3} />
            {errors.productsToAdvertise && <p className="text-sm text-destructive">{errors.productsToAdvertise.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topPriorityProducts">Which products are your top priority? *</Label>
            <Textarea id="topPriorityProducts" {...register("topPriorityProducts")} placeholder="e.g. Red Water Bottle ASIN: B0XXXXXX" rows={2} />
            {errors.topPriorityProducts && <p className="text-sm text-destructive">{errors.topPriorityProducts.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Are your products already live on Amazon? *</Label>
            <RadioGroup
              value={liveStatusVal}
              onValueChange={(value) => setValue("productsLiveStatus", value as any, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {liveOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`live-${opt.id}`} />
                  <Label htmlFor={`live-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.productsLiveStatus && <p className="text-sm text-destructive">{errors.productsLiveStatus.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 4: Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyBudgetRange">What is your monthly ad budget? (Example: $500, $1,500, or $3,000) *</Label>
            <Input id="monthlyBudgetRange" {...register("monthlyBudgetRange")} placeholder="e.g., $1500" />
            {errors.monthlyBudgetRange && <p className="text-sm text-destructive">{errors.monthlyBudgetRange.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyBudget">What daily budget feels comfortable for you? (Example: $20 per day or $50 per day) *</Label>
            <Input id="dailyBudget" {...register("dailyBudget")} placeholder="e.g., $50" />
            {errors.dailyBudget && <p className="text-sm text-destructive">{errors.dailyBudget.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>How do you want to start? *</Label>
            <RadioGroup
              value={startStrategyVal}
              onValueChange={(value) => setValue("startStrategy", value as any, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {startOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`start-${opt.id}`} />
                  <Label htmlFor={`start-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.startStrategy && <p className="text-sm text-destructive">{errors.startStrategy.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Pricing and Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 5: Pricing and Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mainProductPrice">What is the selling price of your main product? *</Label>
            <Input id="mainProductPrice" {...register("mainProductPrice")} placeholder="e.g. $29.99" />
            {errors.mainProductPrice && <p className="text-sm text-destructive">{errors.mainProductPrice.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockEstimate">About how many units do you currently have in stock? (A rough estimate is fine.) *</Label>
            <Input id="stockEstimate" {...register("stockEstimate")} placeholder="e.g. 500 units" />
            {errors.stockEstimate && <p className="text-sm text-destructive">{errors.stockEstimate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Are any products low on stock right now? *</Label>
            <RadioGroup
              value={lowStockStatusVal}
              onValueChange={(value) => setValue("lowStockStatus", value as any, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {stockOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`stock-${opt.id}`} />
                  <Label htmlFor={`stock-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.lowStockStatus && <p className="text-sm text-destructive">{errors.lowStockStatus.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Keywords and Competitors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 6: Keywords and Competitors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suggestedKeywords">What words do you think customers would type into Amazon to find your product? (Best guesses are okay.) *</Label>
            <Textarea id="suggestedKeywords" {...register("suggestedKeywords")} placeholder="e.g. organic dog treats, healthy puppy snacks..." rows={3} />
            {errors.suggestedKeywords && <p className="text-sm text-destructive">{errors.suggestedKeywords.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainCompetitors">Who are your main competitors on Amazon? (Brand names, Amazon links, or ASINs are all helpful.) *</Label>
            <Textarea id="mainCompetitors" {...register("mainCompetitors")} placeholder="e.g. Brand X, Link to listing Y..." rows={3} />
            {errors.mainCompetitors && <p className="text-sm text-destructive">{errors.mainCompetitors.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Product Positioning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 7: Product Positioning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="differentiationStrategy">What makes your product different or better? *</Label>
            <Textarea id="differentiationStrategy" {...register("differentiationStrategy")} placeholder="Our product is made of premium steel and has a lifetime warranty..." rows={3} />
            {errors.differentiationStrategy && <p className="text-sm text-destructive">{errors.differentiationStrategy.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idealCustomer">Who is the ideal customer for your product? (Example: parents, runners, pet owners, college students) *</Label>
            <Textarea id="idealCustomer" {...register("idealCustomer")} placeholder="e.g. runners, high school athletes..." rows={2} />
            {errors.idealCustomer && <p className="text-sm text-destructive">{errors.idealCustomer.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 8: Final Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Are you running any coupons, discounts, or promotions right now? *</Label>
            <RadioGroup
              value={runningPromotionsVal}
              onValueChange={(value) => setValue("runningPromotions", value as any, { shouldValidate: true })}
              className="flex flex-col space-y-2"
            >
              {stockOptions.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`promo-${opt.id}`} />
                  <Label htmlFor={`promo-${opt.id}`} className="font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.runningPromotions && <p className="text-sm text-destructive">{errors.runningPromotions.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Anything important we should know before we start? *</Label>
            <Textarea id="additionalNotes" {...register("additionalNotes")} placeholder="Write anything else or 'None'..." rows={3} />
            {errors.additionalNotes && <p className="text-sm text-destructive">{errors.additionalNotes.message}</p>}
          </div>

          <div className="flex items-start space-x-2 pt-4 border-t">
            <Checkbox
              id="confirmedAccurate"
              onCheckedChange={(checked) => setValue("confirmedAccurate", checked === true, { shouldValidate: true })}
              defaultChecked={getValues("confirmedAccurate")}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="confirmedAccurate" className="text-sm font-medium cursor-pointer">
                I confirm that the details provided are accurate and complete *
              </Label>
            </div>
          </div>
          {errors.confirmedAccurate && <p className="text-sm text-destructive">{errors.confirmedAccurate.message}</p>}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Draft
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit & Complete Onboarding
        </Button>
      </div>
    </form>
  );
};
