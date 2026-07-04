import React, { useState } from "react";
import { X, Mail, Lock, User, Sparkles, LogIn } from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, config } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const res = await signUp(email, password, name);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -35, z: -100 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotateY: 35, z: -100 }}
        transition={{ type: "spring", damping: 24, stiffness: 150 }}
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        className="relative w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl border border-brand-crimson/30"
      >
        {/* Glow Element */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-brand-crimson/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-red to-brand-crimson flex items-center justify-center font-display font-bold text-white shadow-lg">
              A
            </div>
            <span className="font-display font-bold tracking-tight text-white text-xl">
              Allrated
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 relative z-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? "signup" : "signin"}
              initial={{ opacity: 0, rotateY: -65, scale: 0.95 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 65, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 140 }}
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
          <div className="mb-6">
            <h3 className="font-display font-semibold text-2xl text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {isSignUp 
                ? "Join Allrated to track watchlists, like titles, and get tailored matches." 
                : "Sign in to resume tracking and curated recommendations."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-brand-crimson/20 border border-brand-crimson/40 text-brand-red text-xs rounded-lg font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-gray-300 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#12090B]/80 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red text-sm transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-gray-300 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#12090B]/80 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-300 uppercase tracking-wider block">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#12090B]/80 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-red hover:bg-[#ff1525] disabled:bg-brand-red/50 text-white font-display font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-gray-400 hover:text-brand-red transition-all"
            >
              {isSignUp ? "Already have an account? Sign in" : "New to Allrated? Create an account"}
            </button>
          </div>

          {/* Database Info Banner */}
          <div className="mt-4 flex items-center justify-center gap-1.5 bg-brand-maroon/50 border border-white/5 p-2.5 rounded-lg text-[10px] text-gray-400 font-mono">
            <Sparkles size={11} className="text-brand-red" />
            <span>
              {config.supabaseActive 
                ? "SUPABASE AUTHENTICATION ACTIVE" 
                : "USING LOCAL EMBEDDED AUTHENTICATION"}
            </span>
          </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
