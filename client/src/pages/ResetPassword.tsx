import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function ResetPassword() {
  const search = useSearch();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetMutation = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const resetToken = params.get("token");

    if (!resetToken) {
      setStatus("error");
      setMessage("No reset token provided");
      return;
    }

    setToken(resetToken);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setStatus("loading");

    try {
      await resetMutation.mutateAsync({
        token,
        newPassword,
      });
      setStatus("success");
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Password reset failed");
    }
  };

  if (status === "error") {
    return (
      <>
        <div className="sparkle-bg" />
        <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Reset Failed</h1>
            <p className="text-foreground/70 mb-6">{message}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <div className="sparkle-bg" />
        <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h1>
            <p className="text-foreground/70 mb-4">{message}</p>
            <div className="text-sm text-foreground/50">Redirecting to login...</div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (status === "loading") {
    return (
      <>
        <div className="sparkle-bg" />
        <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Resetting Password</h1>
            <p className="text-foreground/70">Please wait...</p>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <div className="sparkle-bg" />
      <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-foreground/70 mb-6">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 rounded transition"
            >
              {resetMutation.isPending ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-400 hover:text-blue-300 text-sm">
              Back to Login
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
