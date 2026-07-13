"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ShieldAlert, Calendar, Trash2, Play, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

const scenarioSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  weights: z.object({
    cost: z.number().min(0, "Cost weight cannot be negative").max(100),
    quality: z.number().min(0, "Quality weight cannot be negative").max(100),
    reliability: z.number().min(0, "Reliability weight cannot be negative").max(100),
    delivery_time: z.number().min(0, "Delivery time weight cannot be negative").max(100),
    compliance: z.number().min(0, "Compliance weight cannot be negative").max(100),
    rating: z.number().min(0, "Rating weight cannot be negative").max(100),
    financial_stability: z.number().min(0, "Financial stability weight cannot be negative").max(100),
  })
}).refine((data) => {
  const w = data.weights;
  const total = w.cost + w.quality + w.reliability + w.delivery_time + w.compliance + w.rating + w.financial_stability;
  return Math.abs(total - 100) < 0.01;
}, {
  message: "Weights must sum exactly to 100%",
  path: ["weights"]
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

interface Scenario {
  id: number;
  name: string;
  description: string;
  weights: Record<string, number>;
  created_at: string;
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [runResult, setRunResult] = useState<{ name: string; topVendor: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      name: "",
      description: "",
      weights: {
        cost: 25,
        quality: 20,
        reliability: 15,
        delivery_time: 15,
        compliance: 10,
        rating: 10,
        financial_stability: 5,
      }
    }
  });

  const weights = watch("weights") || {};
  const currentSum = Object.values(weights).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await api.get("/scenarios");
      setScenarios(response.data);
    } catch (err: any) {
      console.error("Error fetching scenarios:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to load scenarios.");
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ScenarioFormValues) => {
    setSubmitLoading(true);
    try {
      await api.post("/scenarios", data);
      setToast({ message: "Scenario created successfully!", type: "success" });
      reset();
      setShowForm(false);
      fetchScenarios();
    } catch (err: any) {
      console.error("Error creating scenario:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to create scenario.");
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRunScenario = async (scenarioId: number, scenarioName: string) => {
    try {
      const response = await api.post(`/scenarios/${scenarioId}/run`, {});
      const topVendor = response.data.rankings[0]?.vendor_id || "None";
      setRunResult({ name: scenarioName, topVendor });
    } catch (err: any) {
      console.error("Error running scenario:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Error running scenario calculation.");
      setToast({ message: msg, type: "error" });
    }
  };

  const handleDelete = async (scenarioId: number) => {
    try {
      await api.delete(`/scenarios/${scenarioId}`);
      setToast({ message: "Scenario deleted successfully.", type: "info" });
      fetchScenarios();
    } catch (err: any) {
      console.error("Error deleting scenario:", err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" && detail !== null ? detail.message : (detail || "Failed to delete scenario.");
      setToast({ message: msg, type: "error" });
    }
  };

  const weightKeys: (keyof ScenarioFormValues["weights"])[] = [
    "cost", "quality", "reliability", "delivery_time", "compliance", "rating", "financial_stability"
  ];

  if (loading && scenarios.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Scenarios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure multi-criteria optimization profiles</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl flex items-center gap-2">
          {showForm ? "Cancel" : <><Scale className="w-4 h-4" /> Create Scenario</>}
        </Button>
      </div>

      {toast && (
        <div className={`p-4 mb-4 rounded-xl border flex justify-between items-center transition-all ${
          toast.type === "success" ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900" :
          toast.type === "error" ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900" :
          "bg-blue-50 text-blue-800 border-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
        }`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="font-bold ml-2 hover:opacity-80">×</button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <h2 className="text-lg font-bold mb-4">Create New Scenario</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. High Quality Logistics"
                    {...register("name")}
                    className="mt-1.5 animate-focus"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief objective of this scenario"
                    {...register("description")}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm">Weights Assignment</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    Math.abs(currentSum - 100) < 0.01 
                      ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" 
                      : "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    Sum: {currentSum}% / 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {weightKeys.map((key) => (
                    <div key={key}>
                      <Label htmlFor={`weights.${key}`} className="text-xs text-slate-500 dark:text-slate-400">
                        {key.replace("_", " ")}
                      </Label>
                      <Input
                        id={`weights.${key}`}
                        type="number"
                        {...register(`weights.${key}`, { valueAsNumber: true })}
                        className="mt-1.5 h-9 bg-white dark:bg-slate-900"
                      />
                    </div>
                  ))}
                </div>
                {errors.weights && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs mt-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.weights.message}</span>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitLoading} className="rounded-xl mt-4">
                {submitLoading ? "Creating..." : "Create Scenario"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && scenarios.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Optimization Scenarios</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Create optimization profiles assigning importances weights. This allows multi-criteria TOPSIS scoring calculations.
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-primary text-white rounded-xl px-6 py-5">
            Create Your First Scenario
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Scenario Profile</th>
                  <th className="px-6 py-4 text-left font-semibold">Description</th>
                  <th className="px-6 py-4 text-left font-semibold">Configured Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scenarios.map((scenario) => (
                  <motion.tr
                    key={scenario.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      <span>{scenario.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{scenario.description}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {format(new Date(scenario.created_at), "PPP")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunScenario(scenario.id, scenario.name)}
                        className="rounded-xl inline-flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Run
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(scenario.id)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-xl"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Remove Scenario?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
              Are you sure you want to delete this optimization profile? Associated reports may become invalid.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="rounded-xl">Delete</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Result Display Overlay */}
      {runResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">Optimization Complete</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm leading-relaxed">
              Calculation completed for <strong>{runResult.name}</strong>.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6 border border-slate-100 dark:border-slate-850">
              <span className="text-xs text-slate-400 dark:text-slate-500 block">Top Recommended Supplier ID</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 block mt-1 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-yellow-500" /> Supplier #{runResult.topVendor}
              </span>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setRunResult(null)} className="rounded-xl">Dismiss</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

