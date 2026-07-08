"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api, { getAccessToken, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Target, Users, BarChart2, ShieldAlert, LogOut, Sun, Moon, Menu } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutStore = useAuthStore((state) => state.logout);

  useEffect(() => {
    const checkAuth = async () => {
      if (getAccessToken()) {
        setIsLoggedIn(true);
        return;
      }
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.access_token);
        setIsLoggedIn(true);
      } catch (err) {
        router.push("/auth/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const activeTheme = savedTheme || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    logoutStore();
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  if (!isLoggedIn) return null;

  const navItems = [
    { label: "Vendors", path: "/dashboard/vendors", icon: Users },
    { label: "Scenarios", path: "/dashboard/scenarios", icon: ShieldAlert },
    { label: "Reports", path: "/dashboard/reports", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold flex items-center gap-2 text-primary">
            <Target className="w-6 h-6" />
            <span>VendorIQ</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-2 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-xl">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Hamburguer */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl">
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 flex flex-col gap-3"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(item.path) ? "default" : "outline"}
                    className="w-full flex items-center justify-start gap-3 rounded-xl"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <Button variant="outline" onClick={handleLogout} className="w-full flex items-center justify-start gap-3 text-red-600 dark:text-red-400 rounded-xl">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Main Container */}
      <div className="container mx-auto px-6 py-8 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

