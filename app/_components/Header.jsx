"use client";

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function Header() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // fetching user session
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
      } finally {
        setLoading(false);
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

  // click outside dropdown handling 
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // navigation handlers
  const handleLogoClick = () => router.push('/');
  const handleSignupClick = () => router.push('/signup');

  // logout function
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

  // user avatar component
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

  // loading skeleton
  if (loading) {
    return (
      <div className='p-4 flex justify-between items-center border shadow-sm'>
        <Skeleton height={40} width={100} />
        <Skeleton height={40} width={100} />
      </div>
    );
  }

  // rendering header
  return (
    <div className='p-4 flex justify-between items-center border-b shadow-sm bg-white sticky top-0 z-50'>
      <Image 
        src="/Finzarc-removebg-preview.png" 
        alt="logo" 
        width={120} 
        height={40} 
        onClick={handleLogoClick} 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        priority
      />

      <div className="flex items-center gap-4" ref={dropdownRef}>
        {session ? (
          <>
            <div className="hidden md:flex flex-col items-end">
              <p className="font-medium text-gray-800">
                {user?.user_metadata?.first_name || 'User'}
              </p>
              <p className="text-sm text-gray-500">
                {user?.email}
              </p>
            </div>
            <UserAvatar />
            
            {showDropdown && (
              <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border p-2 w-48">
                <div className="p-2 text-sm text-gray-700">
                  {user?.email}
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
            className="px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Sign Up
          </Button>
        )}
      </div>
    </div>
  );
}

export default Header;