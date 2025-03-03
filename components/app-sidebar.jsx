"use client";

import * as React from "react";
import {
  SquareTerminal,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}