import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginSignup() {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  // Mutations
  const signupMutation = trpc.auth.signup.useMutation();
  const loginMutation = trpc.auth.login.useMutation();
  const { data: schoolCodes = [] } = trpc.auth.getSchoolCodes.useQuery();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signupMutation.mutateAsync({
        firstName,
        lastName,
        username,
        password,
        schoolCode,
      });

      // After signup, login automatically
      await loginMutation.mutateAsync({
        username,
        password,
      });

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginMutation.mutateAsync({
        username,
        password,
      });

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border border-border">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CHHS DECA</h1>
          <p className="text-foreground/70">
            {isSignup ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-foreground font-semibold mb-2 text-sm">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2 text-sm">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-2 text-sm">
                  School Code
                </label>
                <select
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select your school</option>
                  {schoolCodes.map((code) => (
                    <option key={code.id} value={code.code}>
                      {code.schoolName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-foreground font-semibold mb-2 text-sm">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="block text-foreground font-semibold mb-2 text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded text-foreground placeholder-foreground/50 focus:outline-none focus:border-blue-500"
              placeholder="••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignup ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-foreground/70 text-sm mb-2">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
              setFirstName("");
              setLastName("");
              setUsername("");
              setPassword("");
              setSchoolCode("");
            }}
            className="text-blue-400 hover:text-blue-300 font-semibold text-sm"
          >
            {isSignup ? "Sign In" : "Create Account"}
          </button>
        </div>
      </Card>
    </div>
  );
}
