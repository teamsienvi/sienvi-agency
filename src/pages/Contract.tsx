import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft,
  FileSignature,
  Loader2,
  CheckCircle2,
  Shield,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get("view") === "true";
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [signatureName, setSignatureName] = useState("");

  // Agreement Details Form Fields
  const [effectiveDate, setEffectiveDate] = useState("");
  const [clientLegalName, setClientLegalName] = useState("");
  const [clientTradeName, setClientTradeName] = useState("");
  const [clientJurisdiction, setClientJurisdiction] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientContactName, setClientContactName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [strategyPeriod, setStrategyPeriod] = useState("");
  const [confidentialityPeriod, setConfidentialityPeriod] = useState("5 years");
  const [approvedWebsites, setApprovedWebsites] = useState("");
  const [shopifySite, setShopifySite] = useState("");
  const [signerTitle, setSignerTitle] = useState("Authorized Signatory");
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);

  const onPdfLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setPdfNumPages(numPages);
  }, []);

  const [currentSignerEmail, setCurrentSignerEmail] = useState("");
  const [currentSignerName, setCurrentSignerName] = useState("");
  const [hasMySignature, setHasMySignature] = useState(false);
  const [coSigners, setCoSigners] = useState<any[]>([]);

  const isAmazonContract = profile?.plan === "amazon" || 
    (profile?.selectedServices || []).includes("channel-amazon") || 
    (profile?.selectedServices || []).includes("amazon-design");

  const isPartnership = Boolean(
    profile?.isPartnership ||
    profile?.plan === "partnership" ||
    profile?.plan === "nda" ||
    profile?.contractDetails?.isNda ||
    profile?.contractDetails?.relationshipType === "partnership"
  );

  const isNda = Boolean(
    isPartnership ||
    profile?.isNda ||
    profile?.contractDetails?.uploadedContractName?.toLowerCase()?.includes("confidentiality") ||
    profile?.contractDetails?.uploadedContractName?.toLowerCase()?.includes("nda") ||
    profile?.contractDetails?.uploadedContractName?.toLowerCase()?.includes("cheercpt") ||
    profile?.contractDetails?.uploadedContractName?.toLowerCase()?.includes("non-use")
  );

  const isCommissionBased = (profile?.isCommissionBased || 
    profile?.customPrice === 0 || 
    profile?.custom_price === 0 || 
    profile?.plan === "custom" || 
    profile?.plan === "prospect") && !isPartnership && !isNda;

  // Resolve the monthly price from profile or plan defaults
  const planDefaultPrices: Record<string, number> = {
    single: 888, triple: 2398.20, full: 3996,
    amazon: 999, advertising: 999, custom: 0,
    partnership: 0, nda: 0,
  };
  const monthlyPrice = profile?.customPrice ?? profile?.custom_price ?? planDefaultPrices[profile?.plan] ?? 0;
  const formattedPrice = isPartnership || isNda
    ? "Strategic Partnership (No Service / Subscription Fees)"
    : isCommissionBased 
    ? "Commission-Based (Performance / Revenue Share)" 
    : `$${Number(monthlyPrice).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USD/month`;

  // Contract terms — per-client values from contractDetails, with sensible defaults
  const cd = profile?.contractDetails || {};
  const initialTerm = cd.initialTerm || (isPartnership ? "Indefinite / Strategic" : "6 months");
  const noticePeriod = cd.noticePeriod || (isPartnership ? "30 days" : "30 days");
  const billingTerms = isPartnership || isNda
    ? (cd.billingTerms || "None. Mutual strategic collaboration; no subscription or recurring service fees.")
    : isCommissionBased 
    ? (cd.billingTerms || "Commission-based; invoiced according to agreed performance milestones and revenue share terms")
    : (cd.billingTerms || "Initial payment due upon full execution; recurring invoices monthly from Effective Date");
  const serviceDelivery = cd.serviceDelivery || (isPartnership ? "Collaborative & remote evaluation" : "Remote unless otherwise agreed in writing");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      const paramClientId = searchParams.get("clientId");
      const response = await supabase.functions.invoke("get-client-profile", {
        method: "POST",
        body: { clientId: paramClientId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        navigate("/dashboard");
        return;
      }

      const fetchedProfile = response.data.profile;
      setProfile(fetchedProfile);
      
      const userEmail = (session.user.email || fetchedProfile.currentSignerEmail || "").toLowerCase();
      setCurrentSignerEmail(userEmail);

      const signers = fetchedProfile.signers || fetchedProfile.contractDetails?.signers || [];
      setCoSigners(signers);

      const mySigner = signers.find((s: any) => 
        s.email?.toLowerCase() === userEmail ||
        (userEmail.includes("jordan") && s.email?.toLowerCase().includes("jordan")) ||
        (userEmail.includes("michael") && s.email?.toLowerCase().includes("michael"))
      );

      const isMySignerSigned = mySigner?.status === "signed" || !!mySigner?.signature;
      setHasMySignature(isMySignerSigned);

      const allSigned = fetchedProfile.contractStatus === "signed" || (signers.length > 0 && signers.every((s: any) => s.status === "signed"));
      
      if (allSigned && !isViewMode) {
        setAlreadySigned(true);
      }

      const isPartnerAcc = fetchedProfile.isPartnership || 
        fetchedProfile.plan === "partnership" || 
        fetchedProfile.plan === "nda" || 
        fetchedProfile.contractDetails?.isNda || 
        fetchedProfile.contractDetails?.relationshipType === "partnership";

      // Pre-populate signature name
      if (mySigner?.signature) {
        setSignatureName(mySigner.signature);
      } else if (mySigner?.name) {
        setSignatureName(mySigner.name);
      } else if (fetchedProfile.currentSignerName) {
        setSignatureName(fetchedProfile.currentSignerName);
      } else if (isPartnerAcc) {
        setSignatureName(fetchedProfile.contractDetails?.clientContactName || `${fetchedProfile.firstName || ""} ${fetchedProfile.lastName || ""}`.trim() || "");
      } else if (fetchedProfile.firstName) {
        setSignatureName(`${fetchedProfile.firstName} ${fetchedProfile.lastName || ""}`.trim());
      } else if (userEmail.includes("michael")) {
        setSignatureName("Michael Wilson");
      } else if (userEmail.includes("jordan")) {
        setSignatureName("Jordan Ellams");
      }

      // Pre-populate Agreement Details fields
      const details = fetchedProfile.contractDetails || {};
      const fallbackEntity = isPartnerAcc ? (fetchedProfile.contractDetails?.clientTradeName || fetchedProfile.entityName || "") : (fetchedProfile.entityName || "In the Dome");
      const fallbackLegal = isPartnerAcc ? (fetchedProfile.contractDetails?.clientLegalName || `${fetchedProfile.firstName || ""} ${fetchedProfile.lastName || ""}`.trim() || "") : (fetchedProfile.entityName || "In the Dome");

      setEffectiveDate(details.effectiveDate || new Date().toISOString().substring(0, 10));
      setClientLegalName(details.clientLegalName || fallbackLegal);
      setClientTradeName(details.clientTradeName || fallbackEntity);
      setClientJurisdiction(details.clientJurisdiction || (isPartnerAcc ? "United States" : "California, USA"));
      setClientAddress(details.clientAddress || (isPartnerAcc ? "United States" : ""));
      setClientContactName(details.clientContactName || (isPartnerAcc ? (`${fetchedProfile.firstName || ""} ${fetchedProfile.lastName || ""}`.trim() || "") : (mySigner?.name || `${fetchedProfile.firstName || ""} ${fetchedProfile.lastName || ""}`.trim() || "Jordan Ellams & Michael Wilson")));
      setClientEmail(details.clientEmail || userEmail || fetchedProfile.email || "");
      setSignerTitle(mySigner?.title || details.signerTitle || (isPartnerAcc ? "Authorized Representative" : "Co-Founder / Principal"));
      setStrategyPeriod(details.strategyPeriod || (isPartnerAcc ? "Strategic Collaboration" : "Initial 6-Month Strategy"));
      setConfidentialityPeriod(details.confidentialityPeriod || "5 years");
      setApprovedWebsites(details.approvedWebsites || "");
      setShopifySite(details.shopifySite || "");

    } catch (error: any) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = () => {
    if (isPartnership || isNda) {
      return "Strategic Partnership (No Service Fees)";
    }
    if (isCommissionBased) {
      return "Commission-Based";
    }
    if (profile?.contractDetails?.monthlyFee) {
      return profile.contractDetails.monthlyFee;
    }
    const price = profile?.customPrice ?? profile?.custom_price;
    if (price !== null && price !== undefined) {
      if (price === 0) {
        return "Commission-Based";
      }
      return `$${price} USD/month`;
    }
    switch (profile?.plan) {
      case "partnership":
      case "nda":
        return "Strategic Partnership (No Service Fees)";
      case "single":
        return "$888 USD/month";
      case "triple":
        return "$2,664 USD/month";
      case "full":
        return "$3,996 USD/month";
      case "amazon":
        return "$999 USD/month";
      case "advertising": {
        const channelsCount = (profile?.selectedServices || []).filter((s: string) => s.startsWith("channel-")).length;
        if (channelsCount === 1) return "$999 USD/month";
        if (channelsCount === 2) return "$1,498 USD/month";
        if (channelsCount === 3) return "$1,978 USD/month";
        if (channelsCount === 4) return "$2,356 USD/month";
        if (channelsCount === 5) return "$2,650 USD/month";
        if (channelsCount === 6) return "$2,957 USD/month";
        if (channelsCount === 7) return "$3,450 USD/month";
        return "$999 USD/month";
      }
      default:
        return isCommissionBased ? "Commission-Based" : "$888 USD/month";
    }
  };

  const handleSign = async () => {
    const resolvedJurisdiction = clientJurisdiction.trim() || (isPartnership || isNda ? "United States" : "California, USA");
    const resolvedAddress = clientAddress.trim() || "United States";
    const resolvedContactName = clientContactName.trim() || clientLegalName.trim() || signatureName.trim();

    if (!effectiveDate) {
      toast.error("Please select an Effective Date");
      return;
    }
    if (!clientLegalName.trim()) {
      toast.error("Please enter your Client Legal Name");
      return;
    }
    if (!agreed) {
      toast.error("Please agree to the terms first");
      return;
    }

    if (!signatureName.trim()) {
      toast.error("Please type your full name to sign the agreement");
      return;
    }

    setSigning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const contractDetails = {
        ...(profile?.contractDetails || {}),
        effectiveDate,
        clientLegalName: clientLegalName.trim(),
        clientTradeName: clientTradeName.trim(),
        clientJurisdiction: resolvedJurisdiction,
        clientAddress: resolvedAddress,
        clientContactName: resolvedContactName,
        clientEmail: clientEmail.trim(),
        signerTitle: signerTitle.trim() || "Authorized Signatory",
        approvedWebsites: approvedWebsites.trim(),
        shopifySite: shopifySite.trim(),
        strategyPeriod: strategyPeriod.trim(),
        confidentialityPeriod: confidentialityPeriod.trim(),
      };

      // Only include clientId if explicitly in admin view mode with a param clientId
      const requestBody: Record<string, any> = {
        action: "sign_contract",
        signature: signatureName.trim(),
        signerName: signatureName.trim(),
        signerTitle: signerTitle.trim() || "Authorized Signatory",
        signerEmail: currentSignerEmail || session.user.email,
        contractDetails,
      };
      if (isViewMode && searchParams.get("clientId")) {
        requestBody.clientId = searchParams.get("clientId");
      }

      const response = await supabase.functions.invoke("update-client-status", {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        let errorMsg = response.error.message || "Failed to sign contract";
        try {
          if (response.error.context && typeof response.error.context.json === "function") {
            const body = await response.error.context.json();
            if (body?.error) errorMsg = body.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }
      if (response.data?.error) throw new Error(response.data.error);

      toast.success("Agreement signed successfully!");

      await checkAccess();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  const renderAgreementDetailsTable = () => {
    if (isPartnership || isNda) {
      if (isViewMode) {
        return (
          <div className="mb-6 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
            <div className="bg-purple-50/70 border-b border-purple-100 px-4 py-3 print:bg-slate-100 print:border-slate-300 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase print:text-slate-900">Partnership & NDA Details</h3>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">Mutual NDA</Badge>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider print:border-slate-300 print:bg-transparent">
                  <th className="px-4 py-2.5 text-left w-1/2 print:text-slate-700">Field</th>
                  <th className="px-4 py-2.5 text-left w-1/2 print:text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800 w-1/2">Effective Date</td>
                  <td className="px-4 py-3 text-slate-800 w-1/2">{effectiveDate}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Legal Name</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{clientLegalName}</td>
                </tr>
                {clientTradeName && (
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Trade Name / Brand</td>
                    <td className="px-4 py-3 text-slate-800">{clientTradeName}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Jurisdiction</td>
                  <td className="px-4 py-3 text-slate-800">{clientJurisdiction}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Address</td>
                  <td className="px-4 py-3 text-slate-800">{clientAddress}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Contact Name</td>
                  <td className="px-4 py-3 text-slate-800">{clientContactName}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Partner Email</td>
                  <td className="px-4 py-3 text-slate-800">{clientEmail}</td>
                </tr>
                <tr className="bg-slate-50/30 print:bg-transparent">
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Legal Name</td>
                  <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Description</td>
                  <td className="px-4 py-3 text-slate-800">AI automation, software engineering, digital optimization, and business consulting</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Jurisdiction</td>
                  <td className="px-4 py-3 text-slate-800">British Columbia, Canada</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Principal Office</td>
                  <td className="px-4 py-3 text-slate-800">9194 Tronson Road, Vernon, BC, V1H1E2</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Email</td>
                  <td className="px-4 py-3 text-slate-800">info@sienvi.com</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agreement Purpose</td>
                  <td className="px-4 py-3 text-slate-800 font-medium text-purple-700 print:text-slate-800">
                    Confidentiality, Non-Use, Non-Build & Feedback Collaboration
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Financial Obligations</td>
                  <td className="px-4 py-3 text-emerald-700 font-semibold print:text-slate-800">
                    None (Strategic Partnership — Zero Subscription or Monthly Service Fees)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Confidentiality Survival Period</td>
                  <td className="px-4 py-3 text-slate-800">{confidentialityPeriod}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }

      return (
        <div className="mb-6 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm print:border-slate-300">
          <div className="bg-purple-50/70 border-b border-purple-100 px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Partnership & NDA Details</h3>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-semibold">Mutual NDA</Badge>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left w-1/2">Field</th>
                <th className="px-4 py-2.5 text-left w-1/2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1 w-1/2">
                  Effective Date <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-2 w-1/2">
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="max-w-md h-9 text-sm"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                  Partner Legal Name <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="e.g. Corey Robert Rickett"
                    value={clientLegalName}
                    onChange={(e) => setClientLegalName(e.target.value)}
                    className="max-w-md h-9 text-sm"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Partner Trade Name / Brand (if applicable)</td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="e.g. Company Name"
                    value={clientTradeName}
                    onChange={(e) => setClientTradeName(e.target.value)}
                    className="max-w-md h-9 text-sm"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                  Partner Jurisdiction <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="e.g., California, USA or United States"
                    value={clientJurisdiction}
                    onChange={(e) => setClientJurisdiction(e.target.value)}
                    className="max-w-md h-9 text-sm"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                  Partner Address <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="Full address / City, State, ZIP"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="max-w-md h-9 text-sm"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                  Partner Contact Name <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="Full Contact Name"
                    value={clientContactName}
                    onChange={(e) => setClientContactName(e.target.value)}
                    className="max-w-md h-9 text-sm"
                    required
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Partner Email</td>
                <td className="px-4 py-2">
                  <Input
                    type="email"
                    value={clientEmail}
                    readOnly
                    disabled
                    className="max-w-md h-9 text-sm bg-slate-50 cursor-not-allowed"
                  />
                </td>
              </tr>
              <tr className="bg-slate-50/30">
                <td className="px-4 py-3 font-semibold text-slate-600">Agency Legal Name</td>
                <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Agency Jurisdiction</td>
                <td className="px-4 py-3 text-slate-800">British Columbia, Canada</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Agency Email</td>
                <td className="px-4 py-3 text-slate-800">info@sienvi.com</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Agreement Purpose</td>
                <td className="px-4 py-3 font-medium text-purple-700">
                  Confidentiality, Non-Use, Non-Build & Feedback Collaboration
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Financial Terms</td>
                <td className="px-4 py-3 text-emerald-700 font-semibold">
                  None (Strategic Partnership — Zero Subscription or Monthly Service Fees)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Confidentiality Survival Period</td>
                <td className="px-4 py-2">
                  <Input
                    placeholder="e.g., 5 years"
                    value={confidentialityPeriod}
                    onChange={(e) => setConfidentialityPeriod(e.target.value)}
                    className="max-w-md h-9 text-sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (isViewMode) {
      return (
        <div className="mb-6 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm print:shadow-none print:border-slate-300">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 print:bg-slate-100 print:border-slate-300">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase print:text-slate-900">Agreement Details</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider print:border-slate-300 print:bg-transparent">
                <th className="px-4 py-2.5 text-left w-1/2 print:text-slate-700">Field</th>
                <th className="px-4 py-2.5 text-left w-1/2 print:text-slate-700">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800 w-1/2">Effective Date</td>
                <td className="px-4 py-3 text-slate-800 w-1/2">{effectiveDate}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Legal Name</td>
                <td className="px-4 py-3 text-slate-800">{clientLegalName}</td>
              </tr>
              {clientTradeName && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Trade Name / DBA, if applicable</td>
                  <td className="px-4 py-3 text-slate-800">{clientTradeName}</td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Jurisdiction</td>
                <td className="px-4 py-3 text-slate-800">{clientJurisdiction}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Address</td>
                <td className="px-4 py-3 text-slate-800">{clientAddress}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Contact Name</td>
                <td className="px-4 py-3 text-slate-800">{clientContactName}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Client Email</td>
                <td className="px-4 py-3 text-slate-800">{clientEmail}</td>
              </tr>
              {approvedWebsites && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Approved Website(s)</td>
                  <td className="px-4 py-3 text-slate-800">{approvedWebsites}</td>
                </tr>
              )}
              {shopifySite && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Shopify Site for AI Assistant</td>
                  <td className="px-4 py-3 text-slate-800">{shopifySite}</td>
                </tr>
              )}
              <tr className="bg-slate-50/30 print:bg-transparent">
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Legal Name</td>
                <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Description</td>
                <td className="px-4 py-3 text-slate-800">AI automation, search optimization, digital advertising, and business consulting</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Jurisdiction</td>
                <td className="px-4 py-3 text-slate-800">British Columbia, Canada</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Principal Office</td>
                <td className="px-4 py-3 text-slate-800">9194 Tronson Road, Vernon, BC, V1H1E2</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Email</td>
                <td className="px-4 py-3 text-slate-800">info@sienvi.com</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Initial Term</td>
                <td className="px-4 py-3 text-slate-800">{initialTerm}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Month-to-Month Renewal</td>
                <td className="px-4 py-3 text-slate-800">Yes, after the Initial Term</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Notice Period</td>
                <td className="px-4 py-3 text-slate-800">{noticePeriod} written notice</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Monthly Fee</td>
                <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600 print:text-slate-800">{getPlanPrice()}</td>
              </tr>
              {profile?.contractDetails?.setupFee && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">One-Time Setup Fee</td>
                  <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600 print:text-slate-800">{profile.contractDetails.setupFee}</td>
                </tr>
              )}
              {profile?.contractDetails?.commissionTerms && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Lead Generation Commissions</td>
                  <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600 print:text-slate-800">{profile.contractDetails.commissionTerms}</td>
                </tr>
              )}
              {profile?.contractDetails?.compensationStructure && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Compensation Breakdown</td>
                  <td className="px-4 py-3 text-slate-800 print:text-slate-800 leading-relaxed">{profile.contractDetails.compensationStructure}</td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Billing and Due Date</td>
                <td className="px-4 py-3 text-slate-800">{billingTerms}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Service Delivery</td>
                <td className="px-4 py-3 text-slate-800">{serviceDelivery}</td>
              </tr>
              {strategyPeriod && (
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Strategy Discussion Date / Period</td>
                  <td className="px-4 py-3 text-slate-800">{strategyPeriod}</td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Confidentiality Survival Period</td>
                <td className="px-4 py-3 text-slate-800">{confidentialityPeriod}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="mb-6 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm print:border-slate-300">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Agreement Details</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left w-1/2">Field</th>
              <th className="px-4 py-2.5 text-left w-1/2">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1 w-1/2">
                Effective Date <span className="text-red-500">*</span>
              </td>
              <td className="px-4 py-2 w-1/2">
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="max-w-md h-9 text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                Client Legal Name <span className="text-red-500">*</span>
              </td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., Acme Corporation LLC"
                  value={clientLegalName}
                  onChange={(e) => setClientLegalName(e.target.value)}
                  className="max-w-md h-9 text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Client Trade Name / DBA, if applicable</td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., Acme Labs"
                  value={clientTradeName}
                  onChange={(e) => setClientTradeName(e.target.value)}
                  className="max-w-md h-9 text-sm"
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                Client Jurisdiction <span className="text-red-500">*</span>
              </td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., Delaware, USA or Ontario, Canada"
                  value={clientJurisdiction}
                  onChange={(e) => setClientJurisdiction(e.target.value)}
                  className="max-w-md h-9 text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                Client Address <span className="text-red-500">*</span>
              </td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., 123 Main St, Suite 100, New York, NY 10001"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="max-w-md h-9 text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600 flex items-center gap-1">
                Client Contact Name <span className="text-red-500">*</span>
              </td>
              <td className="px-4 py-2">
                <Input
                  placeholder="Full Name"
                  value={clientContactName}
                  onChange={(e) => setClientContactName(e.target.value)}
                  className="max-w-md h-9 text-sm"
                  required
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Client Email</td>
              <td className="px-4 py-2">
                <Input
                  type="email"
                  value={clientEmail}
                  readOnly
                  disabled
                  className="max-w-md h-9 text-sm bg-slate-50 cursor-not-allowed"
                />
              </td>
            </tr>
            {profile?.contractDetails?.uploadedContractUrl && (
              <>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">Approved Website(s)</td>
                  <td className="px-4 py-2">
                    <Input
                      placeholder="e.g., www.example.com"
                      value={approvedWebsites}
                      onChange={(e) => setApprovedWebsites(e.target.value)}
                      className="max-w-md h-9 text-sm"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">Shopify Site for AI Assistant</td>
                  <td className="px-4 py-2">
                    <Input
                      placeholder="e.g., mystore.myshopify.com"
                      value={shopifySite}
                      onChange={(e) => setShopifySite(e.target.value)}
                      className="max-w-md h-9 text-sm"
                    />
                  </td>
                </tr>
              </>
            )}
            <tr className="bg-slate-50/30">
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Legal Name</td>
              <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Description</td>
              <td className="px-4 py-3 text-slate-800">AI automation, search optimization, digital advertising, and business consulting</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Jurisdiction</td>
              <td className="px-4 py-3 text-slate-800">British Columbia, Canada</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Principal Office</td>
              <td className="px-4 py-3 text-slate-800">9194 Tronson Road, Vernon, BC, V1H1E2</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Email</td>
              <td className="px-4 py-3 text-slate-800">info@sienvi.com</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Initial Term</td>
              <td className="px-4 py-3 text-slate-800">{initialTerm}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Month-to-Month Renewal</td>
              <td className="px-4 py-3 text-slate-800">Yes, after the Initial Term</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Notice Period</td>
              <td className="px-4 py-3 text-slate-800">{noticePeriod} written notice</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Monthly Fee</td>
              <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600">{getPlanPrice()}</td>
            </tr>
            {profile?.contractDetails?.setupFee && (
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">One-Time Setup Fee</td>
                <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600">{profile.contractDetails.setupFee}</td>
              </tr>
            )}
            {profile?.contractDetails?.commissionTerms && (
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Lead Generation Commissions</td>
                <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600">{profile.contractDetails.commissionTerms}</td>
              </tr>
            )}
            {profile?.contractDetails?.compensationStructure && (
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600">Compensation Breakdown</td>
                <td className="px-4 py-3 text-slate-800 leading-relaxed">{profile.contractDetails.compensationStructure}</td>
              </tr>
            )}
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Billing and Due Date</td>
              <td className="px-4 py-3 text-slate-800">{billingTerms}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Service Delivery</td>
              <td className="px-4 py-3 text-slate-800">{serviceDelivery}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Strategy Discussion Date / Period</td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., June 2026 or leave blank"
                  value={strategyPeriod}
                  onChange={(e) => setStrategyPeriod(e.target.value)}
                  className="max-w-md h-9 text-sm"
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Confidentiality Survival Period</td>
              <td className="px-4 py-2">
                <Input
                  placeholder="e.g., 5 years"
                  value={confidentialityPeriod}
                  onChange={(e) => setConfidentialityPeriod(e.target.value)}
                  className="max-w-md h-9 text-sm"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>Contract Already Signed</CardTitle>
                <CardDescription>
                  You have already signed the service agreement.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="outline" onClick={() => window.open("/contract?view=true", "_blank")}>
                  View Signed Copy
                </Button>
                <Button onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 container mx-auto px-4 py-8 print:py-0 print:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-6 print:space-y-0"
        >
          {/* Header */}
          <div className="flex items-center gap-4 print:hidden">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center space-y-2 print:hidden">
            {isPartnership ? (
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">Partnership NDA</Badge>
            ) : (
              <Badge className="bg-blue-500">Step 2 of 4</Badge>
            )}
            <h1 className="text-3xl font-bold">
              {isPartnership
                ? "Confidentiality & Non-Disclosure Agreement"
                : isAmazonContract
                ? "Business Agreement"
                : "Service Agreement"}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isPartnership
                ? "Please review and digitally sign the Confidentiality, Non-Use, Non-Build & Feedback Agreement to confirm our strategic partnership."
                : "Please review and sign the agreement to continue."}
            </p>
          </div>

          {/* Contract Content */}
          <Card className="print:border-none print:shadow-none print:bg-white">
            <CardHeader className="print:p-0 print:pb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary print:hidden" />
                <CardTitle className="print:text-xl print:font-bold">
                  {isPartnership
                    ? (profile?.contractDetails?.uploadedContractName || "CHEERCPT — Confidentiality, Non-Use, Non-Build & Feedback Agreement")
                    : isAmazonContract 
                    ? "Business Agreement for Amazon Advertising Services" 
                    : "Client Service Agreement"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none print:p-0">
              {profile?.contractDetails?.uploadedContractUrl ? (() => {
                const contractUrl = profile.contractDetails.uploadedContractUrl;
                const fileName = profile.contractDetails.uploadedContractName || 'Service Agreement';
                const isPdf = contractUrl.toLowerCase().endsWith('.pdf');
                const isDocx = contractUrl.toLowerCase().endsWith('.docx') || contractUrl.toLowerCase().endsWith('.doc');

                return (
                  <>
                    {/* Show agreement details: static in view mode, editable in signing mode */}
                    {renderAgreementDetailsTable()}
                    
                    {profile?.contractDetails?.uploadedProposalUrl && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-blue-50/60 shadow-sm print:hidden">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-600 text-white text-[10px] py-0 px-2 font-semibold">PROPOSAL</Badge>
                              <p className="font-semibold text-sm text-slate-900">
                                {profile.contractDetails.uploadedProposalName || "B2B Revenue Pipeline & Wholesale Portal Proposal"}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Comprehensive proposal outlining project scope, revenue architecture, and delivery timeline
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(profile.contractDetails.uploadedProposalUrl, "_blank")}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0 font-medium text-xs shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View Proposal PDF
                        </Button>
                      </div>
                    )}

                    <h3 className="font-semibold text-base mt-4 mb-2">Contract Document</h3>

                    {isPdf ? (
                      <div className="w-full rounded-lg border overflow-hidden bg-white mb-6 print:border-none print:rounded-none print:overflow-visible print:mb-0">
                        <div className="max-h-[650px] overflow-y-auto print:max-h-none print:overflow-visible">
                          <Document
                            file={contractUrl}
                            onLoadSuccess={onPdfLoadSuccess}
                            loading={
                              <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                                <span className="text-sm text-muted-foreground">Loading contract...</span>
                              </div>
                            }
                            error={
                              <div className="text-center p-8 text-muted-foreground">
                                <p className="font-medium">Unable to load PDF</p>
                                <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm mt-2 inline-block">
                                  Download document instead →
                                </a>
                              </div>
                            }
                          >
                            {Array.from(new Array(pdfNumPages), (_, i) => (
                              <div key={`page_${i + 1}`} className="border-b border-slate-100 last:border-b-0 print:border-b-0 print:break-after-page">
                                <Page
                                  pageNumber={i + 1}
                                  width={680}
                                  renderTextLayer={true}
                                  renderAnnotationLayer={true}
                                />
                              </div>
                            ))}
                          </Document>
                        </div>
                      </div>
                    ) : isDocx ? (() => {
                      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(contractUrl)}`;
                      return (
                        <>
                          <div className="w-full rounded-lg border overflow-hidden bg-white mb-6 print:hidden">
                            <iframe
                              src={viewerUrl}
                              className="w-full h-[650px] border-none min-h-[600px]"
                              title="Service Agreement"
                            />
                            <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 border-t">
                              <a
                                href={contractUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Download original document: {fileName}
                              </a>
                            </div>
                          </div>
                          <div className="hidden print:block text-center p-6 border-2 border-slate-300 rounded-lg bg-slate-50 mb-6">
                            <p className="font-semibold text-slate-700 text-sm">📎 Custom Agreement Document Attached</p>
                            <p className="text-xs text-slate-500 mt-1">{fileName}</p>
                            <p className="text-xs text-slate-400 mt-2 italic">The full contract document has been reviewed and agreed to by both parties as referenced above.</p>
                          </div>
                        </>
                      );
                    })() : (
                      <div className="bg-muted p-6 rounded-lg space-y-4 text-sm mb-6">
                        <p className="font-medium">Custom Agreement Uploaded</p>
                        <p className="text-muted-foreground">Document: {fileName}</p>
                        <a
                          href={contractUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-primary hover:underline font-medium"
                        >
                          Open / Download Agreement Document →
                        </a>
                        <p className="text-xs text-muted-foreground">Please review the agreement above and sign below.</p>
                      </div>
                    )}
                  </>
                );
              })() : isAmazonContract ? (
                <div className="bg-muted p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4 text-sm print:bg-white print:max-h-none print:p-0 print:overflow-visible">
                  <h3 className="font-semibold text-center text-base border-b pb-2 mb-4 print:hidden">BUSINESS AGREEMENT FOR AMAZON ADVERTISING SERVICES</h3>
                  {renderAgreementDetailsTable()}
                  
                  <p>
                    This Business Agreement ("Agreement") is made effective as of the date of signing, 
                    between the undersigned client ("Client"), and Sienvi Agency, a company specialized in AI Automations & 
                    Advertising, organized and existing under the laws of British Columbia, Canada with its principal office 
                    located at 9194 Tronson Road, Vernon, BC, V1H1E2 ("Agency").
                  </p>

                  <p className="italic">
                    WHEREAS, the Agency agrees to provide Amazon PPC Advertising services to the Client according to the terms and conditions of this Agreement; and<br />
                    WHEREAS, the Client agrees to engage the Agency for such services and to pay the Agency for the services provided;<br />
                    NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties hereto agree as follows:
                  </p>

                  <h4 className="font-semibold mt-4">1. Services Provided</h4>
                  <p>
                    The Agency shall provide the Client with Amazon PPC Advertising ("Services") as described in Exhibit A attached hereto. 
                    The Agency agrees to use its best efforts to provide the Services in accordance with industry standards.
                  </p>

                  <h4 className="font-semibold mt-4">2. Payment</h4>
                  <p>
                    The Client agrees to pay the Agency as outlined in Exhibit B attached hereto for the provision of the Services.
                  </p>

                  <h4 className="font-semibold mt-4">3. Term and Termination</h4>
                  <p>
                    This Agreement shall commence on the date of signing and continue in effect for the Initial Term of {initialTerm} and on a 
                    month-to-month basis thereafter, unless terminated earlier by either party with {noticePeriod} written notice.
                  </p>

                  <h4 className="font-semibold mt-4">4. Confidentiality</h4>
                  <p>
                    Both parties agree to maintain the confidentiality of each other's proprietary information as per Exhibit C. 
                    The automations and content created by the Agency will be provided to the Client by the end of the contract.
                  </p>

                  <h4 className="font-semibold mt-4">5. Governing Law</h4>
                  <p>
                    This Agreement shall be governed by the laws of British Columbia, Canada.
                  </p>

                  <h4 className="font-semibold mt-4">6. Entire Agreement</h4>
                  <p>
                    This, together with any exhibits, constitutes the entire agreement between the parties on this subject.
                  </p>

                  <h4 className="font-semibold mt-4">7. Amendment</h4>
                  <p>
                    Any amendments must be in writing and signed by both parties.
                  </p>

                  <h4 className="font-semibold mt-4">8. Counterparts</h4>
                  <p>
                    This Agreement may be executed in counterparts, each of which shall be deemed an original.
                  </p>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-semibold text-base mb-2">Exhibit A: Description of Services</h3>
                    <p className="font-medium">Amazon PPC Advertising:</p>
                    <p>
                      The Agency will develop a comprehensive strategy tailored to the Client's business goals and targets discussed 
                      during the Strategy Discussion. These include the following:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Discovery:</strong> A full discovery over a 1-2 week period to determine logins, gaps, errors and current business infrastructure.</li>
                      <li><strong>Prioritization:</strong> Post discovery, the Agency will prioritize what elements of advertising additions, improvements and automations are at the forefront of the work.</li>
                      <li><strong>Data Analysis:</strong> Monitoring and analysis of engagement metrics to assess the company's performance and processes.</li>
                      <li><strong>Content Optimization:</strong> Review and suggested optimization of content based on performance data and social media trends to maximize reach and engagement using AI Optimizations and Analysis. <em>NOTE: this does not include content creation by the Agency.</em></li>
                      <li><strong>Weekly Reporting:</strong> The Agency will provide weekly reporting via calls or Loom.com updates for the Client to understand data trends, progress and insights. The Agency will provide reporting from one Agency representative. The founder will oversee all processes by the Agency and report as required.</li>
                      <li><strong>PPC Amazon Advertising:</strong> The Agency will create, monitor, and modify PPC Advertising campaigns specifically in Amazon as requested by the Client.</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-semibold text-base mb-2">Exhibit B: Payment Terms</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Fee Structure:</strong> {formattedPrice} for {initialTerm}.</li>
                      <li><strong>Payment Schedule:</strong> Payments to be made on a monthly basis, within 7 days of invoice receipt on the 7th of each month.</li>
                      <li><strong>Late Payment:</strong> Late payments may incur a late fee of 2% per month on the overdue amount.</li>
                      <li><strong>Expenses:</strong> The Client is responsible for any additional costs agreed upon for all payments to be made directly to third-party vendors unless otherwise agreed. This includes PPC costs on all applicable advertising platforms such as Amazon and other related e-commerce and social channels.</li>
                      <li><strong>Adjustments and Reviews:</strong> The fee structure and scope of services may be reviewed and adjusted periodically upon mutual agreement with 30 days notice.</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-semibold text-base mb-2">Exhibit C: Confidentiality Agreement</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Confidential Information Protection:</strong> Obligation to both parties to protect and not disclose confidential information related to business strategies, content plans, analytics, and any proprietary tools or data.</li>
                      <li><strong>Exceptions:</strong> Standard exceptions to confidentiality obligations apply, as detailed in the main agreement.</li>
                      <li><strong>Duration:</strong> The confidentiality obligations shall continue for the Confidentiality Survival Period after the termination of this Agreement.</li>
                      <li><strong>Return or Destruction:</strong> Upon termination, confidential information shall be returned or destroyed as agreed upon.</li>
                    </ul>
                  </div>
                </div>
              ) : isNda ? (
                <div className="bg-muted p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4 text-sm print:bg-white print:max-h-none print:p-0 print:overflow-visible">
                  <h3 className="font-semibold print:hidden">Confidentiality, Non-Use, Non-Build & Feedback Agreement</h3>
                  {renderAgreementDetailsTable()}

                  <p>
                    This Confidentiality, Non-Use, Non-Build & Feedback Agreement ("Agreement") is entered into 
                    between SIENVI Agency ("Disclosing Party") and the undersigned strategic partner ("Receiving Party"), 
                    collectively referred to as the "Parties."
                  </p>

                  <h4 className="font-semibold mt-4">1. Purpose</h4>
                  <p>
                    The Parties wish to explore a potential strategic collaboration. In connection with this exploration, 
                    the Disclosing Party may share certain proprietary and confidential information with the Receiving Party. 
                    This Agreement sets forth the terms under which such information will be disclosed and protected.
                  </p>

                  <h4 className="font-semibold mt-4">2. Definition of Confidential Information</h4>
                  <p>
                    "Confidential Information" means any and all non-public, proprietary, or trade secret information 
                    disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, electronically, 
                    or by any other means, including but not limited to: business strategies, marketing plans, client lists, 
                    AI systems, automation workflows, software tools, processes, pricing models, financial data, analytics, 
                    product roadmaps, and any other information marked or reasonably understood to be confidential.
                  </p>

                  <h4 className="font-semibold mt-4">3. Non-Use Obligation</h4>
                  <p>
                    The Receiving Party agrees not to use any Confidential Information for any purpose other than 
                    evaluating and engaging in the proposed strategic collaboration with the Disclosing Party. 
                    The Receiving Party shall not exploit, commercialize, or otherwise benefit from the Confidential 
                    Information outside the scope of this Agreement.
                  </p>

                  <h4 className="font-semibold mt-4">4. Non-Build Obligation</h4>
                  <p>
                    The Receiving Party agrees not to design, develop, build, replicate, reverse-engineer, or create 
                    any product, service, tool, workflow, or system that is substantially similar to or derived from 
                    the Confidential Information disclosed under this Agreement.
                  </p>

                  <h4 className="font-semibold mt-4">5. Non-Disclosure Obligation</h4>
                  <p>
                    The Receiving Party agrees to hold all Confidential Information in strict confidence and not to 
                    disclose it to any third party without the prior written consent of the Disclosing Party, except 
                    to those employees, contractors, or advisors who have a need to know and are bound by obligations 
                    of confidentiality no less restrictive than those set forth herein.
                  </p>

                  <h4 className="font-semibold mt-4">6. Feedback</h4>
                  <p>
                    If the Receiving Party provides any feedback, suggestions, or recommendations ("Feedback") 
                    regarding the Confidential Information or the Disclosing Party's products, services, or strategies, 
                    the Disclosing Party shall be free to use, disclose, reproduce, and otherwise exploit such 
                    Feedback without restriction or obligation of any kind.
                  </p>

                  <h4 className="font-semibold mt-4">7. Term and Survival</h4>
                  <p>
                    This Agreement shall remain in effect for the duration of the strategic collaboration. 
                    The confidentiality, non-use, and non-build obligations shall survive for the Confidentiality 
                    Survival Period ({confidentialityPeriod}) following the termination or expiration of this Agreement. 
                    Either party may terminate this Agreement with {noticePeriod} written notice.
                  </p>

                  <h4 className="font-semibold mt-4">8. Return of Materials</h4>
                  <p>
                    Upon termination of this Agreement or upon request by the Disclosing Party, the Receiving Party 
                    shall promptly return or destroy all Confidential Information and any copies thereof.
                  </p>

                  <h4 className="font-semibold mt-4">9. Governing Law</h4>
                  <p>
                    This Agreement shall be governed by and construed in accordance with the laws of the 
                    applicable jurisdiction agreed upon by both parties.
                  </p>

                  <h4 className="font-semibold mt-4">10. Entire Agreement</h4>
                  <p>
                    This Agreement constitutes the entire understanding between the Parties with respect to the 
                    subject matter hereof and supersedes all prior negotiations, representations, or agreements 
                    relating thereto. Any amendments must be in writing and signed by both Parties.
                  </p>

                  <p className="mt-6 italic text-muted-foreground">
                    By signing below, you acknowledge that you have read, understood, and 
                    agree to be bound by the terms of this Confidentiality, Non-Use, Non-Build & Feedback Agreement.
                  </p>
                </div>
              ) : (
                <div className="bg-muted p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4 text-sm print:bg-white print:max-h-none print:p-0 print:overflow-visible">
                  <h3 className="font-semibold print:hidden">Terms of Service</h3>
                  {renderAgreementDetailsTable()}
                  
                  <p>
                    This Service Agreement ("Agreement") is entered into between SIENVI Agency 
                    ("Provider") and the undersigned client ("Client").
                  </p>

                  <h4 className="font-semibold mt-4">1. Services</h4>
                  <p>
                    Provider agrees to deliver the services as outlined in the selected plan, 
                    including but not limited to digital marketing, automation, and related 
                    consulting services.
                  </p>

                  <h4 className="font-semibold mt-4">2. Payment Terms</h4>
                  <p>
                    Client agrees to pay {formattedPrice} as the monthly subscription fee via the 
                    payment method on file. Payments are processed automatically on each 
                    billing cycle.
                  </p>

                  <h4 className="font-semibold mt-4">3. Term and Termination</h4>
                  <p>
                    This Agreement remains in effect for the duration of the subscription. 
                    Either party may terminate with 30 days written notice.
                  </p>

                  <h4 className="font-semibold mt-4">4. Confidentiality</h4>
                  <p>
                    Both parties agree to maintain confidentiality of proprietary information 
                    shared during the course of this engagement.
                  </p>

                  <h4 className="font-semibold mt-4">5. Limitation of Liability</h4>
                  <p>
                    Provider's liability shall be limited to the fees paid by Client in the 
                    12 months preceding any claim.
                  </p>

                  <h4 className="font-semibold mt-4">6. Governing Law</h4>
                  <p>
                    This Agreement shall be governed by the laws of the State of California.
                  </p>

                  <p className="mt-6 italic text-muted-foreground">
                    By signing below, you acknowledge that you have read, understood, and 
                    agree to be bound by the terms of this Agreement.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-4 print:p-0 print:pt-4">
              {(() => {
                const clientEntityName = clientLegalName || clientTradeName || profile?.contractDetails?.clientLegalName || profile?.contractDetails?.clientTradeName || profile?.entityName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Partner";
                const displaySignDate = effectiveDate ? new Date(effectiveDate + 'T00:00:00').toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                const isDual = coSigners && coSigners.length > 1;

                if (isViewMode || alreadySigned) {
                  return (
                    <div className="w-full space-y-6 pt-4 border-t">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isDual 
                              ? `Authorized Co-Signatures (${profile?.entityName || "In the Dome"})` 
                              : isPartnership
                              ? "Authorized Strategic Partner Digital Signature"
                              : "Authorized Digital Signature"}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">Entity: <strong className="text-slate-800">{clientEntityName}</strong></span>
                        </div>

                        {isDual ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {coSigners.map((signer: any, idx: number) => {
                              const isSignerCompleted = signer.status === "signed" || !!signer.signature;
                              return (
                                <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Co-Signer {idx + 1}</span>
                                    {isSignerCompleted ? (
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">✓ Signed</Badge>
                                    ) : (
                                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Awaiting Signature</Badge>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Signer Legal Name:</p>
                                    <p className="font-bold text-slate-900">{signer.name || signer.email}</p>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200">
                                    <p className="text-xs text-slate-500">Digital Signature:</p>
                                    <p className="font-serif italic font-bold text-2xl text-indigo-700 py-1">
                                      {signer.signature || "(Pending Execution)"}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                                    <div>
                                      <span className="text-slate-400 block">Title:</span>
                                      <span className="font-semibold text-slate-700">{signer.title || "Co-Founder / Principal"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block">Date Signed:</span>
                                      <span className="font-semibold text-slate-700">
                                        {signer.signedAt ? new Date(signer.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Pending"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-3 max-w-lg">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase">For and on behalf of:</p>
                              <p className="font-bold text-base text-slate-900">{clientEntityName}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-xs text-slate-500">Authorized Digital Signature:</p>
                              <p className="font-serif italic font-bold text-2xl text-indigo-700 py-1">
                                {profile?.contractSignature || signatureName || "Jordan"}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
                              <div>
                                <span className="text-slate-400 block">Title:</span>
                                <span className="font-semibold text-slate-700">{signerTitle || (isPartnership ? "Partner / Principal" : "Authorized Signatory")}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block">Date Signed:</span>
                                <span className="font-semibold text-slate-700">
                                  {profile?.contractSignedAt ? new Date(profile.contractSignedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : displaySignDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-4 bg-muted/50 p-4 rounded-lg no-print print:hidden">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-green-500" />
                          This document is digitally signed and securely archived.
                        </span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
                            Back to Dashboard
                          </Button>
                          <Button size="sm" variant="default" onClick={() => window.print()}>
                            Print / Save as PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (hasMySignature) {
                  return (
                    <div className="w-full space-y-6 pt-4 border-t">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>You have submitted your signature as {signatureName || currentSignerName}</span>
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          {isDual 
                            ? "This agreement requires co-signatures from both co-founders before full execution. We are awaiting the second signature."
                            : "Your signature has been securely submitted and recorded."}
                        </p>
                      </div>

                      {isDual && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                          {coSigners.map((signer: any, idx: number) => {
                            const isSignerCompleted = signer.status === "signed" || !!signer.signature;
                            return (
                              <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500">{signer.name || signer.email}</span>
                                  {isSignerCompleted ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">✓ Signed</Badge>
                                  ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Pending</Badge>
                                  )}
                                </div>
                                <p className="font-serif italic text-lg text-indigo-700">{signer.signature || "Awaiting Signature"}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-4 bg-muted/50 p-4 rounded-lg">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          Signature recorded securely. You will be notified once fully executed.
                        </span>
                        <Button size="sm" variant="default" onClick={() => navigate("/dashboard")}>
                          Continue to Dashboard
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="w-full space-y-4">
                    {isDual && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                        <span>Co-Signers Review: <strong>Jordan Ellams & Michael Wilson (In the Dome)</strong></span>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 text-xs">2 Signatures Required</Badge>
                      </div>
                    )}

                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signing Entity</p>
                        <p className="text-base font-bold text-slate-900">
                          {clientEntityName}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="signatureName" className="text-xs font-semibold text-slate-600">
                            Full Legal Name (Digital Signature) *
                          </Label>
                          <Input 
                            id="signatureName"
                            placeholder="Type your full name to sign"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            className="font-medium bg-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signerTitle" className="text-xs font-semibold text-slate-600">
                            Title / Role
                          </Label>
                          <Input 
                            id="signerTitle"
                            placeholder={isPartnership ? "e.g. Partner / Principal" : "e.g. Co-Founder / Principal"}
                            value={signerTitle}
                            onChange={(e) => setSignerTitle(e.target.value)}
                            className="font-medium bg-white"
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 pt-1">
                        <span>Date: </span>
                        <span className="font-semibold text-slate-700">{displaySignDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full p-4 bg-muted/50 rounded-lg">
                      <Checkbox 
                        id="agree" 
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      />
                      <label 
                        htmlFor="agree" 
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        I have read and agree to the terms of this {isPartnership ? "Confidentiality & Non-Disclosure Agreement" : isAmazonContract ? "Business Agreement" : "Service Agreement"} on behalf of {clientEntityName}
                      </label>
                    </div>

                    <Button 
                      onClick={handleSign} 
                      disabled={!agreed || signing || !signatureName.trim()}
                      className={isPartnership ? "w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold" : "w-full"}
                      size="lg"
                    >
                      {signing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileSignature className="w-4 h-4 mr-2" />
                      )}
                      {isPartnership ? "Sign & Accept NDA" : "Sign Agreement"}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span>Your signature is legally binding and securely stored</span>
                    </div>
                  </div>
                );
              })()}
            </CardFooter>
          </Card>
        </motion.div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default Contract;