"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Target, AlertCircle, CheckCircle2, Clipboard } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    }
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setLoading(true);
    setError("");
    setSuccess("");
    setToken("");

    try {
      const response = await api.post("/auth/forgot-password", data);
      setSuccess(response.data.message || "Reset token generated successfully.");
      if (response.data.token) {
        setToken(response.data.token);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail !== null) {
        setError(detail.message || detail.msg || JSON.stringify(detail));
      } else {
        setError(detail || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
    >
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your registered email address</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-900/30 mb-4 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
            <span className="font-medium">{success}</span>
          </div>
          {token && (
            <div className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
              <span className="text-xs font-semibold text-slate-500 block">Simulated Reset Token (Copy this):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={token}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs w-full font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(token)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500"
                  title="Copy token"
                >
                  <Clipboard className="w-4.5 h-4.5" />
                </button>
              </div>
              <Link href={`/auth/reset-password?token=${encodeURIComponent(token)}`} className="text-xs text-primary font-semibold hover:underline block mt-2">
                Proceed to Reset Password Page &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              {...register("email")}
              className="mt-1.5"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow" disabled={loading}>
            {loading ? "Submitting..." : "Send Reset Instructions"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
        Remembered password?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign In here
        </Link>
      </p>
    </motion.div>
  );
}
