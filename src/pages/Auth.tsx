import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import ParticlesBackground from "@/components/auth/ParticlesBackground";

type AuthView = "signin" | "signup" | "forgot" | "signup-success" | "forgot-success";

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<AuthView>("signin");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Sign-up extras
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  const resetForm = () => {
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setUsername("");
    setPhone("");
    setDob("");
    setGender("");
  };

  const switchView = (v: AuthView) => {
    setError("");
    setView(v);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message?.includes("Invalid login") ? "Invalid email or password." : authError.message || "An error occurred.");
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (username.length < 3) { setError("Username must be at least 3 characters."); setSubmitting(false); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); setSubmitting(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); setSubmitting(false); return; }

    const { error: authError } = await signUp(email, password, username, {
      full_name: fullName,
      phone,
      date_of_birth: dob,
      gender,
    });

    if (authError) {
      if (authError.message?.includes("User already registered")) {
        setError("An account with this email already exists.");
      } else {
        setError(authError.message || "An error occurred.");
      }
    } else {
      switchView("signup-success");
    }
    setSubmitting(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await resetPassword(email);
    if (err) {
      setError(err.message || "Something went wrong.");
    } else {
      switchView("forgot-success");
    }
    setSubmitting(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-pulse-blue transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <ParticlesBackground />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pulse-blue/10 to-pulse-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <Link to="/" className="block text-center mb-6">
          <span className="text-3xl font-bold gradient-text tracking-tight">Pulse</span>
        </Link>

        <AnimatePresence mode="wait">
          {/* ─── SUCCESS VIEWS ─── */}
          {(view === "signup-success" || view === "forgot-success") && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-8 text-center shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan flex items-center justify-center text-2xl">
                ✉️
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {view === "signup-success" ? "Check your email" : "Reset link sent"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {view === "signup-success"
                  ? "We sent a confirmation link. Click it to activate your account."
                  : "Check your inbox for a password reset link."}
              </p>
              <button
                onClick={() => { resetForm(); switchView("signin"); }}
                className="mt-6 text-sm text-accent hover:underline"
              >
                Back to login
              </button>
            </motion.div>
          )}

          {/* ─── FORGOT PASSWORD ─── */}
          {view === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-2xl p-8 shadow-2xl"
            >
              <button
                onClick={() => switchView("signin")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="text-xl font-semibold text-foreground mb-1">Forgot password?</h2>
              <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
                </button>
              </form>
            </motion.div>
          )}

          {/* ─── SIGN IN / SIGN UP ─── */}
          {(view === "signin" || view === "signup") && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: view === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: view === "signup" ? -20 : 20 }}
              className="glass-card rounded-2xl p-8 shadow-2xl"
            >
              {/* Tabs */}
              <div className="flex mb-6 rounded-xl overflow-hidden bg-secondary/50">
                {(["signin", "signup"] as const).map((v, i) => (
                  <button
                    key={v}
                    onClick={() => switchView(v)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      view === v
                        ? "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {i === 0 ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {view === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-border accent-pulse-blue" />
                      Remember me
                    </label>
                    <button type="button" onClick={() => switchView("forgot")} className="text-sm text-pulse-blue hover:underline">
                      Forgot password?
                    </button>
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* Row: Full Name + Username */}
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Username *" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
                  </div>

                  <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                  <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />

                  {/* Row: DOB + Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`${inputClass} ${!dob ? "text-muted-foreground" : ""}`} />
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={`${inputClass} ${!gender ? "text-muted-foreground" : ""}`}>
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
                  <PasswordStrengthMeter password={password} />
                  <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                  </button>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    By signing up, you agree to our Terms & Privacy Policy
                  </p>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Auth;
