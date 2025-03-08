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
  const UserAvatar = () => (
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
          className="rounded-full border-2 border-gray-200"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  );

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
              {user?.user_metadata?.first_name || 'User'}
            </div>
            
            {showDropdown && (
              <div className="absolute top-12 right-4 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-lg border border-white/20 rounded-lg p-2 w-48">
                <div className="p-2 text-sm text-gray-700">
                  {user?.user_metadata?.first_name || 'User'}
                </div>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-2 text-sm hover:bg-gray-100 rounded-md text-red-600"
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