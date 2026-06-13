import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Briefcase, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  // Section 1: Business & Contact Information
  businessName: z.string().min(1, "Business name is required"),
  primaryContactName: z.string().min(1, "Primary contact name is required"),
  roleTitle: z.string().min(1, "Role/Title is required"),
  emailAddress: z.string().email("Valid email is required"),
  phoneWhatsapp: z.string().optional(),
  website: z.string().optional(),
  socialMediaLinks: z.string().optional(),
  locationTimeZone: z.string().min(1, "Location/Time Zone is required"),
  preferredCommunication: z.string().min(1, "Preferred communication is required"),
  preferredMeetingFrequency: z.string().optional(),

  // Section 2: Business Overview
  businessDescription: z.string().min(10, "Please describe your business"),
  industryNiche: z.string().min(1, "Industry/Niche is required"),
  yearsOperating: z.string().optional(),
  primaryServices: z.string().min(5, "Primary services description is required"),
  primaryClients: z.string().min(5, "Primary clients description is required"),
  revenueStreams: z.string().optional(),
  businessStage: z.string().optional(),

  // Section 3: Goals & Success Outcomes
  top3Goals: z.string().min(10, "Please outline your top 3 goals"),
  successfulPartnership: z.string().min(10, "Please describe success in this partnership"),
  specificOutcomes: z.string().min(10, "Please list specific outcomes needed"),
  measureSuccess: z.string().min(10, "Please describe how to measure success"),
  deadlinesPriorities: z.string().optional(),
  longTermVision: z.string().optional(),

  // Section 4: Current Challenges & Bottlenecks
  adminChallenges: z.string().min(10, "Please describe your administrative challenges"),
  personalTimeSinks: z.string().min(10, "Please describe personal time sinks"),
  tasksFallingThroughCracks: z.string().optional(),
  unclearProcesses: z.string().optional(),
  preventionFactors: z.string().optional(),
  pastSupportExperience: z.string().optional(),
  immediateDelegation: z.string().min(10, "Please detail what you want to delegate immediately"),

  // Section 5: Admin Support Needs
  selectedAdminServices: z.array(z.string()).min(1, "Select at least one admin service"),
  highestPriorityTasks: z.string().min(5, "Please list highest priority tasks"),
  recurringTasks: z.string().optional(),
  oneTimeCleanup: z.string().optional(),
  tasksNotToHandle: z.string().optional(),

  // Section 6: Workflow & Operations
  currentWorkflow: z.string().min(10, "Please describe your current workflow"),
  documentedSOPs: z.string().min(1, "SOP status is required"),
  sopStorage: z.string().optional(),
  documentPriority: z.string().optional(),
  taskTrackingMethod: z.string().min(1, "Task tracking method is required"),
  recurringMeetings: z.string().optional(),
  approvalSteps: z.string().optional(),
  decisionMaker: z.string().optional(),

  // Section 7: Tools, Platforms & Access
  selectedTools: z.array(z.string()).optional(),
  toolsToClean: z.string().optional(),
  accessPrepared: z.string().optional(),
  accessMethod: z.string().optional(),
  passwordManager: z.string().optional(),

  // Section 8: Client / Customer Communication
  regularCommunication: z.string().optional(),
  messageTypes: z.string().optional(),
  emailTemplates: z.string().optional(),
  communicationTone: z.string().min(1, "Communication tone is required"),
  phrasesToAvoid: z.string().optional(),
  approvalSituations: z.string().min(5, "Please list approval situations"),
  desiredResponseTime: z.string().optional(),

  // Section 9: Sales, Leads & Follow-Up
  leadSources: z.string().optional(),
  leadTracking: z.string().optional(),
  leadFollowUp: z.string().optional(),
  salesPipeline: z.string().optional(),
  leadCracks: z.string().optional(),
  helpLeadFollowUp: z.string().optional(),
  helpMaterials: z.string().optional(),
  goodLeadCriteria: z.string().optional(),
  avoidClients: z.string().optional(),

  // Section 10: Calendar & Scheduling
  calendarManager: z.string().optional(),
  appointmentTypes: z.string().optional(),
  workingHours: z.string().optional(),
  protectedTimes: z.string().optional(),
  prepMeetings: z.string().optional(),
  meetingNotes: z.string().optional(),
  schedulingLinks: z.string().optional(),
  schedulingPreferences: z.string().optional(),

  // Section 11: Documents, Files & Organization
  fileStorage: z.string().min(1, "Please define where files are stored"),
  fileOrganization: z.string().optional(),
  fileCategories: z.string().optional(),
  newFolderStructure: z.string().optional(),
  repeatedDocuments: z.string().optional(),
  documentFormatting: z.string().optional(),
  namingConventions: z.string().optional(),

  // Section 12: Reporting & Performance Tracking
  numbersTracked: z.string().optional(),
  trackingLocation: z.string().optional(),
  reportsNeeded: z.string().optional(),
  reportRecipients: z.string().optional(),
  reportFrequency: z.string().optional(),
  leadershipOverview: z.string().optional(),

  // Section 13: Finance & Billing Support
  invoiceSupport: z.string().optional(),
  financeTools: z.string().optional(),
  invoiceApprover: z.string().optional(),
  invoiceTemplates: z.string().optional(),
  invoiceFrequency: z.string().optional(),
  overdueHandling: z.string().optional(),
  excludedFinancialTasks: z.string().optional(),

  // Section 14: Team & Vendor Coordination
  teamStructure: z.string().optional(),
  contractorsVendors: z.string().optional(),
  communicationInclusion: z.string().optional(),
  teamTasksCoordination: z.string().optional(),
  taskAssignmentSupport: z.string().optional(),
  internalCommRules: z.string().optional(),

  // Section 15: Brand, Voice & Professional Standards
  brandGuidelines: z.string().optional(),
  brandSound: z.string().min(5, "Please describe how your brand should sound"),
  likedExamples: z.string().optional(),
  dislikedExamples: z.string().optional(),
  standardsMatteredMost: z.string().optional(),
  legalCompliance: z.string().optional(),

  // Section 16: Access, Security & Confidentiality
  systemsAccessNeeded: z.string().min(5, "Please list systems we need access to"),
  accessInviters: z.string().optional(),
  ndaRequired: z.string().optional(),
  restrictedAccess: z.string().optional(),
  twoFactorAuth: z.string().optional(),
  revokingProcess: z.string().optional(),
  privacyRules: z.string().optional(),

  // Section 17: Collaboration & Feedback
  finalDecisionMaker: z.string().min(1, "Please state the final decision-maker"),
  workApprover: z.string().optional(),
  feedbackPreference: z.string().optional(),
  clientFeedbackTurnaround: z.string().optional(),
  agencyFeedbackTurnaround: z.string().optional(),
  urgentRequests: z.string().optional(),
  idealWorkingRelationship: z.string().optional(),
  providerFrustrations: z.string().optional(),

  // Section 18: Priorities & First 30 Days
  firstPriorityFix: z.string().min(5, "Please specify what we should fix first"),
  first7Days: z.string().optional(),
  first30Days: z.string().optional(),
  successIndicator30Days: z.string().min(10, "Please describe 30-day success"),
  immediateFires: z.string().optional(),
  upcomingDeadlines: z.string().optional(),

  // Section 19: Assets & Links
  driveFolder: z.string().optional(),
  pmWorkspace: z.string().optional(),
  crmLogin: z.string().optional(),
  schedulingLink: z.string().optional(),
  websiteLink: z.string().optional(),
  brandAssets: z.string().optional(),
  templatesSOPs: z.string().optional(),
  reportsDashboards: z.string().optional(),
  clientCommTemplates: z.string().optional(),
  otherLinks: z.string().optional(),

  // Section 20: Final Notes
  finalNotes: z.string().optional(),
  outsourcingWorries: z.string().optional(),
  partnershipEase: z.string().optional(),
  boundariesPreferences: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BusinessAdminOnboardingFormProps {
  clientProfileId: string;
  onComplete: () => void;
  initialData?: any;
}

const adminServiceOptions = [
  { id: "inbox_mgmt", label: "Inbox management" },
  { id: "calendar_mgmt", label: "Calendar management" },
  { id: "appt_scheduling", label: "Appointment scheduling" },
  { id: "client_onboarding", label: "Client onboarding" },
  { id: "client_offboarding", label: "Client offboarding" },
  { id: "crm_mgmt", label: "CRM management" },
  { id: "lead_tracking", label: "Lead tracking" },
  { id: "followup_mgmt", label: "Follow-up management" },
  { id: "data_entry", label: "Data entry" },
  { id: "doc_formatting", label: "Document formatting" },
  { id: "file_org", label: "File organization" },
  { id: "sop_creation", label: "SOP creation" },
  { id: "project_mgmt", label: "Project management" },
  { id: "meeting_notes", label: "Meeting notes" },
  { id: "reporting_dashboards", label: "Reporting / dashboards" },
  { id: "invoice_support", label: "Invoice support" },
  { id: "payment_followup", label: "Payment follow-ups" },
  { id: "contract_proposal", label: "Contract / proposal support" },
  { id: "research", label: "Research" },
  { id: "vendor_coord", label: "Vendor coordination" },
  { id: "team_coord", label: "Team coordination" },
  { id: "travel_planning", label: "Travel planning" },
  { id: "personal_exec", label: "Personal executive support" },
];

const toolOptions = [
  { id: "slack", label: "Slack" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "clickup", label: "ClickUp" },
  { id: "asana", label: "Asana" },
  { id: "trello", label: "Trello" },
  { id: "monday", label: "Monday.com" },
  { id: "notion", label: "Notion" },
  { id: "hubspot", label: "HubSpot" },
  { id: "ghl", label: "GoHighLevel" },
  { id: "calendly", label: "Calendly" },
  { id: "drive", label: "Google Drive" },
  { id: "dropbox", label: "Dropbox" },
  { id: "qbo", label: "QuickBooks Online" },
  { id: "stripe", label: "Stripe" },
  { id: "zapier", label: "Zapier" },
  { id: "make", label: "Make (Integromat)" },
];

const steps = [
  { id: "contact_overview", title: "1. Business Info" },
  { id: "goals_challenges", title: "2. Goals & Challenges" },
  { id: "support_workflows", title: "3. Support Needs" },
  { id: "tools_comm", title: "4. Tools & Comm" },
  { id: "details_security", title: "5. Details & Security" },
  { id: "links_finalize", title: "6. Links & Finish" }
];

export const BusinessAdminOnboardingForm = ({ clientProfileId, onComplete, initialData }: BusinessAdminOnboardingFormProps) => {
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      businessName: initialData.business_name || "",
      primaryContactName: initialData.primary_contact_name || "",
      roleTitle: initialData.role_title || "",
      emailAddress: initialData.email_address || "",
      phoneWhatsapp: initialData.phone_whatsapp || "",
      website: initialData.website || "",
      socialMediaLinks: initialData.social_media_links || "",
      locationTimeZone: initialData.location_time_zone || "",
      preferredCommunication: initialData.preferred_communication || "",
      preferredMeetingFrequency: initialData.preferred_meeting_frequency || "",
      businessDescription: initialData.business_description || "",
      industryNiche: initialData.industry_niche || "",
      yearsOperating: initialData.years_operating || "",
      primaryServices: initialData.primary_services || "",
      primaryClients: initialData.primary_clients || "",
      revenueStreams: initialData.revenue_streams || "",
      businessStage: initialData.business_stage || "",
      top3Goals: initialData.top_3_goals || "",
      successfulPartnership: initialData.successful_partnership || "",
      specificOutcomes: initialData.specific_outcomes || "",
      measureSuccess: initialData.measure_success || "",
      deadlinesPriorities: initialData.deadlines_priorities || "",
      longTermVision: initialData.long_term_vision || "",
      adminChallenges: initialData.admin_challenges || "",
      personalTimeSinks: initialData.personal_time_sinks || "",
      tasksFallingThroughCracks: initialData.tasks_falling_through_cracks || "",
      unclearProcesses: initialData.unclear_processes || "",
      preventionFactors: initialData.prevention_factors || "",
      pastSupportExperience: initialData.past_support_experience || "",
      immediateDelegation: initialData.immediate_delegation || "",
      selectedAdminServices: initialData.selected_admin_services || [],
      highestPriorityTasks: initialData.highest_priority_tasks || "",
      recurringTasks: initialData.recurring_tasks || "",
      oneTimeCleanup: initialData.one_time_cleanup || "",
      tasksNotToHandle: initialData.tasks_not_to_handle || "",
      currentWorkflow: initialData.current_workflow || "",
      documentedSOPs: initialData.documented_sops || "",
      sopStorage: initialData.sop_storage || "",
      documentPriority: initialData.document_priority || "",
      taskTrackingMethod: initialData.task_tracking_method || "",
      recurringMeetings: initialData.recurring_meetings || "",
      approvalSteps: initialData.approval_steps || "",
      decisionMaker: initialData.decision_maker || "",
      selectedTools: initialData.selected_tools || [],
      toolsToClean: initialData.tools_to_clean || "",
      accessPrepared: initialData.access_prepared || "",
      accessMethod: initialData.access_method || "",
      passwordManager: initialData.password_manager || "",
      regularCommunication: initialData.regular_communication || "",
      messageTypes: initialData.message_types || "",
      emailTemplates: initialData.email_templates || "",
      communicationTone: initialData.communication_tone || "",
      phrasesToAvoid: initialData.phrases_to_avoid || "",
      approvalSituations: initialData.approval_situations || "",
      desiredResponseTime: initialData.desired_response_time || "",
      leadSources: initialData.lead_sources || "",
      leadTracking: initialData.lead_tracking || "",
      leadFollowUp: initialData.lead_follow_up || "",
      salesPipeline: initialData.sales_pipeline || "",
      leadCracks: initialData.lead_cracks || "",
      helpLeadFollowUp: initialData.help_lead_follow_up || "",
      helpMaterials: initialData.help_materials || "",
      goodLeadCriteria: initialData.good_lead_criteria || "",
      avoidClients: initialData.avoid_clients || "",
      calendarManager: initialData.calendar_manager || "",
      appointmentTypes: initialData.appointment_types || "",
      workingHours: initialData.working_hours || "",
      protectedTimes: initialData.protected_times || "",
      prepMeetings: initialData.prep_meetings || "",
      meetingNotes: initialData.meeting_notes || "",
      schedulingLinks: initialData.scheduling_links || "",
      schedulingPreferences: initialData.scheduling_preferences || "",
      fileStorage: initialData.file_storage || "",
      fileOrganization: initialData.file_organization || "",
      fileCategories: initialData.file_categories || "",
      newFolderStructure: initialData.new_folder_structure || "",
      repeatedDocuments: initialData.repeated_documents || "",
      documentFormatting: initialData.document_formatting || "",
      namingConventions: initialData.naming_conventions || "",
      numbersTracked: initialData.numbers_tracked || "",
      trackingLocation: initialData.tracking_location || "",
      reportsNeeded: initialData.reports_needed || "",
      reportRecipients: initialData.report_recipients || "",
      reportFrequency: initialData.report_frequency || "",
      leadershipOverview: initialData.leadership_overview || "",
      invoiceSupport: initialData.invoice_support || "",
      financeTools: initialData.finance_tools || "",
      invoiceApprover: initialData.invoice_approver || "",
      invoiceTemplates: initialData.invoice_templates || "",
      invoiceFrequency: initialData.invoice_frequency || "",
      overdueHandling: initialData.overdue_handling || "",
      excludedFinancialTasks: initialData.excluded_financial_tasks || "",
      teamStructure: initialData.team_structure || "",
      contractorsVendors: initialData.contractors_vendors || "",
      communicationInclusion: initialData.communication_inclusion || "",
      teamTasksCoordination: initialData.team_tasks_coordination || "",
      taskAssignmentSupport: initialData.task_assignment_support || "",
      internalCommRules: initialData.internal_comm_rules || "",
      brandGuidelines: initialData.brand_guidelines || "",
      brandSound: initialData.brand_sound || "",
      likedExamples: initialData.liked_examples || "",
      dislikedExamples: initialData.disliked_examples || "",
      standardsMatteredMost: initialData.standards_mattered_most || "",
      legalCompliance: initialData.legal_compliance || "",
      systemsAccessNeeded: initialData.systems_access_needed || "",
      accessInviters: initialData.access_inviters || "",
      ndaRequired: initialData.nda_required || "",
      restrictedAccess: initialData.restricted_access || "",
      twoFactorAuth: initialData.two_factor_auth || "",
      revokingProcess: initialData.revoking_process || "",
      privacyRules: initialData.privacy_rules || "",
      finalDecisionMaker: initialData.final_decision_maker || "",
      workApprover: initialData.work_approver || "",
      feedbackPreference: initialData.feedback_preference || "",
      clientFeedbackTurnaround: initialData.client_feedback_turnaround || "",
      agencyFeedbackTurnaround: initialData.agency_feedback_turnaround || "",
      urgentRequests: initialData.urgent_requests || "",
      idealWorkingRelationship: initialData.ideal_working_relationship || "",
      providerFrustrations: initialData.provider_frustrations || "",
      firstPriorityFix: initialData.first_priority_fix || "",
      first7Days: initialData.first_7_days || "",
      first30Days: initialData.first_30_days || "",
      successIndicator30Days: initialData.success_indicator_30_days || "",
      immediateFires: initialData.immediate_fires || "",
      upcomingDeadlines: initialData.upcoming_deadlines || "",
      driveFolder: initialData.drive_folder || "",
      pmWorkspace: initialData.pm_workspace || "",
      crmLogin: initialData.crm_login || "",
      schedulingLink: initialData.scheduling_link || "",
      websiteLink: initialData.website_link || "",
      brandAssets: initialData.brand_assets || "",
      templatesSOPs: initialData.templates_sops || "",
      reportsDashboards: initialData.reports_dashboards || "",
      clientCommTemplates: initialData.client_comm_templates || "",
      otherLinks: initialData.other_links || "",
      finalNotes: initialData.final_notes || "",
      outsourcingWorries: initialData.outsourcing_worries || "",
      partnershipEase: initialData.partnership_ease || "",
      boundariesPreferences: initialData.boundaries_preferences || "",
    } : {
      selectedAdminServices: [],
      selectedTools: [],
    },
  });

  const selectedAdminServices = watch("selectedAdminServices") || [];
  const selectedTools = watch("selectedTools") || [];

  const toggleAdminService = (serviceId: string) => {
    const current = selectedAdminServices;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    setValue("selectedAdminServices", updated);
  };

  const toggleTool = (toolId: string) => {
    const current = selectedTools;
    const updated = current.includes(toolId)
      ? current.filter(id => id !== toolId)
      : [...current, toolId];
    setValue("selectedTools", updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // Stub database save since onboarding_business_admin table does not exist yet.
      // In production, this would make an upsert to the backend.
      const values = getValues();
      console.log("Mock Saving Business Admin draft details:", values);
      toast.success("Draft saved successfully! (Dev Mode)");
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Stub database completion since onboarding_business_admin table does not exist yet.
      console.log("Mock Submitting Business Admin details:", data);
      toast.success("Business Admin questionnaire completed successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete questionnaire");
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  const prevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Introduction Card */}
      <Card className="border-indigo-500/20 bg-indigo-50/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Business Admin Onboarding Questionnaire</CardTitle>
              <CardDescription>
                For Non-Ecommerce & Business Admin Clients. Helps Sienvi support your administrative operations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            This detailed questionnaire helps us understand your business structure, operational bottlenecks, daily tools,
            communication habits, and target goals. Please allow 30–60 minutes to fill this out.
          </p>
        </CardContent>
      </Card>

      {/* Progress Wizard */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-4">
        {steps.map((step, idx) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(idx)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all font-medium ${
              activeStep === idx
                ? "bg-indigo-600 text-white shadow-sm"
                : idx < activeStep
                ? "text-green-600 hover:bg-slate-100"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* STEP 1: BUSINESS & CONTACT INFO */}
            {activeStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 1 & 2: Business Overview & Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input id="businessName" {...register("businessName")} placeholder="Legal and/or operating name" />
                      {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactName">Primary Contact Name *</Label>
                      <Input id="primaryContactName" {...register("primaryContactName")} placeholder="First & Last Name" />
                      {errors.primaryContactName && <p className="text-xs text-destructive">{errors.primaryContactName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleTitle">Role / Title *</Label>
                      <Input id="roleTitle" {...register("roleTitle")} placeholder="Founder, CEO, Ops Manager, etc." />
                      {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailAddress">Email Address *</Label>
                      <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="yourname@domain.com" />
                      {errors.emailAddress && <p className="text-xs text-destructive">{errors.emailAddress.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneWhatsapp">Phone Number / WhatsApp Number</Label>
                      <Input id="phoneWhatsapp" {...register("phoneWhatsapp")} placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Business Website</Label>
                      <Input id="website" {...register("website")} placeholder="https://yourwebsite.com" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationTimeZone">Business Location / Time Zone *</Label>
                      <Input id="locationTimeZone" {...register("locationTimeZone")} placeholder="e.g. New York (EST), London (GMT)" />
                      {errors.locationTimeZone && <p className="text-xs text-destructive">{errors.locationTimeZone.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredCommunication">Preferred Communication Method *</Label>
                      <Input id="preferredCommunication" {...register("preferredCommunication")} placeholder="e.g. Email, Slack, WhatsApp" />
                      {errors.preferredCommunication && <p className="text-xs text-destructive">{errors.preferredCommunication.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="socialMediaLinks">Social Media / LinkedIn Links</Label>
                      <Input id="socialMediaLinks" {...register("socialMediaLinks")} placeholder="LinkedIn page or profile links" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredMeetingFrequency">Preferred Meeting Frequency</Label>
                      <Input id="preferredMeetingFrequency" {...register("preferredMeetingFrequency")} placeholder="e.g. Weekly, Monthly, As-needed" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="businessDescription">How would you describe your business? *</Label>
                    <Textarea id="businessDescription" {...register("businessDescription")} placeholder="What do you do, who do you serve, value proposition..." rows={3} />
                    {errors.businessDescription && <p className="text-xs text-destructive">{errors.businessDescription.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industryNiche">Industry / Niche *</Label>
                      <Input id="industryNiche" {...register("industryNiche")} placeholder="e.g. Consulting, Real Estate, Legal" />
                      {errors.industryNiche && <p className="text-xs text-destructive">{errors.industryNiche.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOperating">How long have you been operating?</Label>
                      <Input id="yearsOperating" {...register("yearsOperating")} placeholder="e.g. 3 years" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryServices">What are your primary services or offers? *</Label>
                    <Textarea id="primaryServices" {...register("primaryServices")} placeholder="List main services, retainers, programs..." rows={2} />
                    {errors.primaryServices && <p className="text-xs text-destructive">{errors.primaryServices.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryClients">Who are your primary clients or customers? *</Label>
                    <Textarea id="primaryClients" {...register("primaryClients")} placeholder="Briefly describe the types of people or businesses you serve..." rows={2} />
                    {errors.primaryClients && <p className="text-xs text-destructive">{errors.primaryClients.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenueStreams">What are your current revenue streams?</Label>
                      <Input id="revenueStreams" {...register("revenueStreams")} placeholder="Retainers, projects, subscriptions, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessStage">What stage is your business currently in?</Label>
                      <Input id="businessStage" {...register("businessStage")} placeholder="Growing, Scaling, Restructuring..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: GOALS & CHALLENGES */}
            {activeStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 3 & 4: Goals, Vision & Challenges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="top3Goals">What are your top 3 business goals for the next 6–12 months? *</Label>
                    <Textarea id="top3Goals" {...register("top3Goals")} placeholder="1. Goal one\n2. Goal two\n3. Goal three" rows={3} />
                    {errors.top3Goals && <p className="text-xs text-destructive">{errors.top3Goals.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="successfulPartnership">What would a successful partnership with Sienvi Agency look like? *</Label>
                    <Textarea id="successfulPartnership" {...register("successfulPartnership")} placeholder="Be specific (e.g. fewer missed follow-ups, clean inbox, organized CRM)..." rows={3} />
                    {errors.successfulPartnership && <p className="text-xs text-destructive">{errors.successfulPartnership.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specificOutcomes">What specific outcomes do you want from business-admin support? *</Label>
                    <Textarea id="specificOutcomes" {...register("specificOutcomes")} placeholder="e.g. save 10 hours/week, manage calendar, organize files..." rows={2} />
                    {errors.specificOutcomes && <p className="text-xs text-destructive">{errors.specificOutcomes.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="measureSuccess">How will we measure success? *</Label>
                    <Textarea id="measureSuccess" {...register("measureSuccess")} placeholder="e.g. task completion rate, fewer overdue emails, inbox zero..." rows={2} />
                    {errors.measureSuccess && <p className="text-xs text-destructive">{errors.measureSuccess.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deadlinesPriorities">Urgent priorities, deadlines, or busy seasons?</Label>
                      <Input id="deadlinesPriorities" {...register("deadlinesPriorities")} placeholder="Launches, seasonal peaks, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longTermVision">Where do you want to be in 3–5 years?</Label>
                      <Input id="longTermVision" {...register("longTermVision")} placeholder="Your scaling vision..." />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="adminChallenges">What are the biggest administrative challenges in your business right now? *</Label>
                    <Textarea id="adminChallenges" {...register("adminChallenges")} placeholder="Describe what feels messy, slow, repetitive, or stressful..." rows={3} />
                    {errors.adminChallenges && <p className="text-xs text-destructive">{errors.adminChallenges.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personalTimeSinks">Where are you personally spending too much time? *</Label>
                    <Textarea id="personalTimeSinks" {...register("personalTimeSinks")} placeholder="e.g. scheduling, client emails, manual data entry..." rows={2} />
                    {errors.personalTimeSinks && <p className="text-xs text-destructive">{errors.personalTimeSinks.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tasksFallingThroughCracks">What tasks are falling through the cracks?</Label>
                      <Input id="tasksFallingThroughCracks" {...register("tasksFallingThroughCracks")} placeholder="e.g. lead follow-up, invoicing..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unclearProcesses">What processes feel unclear or undocumented?</Label>
                      <Input id="unclearProcesses" {...register("unclearProcesses")} placeholder="SOP needs..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preventionFactors">What is preventing your business from operating smoothly?</Label>
                      <Input id="preventionFactors" {...register("preventionFactors")} placeholder="Roadblocks..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pastSupportExperience">Worked with admin support/VAs before? What worked/didn't?</Label>
                      <Input id="pastSupportExperience" {...register("pastSupportExperience")} placeholder="Reflections on previous VAs..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="immediateDelegation">What would you like to stop doing yourself immediately? *</Label>
                    <Textarea id="immediateDelegation" {...register("immediateDelegation")} placeholder="List tasks you want to hand off as soon as possible..." rows={2} />
                    {errors.immediateDelegation && <p className="text-xs text-destructive">{errors.immediateDelegation.message}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: ADMIN NEEDS & WORKFLOW */}
            {activeStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 5 & 6: Support Needs & Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="block mb-2 font-semibold">Which business-admin services do you need help with? *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {adminServiceOptions.map(service => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`srv-${service.id}`}
                            checked={selectedAdminServices.includes(service.id)}
                            onCheckedChange={() => toggleAdminService(service.id)}
                          />
                          <Label htmlFor={`srv-${service.id}`} className="text-xs font-normal cursor-pointer select-none">
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.selectedAdminServices && <p className="text-xs text-destructive">{errors.selectedAdminServices.message}</p>}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="highestPriorityTasks">Which tasks are highest priority right now? *</Label>
                    <Textarea id="highestPriorityTasks" {...register("highestPriorityTasks")} placeholder="List the top 3–5 items..." rows={2} />
                    {errors.highestPriorityTasks && <p className="text-xs text-destructive">{errors.highestPriorityTasks.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringTasks">Which tasks are recurring?</Label>
                      <Input id="recurringTasks" {...register("recurringTasks")} placeholder="Daily, weekly, monthly..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oneTimeCleanup">Which tasks are one-time cleanup projects?</Label>
                      <Input id="oneTimeCleanup" {...register("oneTimeCleanup")} placeholder="Folders setup, file formatting..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tasksNotToHandle">Are there any tasks we should NOT handle?</Label>
                    <Input id="tasksNotToHandle" {...register("tasksNotToHandle")} placeholder="e.g. final financial approvals, client decisions..." />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="currentWorkflow">Describe your current workflow from lead/client inquiry to completed service. *</Label>
                    <Textarea id="currentWorkflow" {...register("currentWorkflow")} placeholder="Walk us through what happens step by step..." rows={3} />
                    {errors.currentWorkflow && <p className="text-xs text-destructive">{errors.currentWorkflow.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Do you have documented SOPs or processes? *</Label>
                      <RadioGroup
                        defaultValue={initialData?.documented_sops || ""}
                        onValueChange={(val) => setValue("documentedSOPs", val)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="sop_yes" />
                          <Label htmlFor="sop_yes" className="text-xs font-normal">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="sop_no" />
                          <Label htmlFor="sop_no" className="text-xs font-normal">No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partially" id="sop_part" />
                          <Label htmlFor="sop_part" className="text-xs font-normal">Partially</Label>
                        </div>
                      </RadioGroup>
                      {errors.documentedSOPs && <p className="text-xs text-destructive">{errors.documentedSOPs.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sopStorage">Where are your SOPs stored?</Label>
                      <Input id="sopStorage" {...register("sopStorage")} placeholder="Google Drive, Notion, Loom, Trainual..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentPriority">What processes need to be documented first?</Label>
                      <Input id="documentPriority" {...register("documentPriority")} placeholder="Inbox guidelines, CRM setup, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taskTrackingMethod">How are tasks currently assigned and tracked? *</Label>
                      <Input id="taskTrackingMethod" {...register("taskTrackingMethod")} placeholder="ClickUp, Asana, Monday, Spreadsheets..." />
                      {errors.taskTrackingMethod && <p className="text-xs text-destructive">{errors.taskTrackingMethod.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringMeetings">Recurring meetings or check-ins?</Label>
                      <Input id="recurringMeetings" {...register("recurringMeetings")} placeholder="Weekly sync, standups..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approvalSteps">Approval steps before completing/sending?</Label>
                      <Input id="approvalSteps" {...register("approvalSteps")} placeholder="e.g. Draft review, client sign-off..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: TOOLS & COMMUNICATION */}
            {activeStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 7, 8 & 9: Tools, Platforms, Communication & Leads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="block mb-2 font-semibold">Which tools does your business currently use? Select all that apply.</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {toolOptions.map(tool => (
                        <div key={tool.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tool-${tool.id}`}
                            checked={selectedTools.includes(tool.id)}
                            onCheckedChange={() => toggleTool(tool.id)}
                          />
                          <Label htmlFor={`tool-${tool.id}`} className="text-xs font-normal cursor-pointer select-none">
                            {tool.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="toolsToClean">Tools to clean up, organize, or connect?</Label>
                      <Input id="toolsToClean" {...register("toolsToClean")} placeholder="Tools requiring consolidation..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordManager">Password Manager Used</Label>
                      <Input id="passwordManager" {...register("passwordManager")} placeholder="1Password, LastPass, Dashlane, None..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessPrepared">Access instructions or shared folder ready?</Label>
                      <Input id="accessPrepared" {...register("accessPrepared")} placeholder="Yes/No details..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessMethod">How will Sienvi be granted access?</Label>
                      <Input id="accessMethod" {...register("accessMethod")} placeholder="Invite link, direct details..." />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="regularCommunication">Who do you communicate with regularly?</Label>
                    <Input id="regularCommunication" {...register("regularCommunication")} placeholder="Clients, Leads, Team, Vendors..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="messageTypes">Types of messages received most often?</Label>
                      <Input id="messageTypes" {...register("messageTypes")} placeholder="Inquiries, Support, Invoicing..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="communicationTone">What tone should we use when communicating on your behalf? *</Label>
                      <Input id="communicationTone" {...register("communicationTone")} placeholder="Professional, Warm, Casual, Concise..." />
                      {errors.communicationTone && <p className="text-xs text-destructive">{errors.communicationTone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailTemplates">Do you have email templates or scripts?</Label>
                      <Input id="emailTemplates" {...register("emailTemplates")} placeholder="Yes, No, Partially..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phrasesToAvoid">Phrases, promises, or claims to avoid?</Label>
                      <Input id="phrasesToAvoid" {...register("phrasesToAvoid")} placeholder="Specific expressions to stay away from..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="approvalSituations">What situations require your approval before responding? *</Label>
                      <Input id="approvalSituations" {...register("approvalSituations")} placeholder="Refunds, complaints, custom pricing..." />
                      {errors.approvalSituations && <p className="text-xs text-destructive">{errors.approvalSituations.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desiredResponseTime">Desired response time for client messages?</Label>
                      <Input id="desiredResponseTime" {...register("desiredResponseTime")} placeholder="e.g. Same day, within 24 hours..." />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="leadSources">How do new leads currently come in?</Label>
                    <Textarea id="leadSources" {...register("leadSources")} placeholder="Website, referrals, ads, organic social..." rows={2} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadTracking">Where are leads tracked?</Label>
                      <Input id="leadTracking" {...register("leadTracking")} placeholder="CRM name, Spreadsheet, none..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leadFollowUp">What happens after someone becomes a lead?</Label>
                      <Input id="leadFollowUp" {...register("leadFollowUp")} placeholder="Describe the current process..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 5: DETAILS & SECURITY */}
            {activeStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 10–17: Calendars, Files, Billing, Team, Standards & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendarManager">Who manages your calendar currently?</Label>
                      <Input id="calendarManager" {...register("calendarManager")} placeholder="Self, previous assistant, automated..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingHours">Working hours and availability rules?</Label>
                      <Input id="workingHours" {...register("workingHours")} placeholder="e.g. 9am - 5pm EST Mon-Fri..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="fileStorage">Where are your business files stored? *</Label>
                      <Input id="fileStorage" {...register("fileStorage")} placeholder="Google Drive, Dropbox, Notion, etc." />
                      {errors.fileStorage && <p className="text-xs text-destructive">{errors.fileStorage.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileOrganization">How organized are your files?</Label>
                      <Input id="fileOrganization" {...register("fileOrganization")} placeholder="Somewhat organized, messy, digital junk drawer..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="numbersTracked">What KPIs/numbers do you track?</Label>
                      <Input id="numbersTracked" {...register("numbersTracked")} placeholder="Revenue, response time, closing rate..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceSupport">Need invoicing or billing support?</Label>
                      <Input id="invoiceSupport" {...register("invoiceSupport")} placeholder="Yes/No with preferences..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="teamStructure">Do you have a team? (roles & names)</Label>
                      <Input id="teamStructure" {...register("teamStructure")} placeholder="List team members if applicable..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandSound">How should your business sound? *</Label>
                      <Input id="brandSound" {...register("brandSound")} placeholder="Warm, Professional, Corporate, Casual..." />
                      {errors.brandSound && <p className="text-xs text-destructive">{errors.brandSound.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="systemsAccessNeeded">What systems will we need access to? *</Label>
                    <Textarea id="systemsAccessNeeded" {...register("systemsAccessNeeded")} placeholder="CRM, Email provider, ClickUp, Slack..." rows={2} />
                    {errors.systemsAccessNeeded && <p className="text-xs text-destructive">{errors.systemsAccessNeeded.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalDecisionMaker">Who is the final decision-maker? *</Label>
                      <Input id="finalDecisionMaker" {...register("finalDecisionMaker")} placeholder="Name of final approver" />
                      {errors.finalDecisionMaker && <p className="text-xs text-destructive">{errors.finalDecisionMaker.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workApprover">Who approves Sienvi's completed work?</Label>
                      <Input id="workApprover" {...register("workApprover")} placeholder="Manager, Founder, CEO..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 6: LINKS, PRIORITIES & FINALIZE */}
            {activeStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">Section 18, 19 & 20: Priorities, Links & Final Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstPriorityFix">What should we fix first? *</Label>
                      <Input id="firstPriorityFix" {...register("firstPriorityFix")} placeholder="Biggest operational bottleneck" />
                      {errors.firstPriorityFix && <p className="text-xs text-destructive">{errors.firstPriorityFix.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="successIndicator30Days">What makes this worth it after 30 days? *</Label>
                      <Input id="successIndicator30Days" {...register("successIndicator30Days")} placeholder="Metrics or outcomes" />
                      {errors.successIndicator30Days && <p className="text-xs text-destructive">{errors.successIndicator30Days.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first7Days">First 7 Days Priorities</Label>
                      <Input id="first7Days" {...register("first7Days")} placeholder="Immediate adjustments..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first30Days">First 30 Days Goals</Label>
                      <Input id="first30Days" {...register("first30Days")} placeholder="Month 1 expectations..." />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-slate-700">Assets & Links (Provide URLs if available)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="driveFolder">Shared Folder Link (Drive/Dropbox)</Label>
                        <Input id="driveFolder" {...register("driveFolder")} placeholder="https://drive.google.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pmWorkspace">Project Management Workspace</Label>
                        <Input id="pmWorkspace" {...register("pmWorkspace")} placeholder="Link to ClickUp/Asana..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="crmLogin">CRM Login / Invite Link</Label>
                        <Input id="crmLogin" {...register("crmLogin")} placeholder="Link to Hubspot/GoHighLevel..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedulingLink">Scheduling Link</Label>
                        <Input id="schedulingLink" {...register("schedulingLink")} placeholder="Calendly link..." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="finalNotes">Final Notes / Boundary Rules / Outsourcing Worries</Label>
                    <Textarea id="finalNotes" {...register("finalNotes")} placeholder="Any other boundaries, special preferences, or concerns about outsourcing admin support..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={activeStep === 0 || saving}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleSaveDraft}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Save Draft
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
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
          )}
        </div>
      </div>
    </form>
  );
};
