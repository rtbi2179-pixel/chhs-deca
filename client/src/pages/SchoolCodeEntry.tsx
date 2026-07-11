import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, XCircle, AlertCircle } from "lucide-react";

export function SchoolCodeEntry() {
  const search = useSearch();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "error" | "blacklisted">("form");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const emailParam = params.get("email");
    const firstNameParam = params.get("firstName");
    const lastNameParam = params.get("lastName");
    const passwordParam = params.get("password");
    const attemptsParam = params.get("attempts");

    if (!emailParam) {
      setStatus("error");
      setError("Email not found. Please sign up again.");
      return;
    }

    setEmail(emailParam);
    setFirstName(firstNameParam || "");
    setLastName(lastNameParam || "");
    setPassword(passwordParam || "");
    setAttempts(parseInt(attemptsParam || "0"));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!schoolCode) {
      setError("Please enter your school code");
      return;
    }

    setLoading(true);

    try {
      await signupMutation.mutateAsync({
        firstName,
        lastName,
        email,
        password,
        schoolCode,
      });

      // After signup, login automatically
      window.location.href = "/";
    } catch (err: any) {
      const errorMsg = err.message || "School code verification failed";
      
      // Check if email was blacklisted
      if (errorMsg.includes("blacklisted")) {
        setStatus("blacklisted");
        setError("This email has been blocked due to too many failed attempts.");
      } else {
        setError(errorMsg);
        setAttempts(attempts + 1);
        
        // Check if we've exceeded the limit
        if (attempts + 1 >= 8) {
          setStatus("blacklisted");
          setError("Maximum attempts exceeded. This email has been blocked.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "error" && !status.includes("blacklist")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Error</h1>
            <p className="text-foreground/70 mb-6">{error}</p>
            <a
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition"
            >
              Back to Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "blacklisted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Account Blocked</h1>
            <p className="text-foreground/70 mb-6">
              This email address has been blocked due to too many failed school code attempts. Please contact your DECA advisor for assistance.
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const remainingAttempts = Math.max(0, 8 - attempts);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Enter School Code</h1>
          <p className="text-foreground/70 mb-6">
            Enter your school code to complete your account setup. Ask your DECA advisor if you don't have one.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-foreground font-semibold mb-2 text-sm">
                School Code
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                placeholder="Enter your school code"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {remainingAttempts < 3 && remainingAttempts > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 px-4 py-2 rounded text-sm">
                ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
              </div>
            )}

            <button
              type="submit"
              disabled={loading || remainingAttempts === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-2 rounded transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying..." : "Verify School Code"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-400 hover:text-blue-300 text-sm">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
