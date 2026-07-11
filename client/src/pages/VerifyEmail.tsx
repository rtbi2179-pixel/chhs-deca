import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function VerifyEmail() {
  const search = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        await verifyMutation.mutateAsync({ token });
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Email verification failed");
      }
    };

    verify();
  }, [search]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifying Email</h1>
              <p className="text-foreground/70">Please wait while we verify your email address...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
              <p className="text-foreground/70 mb-4">{message}</p>
              <div className="text-sm text-foreground/50">Redirecting to login...</div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-foreground/70 mb-6">{message}</p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition"
              >
                Back to Login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
