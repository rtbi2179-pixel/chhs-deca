import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success">("form");
  const [error, setError] = useState("");

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setStatus("loading");

    try {
      await requestResetMutation.mutateAsync({ email, schoolCode: schoolCode.trim() || undefined });
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      setStatus("form");
    }
  };

  if (status === "success") {
    return (
      <>
        <div className="sparkle-bg" />
        <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-foreground/70 mb-6">
              If your email and school code match an account, your chapter administrator has been notified. After approval, a one-time reset link will be sent to <strong>{email}</strong> and will expire after one hour.
            </p>
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

  return (
    <>
      <div className="sparkle-bg" />
      <div className="relative z-10 min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-foreground/70 mb-6">
            Enter your email and school code to request a secure, chapter-approved password reset. An administrator must approve the request before a one-hour reset link is sent.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                School Code
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                placeholder="Your chapter school code"
              />
              <p className="mt-1 text-xs text-foreground/55">Sahan and Ricardo may leave this blank.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "loading" ? "Submitting..." : "Request Chapter Approval"}
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
