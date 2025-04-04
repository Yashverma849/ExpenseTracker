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
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        const session = data.session;
        console.log("Session retrieved:", session ? "Session exists" : "No session");
        
        if (session) {
          console.log("Session user:", session.user?.id);
          console.log("Session user metadata:", session.user?.user_metadata);
        }
        
        setSession(session);
        
        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error fetching user:', userError);
            return;
          }
          
          if (userData.user) {
            console.log("User data retrieved successfully");
            console.log("User metadata from getUser:", userData.user.user_metadata);
            console.log("User ID:", userData.user.id);
            console.log("User email:", userData.user.email);
            
            // If metadata is missing, try to retrieve it from the session
            if (!userData.user.user_metadata && session.user?.user_metadata) {
              console.log("Metadata missing in getUser response but present in session");
              userData.user.user_metadata = session.user.user_metadata;
            }
            
            setUser(userData.user);
          } else {
            console.error("getUser returned no user data");
          }
        }
      } catch (error) {
        console.error('Error in session logic:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      
      if (session) {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user on auth change:', error);
          return;
        }
        
        console.log("User data after auth change:", data.user?.id);
        setUser(data.user);
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
    const [imageError, setImageError] = useState(false);
    
    // Check if user exists
    if (!user) {
      console.log("UserAvatar: No user data available");
      return (
        <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-white/30 flex items-center justify-center text-white font-medium">
          ?
        </div>
      );
    }
    
    // Get initial from email or default
    const userInitial = user.email ? user.email[0].toUpperCase() : 'U';
    
    // Check if we have a valid avatar URL
    const avatarUrl = user.user_metadata && typeof user.user_metadata === 'object' 
      ? user.user_metadata.avatar_url 
      : null;
    
    // Log the metadata info directly
    console.log("User initial:", userInitial);
    console.log("Has metadata:", user.user_metadata ? "Yes" : "No");
    console.log("Avatar URL:", avatarUrl);
    
    return (
      <div 
        className="relative cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {avatarUrl && !imageError ? (
          <Image
            src={avatarUrl}
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full border-2 border-white/30"
            onError={() => {
              console.error("Avatar image failed to load");
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-900 border-2 border-white/30 flex items-center justify-center text-white font-medium">
            {userInitial}
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
                  {/* User info with proper fallbacks */}
                  {user ? (
                    <>
                      {/* Show name if available */}
                      {user.user_metadata && (user.user_metadata.first_name || user.user_metadata.name) ? (
                        <div className="font-semibold">
                          {user.user_metadata.first_name || user.user_metadata.name}
                        </div>
                      ) : user.email ? (
                        <div className="font-semibold truncate">
                          {user.email.split('@')[0]}
                        </div>
                      ) : (
                        <div className="font-semibold">User</div>
                      )}
                      
                      {/* Show email with truncation */}
                      {user.email && (
                        <div className="truncate text-xs text-white/80 mt-1" title={user.email}>
                          {user.email}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="font-semibold">Loading user data...</div>
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