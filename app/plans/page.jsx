
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

  if (/^0[17]\d{8}$/.test(phone)) {
    return `254${phone.slice(1)}`;
  }

  if (/^254[17]\d{8}$/.test(phone)) {
    return phone;
  }

  return null;
}

function PlansGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preserve MikroTik captive-portal values when a customer selects a plan.
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
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {item.name}
                </h2>

                <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
                  {formatPrice(item.price)}
                </p>

                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <div className="flex justify-between gap-3">
                    <span>Validity:</span>
                    <span className="font-semibold text-gray-900">
                      {item.validity}
                    </span>
                  </div>

                  {item.devices !== undefined && (
                    <div className="flex justify-between gap-3">
                      <span>Devices:</span>
                      <span className="font-semibold text-gray-900">
                        {item.devices === null ? "Unlimited" : item.devices}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectPlan(item.id)}
                className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-center text-sm font-bold text-black transition hover:bg-yellow-400"
              >
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

  // These values originate from the MikroTik Hotspot redirect URL.
  const macAddress = searchParams.get("macAddress") || "";
  const ipAddress = searchParams.get("ipAddress") || "";
  const linkLogin = searchParams.get("linkLogin") || "";
  const linkOrig = searchParams.get("linkOrig") || "";

  // Keep the portal values when returning to the plan list.
  const plansUrlParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ macAddress, ipAddress, linkLogin, linkOrig })) {
    if (value) plansUrlParams.set(key, value);
  }
  const plansUrl = plansUrlParams.toString()
    ? `/plans?${plansUrlParams.toString()}`
    : "/plans";

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
        body: JSON.stringify({
          phoneNumber: mpesaPhone,
          planId: plan.id,
          macAddress,
          ipAddress,
          linkLogin,
          linkOrig,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Save the ID even if the API returned an error.
      // Safaricom may already have received the payment request.
      if (data.checkoutRequestId) {
        setCheckoutRequestId(data.checkoutRequestId);
      }

      if (data.checkoutRequestId || data.paymentInitiated || data.success) {
        setPaymentStarted(true);
      }

      if (!response.ok || !data.success) {
        setMessageType("error");
        setMessage(
          data.error ||
            "We could not confirm that the payment request started. Check the payment status before trying again."
        );
        return;
      }

      setPaymentStarted(true);
      setMessageType("info");
      setMessage(
        data.message ||
          "M-Pesa request sent. Check your phone and enter your PIN. Waiting for payment confirmation."
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        "The connection was interrupted. Do not submit another payment until you have checked whether the first request reached your phone."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!plan) return <PlansGrid />;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <a
          href={plansUrl}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          &larr; Back to plans
        </a>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gray-900 px-6 py-7 text-white sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Captive Portal Checkout
            </p>
            <h1 className="mt-3 text-3xl font-extrabold">{plan.name}</h1>
            <p className="mt-3 text-gray-300">
              Pay securely with M-Pesa to purchase your internet package.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Total to pay</p>
              <p className="mt-1 text-4xl font-extrabold text-gray-900">
                {formatPrice(plan.price)}
              </p>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-600">Internet validity</span>
                <span className="text-sm font-bold text-gray-900">
                  {plan.validity}
                </span>
              </div>

              {plan.devices !== undefined && (
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">Device allowance</span>
                  <span className="text-sm font-bold text-gray-900">
                    {plan.devices === null
                      ? "Unlimited devices"
                      : `${plan.devices} device${plan.devices === 1 ? "" : "s"}`}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-7">
              <label
                htmlFor="mpesa-phone"
                className="block text-sm font-bold text-gray-800"
              >
                M-Pesa phone number
              </label>

              <p className="mt-1 text-sm text-gray-500">
                Enter the number that should receive the payment prompt.
              </p>

              <input
                id="mpesa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0712345678"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setMessage("");
                  setMessageType("info");
                }}
                disabled={loading || paymentStarted}
                className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />

              {message && (
                <div
                  role={messageType === "error" ? "alert" : "status"}
                  aria-live="polite"
                  className={`mt-4 rounded-xl border p-4 text-sm ${
                    messageType === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-blue-200 bg-blue-50 text-blue-900"
                  }`}
                >
                  {message}
                </div>
              )}

              {!paymentStarted && (
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading}
                  className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Sending payment request..."
                    : `Pay ${formatPrice(plan.price)} with M-Pesa`}
                </button>
              )}

              {paymentStarted && checkoutRequestId && (
                <div className="mt-6">
                  <MpesaPaymentMonitor
                    checkoutRequestId={checkoutRequestId}
                  />
                </div>
              )}

              {paymentStarted && !checkoutRequestId && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  The payment request may have been sent, but its tracking ID
                  was not returned. Check your phone and payment records before
                  attempting another payment.
                </div>
              )}

              {paymentStarted && (
                <a
                  href={plansUrl}
                  className="mt-4 block text-center text-sm font-semibold text-gray-600 underline hover:text-gray-900"
                >
                  Return to plans
                </a>
              )}

              <p className="mt-4 text-center text-xs text-gray-500">
                Payment confirmation is required before internet access can be
                activated. Do not pay again while a request is still pending.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-gray-600">
          Loading internet plans...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
