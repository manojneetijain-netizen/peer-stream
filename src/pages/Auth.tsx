import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (isSignUp && username.length < 3) {
      setError("Username must be at least 3 characters.");
      setSubmitting(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    const { error: authError } = isSignUp
      ? await signUp(email, password, username)
      : await signIn(email, password);

    if (authError) {
      if (authError.message?.includes("User already registered")) {
        setError("An account with this email already exists.");
      } else if (authError.message?.includes("Invalid login")) {
        setError("Invalid email or password.");
      } else {
        setError(authError.message || "An error occurred.");
      }
    } else if (isSignUp) {
      setSignUpSuccess(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pulse-blue/10 to-pulse-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Link to="/" className="block text-center mb-8">
          <span className="text-3xl font-bold gradient-text tracking-tight">Pulse</span>
        </Link>

        {signUpSuccess ? (
          <div className="glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link. Click it to activate your account.
            </p>
            <button
              onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }}
              className="mt-6 text-sm text-pulse-cyan hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex mb-8 rounded-xl overflow-hidden bg-secondary/50">
              {["Sign In", "Sign Up"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => { setIsSignUp(i === 1); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    (i === 0 && !isSignUp) || (i === 1 && isSignUp)
                      ? "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-pulse-blue"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-pulse-blue"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-pulse-blue"
              />

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "..." : isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
