"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { UserPlus, AlertCircle } from "lucide-react";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      username: "",
      password: "",
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", data);
      router.push("/auth/login?message=Registration successful");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(", "));
      } else if (typeof detail === "object" && detail !== null) {
        setError(detail.message || detail.msg || JSON.stringify(detail));
      } else {
        setError(detail || "Registration failed. Try again.");
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
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create VendorIQ Account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get started with procurement intelligence</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            {...register("full_name")}
            className="mt-1.5"
            aria-invalid={!!errors.full_name}
          />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>

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

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="johndoe"
            {...register("username")}
            className="mt-1.5"
            aria-invalid={!!errors.username}
          />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="mt-1.5"
            aria-invalid={!!errors.password}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
