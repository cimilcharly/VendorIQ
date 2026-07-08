"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    weights: {
      cost: 35,
      quality: 25,
      reliability: 20,
      delivery: 15,
      compliance: 5,
    },
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/scenarios`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData({
        name: "",
        description: "",
        weights: {
          cost: 35,
          quality: 25,
          reliability: 20,
          delivery: 15,
          compliance: 5,
        },
      });
      setShowForm(false);
      fetchScenarios();
    } catch (error) {
      console.error("Error creating scenario:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async (scenarioId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/scenarios/${scenarioId}/run`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Top Vendor: ${response.data.rankings[0]?.vendor_id}`);
    } catch (error) {
      console.error("Error running scenario:", error);
    }
  };

  const handleDelete = async (scenarioId: number) => {
    if (confirm("Are you sure?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/scenarios/${scenarioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchScenarios();
      } catch (error) {
        console.error("Error deleting scenario:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Scenario"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Scenario</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Scenario Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <h3 className="font-bold mb-3">Weights (sum should equal 100)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(formData.weights).map(([key, value]) => (
                  <div key={key}>
                    <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weights: { ...formData.weights, [key]: parseFloat(e.target.value) },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Scenario"}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Description</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario) => (
              <tr key={scenario.id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{scenario.name}</td>
                <td className="px-6 py-4">{scenario.description}</td>
                <td className="px-6 py-4">{new Date(scenario.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunScenario(scenario.id)}
                  >
                    Run
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(scenario.id)}
                    className="text-red-600"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
