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
import { TransportationChartComponent } from "@/components/charts/transportation";
import { EntertainmentChartComponent } from "@/components/charts/entertainment";
import { OthersChartComponent } from "@/components/charts/others";
import Chatbox from "@/components/Chatbox";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      // Trigger a refresh in all chart components
      setRefreshTrigger(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white bg-gray-900">
        <div className="p-6 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg border border-white/20">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900">
        <div className="p-6 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-lg border border-white/20">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar className="bg-transparent backdrop-blur-lg border-r border-white/20" />
      <SidebarInset>
        {/* Fixed background with fallback color */}
        <div className="relative flex justify-center w-full pb-16 bg-gray-900">
          <Image
            src="/pexels-adrien-olichon-1257089-2387793.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="absolute inset-0 z-0"
            priority
            onError={(e) => {
              console.error("Failed to load background image");
              e.target.style.display = 'none';
            }}
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
                          Expense Dashboard
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block text-white" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-white text-sm font-semibold">
                          Category Breakdown
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

                  {/* Three-column Grid for main categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <HousingChartComponent refresh={refreshTrigger} />
                    </div>
                    <div>
                      <FoodChartComponent refresh={refreshTrigger} />
                    </div>
                    <div>
                      <TransportationChartComponent refresh={refreshTrigger} />
                    </div>
                  </div>

                  {/* Two-column Grid for additional categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <EntertainmentChartComponent refresh={refreshTrigger} />
                    </div>
                    <div>
                      <OthersChartComponent refresh={refreshTrigger} />
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