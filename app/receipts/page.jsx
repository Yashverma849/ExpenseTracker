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
      <AppSidebar />
      <SidebarInset>
        <div
          className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
          style={{ backgroundImage: "url('/pc.jpeg')" }}
        >
          <div className="w-full max-w-md">
            {showAlert && (
              <Alert className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Alert</AlertTitle>
                <AlertDescription>
                  {alertMessage}
                </AlertDescription>
              </Alert>
            )}
            <div
              className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg p-6 border border-white/20"
            >
              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Upload Receipt</h2>
                <input type="file" onChange={handleFileChange} className="w-full mb-4" />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {uploading ? "Uploading..." : "Upload Receipt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}