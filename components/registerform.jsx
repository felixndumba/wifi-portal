"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm({ onSwitchTab }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const register = async () => {
    if (!name || !phone || !password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Redirecting to plans...");
        router.push("/plans");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      alert("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-16">
      <h2 className="text-4xl font-bold mb-12">
        CREATE <span className="text-yellow-500">ACCOUNT</span>
      </h2>

      <div className="w-[450px] mx-auto text-left">
        <label className="text-gray-500">Full Name *</label>
        <input
          type="text"
          className="w-full border-b border-gray-400 py-3 outline-none mb-6"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
        />

        <label className="text-gray-500">+254 - Phone Number *</label>
        <input
          type="text"
          className="w-full border-b border-gray-400 py-3 outline-none mb-6"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
        />

        <label className="text-gray-500">Password *</label>
        <input
          type="password"
          className="w-full border-b border-gray-400 py-3 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <button
        onClick={register}
        disabled={loading}
        className="mt-10 bg-black text-white px-16 py-4 rounded-full disabled:opacity-50"
      >
        {loading ? "REGISTERING..." : "REGISTER"}
      </button>

      <p className="mt-6 text-gray-600">
        Already have an account?{" "}
        <span
          onClick={onSwitchTab}
          className="text-yellow-500 cursor-pointer font-semibold hover:underline"
        >
          Login here
        </span>
      </p>
    </div>
  );
}

