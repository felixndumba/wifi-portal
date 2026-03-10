"use client"

import { useState, useEffect } from "react";
import Header from "../../components/header";

export default function DevicesPage() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for logged-in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchDevices(userData.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDevices = async (userId) => {
    try {
      const res = await fetch(`/api/devices?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample device data - will be replaced with MikroTik API data
  const sampleDevices = [
    {
      id: 1,
      name: "MikroTik Router",
      type: "Router",
      ipAddress: "192.168.1.1",
      status: "online",
      uptime: "5 days, 3 hours",
      signal: "-45 dBm",
      traffic: { download: "2.5 MB/s", upload: "0.8 MB/s" }
    },
    {
      id: 2,
      name: "Living Room AP",
      type: "Access Point",
      ipAddress: "192.168.1.2",
      status: "online",
      uptime: "5 days, 3 hours",
      signal: "-52 dBm",
      traffic: { download: "1.2 MB/s", upload: "0.3 MB/s" }
    },
    {
      id: 3,
      name: "Bedroom Extender",
      type: "Range Extender",
      ipAddress: "192.168.1.3",
      status: "offline",
      uptime: "N/A",
      signal: "N/A",
      traffic: { download: "N/A", upload: "N/A" }
    }
  ];

  const DeviceCard = ({ device }) => (
    <div className={`border-2 rounded-xl p-6 ${device.status === 'online' ? 'border-green-400 bg-gradient-to-b from-green-50 to-white' : 'border-red-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${device.status === 'online' ? 'bg-green-100' : 'bg-gray-200'}`}>
            <span className="text-2xl">📡</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{device.name}</h3>
            <p className="text-sm text-gray-500">{device.type}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500">IP Address</p>
          <p className="font-medium text-gray-800">{device.ipAddress}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500">Uptime</p>
          <p className="font-medium text-gray-800">{device.uptime}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500">Signal</p>
          <p className="font-medium text-gray-800">{device.signal}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500">Traffic</p>
          <p className="font-medium text-gray-800">
            ↓ {device.traffic.download} ↑ {device.traffic.upload}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          ⚙️ Configure
        </button>
        <button className="px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
          📊 Stats
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="text-center mt-20">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="text-center mt-8 mb-8">
        <h1 className="text-4xl font-bold">
          CHANGE <span className="text-yellow-500">DEVICE</span>
        </h1>
        {user ? (
          <p className="text-gray-600 mt-2">Welcome, {user.name}!</p>
        ) : (
          <p className="text-gray-600 mt-2">Please login to view your devices</p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Device Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{sampleDevices.filter(d => d.status === 'online').length}</p>
            <p className="text-sm text-gray-600">Online</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{sampleDevices.filter(d => d.status === 'offline').length}</p>
            <p className="text-sm text-gray-600">Offline</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{sampleDevices.length}</p>
            <p className="text-sm text-gray-600">Total Devices</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">MikroTik</p>
            <p className="text-sm text-gray-600">Router Type</p>
          </div>
        </div>

        {/* MikroTik Connection Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔗</span>
              <div>
                <h3 className="font-bold text-blue-800">MikroTik Connection</h3>
                <p className="text-sm text-blue-600">API integration coming soon</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
              ⚠️ Demo Mode
            </span>
          </div>
        </div>

        {/* Connected Devices */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📱 Connected Devices</h2>
          <p className="text-gray-500 mb-6">Manage your network devices</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </section>

        {/* Add Device Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">➕ Add New Device</h2>
          <p className="text-gray-500 mb-6">Connect a new device to your network</p>
          
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Add Device</h3>
            <p className="text-gray-500 mt-2 mb-4">Connect MikroTik or other network devices</p>
            <button className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              + Add Device
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

