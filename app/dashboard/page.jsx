"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar";
import Image from "next/image";
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
import { HousingChartComponent } from "@/components/charts/housing";
import { Piechartcomponent } from "@/components/charts/piechart";
import { FoodChartComponent } from "@/components/charts/food";
import Chatbox from "@/components/Chatbox";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data?.user) {
          router.push('/');
        }
      } catch (err) {
        if (err.message === "Auth session missing!") {
          router.push('/');
        } else {
          setError("Failed to authenticate. Please log in.");
          console.error("Authentication error:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      console.error('Error fetching expenses:', error.message, error.details);
    } else {
      setExpenses(data);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar className="bg-transparent backdrop-blur-lg border-r border-white/20" />
      <SidebarInset>
        {/* Fixed background */}
        <div className="relative flex justify-center w-full pb-16">
          <Image 
            src="/pexels-adrien-olichon-1257089-2387793.jpg" 
            alt="logo" 
            layout="fill" 
            objectFit="cover" 
            className="absolute inset-0 z-0" 
          />
          <div className="relative z-10 w-full">
            {/* Main Content */}
            <div className="min-h-screen">
              {/* Header with Glass Effect */}
              <header className="flex h-16 items-center gap-2 m-4 bg-transparent backdrop-blur-lg shadow-lg rounded-lg p-4 border border-white/20 text-white">
                <div className="flex items-center gap-2 px-4 text-white">
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

              {/* Charts Grid */}
              <div className="p-4">
                <div className="flex flex-1 flex-col gap-4">
                  {/* Full-width Pie Chart */}
                  <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-xl p-6 border border-white/20">
                    <Piechartcomponent expenses={expenses} />
                  </div>

                  {/* Two-column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-xl p-6 border border-white/20">
                      <HousingChartComponent expenses={expenses} />
                    </div>
                    <div className="bg-transparent backdrop-blur-lg shadow-lg rounded-xl p-6 border border-white/20">
                      <FoodChartComponent expenses={expenses} />
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </SidebarInset>
      <Chatbox onExpenseAdded={handleExpenseAdded} />
    </SidebarProvider>
  );
}