import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Plus, Minus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"admins" | "discussions" | "calendar" | "volunteers">("admins");
  const [emailToPromote, setEmailToPromote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { data: admins = [], refetch: refetchAdmins } = trpc.auth.getAllAdmins.useQuery();
  const promoteAdminMutation = trpc.auth.promoteToAdmin.useMutation();
  const demoteAdminMutation = trpc.auth.demoteFromAdmin.useMutation();

  // Check if user is super admin
  const isSuperAdmin = user?.email === "rtbi2179@gmail.com";

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-foreground/70">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await promoteAdminMutation.mutateAsync({ email: emailToPromote });
      setMessage(`✅ ${emailToPromote} has been promoted to admin`);
      setEmailToPromote("");
      refetchAdmins();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteAdmin = async (email: string | null) => {
    if (!email) return;
    if (!confirm(`Are you sure you want to demote ${email}?`)) return;

    setLoading(true);
    try {
      await demoteAdminMutation.mutateAsync({ email });
      setMessage(`✅ ${email} has been demoted`);
      refetchAdmins();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="text-yellow-500">👑</span> Admin Panel
          </h1>
          <p className="text-foreground/70">Manage your DECA hub</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === "admins"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            👑 Admins
          </button>
          <button
            onClick={() => setActiveTab("discussions")}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === "discussions"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            💬 Discussions
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === "calendar"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`px-4 py-2 font-semibold transition whitespace-nowrap ${
              activeTab === "volunteers"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            🤝 Volunteers
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            {message}
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === "admins" && isSuperAdmin && (
          <div className="space-y-6">
            {/* Promote Admin Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Promote Admin</h2>
              <form onSubmit={handlePromoteAdmin} className="flex gap-2">
                <input
                  type="email"
                  value={emailToPromote}
                  onChange={(e) => setEmailToPromote(e.target.value)}
                  placeholder="Enter email to promote"
                  className="flex-1 px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-yellow-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white font-semibold px-6 py-2 rounded transition flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Plus className="w-4 h-4" />
                  Promote
                </button>
              </form>
            </div>

            {/* Current Admins */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Current Admins ({admins.length})</h2>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between bg-background p-3 rounded border border-border">
                    <div>
                      <p className="font-semibold text-foreground">{admin.name || admin.email}</p>
                      <p className="text-sm text-foreground/60">{admin.email}</p>
                      <p className="text-xs text-yellow-500 mt-1">
                        {admin.role === "super_admin" ? "👑 Super Admin" : "👤 Admin"}
                      </p>
                    </div>
                    {admin.role !== "super_admin" && (
                      <button
                        onClick={() => handleDemoteAdmin(admin.email)}
                        disabled={loading}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === "discussions" && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Manage Discussions</h2>
            <p className="text-foreground/70">Delete inappropriate comments and manage discussions</p>
            <p className="text-sm text-foreground/50 mt-2">Coming soon...</p>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Manage Calendar</h2>
            <p className="text-foreground/70">Add and remove competition dates</p>
            <p className="text-sm text-foreground/50 mt-2">Coming soon...</p>
          </div>
        )}

        {/* Volunteers Tab */}
        {activeTab === "volunteers" && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Manage Volunteer Opportunities</h2>
            <p className="text-foreground/70">Create, edit, and manage volunteer sign-ups</p>
            <p className="text-sm text-foreground/50 mt-2">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
