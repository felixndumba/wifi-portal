"use client";

import { useState } from "react";
import Header from "../../components/header";
import LoginForm from "../../components/loginform";
import RegisterForm from "../../components/registerform";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div>
      <Header />

      <div className="flex justify-center gap-20 mt-14 border-b w-[700px] mx-auto text-gray-600">
        <p
          className={`border-b-2 pb-3 cursor-pointer transition-colors ${
            activeTab === "login"
              ? "border-green-500 text-green-500 font-semibold"
              : "border-transparent hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </p>
        <p
          className={`border-b-2 pb-3 cursor-pointer transition-colors ${
            activeTab === "register"
              ? "border-green-500 text-green-500 font-semibold"
              : "border-transparent hover:text-gray-900"
          }`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </p>
      </div>

      {activeTab === "login" ? (
        <LoginForm onSwitchTab={() => setActiveTab("register")} />
      ) : (
        <RegisterForm onSwitchTab={() => setActiveTab("login")} />
      )}
    </div>
  );
}

