"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Target, RefreshCw, Shield, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2 text-primary">
            <Target className="w-6 h-6" />
            <span>VendorIQ</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full inline-flex items-center gap-1.5 mb-6">
            <Zap className="w-3.5 h-3.5" /> Next-Gen Procurement Intelligence
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight bg-gradient-to-r from-slate-900 via-primary to-slate-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent">
            Make Smarter, Data-Driven <br />Procurement Decisions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            VendorIQ empowers SMEs with advanced multi-criteria decision science, allowing you to rank, compare, and simulate vendor scenarios with absolute mathematical precision.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center gap-4 mb-20"
        >
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl">
              Book Demo
            </Button>
          </Link>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 text-left mb-24">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Criteria Analysis</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Define custom weight profiles to rank suppliers across cost, delivery times, financial health, and compliance scores.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Mathematical Decision Engine</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Utilize verified TOPSIS and AHP scientific algorithms to objectively calculate supplier alignment and reduce bias.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Dynamic Simulations</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Run instant what-if scenario simulations to evaluate vendor performance changes under varying market conditions.
            </p>
          </motion.div>
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-center"
        >
          <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold mb-4">Ready to optimize your supply chain?</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8">
            Create an account in less than 2 minutes and upload your first set of vendors to begin ranking immediately.
          </p>
          <Link href="/auth/register">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-xl shadow-md">
              Get Started for Free
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
