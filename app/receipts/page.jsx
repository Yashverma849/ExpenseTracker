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
import { Terminal } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import Image from "next/image"; // Ensure you have this import for the Image component

export default function Page() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

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
    if (!file) {
      setAlertMessage("No file selected. Please select your receipt.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Hide alert after 3 seconds
      return;
    }

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
    } else {
      setAlertMessage("Your receipt is successfully uploaded.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Hide alert after 3 seconds
    }

    setUploading(false);
    setFile(null);
  };

  return (
    <SidebarProvider>
      <AppSidebar className=" bg-transparent backdrop-blur-lg border-r border-white/20" />
      <SidebarInset>
        {/* Fixed background */}
        <div className="relative w-full pb-16">
          <Image 
            src="/pexels-adrien-olichon-1257089-2387793.jpg" 
            alt="logo" 
            layout="fill" 
            objectFit="cover" 
            className="absolute inset-0 z-0" 
            onError={(e) => {
              console.error("Error loading image:", e);
              e.target.src = "/fallback-image.jpg"; // Provide a fallback image
            }}
          />
          <div className="flex justify center relative z-10 w-full">
            {/* Main Content */}
            <div className="min-h-screen">
              {/* Header with Glass Effect */}
              <header className="flex h-16 items-center gap-2 m-4 bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 text-white">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 p-2 rounded-lg transition-colors" />
                  <Separator orientation="vertical" className="mr-2 h-4 bg-white/30" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className=" md:block">
                        <BreadcrumbLink 
                          href="#" 
                          className="text-white transition-colors text-sm font-medium"
                        >
                          Building Your Application
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block text-white" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-white text-sm font-semibold">
                          Data Fetching
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <div className="w-full max-w-md flex flex-col items-center justify-center">
                {showAlert && (
                  <Alert className="mb-4 flex items-center bg-black text-white dm-serif-text-regular-italic">
                    <Terminal className="h-4 w-4 flex justify-center" />
                    <AlertTitle className="text-white">Alert</AlertTitle>
                    <AlertDescription className="text-white">
                      {alertMessage}
                    </AlertDescription>
                  </Alert>
                )}
                <div
                  className="flex justify-center bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-black/20"
                >
                  <div className=" bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-black/20 bg-opacity-50 p-4 rounded-lg">
                    <h2 className="text-xxl font-bold mb-4 text-white dm-serif-text-regular chart-colors">UPLOAD RECEIPT</h2>
                    <input type="file" onChange={handleFileChange} className="w-full mb-4 text-white" />
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 dm-serif-text-regular"
                    >
                      {uploading ? "Uploading..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}