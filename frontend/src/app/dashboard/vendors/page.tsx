"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Mail, MapPin, Tag, AlertTriangle, Users } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
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
      const response = await api.get("/vendors");
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitLoading(true);

    try {
      await api.post("/vendors", formData);

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
      setFormSubmitLoading(false);
    }
  };

  const handleDelete = async (vendorId: number) => {
    try {
      await api.delete(`/vendors/${vendorId}`);
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
    }
  };

  if (loading && vendors.length === 0) {
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
          <h1 className="text-3xl font-extrabold tracking-tight">Vendors</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage supplier credentials and contacts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl flex items-center gap-2">
          {showForm ? "Cancel" : <><Plus className="w-4 h-4" /> Add Vendor</>}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <h2 className="text-lg font-bold mb-4">Add New Vendor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button type="submit" disabled={formSubmitLoading} className="rounded-xl mt-4">
                {formSubmitLoading ? "Adding..." : "Add Vendor"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && vendors.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Suppliers Registered</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Create supplier profiles with contact metrics, geographic regions, and GST registration details to begin simulations.
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-primary text-white rounded-xl px-6 py-5">
            Add Your First Vendor
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Vendor</th>
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                  <th className="px-6 py-4 text-left font-semibold">Region</th>
                  <th className="px-6 py-4 text-left font-semibold">Contact Email</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vendors.map((vendor) => (
                  <motion.tr
                    key={vendor.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{vendor.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium flex items-center gap-1.5 w-fit">
                        <Tag className="w-3.5 h-3.5" /> {vendor.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400" /> {vendor.region}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-slate-400" /> {vendor.contact_email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(vendor.id)}
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

      {/* Delete Confirmation Modal Overlay */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Remove Supplier?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
              Are you sure you want to delete this vendor record? This action will permanently remove their historical evaluation metrics.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="rounded-xl">Delete</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

