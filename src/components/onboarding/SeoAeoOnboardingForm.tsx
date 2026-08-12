import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clipboard, CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  // 1. Business Goals & Search Intent
  businessOutcome: z.string().min(1, "This field is required"),
  prioritizeProducts: z.string().min(1, "This field is required"),
  idealCustomerSearch: z.string().min(1, "This field is required"),
  prospectsSearchComparing: z.string().min(1, "This field is required"),
  prospectsSearchReadyToBuy: z.string().min(1, "This field is required"),

  // 2. Conversion & Existing Organic Performance
  questionsBeforeLead: z.string().min(1, "This field is required"),
  objectionsToStop: z.string().min(1, "This field is required"),
  pagesGenerateLeads: z.string().min(1, "This field is required"),
  pagesShouldGenerate: z.string().min(1, "This field is required"),
  valuableKeywords: z.string().min(1, "This field is required"),

  // 3. Positioning, Proof & Answer Engine Visibility
  avoidKeywords: z.string().min(1, "This field is required"),
  topSearchCompetitors: z.string().min(1, "This field is required"),
  differentiator: z.string().min(1, "This field is required"),
  proofForPages: z.string().min(1, "This field is required"),
  exactQuestionsToAnswer: z.string().min(1, "This field is required"),
  claimsToAvoid: z.string().min(1, "This field is required"),

  // 4. Access, Local SEO, Measurement & Monthly Inputs
  currentAccess: z.string().min(1, "This field is required"),
  localSeoPriorities: z.string().min(1, "This field is required"),
  organicActionsConversions: z.string().min(1, "This field is required"),
  assetsTeamCanProvide: z.string().min(1, "This field is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SeoAeoOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

const SECTIONS = [
  { id: "intent", title: "Business Goals & Search Intent" },
  { id: "conversion", title: "Conversion & Existing Performance" },
  { id: "positioning", title: "Positioning & Visibility" },
  { id: "access", title: "Access, Measurement & Inputs" },
];

export const SeoAeoOnboardingForm = ({ clientProfileId, onComplete, initialData }: SeoAeoOnboardingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessOutcome: initialData?.businessOutcome || "",
      prioritizeProducts: initialData?.prioritizeProducts || "",
      idealCustomerSearch: initialData?.idealCustomerSearch || "",
      prospectsSearchComparing: initialData?.prospectsSearchComparing || "",
      prospectsSearchReadyToBuy: initialData?.prospectsSearchReadyToBuy || "",

      questionsBeforeLead: initialData?.questionsBeforeLead || "",
      objectionsToStop: initialData?.objectionsToStop || "",
      pagesGenerateLeads: initialData?.pagesGenerateLeads || "",
      pagesShouldGenerate: initialData?.pagesShouldGenerate || "",
      valuableKeywords: initialData?.valuableKeywords || "",

      avoidKeywords: initialData?.avoidKeywords || "",
      topSearchCompetitors: initialData?.topSearchCompetitors || "",
      differentiator: initialData?.differentiator || "",
      proofForPages: initialData?.proofForPages || "",
      exactQuestionsToAnswer: initialData?.exactQuestionsToAnswer || "",
      claimsToAvoid: initialData?.claimsToAvoid || "",

      currentAccess: initialData?.currentAccess || "",
      localSeoPriorities: initialData?.localSeoPriorities || "",
      organicActionsConversions: initialData?.organicActionsConversions || "",
      assetsTeamCanProvide: initialData?.assetsTeamCanProvide || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        seo_aeo_version: true,
        businessOutcome: values.businessOutcome,
        prioritizeProducts: values.prioritizeProducts,
        idealCustomerSearch: values.idealCustomerSearch,
        prospectsSearchComparing: values.prospectsSearchComparing,
        prospectsSearchReadyToBuy: values.prospectsSearchReadyToBuy,

        questionsBeforeLead: values.questionsBeforeLead,
        objectionsToStop: values.objectionsToStop,
        pagesGenerateLeads: values.pagesGenerateLeads,
        pagesShouldGenerate: values.pagesShouldGenerate,
        valuableKeywords: values.valuableKeywords,

        avoidKeywords: values.avoidKeywords,
        topSearchCompetitors: values.topSearchCompetitors,
        differentiator: values.differentiator,
        proofForPages: values.proofForPages,
        exactQuestionsToAnswer: values.exactQuestionsToAnswer,
        claimsToAvoid: values.claimsToAvoid,

        currentAccess: values.currentAccess,
        localSeoPriorities: values.localSeoPriorities,
        organicActionsConversions: values.organicActionsConversions,
        assetsTeamCanProvide: values.assetsTeamCanProvide,
      };

      const { data: existingData } = await supabase
        .from("onboarding_questionnaire")
        .select("id, additional_notes")
        .eq("client_profile_id", clientProfileId)
        .maybeSingle();

      let mergedNotes = { ...payload };
      if (existingData?.additional_notes) {
        try {
          const parsedNotes = typeof existingData.additional_notes === "string" 
            ? JSON.parse(existingData.additional_notes) 
            : existingData.additional_notes;
          mergedNotes = { ...parsedNotes, ...payload };
        } catch (e) {
          console.error("Error parsing existing additional_notes", e);
        }
      }

      if (existingData) {
        const { error } = await supabase
          .from("onboarding_questionnaire")
          .update({
            additional_notes: JSON.stringify(mergedNotes),
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("onboarding_questionnaire")
          .insert({
            client_profile_id: clientProfileId,
            additional_notes: JSON.stringify(mergedNotes),
            completed_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      toast.success("SEO/AEO Questionnaire saved successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving questionnaire:", error);
      toast.error(error.message || "Failed to save questionnaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = async () => {
    let fieldsToValidate: any[] = [];
    if (currentSection === 0) {
      fieldsToValidate = ['businessOutcome', 'prioritizeProducts', 'idealCustomerSearch', 'prospectsSearchComparing', 'prospectsSearchReadyToBuy'];
    } else if (currentSection === 1) {
      fieldsToValidate = ['questionsBeforeLead', 'objectionsToStop', 'pagesGenerateLeads', 'pagesShouldGenerate', 'valuableKeywords'];
    } else if (currentSection === 2) {
      fieldsToValidate = ['avoidKeywords', 'topSearchCompetitors', 'differentiator', 'proofForPages', 'exactQuestionsToAnswer', 'claimsToAvoid'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentSection((prev) => Math.min(SECTIONS.length - 1, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error("Please fill in all required fields in this section before continuing.");
    }
  };

  const prevSection = () => {
    setCurrentSection((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderField = (name: keyof FormValues, label: string, placeholder?: string, helpText?: string) => {
    const error = form.formState.errors[name];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="font-semibold text-gray-900 leading-tight">
          {label} <span className="text-red-500">*</span>
        </Label>
        {helpText && <p className="text-sm text-gray-500 mb-2">{helpText}</p>}
        <Textarea
          id={name}
          {...form.register(name)}
          placeholder={placeholder}
          className={`min-h-[100px] sm:min-h-[120px] resize-y bg-white border-gray-200 focus:border-primary focus:ring-primary shadow-sm ${
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
          }`}
        />
        {error && <p className="text-sm text-red-500 font-medium">{error.message}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 sm:pb-24">
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
            <Clipboard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">SEO/AEO-Specific Discovery</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Use this review to align search priorities, customer intent, conversion goals, proof, compliance, measurement, and the inputs needed for ongoing SEO/AEO execution.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur py-3 sm:py-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {SECTIONS.map((section, index) => {
            const isCompleted = currentSection > index;
            const isCurrent = currentSection === index;
            const isLocked = currentSection < index;
            
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  if (currentSection >= index) {
                    setCurrentSection(index);
                  }
                }}
                disabled={isLocked}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all snap-start ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] sm:text-xs">
                    {index + 1}
                  </div>
                )}
                {section.title}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 sm:space-y-8"
          >
            {currentSection === 0 && (
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <div className="bg-white/20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm">1</div>
                    Business Goals & Search Intent
                  </h3>
                </div>
                <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white">
                  {renderField("businessOutcome", "Which specific business outcome should SEO/AEO support first: calls, bookings, quote requests, form submissions, ecommerce sales, demos, local visibility, or authority?")}
                  {renderField("prioritizeProducts", "Which products or services should we prioritize because they are highest-margin, easiest to fulfill, or most strategically important?")}
                  {renderField("idealCustomerSearch", "What does your ideal customer search before they know your brand exists?")}
                  {renderField("prospectsSearchComparing", "What do prospects search when they are comparing providers, prices, locations, reviews, or alternatives?")}
                  {renderField("prospectsSearchReadyToBuy", "What do prospects search when they are ready to buy or book?")}
                </CardContent>
              </Card>
            )}

            {currentSection === 1 && (
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <div className="bg-white/20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm">2</div>
                    Conversion & Existing Organic Performance
                  </h3>
                </div>
                <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white">
                  {renderField("questionsBeforeLead", "What questions do customers repeatedly ask before they become a lead or customer?")}
                  {renderField("objectionsToStop", "What objections stop prospects from converting, and what content would help overcome those objections?")}
                  {renderField("pagesGenerateLeads", "Which pages currently generate leads, calls, bookings, or sales from organic traffic?")}
                  {renderField("pagesShouldGenerate", "Which pages should generate leads but currently do not?")}
                  {renderField("valuableKeywords", "Which keywords, topics, or search queries do you already know are valuable?")}
                </CardContent>
              </Card>
            )}

            {currentSection === 2 && (
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <div className="bg-white/20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm">3</div>
                    Positioning, Proof & Answer Engine Visibility
                  </h3>
                </div>
                <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white">
                  {renderField("avoidKeywords", "Which keywords, topics, or customer types should we avoid because they attract bad-fit leads?")}
                  {renderField("topSearchCompetitors", "Who are your top search competitors: the businesses or websites that appear when customers search your services?")}
                  {renderField("differentiator", "What makes your expertise, process, results, or offer different from competitors in a way searchers would actually care about?")}
                  {renderField("proofForPages", "What proof can we use on SEO/AEO pages: case studies, testimonials, reviews, certifications, before/after results, client wins, photos, videos, guarantees, or data?")}
                  {renderField("exactQuestionsToAnswer", "What exact questions should your brand be the answer for in Google, AI Overviews, ChatGPT-style answer engines, voice search, or featured snippets?")}
                  {renderField("claimsToAvoid", "Are there any claims, topics, guarantees, medical/legal/financial statements, or compliance-sensitive wording we must avoid?")}
                </CardContent>
              </Card>
            )}

            {currentSection === 3 && (
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <div className="bg-white/20 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm">4</div>
                    Access, Local SEO, Measurement & Monthly Inputs
                  </h3>
                </div>
                <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white">
                  {renderField("currentAccess", "Do you currently have access to Google Search Console, GA4, Google Business Profile, CMS/backend, domain/DNS, and past SEO reports?")}
                  {renderField("localSeoPriorities", "If local SEO matters, which cities, neighborhoods, or service areas should we prioritize for ranking and map visibility?")}
                  {renderField("organicActionsConversions", "Which organic-search actions should count as conversions: calls, forms, bookings, purchases, quote requests, email clicks, map directions, downloads, or chats?")}
                  {renderField("assetsTeamCanProvide", "What SEO/AEO assets can your team provide monthly: expert quotes, photos, FAQs, customer stories, reviews, videos, service details, pricing info, or approval feedback?")}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-white sm:bg-transparent border-t sm:border-t-0 border-gray-200 flex items-center justify-between gap-4 z-20">
          {currentSection > 0 ? (
            <Button type="button" variant="outline" onClick={prevSection} className="flex-1 sm:flex-none">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          ) : (
            <div className="flex-1 sm:flex-none" />
          )}

          {currentSection < SECTIONS.length - 1 ? (
            <Button type="button" onClick={nextSection} className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
              Next Section
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {isSubmitting ? "Submitting..." : "Submit Questionnaire"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
