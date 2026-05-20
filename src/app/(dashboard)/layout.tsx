"use client";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useUiStore } from "@/store/uiStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useUiStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="db-root">
      <Sidebar />
      <div className="db-main">
        <Topbar />
        <main className="db-content">{children}</main>
      </div>
    </div>
  );
}
