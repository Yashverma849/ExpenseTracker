"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .limit(1);

      if (error) {
        console.error("Error connecting to database:", error.message, error.details, error.hint);
      } else {
        console.log("Database connection successful:", data);
      }
    };

    testConnection();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("Receipts")
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error.message, error.details, error.hint);
      setUploading(false);
      return;
    }

    const fileUrl = data.path;

    const { error: dbError } = await supabase
      .from("receipts")
      .insert([{ url: fileUrl }]);

    if (dbError) {
      console.error("Error saving file URL to database:", dbError.message, dbError.details, dbError.hint);
    }

    setUploading(false);
    setFile(null);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-center grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
            <div className="col-span-1 md:col-span-3">
              <input type="file" onChange={handleFileChange} />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-2 p-2 bg-blue-500 text-white rounded"
              >
                {uploading ? "Uploading..." : "Upload Receipt"}
              </button>
            </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}