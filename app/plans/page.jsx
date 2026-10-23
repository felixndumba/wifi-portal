"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../components/header";
import MpesaPaymentMonitor from "../../components/mpesa-payment-monitor";

const plans = [
  { id: "1-hour", name: "1 Hour Unlimited", price: 10, durationMinutes: 60, validity: "1 Hour" },
  { id: "3-hours", name: "3 Hours Unlimited", price: 25, durationMinutes: 180, validity: "3 Hours" },
  { id: "8-hours", name: "8 Hours Unlimited", price: 50, durationMinutes: 480, validity: "8 Hours" },
  { id: "24-hours", name: "24 Hours Unlimited", price: 80, durationMinutes: 1440, validity: "24 Hours" },
  { id: "2-days", name: "2 Days Unlimited", price: 150, durationMinutes: 2880, validity: "2 Days" },
  { id: "weekly", name: "Weekly Unlimited", price: 250, durationMinutes: 10080, validity: "7 Days" },
  { id: "monthly-one", name: "Monthly — 1 Device", price: 600, durationMinutes: 43200, validity: "30 Days", devices: 1 },
  { id: "monthly-two", name: "Monthly — 2 Devices", price: 800, durationMinutes: 43200, validity: "30 Days", devices: 2 },
  { id: "monthly-three", name: "Monthly — 3 Devices", price: 950, durationMinutes: 43200, validity: "30 Days", devices: 3 },
  { id: "monthly-unlimited", name: "Monthly — Unlimited Devices", price: 1100, durationMinutes: 43200, validity: "30 Days", devices: null },
];

function formatPrice(price) {
  return `KSh ${price.toLocaleString("en-KE")}`;
}

function normalizeKenyanPhone(value) {
  const phone = value.replace(/[\s+()-]/g, "");
  if (/^0[17]\d{8}$/.test(phone)) return `254${phone.slice(1)}`;
  if (/^254[17]\d{8}$/.test(phone)) return phone;
  return null;
}

function PlansGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectPlan(planId) {
    const params = new URLSearchParams();
    for (const key of ["macAddress", "ipAddress", "linkLogin", "linkOrig"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    params.set("plan", planId);
    router.push(`/plans?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Select an Internet Plan
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-500">
            Choose a high-speed package to get connected via M-Pesa.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((item) => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{formatPrice(item.price)}</p>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <div className="flex justify-between gap-3">
                    <span>Validity:</span>
                    <span className="font-semibold text-gray-900">{item.validity}</span>
                  </div>
                  {item.devices !== undefined && (
                    <div className="flex justify-between gap-3">
                      <span>Devices:</span>
                      <span className="font-semibold text-gray-900">{item.devices === null ? "Unlimited" : item.devices}</span>
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => selectPlan(item.id)} className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-center text-sm font-bold text-black transition hover:bg-yellow-400">
                Select Package
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const plan = plans.find((item) => item.id === planId);

  const macAddress = searchParams.get("macAddress") || "";
  const ipAddress = searchParams.get("ipAddress") || "";
  const linkLogin = searchParams.get("linkLogin") || "";
  const linkOrig = searchParams.get("linkOrig") || "";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");

  async function handlePayment() {
    if (!plan || loading || paymentStarted) return;
    const mpesaPhone = normalizeKenyanPhone(phone);
    if (!mpesaPhone) {
      setMessageType("error");
      setMessage("Enter a valid Kenyan M-Pesa number, e.g. 0712345678.");
      return;
    }
    setLoading(true);
    setMessage("");
    setMessageType("info");
    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: mpesaPhone, planId: plan.id, macAddress, ipAddress, linkLogin, linkOrig }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.checkoutRequestId) setCheckoutRequestId(data.checkoutRequestId);
      if (data.checkoutRequestId || data.paymentInitiated || data.success) setPaymentStarted(true);
      if (!response.ok || !data.success) {
        setMessageType("error");
        setMessage(data.error || "We could not confirm that the payment request started. Check payment status.");
        return;
      }
      setPaymentStarted(true);
      setMessageType("info");
      setMessage(data.message || "M-Pesa payment triggered.");
    } catch {
      setMessageType("error");
      setMessage("Network connection error.");
    } finally {
      setLoading(false);
    }
  }

  if (!plan) return <PlansGrid />;

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Payment</h2>
        <p className="text-sm text-gray-600 mb-2">Plan: <span className="font-semibold text-gray-900">{plan.name}</span></p>
        <p className="text-lg font-bold text-gray-900 mb-6">{formatPrice(plan.price)}</p>
        
        <input 
          type="text" 
          placeholder="M-Pesa Number (e.g., 0712345678)" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-sm"
        />
        
        <button onClick={handlePayment} disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition">
          {loading ? "Processing..." : "Pay with M-Pesa"}
        </button>

        {message && <p className={`mt-4 text-sm font-semibold ${messageType === "error" ? "text-red-600" : "text-blue-600"}`}>{message}</p>}
        {paymentStarted && checkoutRequestId && <MpesaPaymentMonitor checkoutRequestId={checkoutRequestId} linkLogin={linkLogin} />}
      </div>
    </main>
  );
}

// FIX: Definitively wrapping the entry segment in Suspense to stop Next.js worker context drop
export default function PlansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading plan layout...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
