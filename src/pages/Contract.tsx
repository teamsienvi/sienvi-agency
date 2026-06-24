import { useState, useEffect } from "react";
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

  const isAmazonContract = profile?.plan === "amazon" || 
    (profile?.selectedServices || []).includes("channel-amazon") || 
    (profile?.selectedServices || []).includes("amazon-design");

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

      const response = await supabase.functions.invoke("get-client-profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || response.data.error) {
        navigate("/dashboard");
        return;
      }

      const profile = response.data.profile;
      setProfile(profile);
      
      // Check if payment is complete
      if (profile.subscriptionStatus !== "active" && !isViewMode) {
        toast.error("Please complete payment first");
        navigate("/dashboard");
        return;
      }

      // Check if already signed
      if (profile.contractStatus === "signed" && !isViewMode) {
        setAlreadySigned(true);
      }

      // Pre-populate Agreement Details fields
      const details = profile.contractDetails || {};
      setEffectiveDate(details.effectiveDate || new Date().toISOString().substring(0, 10));
      setClientLegalName(details.clientLegalName || "");
      setClientTradeName(details.clientTradeName || "");
      setClientJurisdiction(details.clientJurisdiction || "");
      setClientAddress(details.clientAddress || "");
      setClientContactName(details.clientContactName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim());
      setClientEmail(details.clientEmail || profile.email || "");
      setStrategyPeriod(details.strategyPeriod || "");
      setConfidentialityPeriod(details.confidentialityPeriod || "5 years");

    } catch (error: any) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = () => {
    if (profile?.customPrice) {
      return `$${profile.customPrice} USD/month`;
    }
    switch (profile?.plan) {
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
        if (channelsCount === 1) return "$888 USD/month";
        if (channelsCount === 2) return "$1,776 USD/month";
        if (channelsCount === 3) return "$1,479 USD/month";
        if (channelsCount === 4) return "$1,971 USD/month";
        if (channelsCount === 5) return "$2,464 USD/month";
        if (channelsCount === 6) return "$2,957 USD/month";
        if (channelsCount === 7) return "$3,450 USD/month";
        return "$888 USD/month";
      }
      default:
        return "$888 USD/month";
    }
  };

  const handleSign = async () => {
    if (!effectiveDate) {
      toast.error("Please select an Effective Date");
      return;
    }
    if (!clientLegalName.trim()) {
      toast.error("Please enter your Client Legal Name");
      return;
    }
    if (!clientJurisdiction.trim()) {
      toast.error("Please enter your Client Jurisdiction");
      return;
    }
    if (!clientAddress.trim()) {
      toast.error("Please enter your Client Address");
      return;
    }
    if (!clientContactName.trim()) {
      toast.error("Please enter your Client Contact Name");
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
        effectiveDate,
        clientLegalName: clientLegalName.trim(),
        clientTradeName: clientTradeName.trim(),
        clientJurisdiction: clientJurisdiction.trim(),
        clientAddress: clientAddress.trim(),
        clientContactName: clientContactName.trim(),
        clientEmail: clientEmail.trim(),
        strategyPeriod: strategyPeriod.trim(),
        confidentialityPeriod: confidentialityPeriod.trim(),
      };

      const response = await supabase.functions.invoke("update-client-status", {
        body: { 
          action: "sign_contract",
          signature: signatureName.trim(),
          contractDetails
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data.error) throw new Error(response.data.error);

      toast.success("Contract signed successfully!");
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  const renderAgreementDetailsTable = () => {
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
              <tr className="bg-slate-50/30 print:bg-transparent">
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Legal Name</td>
                <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Agency Description</td>
                <td className="px-4 py-3 text-slate-800">A company specialized in AI Automations & Advertising</td>
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
                <td className="px-4 py-3 text-slate-800">3 months</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Month-to-Month Renewal</td>
                <td className="px-4 py-3 text-slate-800">Yes, after the Initial Term</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Monthly Fee</td>
                <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600 print:text-slate-800">{getPlanPrice()}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Invoice Date</td>
                <td className="px-4 py-3 text-slate-800">7th of each month</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-600 print:text-slate-800">Payment Due Date</td>
                <td className="px-4 py-3 text-slate-800">Within 7 days of invoice receipt</td>
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
            <tr className="bg-slate-50/30">
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Legal Name</td>
              <td className="px-4 py-3 text-slate-800">Sienvi Agency</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Agency Description</td>
              <td className="px-4 py-3 text-slate-800">A company specialized in AI Automations & Advertising</td>
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
              <td className="px-4 py-3 text-slate-800">3 months</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Month-to-Month Renewal</td>
              <td className="px-4 py-3 text-slate-800">Yes, after the Initial Term</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Monthly Fee</td>
              <td className="px-4 py-3 text-slate-800 font-medium text-indigo-600">{getPlanPrice()}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Invoice Date</td>
              <td className="px-4 py-3 text-slate-800">7th of each month</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-600">Payment Due Date</td>
              <td className="px-4 py-3 text-slate-800">Within 7 days of invoice receipt</td>
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
            <Badge className="bg-blue-500">Step 2 of 4</Badge>
            <h1 className="text-3xl font-bold">
              {isAmazonContract ? "Business Agreement" : "Service Agreement"}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Please review and sign the agreement to continue.
            </p>
          </div>

          {/* Contract Content */}
          <Card className="print:border-none print:shadow-none print:bg-white">
            <CardHeader className="print:p-0 print:pb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary print:hidden" />
                <CardTitle className="print:text-xl print:font-bold">
                  {isAmazonContract 
                    ? "Business Agreement for Amazon Advertising Services" 
                    : "Client Service Agreement"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none print:p-0">
              {isAmazonContract ? (
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
                    This Agreement shall commence on the date of signing and continue in effect for the Initial Term of 3 months and on a 
                    month-to-month basis thereafter, unless terminated earlier by either party with 30 days written notice.
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
                      <li><strong>Fee Structure:</strong> $888 USD/month for 3 months.</li>
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
                    Client agrees to pay the agreed-upon monthly subscription fee via the 
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
              {isViewMode ? (
                <div className="w-full space-y-6 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-500">For SIENVI Agency:</p>
                      <p className="font-bold font-serif italic text-lg py-2 border-b">SIENVI Agency</p>
                      <p className="text-xs text-muted-foreground">Authorized Representative</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-500">For Client:</p>
                      <p className="font-bold font-serif italic text-lg py-2 border-b text-indigo-700">
                        {profile?.contractSignature || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">Digitally Signed Name</p>
                      {profile?.contractSignedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Date: {new Date(profile.contractSignedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })} at {new Date(profile.contractSignedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-4 bg-muted/50 p-4 rounded-lg no-print print:hidden">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-green-500" />
                      This document is digitally signed and securely archived.
                    </span>
                    <Button size="sm" variant="default" onClick={() => window.print()}>
                      Print / Save as PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-2 mb-2">
                    <Label htmlFor="signatureName">Full Name (Acts as your digital signature)</Label>
                    <Input 
                      id="signatureName"
                      placeholder="Type your full name to sign"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      className="font-medium"
                    />
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
                      I have read and agree to the terms of this {isAmazonContract ? "Business Agreement" : "Service Agreement"}
                    </label>
                  </div>

                  <Button 
                    onClick={handleSign} 
                    disabled={!agreed || signing}
                    className="w-full"
                    size="lg"
                  >
                    {signing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSignature className="w-4 h-4 mr-2" />
                    )}
                    Sign Agreement
                  </Button>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Your signature is legally binding and securely stored</span>
                  </div>
                </>
              )}
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