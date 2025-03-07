"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation"; 
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";
import * as Popover from "@radix-ui/react-popover";

// Generate Gravatar URL based on email hash
const getGravatarUrl = (email) => {
  if (!email) return "/default-avatar.png"; 
  const emailHash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;
};

function NavUserComponent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname(); 
  const router = useRouter(); // Use the router

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.warn("No active session found.", sessionError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        const userData = data.user;
        const fullName = userData.user_metadata?.full_name || userData.email;
        const firstName = fullName.split(' ')[0]; // Extract first name
        const avatarUrl = getGravatarUrl(userData.email); // Set avatar URL
        console.log("Avatar URL:", avatarUrl); // Debugging: log the avatar URL
        setUser({
          name: firstName,
          email: userData.email,
          avatarUrl, // Set avatar URL
        });
      } else {
        console.error("Error fetching user:", error);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogin = () => {
    window.location.href = "/login"; 
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Redirect to home page
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Button onClick={handleLogin} className="btn btn-primary">
        Login
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Popover.Root>
        <Popover.Trigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
            <span className="truncate font-semibold text-white">{user.name || 'User'}</span>
          </div>
        </Popover.Trigger>
        <Popover.Content className="bg-white p-2 rounded shadow-lg">
          <Button onClick={handleLogout} className="btn btn-secondary mt-2">Logout</Button>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}

// Dynamically import the component
const NavUser = dynamic(() => Promise.resolve(NavUserComponent), { ssr: false });

export default NavUser;