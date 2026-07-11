import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function TwoFactorAuth() {
  const search = useSearch();
  const [userId, setUserId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verifyCodeMutation = trpc.auth.verifyTwoFactorCode.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const userIdParam = params.get("userId");

    if (!userIdParam) {
      setStatus("error");
      setMessage("No user ID provided");
      return;
    }

    setUserId(parseInt(userIdParam));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    if (!userId) {
      setError("User ID not found");
      return;
    }

    setStatus("loading");

    try {
      await verifyCodeMutation.mutateAsync({
        userId,
        code,
      });
      setStatus("success");
      setMessage("2FA verification successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
      setStatus("form");
    }
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
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
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verified!</h1>
            <p className="text-foreground/70 mb-4">{message}</p>
            <div className="text-sm text-foreground/50">Redirecting...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Two-Factor Authentication</h1>
          <p className="text-foreground/70 mb-6">
            Enter the 6-digit code from your email to verify your identity.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-foreground/50 text-xs mt-2">{code.length}/6 digits</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "loading" ? "Verifying..." : "Verify Code"}
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
  );
}
