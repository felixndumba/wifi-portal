"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "../../components/header";
import { useAuth } from "../../lib/auth";

export default function PlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const plans = [
    { name: "MATHE OFFER", price: 10, validity: "1 Hours" },
    { name: "MTAA OFFER", price: 20,  validity: "2 Hours 30 Min" },
    { name: "BROWSE OFFER", price: 40,  validity: "5 Hours" },
    { name: "BROWSE SANA OFFER", price: 50,  validity: "8 Hours" },
    { name: "Daily OFFER", price: 80,  validity: "24 Hours" },
    { name: "WEKEEND OFFERS", price: 150, validity: "2 Days" },
    { name: "Unlimited", price: 5000, data: "Unlimited", validity: "30 Days" },
  ];

  return (
    <div>
      <Header />
      <div className="text-center mt-10">
        <h1 className="text-4xl font-bold">
          INTERNET <span className="text-yellow-500">PLANS</span>
        </h1>
        <p className="text-gray-600 mt-2">Choose the plan that suits your needs</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-10 w-[900px] mx-auto">
        {plans.map((plan, index) => (
            <div
            key={index}
            className="bg-gray-900 border border-gray-600 rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-200">{plan.name}</h3>
            <p className="text-3xl font-bold text-yellow-500 mt-4">KSh {plan.price}</p>
            <p className="text-gray-600 mt-2">{plan.data}</p>
            <p className="text-sm text-gray-500 mt-1">Valid for {plan.validity}</p>
            <button className="mt-6 bg-black text-white px-8 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Subscribe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

