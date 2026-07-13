"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { FileText, Download, Award, Calendar, Layers, AlertTriangle } from "lucide-react";

interface Report {
  scenario_id: number;
  scenario_name: string;
  weights: Record<string, number>;
  top_vendors: Array<{
    vendor_name: string;
    score: number;
    rank: number;
  }>;
  created_at?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setError(null);
      const response = await api.get("/scenarios");
      setScenarios(response.data);
    } catch (err: any) {
      console.error("Error fetching scenarios:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to load scenarios for evaluations.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (scenarioId: number) => {
    setGenerateLoading(scenarioId);
    setError(null);
    try {
      const response = await api.get(`/reports/scenario/${scenarioId}/summary`);
      setReports((prevReports) => {
        const index = prevReports.findIndex((r) => r.scenario_id === scenarioId);
        if (index > -1) {
          const updated = [...prevReports];
          updated[index] = response.data;
          return updated;
        }
        return [...prevReports, response.data];
      });
    } catch (err: any) {
      console.error("Error generating report:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to generate evaluation report.");
      setError(msg);
    } finally {
      setGenerateLoading(null);
    }
  };

  if (loading && scenarios.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Evaluations</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Generate multi-criteria decision reports</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold hover:opacity-85 text-lg leading-none">×</button>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Available Configurations
          </h2>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Button
                key={scenario.id}
                variant="outline"
                onClick={() => generateReport(scenario.id)}
                disabled={generateLoading === scenario.id}
                className="rounded-xl flex items-center gap-2"
              >
                {generateLoading === scenario.id ? "Analyzing..." : `Evaluate: ${scenario.name}`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Reports Generated</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed text-sm">
            Select one of your scenario configurations above to calculate rankings on the fly.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <FileText className="w-5.5 h-5.5 text-primary" /> {report.scenario_name}
                  </h2>
                  {report.created_at && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(report.created_at), "PPP p")}
                    </span>
                  )}
                </div>
                <Button variant="outline" className="rounded-xl flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Weights Configuration</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.weights).map(([key, value]) => (
                    <span key={key} className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {key.replace("_", " ")}: {value}%
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Topsis Evaluation Rankings</h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-855 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-6 py-3.5 text-left font-semibold">Rank</th>
                          <th className="px-6 py-3.5 text-left font-semibold">Supplier Name</th>
                          <th className="px-6 py-3.5 text-right font-semibold">Topsis Core Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {report.top_vendors.map((vendor) => (
                          <tr key={vendor.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="px-6 py-4">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                                vendor.rank === 1 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400" 
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {vendor.rank === 1 ? <Award className="w-3.5 h-3.5" /> : vendor.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{vendor.vendor_name}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                vendor.score >= 0.7 
                                  ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" 
                                  : "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400"
                              }`}>
                                {(vendor.score * 100).toFixed(1)}% Match
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
