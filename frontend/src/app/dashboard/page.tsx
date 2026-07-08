"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    vendors: 0,
    scenarios: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [vendorsRes, scenariosRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, { headers }),
      ]);

      setStats({
        vendors: vendorsRes.data.length,
        scenarios: scenariosRes.data.length,
        completed: Math.floor(scenariosRes.data.length * 0.8),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Vendors", value: stats.vendors },
    { name: "Scenarios", value: stats.scenarios },
    { name: "Completed", value: stats.completed },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to VendorIQ</h1>
        <p className="text-slate-600">Your decision intelligence dashboard</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-slate-500 text-sm font-medium">Total Vendors</h3>
          <p className="text-3xl font-bold mt-2">{stats.vendors}</p>
          <Link href="/dashboard/vendors">
            <Button variant="outline" className="mt-4 w-full">Manage Vendors</Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-slate-500 text-sm font-medium">Scenarios</h3>
          <p className="text-3xl font-bold mt-2">{stats.scenarios}</p>
          <Link href="/dashboard/scenarios">
            <Button variant="outline" className="mt-4 w-full">Create Scenario</Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-slate-500 text-sm font-medium">Completed Analysis</h3>
          <p className="text-3xl font-bold mt-2">{stats.completed}</p>
          <Link href="/dashboard/reports">
            <Button variant="outline" className="mt-4 w-full">View Reports</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">Quick Stats</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
