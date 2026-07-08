"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface Report {
  scenario_id: number;
  scenario_name: string;
  weights: Record<string, number>;
  top_vendors: Array<{
    vendor_name: string;
    score: number;
    rank: number;
  }>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScenarios(response.data);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
    }
  };

  const generateReport = async (scenarioId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/scenario/${scenarioId}/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports([...reports, response.data]);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      {scenarios.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Generate Reports</h2>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Button
                key={scenario.id}
                variant="outline"
                onClick={() => generateReport(scenario.id)}
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">{report.scenario_name}</h2>

            <div className="mb-6">
              <h3 className="font-bold mb-2">Weights:</h3>
              <div className="flex gap-4 text-sm">
                {Object.entries(report.weights).map(([key, value]) => (
                  <span key={key}>
                    {key}: {value}%
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3">Top Vendors:</h3>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-left">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_vendors.map((vendor) => (
                    <tr key={vendor.rank} className="border-b">
                      <td className="px-4 py-2">{vendor.rank}</td>
                      <td className="px-4 py-2">{vendor.vendor_name}</td>
                      <td className="px-4 py-2">{vendor.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
