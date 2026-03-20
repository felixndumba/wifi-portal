"use client"

import {useState} from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth"

export default function LoginForm({ onSwitchTab }){
  const [phone,setPhone] = useState("")
  const [password,setPassword] = useState("")
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const { login: authLogin } = useAuth();

  const isValidKenyanPhone = (phone) => {
    const pattern = /^(0)?[701][0-9]{8}$/;
    return pattern.test(phone.replace(/[\s-]/g, ""));
  };

  const login = async () => {
    setError("");
    setLoading(true);

    if(!phone || !password){
      setError("Please enter both phone number and password");
      setLoading(false);
      return;
    }
    if (!isValidKenyanPhone(phone)) {
      setError("Please enter a valid Kenyan phone number (e.g., 0712345678 or 0172345678)");
      setLoading(false);
      return;
    }
    if (password.length < 5) {
      setError("Password must be at least 5 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({phone, password})
      });

      const data = await res.json();

      if(data.success){
        const userData = data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        authLogin(userData);
        
        // Trigger storage event for sync across components
        window.dispatchEvent(new StorageEvent('storage', { 
          key: 'user', 
          newValue: localStorage.getItem('user') 
        }));
        
        router.push("/subscriptions");
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return(

  <div className="text-center mt-16">

  <h2 className="text-4xl font-bold mb-12">
  ACCOUNT <span className="text-yellow-500">LOGIN</span>
  </h2>

  {error && (
    <div className="w-[450px] mx-auto text-left mb-4 p-3 bg-black border border-gray-600 text-gray-300 rounded">
      {error}
    </div>
  )}
  <div className="w-[450px] mx-auto text-left">

  <label className="text-gray-500">
  Phone Number *
  </label>

  <input
  type="tel"
  pattern="^(0)?[701][0-9]{8}$"
  title="Valid Kenyan phone (0712345678 or 0172345678)"
  className="w-full border-b border-gray-400 py-3 outline-none"
  value={phone}
  onChange={(e)=>setPhone(e.target.value)}
  />

  <label className="text-gray-500 mt-4 block">
  Password *
  </label>

          <input
            type="password"
            minLength="5"
            title="Password at least 5 characters"
    className="w-full border-b border-gray-400 py-3 outline-none"
  value={password}
  onChange={(e)=>setPassword(e.target.value)}
  />

          <p className="text-sm text-gray-500 mt-2 mb-4 text-center cursor-pointer hover:underline" onClick={() => setError("message password using your number to 0797624963 to get you password")}>
            Forgot Password?
          </p>

  </div>

  <button
  onClick={login}
  disabled={loading}
  className="mt-10 bg-black text-gray-300 px-16 py-4 rounded-full hover:bg-gray-800 disabled:opacity-50"
  >
    {loading ? "LOGGING IN..." : "LOGIN"}
  </button>

  <p className="mt-6 text-gray-600">
  Don't have an account?{" "}
  <span
    onClick={onSwitchTab}
    className="text-yellow-500 cursor-pointer font-semibold hover:underline"
  >
    Register here
  </span>
  </p>

  </div>

  )

}
