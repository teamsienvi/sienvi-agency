import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  Search,
  Copy,
  ExternalLink,
  Eye,
  Check,
  RefreshCw,
  UserPlus,
  ArrowRightLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AddManualClientModal } from "@/components/admin/AddManualClientModal";
import { MigrateToStripeModal } from "@/components/admin/MigrateToStripeModal";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { DeleteClientDialog } from "@/components/admin/DeleteClientDialog";

interface Client {
  id: string;
  email: string | null;
  clientName: string | null;
  plan: string | null;
  subscriptionStatus: string;
  isActive: boolean;
  selectedServices: string[];
  onboardingCompleted: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  customPrice: number | null;
  maxServices: number | null;
  notes: string | null;
  isManual: boolean;
  paymentMethod: string;
  migrationStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

const planPrices: Record<string, number> = {
  single: 888,
  triple: 2398.20,
  full: 3996,
};

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [migrateClient, setMigrateClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  useEffect(() => {
    checkAdminAndFetchClients();
  }, []);

  const checkAdminAndFetchClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Admin access required");
        navigate("/");
        return;
      }

      await fetchClients();
    } catch (error) {
      console.error("Error:", error);
      navigate("/admin");
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("get-admin-clients", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setClients(response.data.clients || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (client: Client) => {
    // Manual client statuses
    if (client.isManual || client.paymentMethod === "manual" || client.paymentMethod === "invoice") {
      if (client.migrationStatus === "pending_migration") {
        return <Badge className="bg-blue-500 hover:bg-blue-600">Pending Migration</Badge>;
      }
      if (!client.isActive || client.subscriptionStatus === "canceled") {
        return <Badge variant="destructive">Canceled</Badge>;
      }
      return <Badge className="bg-gray-500 hover:bg-gray-600">Manual</Badge>;
    }
    
    // Stripe client statuses
    if (!client.isActive || client.subscriptionStatus === "canceled") {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    if (client.subscriptionStatus === "past_due") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Past Due</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const getPaymentMethodBadge = (client: Client) => {
    if (client.paymentMethod === "manual") {
      return <Badge variant="outline" className="text-xs">Manual</Badge>;
    }
    if (client.paymentMethod === "invoice") {
      return <Badge variant="outline" className="text-xs">Invoice</Badge>;
    }
    return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Stripe</Badge>;
  };

  const getPlanDisplay = (plan: string | null, customPrice: number | null) => {
    if (plan === "custom" && customPrice) {
      return `Custom ($${customPrice}/mo)`;
    }
    const planLabels: Record<string, string> = {
      single: "Single Service",
      triple: "Triple Automation",
      full: "Full Automation",
    };
    return planLabels[plan || ""] || plan || "Unknown";
  };

  const getMonthlyPrice = (plan: string | null, customPrice: number | null) => {
    if (plan === "custom" && customPrice) return customPrice;
    return planPrices[plan || ""] || 0;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(`https://dashboard.stripe.com/customers/${customerId}`, "_blank");
  };

  // Filter and sort clients
  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesPlan = planFilter === "all" || client.plan === planFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && client.isActive && client.subscriptionStatus === "active") ||
        (statusFilter === "past_due" && client.subscriptionStatus === "past_due") ||
        (statusFilter === "canceled" && (!client.isActive || client.subscriptionStatus === "canceled"));
      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "highest_value") {
        return getMonthlyPrice(b.plan, b.customPrice) - getMonthlyPrice(a.plan, a.customPrice);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Client Overview</h1>
                <p className="text-muted-foreground">
                  Manage and monitor all client subscriptions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Manual Client
              </Button>
              <Button onClick={fetchClients} variant="outline" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{clients.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {clients.filter((c) => c.isActive && c.subscriptionStatus === "active").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Custom Plans</p>
            <p className="text-2xl font-bold text-primary">
              {clients.filter((c) => c.plan === "custom").length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-muted-foreground">Est. MRR</p>
            <p className="text-2xl font-bold">
              ${clients
                .filter((c) => c.isActive)
                .reduce((sum, c) => sum + getMonthlyPrice(c.plan, c.customPrice), 0)
                .toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-xl border shadow-sm mb-6"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="single">Single Service</SelectItem>
                <SelectItem value="triple">Triple Automation</SelectItem>
                <SelectItem value="full">Full Automation</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest_value">Highest Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No clients found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {client.clientName || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.email || "No email"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {getPlanDisplay(client.plan, client.customPrice)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${getMonthlyPrice(client.plan, client.customPrice).toLocaleString()}/mo
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(client)}
                        {getPaymentMethodBadge(client)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {client.selectedServices.length > 0 ? (
                          client.selectedServices.slice(0, 2).map((service, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                        {client.selectedServices.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{client.selectedServices.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.onboardingCompleted ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditClient(client)}
                          title="Edit Client"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteClient(client)}
                          title="Delete Client"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {(client.isManual || client.paymentMethod !== "stripe") && !client.stripeSubscriptionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMigrateClient(client)}
                            title="Migrate to Stripe"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        )}
                        {!client.isManual && client.stripeCustomerId && !client.stripeCustomerId.startsWith("manual_") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(client.stripeCustomerId, client.id)}
                              title="Copy Customer ID"
                            >
                              {copiedId === client.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStripeCustomer(client.stripeCustomerId)}
                              title="View in Stripe"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>

        {/* Client Details Modal */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium">{selectedClient.clientName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedClient.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">
                      {getPlanDisplay(selectedClient.plan, selectedClient.customPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Price</p>
                    <p className="font-medium">
                      ${getMonthlyPrice(selectedClient.plan, selectedClient.customPrice).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {getStatusBadge(selectedClient)}
                      {getPaymentMethodBadge(selectedClient)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Onboarding</p>
                    <div className="mt-1">
                      {selectedClient.onboardingCompleted ? (
                        <Badge className="bg-green-100 text-green-700">Complete</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                  {selectedClient.maxServices && (
                    <div>
                      <p className="text-sm text-muted-foreground">Max Services</p>
                      <p className="font-medium">{selectedClient.maxServices}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribed</p>
                    <p className="font-medium">
                      {new Date(selectedClient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selected Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.selectedServices.length > 0 ? (
                      selectedClient.selectedServices.map((service, i) => (
                        <Badge key={i} variant="secondary">
                          {service}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No services selected yet</p>
                    )}
                  </div>
                </div>

                {selectedClient.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Internal Notes</p>
                    <p className="bg-muted p-3 rounded-lg text-sm">{selectedClient.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Stripe IDs</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-muted p-2 rounded">
                      <span className="text-sm font-mono">{selectedClient.stripeCustomerId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedClient.stripeCustomerId, "modal-cus")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {selectedClient.stripeSubscriptionId && (
                      <div className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm font-mono">{selectedClient.stripeSubscriptionId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedClient.stripeSubscriptionId!, "modal-sub")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => openStripeCustomer(selectedClient.stripeCustomerId)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Stripe
                  </Button>
                  <Button variant="outline" disabled className="flex-1">
                    Adjust Services (Coming Soon)
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Manual Client Modal */}
        <AddManualClientModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onClientAdded={fetchClients}
        />

        {/* Migrate to Stripe Modal */}
        <MigrateToStripeModal
          open={!!migrateClient}
          onOpenChange={(open) => !open && setMigrateClient(null)}
          client={migrateClient}
          onMigrationStarted={fetchClients}
        />

        {/* Edit Client Modal */}
        <EditClientModal
          open={!!editClient}
          onOpenChange={(open) => !open && setEditClient(null)}
          client={editClient}
          onClientUpdated={fetchClients}
        />

        {/* Delete Client Dialog */}
        <DeleteClientDialog
          open={!!deleteClient}
          onOpenChange={(open) => !open && setDeleteClient(null)}
          client={deleteClient}
          onClientDeleted={fetchClients}
        />
      </div>
    </div>
  );
};

export default AdminClients;
