import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Plus, Minus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSchoolCode } from "@/contexts/SchoolCodeContext";
import { toast } from "sonner";

export function AdminPanel() {
  const { user } = useAuth();
  const [emailToPromote, setEmailToPromote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { data: admins = [], refetch: refetchAdmins } = trpc.auth.getAllAdmins.useQuery();
  const { data: schoolCodes = [] } = trpc.auth.getSchoolCodes.useQuery();
  const { selectedSchoolCode, setSelectedSchoolCode } = useSchoolCode();
  const promoteAdminMutation = trpc.auth.promoteToAdmin.useMutation();
  const demoteAdminMutation = trpc.auth.demoteFromAdmin.useMutation();
  const utils = trpc.useUtils();
  const updateSchoolCodeMutation = trpc.auth.updateMySchoolCode.useMutation({
    onSuccess: () => {
      // Refresh the user's session data after updating school code
      utils.auth.me.invalidate();
    },
  });

  // Check if user is super admin
  const isSuperAdmin = user?.email === "rtbi2179@gmail.com" || user?.email === "sahan.mallampati@gmail.com";

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
    <div className="min-h-screen bg-background p-6 pt-32">
      <div className="max-w-6xl mx-auto">
        {/* Header with Neon Glow */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span className="text-yellow-500 text-5xl">👑</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
              SUPER ADMIN PANEL
            </span>
          </h1>
          <p className="text-foreground/70">Manage admin roles and user permissions</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded border-2 ${
            message.includes("✅") 
              ? "bg-green-500/20 text-green-300 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" 
              : "bg-red-500/20 text-red-300 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          }`}>
            {message}
          </div>
        )}

        {/* Admin Management Section */}
        <div className="space-y-6">
          {/* Promote Admin Form */}
          <div className="bg-card border-2 border-yellow-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
              ⚡ Promote Admin
            </h2>
            <form onSubmit={handlePromoteAdmin} className="flex gap-2">
              <input
                type="email"
                value={emailToPromote}
                onChange={(e) => setEmailToPromote(e.target.value)}
                placeholder="Enter email to promote"
                className="flex-1 px-4 py-2 bg-background border-2 border-yellow-500/50 rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded hover:shadow-[0_0_20px_rgba(250,204,21,0.8)] transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Promote
              </button>
            </form>
          </div>

          {/* Current Admins List */}
          <div className="bg-card border-2 border-yellow-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
              👥 Current Admins
            </h2>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-foreground/60">No admins yet</p>
              ) : (
                admins.map((admin: any, index: number) => (
                  <div
                    key={admin.admin?.email || index}
                    className="flex items-center justify-between p-4 bg-background border border-yellow-500/20 rounded hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)] transition"
                  >
                    <div>
                      <p className="text-yellow-300 font-semibold">{admin.admin?.email}</p>
                      <p className="text-foreground/50 text-sm">
                        Promoted on {new Date(admin.admin?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDemoteAdmin(admin.admin?.email)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <Minus size={16} />
                      Demote
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* School Codes Section */}
          <div className="bg-card border-2 border-blue-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <h2 className="text-xl font-bold text-blue-400 mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              🏫 Active School Codes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schoolCodes.length === 0 ? (
                <p className="text-foreground/60">No active school codes</p>
              ) : (
                schoolCodes.map((school) => (
                  <button
                    key={school.code}
                    onClick={async () => {
                      const newCode = selectedSchoolCode === school.code ? "" : school.code;
                      setSelectedSchoolCode(newCode);
                      // Update the user's school code in the database
                      if (newCode) {
                        try {
                          await updateSchoolCodeMutation.mutateAsync({ schoolCode: newCode });
                          toast.success(`School code updated to ${school.schoolName}`);
                        } catch (error: any) {
                          toast.error(`Failed to update school code: ${error.message}`);
                          // Revert the context selection if the update failed
                          setSelectedSchoolCode(selectedSchoolCode);
                        }
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedSchoolCode === school.code
                        ? "bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                        : "bg-background border-blue-500/20 hover:border-blue-500/50"
                    }`}
                  >
                    <p className="text-blue-300 font-semibold">{school.schoolName}</p>
                    <p className="text-foreground/60 text-sm">Code: {school.code}</p>
                    {selectedSchoolCode === school.code && (
                      <p className="text-green-400 text-sm mt-2">✓ Selected</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <p className="text-blue-300">
              <strong>💡 Note:</strong> Feature management (discussions, calendar, volunteers) is handled by regular admins through the "Manage" buttons on their respective pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
