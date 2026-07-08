"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-primary">VendorIQ</h1>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-5xl font-bold mb-6 text-slate-900">
            Make Better Procurement Decisions
          </h2>
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            VendorIQ is a decision intelligence platform that helps SMEs select the right vendors using data-driven analysis, multi-criteria evaluation, and scenario simulation.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">📊 Data Analysis</h3>
              <p className="text-slate-600">Compare vendors objectively using multiple criteria</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">🎯 Decision Science</h3>
              <p className="text-slate-600">MCDA, TOPSIS, and AHP algorithms for better decisions</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">🔄 Scenario Analysis</h3>
              <p className="text-slate-600">Simulate what-if scenarios instantly</p>
            </div>
          </div>

          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
