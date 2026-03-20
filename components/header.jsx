 "use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const { user, logout } = useAuth();

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push("/");
  };

  return (
    <div className="text-center mt-10">
      <Link href="/"> 
        <h1 className="text-5xl font-bold cursor-pointer hover:opacity-90 transition-opacity">
          <span className="text-gray-200">MATHE</span><br />
          <span className="text-yellow-500">Internet</span>
        </h1>
      </Link>

      <p className="text-gray-600 mt-2">
        Fast, Affordable &amp; Reliable
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-16 mt-10 text-gray-400 sm:text-gray-700 px-4">

        <Link 
          href="/plans" 
          className="hover:text-yellow-500 transition-colors cursor-pointer font-medium"
        >
          Internet Plans
        </Link>
        <Link 
          href="/subscriptions" 
          className="hover:text-yellow-500 transition-colors cursor-pointer font-medium"
        >
          Subscriptions
        </Link>
        <p className="cursor-pointer hover:text-yellow-500 transition-colors font-medium">
          Add Device
        </p>
        <p className="cursor-pointer hover:text-yellow-500 transition-colors font-medium">
          Change Device
        </p>
        
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="cursor-pointer hover:text-yellow-500 transition-colors font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>{user.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
{showDropdown && (
              <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-700 shadow-lg rounded-md py-2 min-w-[140px] z-50">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300 text-left flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            href="/login" 
            className="cursor-pointer hover:text-yellow-500 transition-colors font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Login
          </Link>
        )}
      </div>

      <div className="bg-gray-800 text-gray-200 mt-6 px-4 py-3 w-full max-w-md mx-auto text-center cursor-pointer hover:bg-gray-900 transition-colors">
        Chat with Us – We're Here to Help 24x7!
        <br />
        NO SIGNAL AFTER PAYMENT! CALL 0797624963 FOR ASSISTANCE.
      </div>

    </div>
  );
}

