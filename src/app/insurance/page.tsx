"use client";

import { AppSidebar } from "@/components/app-sidebar";
import Chat2 from "@/components/chat2";

import Navbar from "@/components/Navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <Chat2 />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
