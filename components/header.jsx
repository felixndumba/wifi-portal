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
          <span className="text-black">NAIRIKA</span><br />
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
       
        <p className="cursor-pointer hover:text-yellow-500 transition-colors font-medium">
          Add Device
        </p>
        <p className="cursor-pointer hover:text-yellow-500 transition-colors font-medium">
          Change Device
        </p>
        
    
      </div>

      <div className="bg-gray-800 text-gray-200 mt-6 px-4 py-3 w-full max-w-md mx-auto text-center cursor-pointer hover:bg-gray-900 transition-colors">
        Chat with Us – We're Here to Help 24x7!
        <br />
        NO SIGNAL AFTER PAYMENT! CALL <span className="text-yellow-500 text-bold">0797624963</span> FOR ASSISTANCE.
      </div>

    </div>
  );
}

