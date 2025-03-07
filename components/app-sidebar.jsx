"use client";

import * as React from "react";
import {
  PieChart,
  BookOpen,
  DollarSign, // Import the icon for Expense
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import NavUser from "@/components/nav-user"; // Ensure correct import
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";

// Simplified data to only include Dashboard, Budget, Receipts, and Expense
const data = {
  teams: [
    {
      name: "Finzarc",
      logo: BookOpen,
      plan: "Management",
    },
  ],
  navMain: [
    {
      title: "Budget",
      url: "/dashboard", // Update URL to point to the correct route
      icon: PieChart,
      isActive: true,
    },
    {
      title: "Receipts",
      url: "/receipts", // Update URL to point to the correct route
      icon: BookOpen,
    },
    {
      title: "Expense",
      url: "/expense", // Update URL to point to the correct route
      icon: DollarSign,
    },
  ],
};

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar
      collapsible="icon"
      className="relative bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg border border-white/20 text-white" // Add text-white class here
      {...props}
    >
      <Image 
        src="/pexels-adrien-olichon-1257089-2387793.jpg" 
        alt="Background" 
        layout="fill" 
        objectFit="cover" 
        className="absolute inset-0 z-0" 
      />
      <div className="relative z-10 text-white flex flex-col justify-between h-full">
        <div>
          <SidebarHeader>
            <TeamSwitcher teams={data.teams} />
          </SidebarHeader>
          <SidebarContent>
            <NavMain items={data.navMain} />
          </SidebarContent>
        </div>
        <SidebarFooter className="flex item-center p-4">
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </div>
    </Sidebar>
  );
}