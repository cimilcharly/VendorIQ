"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ArrowUpRight, TrendingUp, Users, BarChart3, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vendors: 0,
    scenarios: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const statsRes = await api.get("/reports/stats");
      setStats({
        vendors: statsRes.data.vendors,
        scenarios: statsRes.data.scenarios,
        completed: statsRes.data.completed,
      });
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to load dashboard data.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Active Vendors", value: stats.vendors, fill: "hsl(var(--accent))" },
    { name: "Scenarios Run", value: stats.scenarios, fill: "hsl(var(--primary))" },
    { name: "Saved Reports", value: stats.completed, fill: "hsl(var(--info))" },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-md mx-auto text-center mt-10 shadow-sm">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-bold mb-2">Failed to Load Dashboard</h3>
        <p className="text-sm mb-6 text-slate-500 dark:text-slate-400">{error}</p>
        <Button onClick={() => { setLoading(true); fetchDashboardData(); }} className="rounded-xl bg-red-600 text-white hover:bg-red-700">
          Try Again
        </Button>
      </div>
    );
  }

  if (stats.vendors === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Suppliers Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          To start analyzing and simulating scenario comparisons, you must first register suppliers in the database.
        </p>
        <Link href="/dashboard/vendors">
          <Button className="bg-primary text-white rounded-xl shadow-sm px-6 py-5">
            Add Your First Vendor
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Decision intelligence overview metrics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Vendors</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +8.4%
              </span>
            </div>
            <p className="text-4xl font-extrabold mt-3">{stats.vendors}</p>
          </div>
          <Link href="/dashboard/vendors" className="mt-6 flex items-center text-sm font-semibold text-primary hover:text-primary/90 gap-1 self-start">
            <span>Manage supplier records</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Scenarios</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                Active Simulation
              </span>
            </div>
            <p className="text-4xl font-extrabold mt-3">{stats.scenarios}</p>
          </div>
          <Link href="/dashboard/scenarios" className="mt-6 flex items-center text-sm font-semibold text-primary hover:text-primary/90 gap-1 self-start">
            <span>Configure weights</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed Reports</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Real-time
              </span>
            </div>
            <p className="text-4xl font-extrabold mt-3">{stats.completed}</p>
          </div>
          <Link href="/dashboard/reports" className="mt-6 flex items-center text-sm font-semibold text-primary hover:text-primary/90 gap-1 self-start">
            <span>View evaluations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Analytics Chart Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">System Distribution</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Total evaluated counts
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.1)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "none",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
