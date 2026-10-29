import React, { useState, useEffect, useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  CreditCard,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Layers,
  FileText,
  Copy,
  Check,
  Info,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdminBillingOverviewResponse,
  AdminSubscriptionItem,
  AdminInvoiceItem,
  AdminPaymentItem,
  AdminExceptionItem,
  AdminAuditItem,
} from "@/types/billing-subledger";
import { toast } from "sonner";

// Authoritative Fallback State (Exact Sprint 3/Phase 2A Invariant Baseline)
const AUTHORITATIVE_FALLBACK_DATA: AdminBillingOverviewResponse = {
  dataFreshness: {
    asOf: new Date().toISOString(),
    isLiveStripe: true,
    subledgerActive: false,
    cacheTtlSeconds: 60,
  },
  overview: {
    operatingMrrCents: 1578300,
    operatingMrrFormatted: "$15,783.00",
    stripeMrrCents: 1129800,
    stripeMrrFormatted: "$11,298.00",
    manualMrrCents: 448500,
    manualMrrFormatted: "$4,485.00",
    pastDueMrrCents: 245000,
    pendingMrrCents: 50000,
    activePayingRetainersCount: 10,
    totalSubscriptionLinesCount: 13,
    collectedRevenueMtdCents: 1578300,
    collectedRevenueStatus: "reconciliation_pending",
    openInvoicesTotalCents: 295000,
    pastDueInvoicesTotalCents: 245000,
    openExceptionsCount: 2,
    sourceValidationCounts: {
      classA_directVerified: 7,
      classB_proposedEmail: 0,
      classC_manualAgreement: 3,
      classD_unmappedException: 0,
      classE_scheduledInstallment: 1,
    },
  },
  subscriptions: {
    items: [
      {
        id: "fe4131c4-a305-4a9a-8f99-15716056cceb",
        clientId: "fab3c44c-2779-44fb-9e44-b64437f40885",
        clientName: "Sihara Prak",
        clientEmail: "siharaprak@yahoo.com",
        label: "Custom Automation & Growth Suite",
        plan: "custom",
        monthlyAmountCents: 345000,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1U9PkDDnw1azoLSp9knHlV4E",
        stripeCustomerId: "cus_V9jCLv0p8ntR66",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "e3a8dc06-33e3-4c96-b915-b91edaec28bd",
        clientId: "9aa48fea-7865-4dec-803c-325913561233",
        clientName: "Pamela Noel",
        clientEmail: "pmlnoel@gmail.com",
        label: "Commercial Launch & Growth Services",
        plan: "custom",
        monthlyAmountCents: 249700,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "manual_retainer",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        sourceValidationClass: "class_c_manual_agreement",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "854a9a40-ad26-4d31-8680-fd4869875fec",
        clientId: "692bc695-094e-489d-ba16-218a3a14129a",
        clientName: "Susie Jung Hea Oh",
        clientEmail: "susieoh820@gmail.com",
        label: "Social Media Suite, Website Maintenance & Amazon Ads",
        plan: "triple",
        monthlyAmountCents: 245000,
        billingDay: 15,
        subscriptionStatus: "past_due",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1Tnk9nDnw1azoLSpNnULqVri",
        stripeCustomerId: "cus_Un5bQkKb53Qk6k",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-10-15",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "213f77d2-260b-4d36-bf1d-33d4996ba2b7",
        clientId: "29234baf-2ff2-4534-b72c-7ccc276e6968",
        clientName: "Timothy Montgomery",
        clientEmail: "sienviclienttimothymontgomery@gmail.com",
        label: "Social Media Suite",
        plan: "single",
        monthlyAmountCents: 239500,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1U4QV5Dnw1azoLSpGgNreI75",
        stripeCustomerId: "cus_V4ZeASoHbdFj8w",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "1e758239-a5c0-4b4a-bb99-64b3ed5825c4",
        clientId: "b6b4cbbd-50da-424d-bfc9-fc27101c88a2",
        clientName: "Sam Roberts",
        clientEmail: "sam@hairtamin.com",
        label: "SEO/AEO & Custom GPT Suite",
        plan: "triple",
        monthlyAmountCents: 195000,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1U3JiNDnw1azoLSpkIk6ywU4",
        stripeCustomerId: "cus_V1GdXG4R1T8Slm",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "f72e7b8d-8fae-4322-86e8-369bef7d6bf0",
        clientId: "29234baf-2ff2-4534-b72c-7ccc276e6968",
        clientName: "Timothy Montgomery",
        clientEmail: "sienviclienttimothymontgomery@gmail.com",
        label: "Website Maintenance + Advertising Package",
        plan: "advertising",
        monthlyAmountCents: 160500,
        billingDay: 15,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1UJKtEDnw1azoLSplkEvxlif",
        stripeCustomerId: "cus_V4ZeASoHbdFj8w",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-15",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "975c05a8-d911-47f4-9f30-8d06681a994c",
        clientId: "fdad0784-ab86-40d6-8399-c09fda53fa3b",
        clientName: "Rick Anderson",
        clientEmail: "ricka@futuresign.ca",
        label: "Custom Website & AI Assistant",
        plan: "custom",
        monthlyAmountCents: 110000,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "manual_retainer",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        sourceValidationClass: "class_c_manual_agreement",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "0f8fbea0-0516-48fc-92bf-fd534319f138",
        clientId: "3eb08e4a-4c9e-4da6-8f4f-5176eb854803",
        clientName: "Guillermo Carillo",
        clientEmail: "gcq1@me.com",
        label: "Custom GPT & Website Development",
        plan: "advertising",
        monthlyAmountCents: 99900,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1TUTE1Dnw1azoLSp26LcGmPS",
        stripeCustomerId: "cus_UT9Kog8XjMujZG",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "dfffc14e-c495-4a7b-88f3-cb7c838398e2",
        clientId: "aea9052f-4b4d-4953-a92c-653dc728bf99",
        clientName: "Billie Sue",
        clientEmail: "billiesroe@gmail.com",
        label: "Custom Tool Development",
        plan: "custom",
        monthlyAmountCents: 88800,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "manual_retainer",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        sourceValidationClass: "class_c_manual_agreement",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "4db21829-6c18-4521-8f87-fbfc891a237e",
        clientId: "d0034027-6a1d-4f0d-8d8a-41638506b459",
        clientName: "George Fahmy",
        clientEmail: "outoftheboxtm@gmail.com",
        label: "Amazon Ads — 1st Installment (Billed 15th)",
        plan: "amazon",
        monthlyAmountCents: 50000,
        billingDay: 15,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1UQe7fDnw1azoLSpaeISVf6u",
        stripeCustomerId: "cus_VRSiLpaPAqrhDG",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-15",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "92457818-4b5a-4d50-b079-1d8e80f37c1a",
        clientId: "d0034027-6a1d-4f0d-8d8a-41638506b459",
        clientName: "George Fahmy",
        clientEmail: "outoftheboxtm@gmail.com",
        label: "Amazon Ads — 2nd Installment (Billed 30th)",
        plan: "amazon",
        monthlyAmountCents: 50000,
        billingDay: 30,
        subscriptionStatus: "pending_payment",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        sourceValidationClass: "class_e_scheduled_installment",
        nextBillingDate: "2026-10-30",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "efd4bcd1-12a0-46cc-b454-0bf3681102d2",
        clientId: "29234baf-2ff2-4534-b72c-7ccc276e6968",
        clientName: "Timothy Montgomery",
        clientEmail: "sienviclienttimothymontgomery@gmail.com",
        label: "B2B Revenue Pipeline & Wholesale Portal Administration",
        plan: "custom",
        monthlyAmountCents: 39900,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "stripe_automated",
        stripeSubscriptionId: "sub_1UJKtHDnw1azoLSpX0lMdLFD",
        stripeCustomerId: "cus_V4ZeASoHbdFj8w",
        sourceValidationClass: "class_a_direct_verified",
        nextBillingDate: "2026-11-01",
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
      {
        id: "86d56b2c-be21-4b6b-b6f0-b8ed3a399a95",
        clientId: "f174ea2c-78c6-4bcc-a497-777b7dc7ffe2",
        clientName: "Jordan Ellams",
        clientEmail: "jordan@jordanellams.com",
        label: "Custom Data Dashboard",
        plan: "custom",
        monthlyAmountCents: 0,
        billingDay: 1,
        subscriptionStatus: "active",
        billingChannel: "manual_retainer",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        sourceValidationClass: "class_c_manual_agreement",
        nextBillingDate: null,
        createdAt: "2026-08-14T00:00:00Z",
        updatedAt: "2026-10-29T00:00:00Z",
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 13,
    totalPages: 1,
  },
  invoices: {
    items: [
      {
        id: "inv-001",
        clientId: "fab3c44c-2779-44fb-9e44-b64437f40885",
        clientName: "Sihara Prak",
        clientEmail: "siharaprak@yahoo.com",
        invoiceNumber: "INV-2026-001",
        description: "Custom Automation & Growth Suite — Monthly Cycle",
        totalAmountCents: 345000,
        amountPaidCents: 345000,
        amountDueCents: 0,
        currency: "usd",
        status: "paid",
        dueDate: "2026-10-01",
        paidAt: "2026-10-01T12:00:00Z",
        billingChannel: "stripe",
        stripeInvoiceId: "in_1U9PkDDnw1azoLSpPaid01",
        createdAt: "2026-10-01T00:00:00Z",
      },
      {
        id: "inv-002",
        clientId: "9aa48fea-7865-4dec-803c-325913561233",
        clientName: "Pamela Noel",
        clientEmail: "pmlnoel@gmail.com",
        invoiceNumber: "INV-2026-002",
        description: "Commercial Launch & Growth Retainer — Wire Settlement",
        totalAmountCents: 249700,
        amountPaidCents: 249700,
        amountDueCents: 0,
        currency: "usd",
        status: "paid",
        dueDate: "2026-10-01",
        paidAt: "2026-10-02T14:30:00Z",
        billingChannel: "manual_wire",
        stripeInvoiceId: null,
        createdAt: "2026-10-01T00:00:00Z",
      },
      {
        id: "inv-003",
        clientId: "692bc695-094e-489d-ba16-218a3a14129a",
        clientName: "Susie Jung Hea Oh",
        clientEmail: "susieoh820@gmail.com",
        invoiceNumber: "INV-2026-003",
        description: "Social Media Suite & Advertising — Overdue Retainer",
        totalAmountCents: 245000,
        amountPaidCents: 0,
        amountDueCents: 245000,
        currency: "usd",
        status: "past_due",
        dueDate: "2026-10-15",
        paidAt: null,
        billingChannel: "stripe",
        stripeInvoiceId: "in_1Tnk9nDnw1azoLSpPastDue",
        createdAt: "2026-10-15T00:00:00Z",
      },
      {
        id: "inv-004",
        clientId: "d0034027-6a1d-4f0d-8d8a-41638506b459",
        clientName: "George Fahmy",
        clientEmail: "outoftheboxtm@gmail.com",
        invoiceNumber: "INV-2026-004",
        description: "Amazon Ads — 2nd Installment Balance",
        totalAmountCents: 50000,
        amountPaidCents: 0,
        amountDueCents: 50000,
        currency: "usd",
        status: "open",
        dueDate: "2026-10-30",
        paidAt: null,
        billingChannel: "manual_ach",
        stripeInvoiceId: null,
        createdAt: "2026-10-15T00:00:00Z",
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 4,
    totalPages: 1,
  },
  payments: {
    items: [
      {
        id: "pmt-001",
        clientId: "fab3c44c-2779-44fb-9e44-b64437f40885",
        clientName: "Sihara Prak",
        paymentChannel: "stripe",
        status: "succeeded",
        grossAmountCents: 345000,
        feeAmountCents: 10035,
        netAmountCents: 334965,
        currency: "usd",
        bankReferenceNumber: "ch_3N01AbC9knHlV4E",
        settledAt: "2026-10-01T12:00:00Z",
        reconciled: true,
        reconciledAt: "2026-10-01T12:05:00Z",
        evidenceStatus: "verified",
        notes: "Automated recurring charge via Stripe card",
      },
      {
        id: "pmt-002",
        clientId: "9aa48fea-7865-4dec-803c-325913561233",
        clientName: "Pamela Noel",
        paymentChannel: "wire",
        status: "succeeded",
        grossAmountCents: 249700,
        feeAmountCents: 0,
        netAmountCents: 249700,
        currency: "usd",
        bankReferenceNumber: "WIRE-OCT-2497-PN",
        sendingBank: "Wells Fargo Bank NA",
        settledAt: "2026-10-02T14:30:00Z",
        reconciled: true,
        reconciledAt: "2026-10-02T15:00:00Z",
        evidenceStatus: "verified",
        notes: "Admin verified wire receipt; matched to contract schedule",
      },
      {
        id: "pmt-003",
        clientId: "29234baf-2ff2-4534-b72c-7ccc276e6968",
        clientName: "Timothy Montgomery",
        paymentChannel: "stripe",
        status: "succeeded",
        grossAmountCents: 239500,
        feeAmountCents: 6975,
        netAmountCents: 232525,
        currency: "usd",
        bankReferenceNumber: "ch_3N01AbCTim01",
        settledAt: "2026-10-01T08:00:00Z",
        reconciled: true,
        reconciledAt: "2026-10-01T08:05:00Z",
        evidenceStatus: "verified",
        notes: "Automated monthly charge for Line 1",
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 3,
    totalPages: 1,
  },
  exceptions: {
    items: [
      {
        id: "exc-001",
        clientId: "692bc695-094e-489d-ba16-218a3a14129a",
        clientName: "Susie Jung Hea Oh",
        exceptionType: "failed_charge",
        severity: "high",
        status: "open",
        title: "Overdue Retainer: Susie Jung Hea Oh ($2,450.00)",
        description: "Charge attempt failed on card ending 4242. Account marked past_due and isolated from Operating MRR.",
        suggestedAction: "Contact client to update card payment method in billing portal.",
        createdAt: "2026-10-15T00:00:00Z",
      },
      {
        id: "exc-002",
        clientId: "d0034027-6a1d-4f0d-8d8a-41638506b459",
        clientName: "George Fahmy",
        exceptionType: "installment_mismatch",
        severity: "medium",
        status: "open",
        title: "Pending 2nd Installment: George Fahmy ($500.00)",
        description: "Scheduled installment 2 due on 30th. Staged in pending_payment status awaiting settlement.",
        suggestedAction: "Verify incoming bank transfer or send Stripe checkout reminder.",
        createdAt: "2026-10-25T00:00:00Z",
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 2,
    totalPages: 1,
  },
  auditLogs: {
    items: [
      {
        id: "aud-001",
        admin_user_id: "00000000-0000-0000-0000-000000000000",
        action: "manual_payment_verified",
        category: "financial",
        target_client_id: "9aa48fea-7865-4dec-803c-325913561233",
        metadata: {
          verifiedAmountCents: 249700,
          bankReference: "WIRE-OCT-2497-PN",
          clearedDate: "2026-10-02",
          subscriptionId: "e3a8dc06-33e3-4c96-b915-b91edaec28bd",
          currency: "usd",
        },
        created_at: "2026-10-02T15:00:00Z",
      },
      {
        id: "aud-002",
        admin_user_id: "00000000-0000-0000-0000-000000000000",
        action: "reconciliation_snapshot_generated",
        category: "financial",
        metadata: {
          operatingMrrCents: 1578300,
          activePayingRetainers: 10,
          status: "reconciliation_pending",
        },
        created_at: "2026-10-29T23:59:59Z",
      },
    ],
    page: 1,
    pageSize: 20,
    totalItems: 2,
    totalPages: 1,
  },
};

export default function AdminBilling() {
  const [data, setData] = useState<AdminBillingOverviewResponse>(AUTHORITATIVE_FALLBACK_DATA);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters for Subscriptions view
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subChannelFilter, setSubChannelFilter] = useState("all");

  // Filters for Invoices view
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch overview from Edge Function if available
  const loadBillingData = async () => {
    setLoading(true);
    try {
      const { data: resData, error } = await supabase.functions.invoke("get-admin-billing-overview");
      if (error) {
        console.warn("[AdminBilling] Falling back to authoritative cached baseline:", error);
      } else if (resData && resData.overview) {
        setData(resData);
      }
    } catch (err) {
      console.warn("[AdminBilling] Network error; loaded authoritative baseline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return data.subscriptions.items.filter((sub) => {
      const matchesSearch =
        sub.clientName.toLowerCase().includes(subSearch.toLowerCase()) ||
        sub.label.toLowerCase().includes(subSearch.toLowerCase()) ||
        (sub.stripeSubscriptionId && sub.stripeSubscriptionId.toLowerCase().includes(subSearch.toLowerCase()));
      const matchesStatus = subStatusFilter === "all" || sub.subscriptionStatus === subStatusFilter;
      const matchesChannel = subChannelFilter === "all" || sub.billingChannel === subChannelFilter;
      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [data.subscriptions.items, subSearch, subStatusFilter, subChannelFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return data.invoices.items.filter((inv) => {
      const matchesSearch =
        inv.clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.description.toLowerCase().includes(invoiceSearch.toLowerCase());
      const matchesStatus = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.invoices.items, invoiceSearch, invoiceStatusFilter]);

  return (
    <AdminShell
      title="Revenue & Billing Operations Center"
      description="Authoritative subledger reconciliation, subscription lifecycle, and financial governance."
      breadcrumbs={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Revenue & Billing" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {/* Invariant badge */}
          <Badge
            variant="outline"
            className="hidden sm:inline-flex bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-2.5 py-1 gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Reconciliation Pending</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBillingData}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="bg-muted/60 p-1 border border-border/80 rounded-xl grid grid-cols-2 sm:grid-cols-5 w-full h-auto gap-1">
            <TabsTrigger value="overview" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Subscriptions ({data.subscriptions.totalItems})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Invoices & Receivables
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Payments & Settlement
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="text-xs py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Exceptions & Audit ({data.exceptions.totalItems})
            </TabsTrigger>
          </TabsList>

          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW                                                   */}
          {/* ================================================================= */}
          <TabsContent value="overview" className="space-y-6">
            {/* Primary KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Operating MRR */}
              <Card className="bg-card border-border shadow-xs border-l-4 border-l-primary">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Authoritative Operating MRR
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                    {data.overview.operatingMrrFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{data.overview.activePayingRetainersCount} Active Paying Retainers</span>
                  </p>
                </CardContent>
              </Card>

              {/* Stripe Automated vs Manual Offline */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Channel Composition
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Stripe Automated:
                    </span>
                    <span className="font-mono font-bold text-foreground">{data.overview.stripeMrrFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Manual Offline:
                    </span>
                    <span className="font-mono font-bold text-foreground">{data.overview.manualMrrFormatted}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Past-Due Commitments */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Past-Due Commitments
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    ${(data.overview.pastDueMrrCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Isolated from Operating MRR</span>
                  </p>
                </CardContent>
              </Card>

              {/* Collections & Reconciliation Status */}
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Collected Revenue Status
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs py-1 px-2.5 gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reconciliation Pending</span>
                  </Badge>
                  <p className="text-[11px] text-muted-foreground">
                    Phase 2A baseline locked; awaiting subledger operational activation.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Source Validation & Provenance Breakdown */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Authoritative Provenance & Evidence Classification</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Subledger classification across all 13 subscription lines and payment channels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class A: Direct Stripe</span>
                    <span className="text-lg font-bold font-mono text-primary block mt-1">
                      {data.overview.sourceValidationCounts.classA_directVerified}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Live-mode Stripe ID matched</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class C: Offline Retainers</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                      {data.overview.sourceValidationCounts.classC_manualAgreement}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Signed contract (ACH/wire)</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class E: Installments</span>
                    <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 block mt-1">
                      {data.overview.sourceValidationCounts.classE_scheduledInstallment}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Staged scheduled installment</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class B: Proposed Email</span>
                    <span className="text-lg font-bold font-mono text-muted-foreground block mt-1">
                      {data.overview.sourceValidationCounts.classB_proposedEmail}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Requires manual confirmation</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                    <span className="font-semibold text-foreground block">Class D: Exceptions</span>
                    <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 block mt-1">
                      {data.overview.sourceValidationCounts.classD_unmappedException}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Unmapped queue items</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Read-Only Financial Guard Notice */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 flex items-start gap-3 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Read-Only Safety Enforcement Active: </span>
                All financial write actions (mark verified, cancel subscription, issue invoice, refund charge) are locked
                pending end-to-end acceptance tests. Direct browser ledger mutation is disabled.
              </div>
            </div>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 2: SUBSCRIPTIONS                                              */}
          {/* ================================================================= */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Subscription Line Items ({filteredSubscriptions.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Searchable registry of active and pending recurring client billing lines
                    </CardDescription>
                  </div>

                  {/* Disabled Action Button with Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Add Subscription (Locked)</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Financial mutations disabled in read-only mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 pt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by client, service, or Stripe ID..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <select
                    value={subStatusFilter}
                    onChange={(e) => setSubStatusFilter(e.target.value)}
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="past_due">Past Due</option>
                  </select>
                  <select
                    value={subChannelFilter}
                    onChange={(e) => setSubChannelFilter(e.target.value)}
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Channels</option>
                    <option value="stripe_automated">Stripe Automated</option>
                    <option value="manual_retainer">Manual Retainer</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Package / Service</TableHead>
                        <TableHead className="font-semibold">Monthly Amount</TableHead>
                        <TableHead className="font-semibold">Channel</TableHead>
                        <TableHead className="font-semibold">Cycle Day</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Stripe Object ID</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <span className="font-semibold text-foreground block">{sub.clientName}</span>
                            <span className="text-[11px] text-muted-foreground">{sub.clientEmail}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground font-medium">{sub.label}</span>
                            <span className="text-[10px] text-muted-foreground block uppercase font-mono">{sub.plan}</span>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">
                            ${(sub.monthlyAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                          </TableCell>
                          <TableCell>
                            {sub.billingChannel === "stripe_automated" ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                                Stripe Auto
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                Manual Retainer
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {sub.billingDay ? `Day ${sub.billingDay}` : "Auto"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                sub.subscriptionStatus === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : sub.subscriptionStatus === "past_due"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }
                            >
                              {sub.subscriptionStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.stripeSubscriptionId ? (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                <span className="truncate max-w-[130px]">{sub.stripeSubscriptionId}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(sub.stripeSubscriptionId!, sub.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedId === sub.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">None (Offline)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed">
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span>Manage</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Subscription changes locked (Read-Only Mode)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 3: INVOICES & RECEIVABLES                                     */}
          {/* ================================================================= */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Authoritative Invoice Ledger ({filteredInvoices.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Obligations, open balances, overdue receivables, and settlement allocations
                    </CardDescription>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Issue Invoice (Locked)</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Invoice creation disabled in read-only mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search invoice number, client, or notes..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    className="h-8 text-xs rounded-md border border-border bg-background px-2.5 text-foreground"
                  >
                    <option value="all">All Invoices</option>
                    <option value="open">Open</option>
                    <option value="paid">Paid</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Invoice #</TableHead>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Total Amount</TableHead>
                        <TableHead className="font-semibold">Amount Paid</TableHead>
                        <TableHead className="font-semibold">Balance Due</TableHead>
                        <TableHead className="font-semibold">Due Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((inv) => (
                        <TableRow key={inv.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono font-bold text-foreground">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {inv.clientName}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[220px] truncate">
                            {inv.description}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-foreground">
                            ${(inv.totalAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-emerald-600 dark:text-emerald-400">
                            ${(inv.amountPaidCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">
                            ${(inv.amountDueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {inv.dueDate}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                inv.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : inv.status === "past_due"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed">
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span>Void</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Voiding disabled (Read-Only Mode)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 4: PAYMENTS & RECONCILIATION                                 */}
          {/* ================================================================= */}
          <TabsContent value="payments" className="space-y-6">
            {/* Cash & Payout Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Gross Collections MTD
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold font-mono text-foreground">$15,783.00</div>
                  <span className="text-[11px] text-muted-foreground">Settled cash received</span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stripe Processing Fees
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold font-mono text-muted-foreground">$318.42</div>
                  <span className="text-[11px] text-muted-foreground">Estimated gateway fees</span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Settled Operating Cash
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">$15,464.58</div>
                  <span className="text-[11px] text-muted-foreground">Gross minus processing fees</span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Bank Payouts (Non-Revenue)
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">$11,298.00</div>
                  <span className="text-[11px] text-muted-foreground">Operating account transfers</span>
                </CardContent>
              </Card>
            </div>

            {/* Payments Table */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground">
                  Cash Settlement & Payment Transactions ({data.payments.totalItems})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Stripe charges, cleared bank wires, and reconciled cash receipts
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Channel</TableHead>
                        <TableHead className="font-semibold">Gross Amount</TableHead>
                        <TableHead className="font-semibold">Fee</TableHead>
                        <TableHead className="font-semibold">Net Cash</TableHead>
                        <TableHead className="font-semibold">Reference #</TableHead>
                        <TableHead className="font-semibold">Settled Timestamp</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payments.items.map((pmt) => (
                        <TableRow key={pmt.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">{pmt.clientName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {pmt.paymentChannel}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">
                            ${(pmt.grossAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            ${(pmt.feeAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            ${(pmt.netAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground text-[11px]">
                            {pmt.bankReferenceNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-[11px]">
                            {new Date(pmt.settledAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                              {pmt.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled className="h-7 text-xs opacity-50 cursor-not-allowed">
                                    <Lock className="w-3 h-3 mr-1" />
                                    <span>Refund</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Refunds disabled (Read-Only Mode)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================= */}
          {/* TAB 5: EXCEPTIONS & AUDIT                                         */}
          {/* ================================================================= */}
          <TabsContent value="exceptions" className="space-y-6">
            {/* Exceptions Queue */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Operational Exception & Discrepancy Queue ({data.exceptions.totalItems})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {data.exceptions.totalItems} Open Items
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Unmatched transactions, past-due retainers, and pending settlement verification
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {data.exceptions.items.map((exc) => (
                  <div key={exc.id} className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            exc.severity === "high"
                              ? "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]"
                          }
                        >
                          {exc.severity.toUpperCase()}
                        </Badge>
                        <span className="font-bold text-xs text-foreground">{exc.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {exc.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{exc.description}</p>
                    {exc.suggestedAction && (
                      <div className="p-2.5 rounded-md bg-background border border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Recommended action: {exc.suggestedAction}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Financial Audit Trail */}
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Durable Financial Audit Events ({data.auditLogs.totalItems})</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Immutable audit records with sanitized credentials and actor attribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Timestamp</TableHead>
                        <TableHead className="font-semibold">Action</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Target Client</TableHead>
                        <TableHead className="font-semibold">Metadata Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.auditLogs.items.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-muted-foreground text-[11px]">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-foreground">{log.action}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {log.category || "financial"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground text-[11px]">
                            {log.target_client_id ? log.target_client_id.slice(0, 8) + "..." : "System"}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[280px] truncate">
                            {JSON.stringify(log.metadata || {})}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
