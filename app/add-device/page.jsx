"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import Header from "../../components/header";

export default function AddDevicePage() {
  const { user, loading } = useAuth();
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please login to add a device");
      return;
    }

    if (!deviceName || !deviceType) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          deviceName,
          deviceType,
          ipAddress
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Device addition will be available with MikroTik API integration");
        setDeviceName("");
        setDeviceType("");
        setIpAddress("");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error adding device:", error);
      alert("Failed to add device");
    } finally {
      setSubmitting(false);
    }
  };

  const deviceTypes = [
    { id: "router", name: "MikroTik Router", icon: "📡" },
    { id: "ap", name: "Access Point", icon: "📶" },
    { id: "extender", name: "WiFi Extender", icon: "🔄" },
    { id: "mesh", name: "Mesh System", icon: "🕸️" },
    { id: "ont", name: "ONT/Modem", icon: "📟" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="text-center mt-20">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">

      <Header />
      
      <div className="text-center mt-8 mb-8">
        <h1 className="text-4xl font-bold">
          ADD <span className="text-yellow-500">DEVICE</span>
        </h1>
        {user ? (
          <p className="text-gray-600 mt-2">Welcome, {user.name}!</p>
        ) : (
          <p className="text-gray-600 mt-2">Please login to add a device</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* MikroTik Notice */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <h3 className="font-bold text-blue-400">MikroTik API Integration</h3>
              <p className="text-sm text-blue-300">Device configuration will connect to your MikroTik router</p>
            </div>
          </div>
        </div>


        {/* Add Device Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📱 Add New Device</h2>
          
          {user ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Living Room Router"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Device Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {deviceTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setDeviceType(type.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        deviceType === type.id
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className="text-sm font-medium">{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  IP Address (Optional)
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding Device..." : "➕ Add Device"}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please login to add a device</p>
              <a
                href="/login"
                className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                🔐 Login
              </a>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 mb-4">📋 Instructions</h3>
          <ul className="space-y-2 text-gray-600">
            <li>1. Enter a name to identify your device</li>
            <li>2. Select the type of device you want to add</li>
            <li>3. Optionally specify the IP address</li>
            <li>4. Click "Add Device" to connect to MikroTik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

