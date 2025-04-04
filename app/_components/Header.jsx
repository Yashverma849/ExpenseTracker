"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function Header() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Fetching user session
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } else {
        setUser(null);
      }
    });

    getSession();

    return () => subscription?.unsubscribe();
  }, []);

  // Click outside dropdown handling 
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation handlers
  const handleLogoClick = () => router.push('/');
  const handleSignupClick = () => router.push('/signup');

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowDropdown(false);
    }
  };

  // User avatar component
  const UserAvatar = () => {
    // Debug: Log user metadata
    console.log("User metadata:", user?.user_metadata);
    console.log("Avatar URL:", user?.user_metadata?.avatar_url);
    
    return (
      <div 
        className="relative cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user?.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white/30"
            onError={(e) => {
              console.error("Error loading avatar image");
              e.target.style.display = 'none';
              // Show fallback
              const fallback = document.createElement('div');
              fallback.className = "w-10 h-10 rounded-full bg-black border-2 border-white/30 flex items-center justify-center text-white font-medium";
              fallback.innerText = user?.email?.[0]?.toUpperCase() || 'U';
              e.target.parentNode.appendChild(fallback);
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-black border-2 border-white/30 flex items-center justify-center text-white font-medium">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`px-4 py-1 flex justify-between items-center shadow-sm sticky top-0 z-50 rounded-2xl transition-all duration-300 ${isScrolled ? 'bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg' : 'bg-transparent'}`}
    >
      <Image 
        src="/Finz (1).png" 
        alt="logo" 
        width={100} 
        height={100} 
        onClick={handleLogoClick} 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        priority
      />

      <div className="flex items-center gap-4" ref={dropdownRef}>
        {session ? (
          <>
            <div 
              className="relative cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <UserAvatar />
            </div>
            
            {showDropdown && (
              <div className="absolute top-12 right-4 bg-black bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg border border-white/20 rounded-lg p-2 w-56 z-50">
                <div className="px-2 pt-2 pb-1 text-sm text-white font-medium">
                  {/* Show name if available */}
                  {user?.user_metadata?.first_name && (
                    <div className="font-semibold">{user.user_metadata.first_name}</div>
                  )}
                  {/* Show email with truncation */}
                  {user?.email && (
                    <div className="truncate text-xs text-white/80 mt-1" title={user.email}>
                      {user.email}
                    </div>
                  )}
                  {/* Fallback if neither is available */}
                  {!user?.user_metadata?.first_name && !user?.email && (
                    <div className="font-semibold">User</div>
                  )}
                </div>
                <hr className="my-1 border-white/20" />
                <button
                  onClick={() => {
                    try {
                      setShowDropdown(false); // Close dropdown first
                      console.log("Navigating to dashboard");
                      router.push('/dashboard');
                    } catch (error) {
                      console.error("Navigation error:", error);
                    }
                  }}
                  className="w-full text-left p-2 text-sm hover:bg-white/10 rounded-md text-white"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-2 text-sm hover:bg-white/10 rounded-md text-red-400"
                >
                  Log Out
                </button>
              </div>
            )}
          </>
        ) : (
          <Button 
            onClick={handleSignupClick}
            variant="attractive" // Use the new variant
            className="px-4 py-1 rounded-full transition-colors"
          >
            Sign Up
          </Button>
        )}
      </div>
    </div>
  );
}

export default Header;