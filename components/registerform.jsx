"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm({ onSwitchTab }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidKenyanPhone = (phone) => {
    const pattern = /^(0)?[701][0-9]{8}$/;
    return pattern.test(phone.replace(/[\s-]/g, ""));
  };

  const router = useRouter();

  const register = async () => {
    setError(""); // Clear previous errors
    if (!name || !phone || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!isValidKenyanPhone(phone)) {
      setError("Please enter a valid Kenyan phone number");
      return;
    }
    if (password.length < 5) {
      setError("Password must be at least 5 characters long");
      return;
    }

    setLoading(true);

    try {
      // Register first
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phone, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || "Registration failed");
        return;
      }

      // Auto-login immediately after registration
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      const loginData = await loginRes.json();

      if (loginData.success) {
        // Auth context will sync via localStorage
        localStorage.setItem('user', JSON.stringify(loginData.user));
        router.push("/subscriptions"); // Consistent with login flow
      } else {
        setError("Registration successful but login failed. Please login manually.");
      }
    } catch (error) {
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-16">
      <h2 className="text-4xl font-bold mb-12">
        CREATE <span className="text-yellow-500">ACCOUNT</span>
      </h2>

      {error && (
        <div className="w-[450px] mx-auto text-left mb-4 p-3 bg-black border border-gray-600 text-gray-300 rounded">
          {error}
        </div>
      )}
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
          type="tel"
          pattern="^(0)?[701][0-9]{8}$"
          title="Valid Kenyan phone (0712345678 or 0172345678)"
          className="w-full border-b border-gray-400 py-3 outline-none mb-6"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
        />

        <label className="text-gray-500">Password *</label>
        <input
          type="password"
          minLength="5"
          title="Password at least 5 characters"
          className="w-full border-b border-gray-400 py-3 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <button
        onClick={register}
        disabled={loading}
        className="mt-10 bg-black text-gray-300 px-16 py-4 rounded-full disabled:opacity-50 hover:bg-gray-800"
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
