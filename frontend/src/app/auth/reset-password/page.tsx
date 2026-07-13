"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Target, AlertCircle, CheckCircle2 } from "lucide-react";

const resetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .refine((val) => /[A-Z]/.test(val), { message: "Password must contain at least one uppercase letter" })
    .refine((val) => /[a-z]/.test(val), { message: "Password must contain at least one lowercase letter" })
    .refine((val) => /[0-9]/.test(val), { message: "Password must contain at least one digit" }),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: "",
      new_password: "",
      confirm_password: "",
    }
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setValue("token", tokenParam);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetFormValues) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/reset-password", {
        token: data.token,
        new_password: data.new_password,
      });
      setSuccess(response.data.message || "Password has been reset successfully.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail !== null) {
        setError(detail.message || detail.msg || JSON.stringify(detail));
      } else {
        setError(detail || "Failed to reset password. The token may be expired or invalid.");
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
        <h1 className="text-2xl font-bold tracking-tight">Create New Password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Reset your account security credentials</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-900/30 mb-4 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
          <span>{success} Redirecting to login...</span>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="token">Reset Token</Label>
            <Input
              id="token"
              placeholder="Paste your reset token here"
              {...register("token")}
              className="mt-1.5 font-mono text-xs"
              aria-invalid={!!errors.token}
            />
            {errors.token && <p className="text-red-500 text-xs mt-1">{errors.token.message}</p>}
          </div>

          <div>
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              placeholder="••••••••"
              {...register("new_password")}
              className="mt-1.5"
              aria-invalid={!!errors.new_password}
            />
            {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              {...register("confirm_password")}
              className="mt-1.5"
              aria-invalid={!!errors.confirm_password}
            />
            {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow" disabled={loading}>
            {loading ? "Resetting Password..." : "Update Password"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
        Back to{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
        Loading reset page...
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

