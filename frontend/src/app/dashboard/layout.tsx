"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    router.push("/");
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            VendorIQ
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard/vendors">
              <Button variant="outline">Vendors</Button>
            </Link>
            <Link href="/dashboard/scenarios">
              <Button variant="outline">Scenarios</Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline">Reports</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
