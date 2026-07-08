"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Vendor {
  id: number;
  name: string;
  category: string;
  region: string;
  contact_email: string;
  gst_number: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    region: "",
    contact_email: "",
    contact_phone: "",
    gst_number: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormData({
        name: "",
        category: "",
        region: "",
        contact_email: "",
        contact_phone: "",
        gst_number: "",
      });
      setShowForm(false);
      fetchVendors();
    } catch (error) {
      console.error("Error adding vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vendorId: number) => {
    if (confirm("Are you sure?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/vendors/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchVendors();
      } catch (error) {
        console.error("Error deleting vendor:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Vendor"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Vendor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Region</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>GST Number</Label>
                <Input
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Vendor"}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Region</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4">{vendor.name}</td>
                <td className="px-6 py-4">{vendor.category}</td>
                <td className="px-6 py-4">{vendor.region}</td>
                <td className="px-6 py-4">{vendor.contact_email}</td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vendor.id)}
                    className="text-red-600 hover:text-red-700"
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
