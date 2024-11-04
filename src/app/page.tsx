import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/Navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Image from "next/image";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-secondary-foreground shadow-lg rounded-lg overflow-hidden border">
              <Image
                src="/robot.jpg"
                alt="Card Image 1"
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p>
                  This is a description for the first card. It provides an
                  overview of the content represented by the image above.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-secondary-foreground shadow-lg rounded-lg overflow-hidden border">
              <Image
                src="/robot.jpg"
                alt="Card Image 2"
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p>
                  This is a description for the second card. It provides an
                  overview of the content represented by the image above.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-secondary-foreground shadow-lg rounded-lg overflow-hidden border">
              <Image
                src="/robot.jpg"
                alt="Card Image 3"
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p>
                  This is a description for the third card. It provides an
                  overview of the content represented by the image above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
