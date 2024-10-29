import { AppSidebar } from "@/components/app-sidebar";
import Chat from "@/components/chat";
import Navbar from "@/components/Navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <Chat />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
