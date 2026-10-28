
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
  { id: "monthly-one", name: "Monthly — 1 Device", price: 600, durationMinutes: 43200, validity: "30 Days" },
  { id: "monthly-two", name: "Monthly — 2 Devices", price: 800, durationMinutes: 43200, validity: "30 Days" },
  { id: "monthly-three", name: "Monthly — 3 Devices", price: 950, durationMinutes: 43200, validity: "30 Days" },
  { id: "monthly-unlimited", name: "Monthly Unlimited", price: 1100, durationMinutes: 43200, validity: "30 Days" },
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Captive portal values supplied by MikroTik.
  const macAddress = searchParams.get("macAddress") || "";
  const ipAddress = searchParams.get("ipAddress") || "";
  const linkLogin = searchParams.get("linkLogin") || "";
  const linkOrig = searchParams.get("linkOrig") || "";

  const selectedPlanId = searchParams.get("plan") || "";
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectPlan(plan) {
    const params = new URLSearchParams();

    params.set("plan", plan.id);

    if (macAddress) params.set("macAddress", macAddress);
    if (ipAddress) params.set("ipAddress", ipAddress);
    if (linkLogin) params.set("linkLogin", linkLogin);
    if (linkOrig) params.set("linkOrig", linkOrig);

    router.push(`/plans?${params.toString()}`);
  }

  async function handlePayment(event) {
    event.preventDefault();
    setError("");

    if (!selectedPlan) {
      setError("Please select a Wi-Fi plan first.");
      return;
    }

    const phone = mpesaPhone.trim().replace(/\s+/g, "");

    if (!/^(?:07|01)\d{8}$/.test(phone) && !/^254(?:7|1)\d{8}$/.test(phone)) {
      setError("Enter a valid Kenyan phone number, e.g. 0712345678 or 254712345678.");
      return;
    }

    if (!macAddress) {
      setError(
        "Your device MAC address was not received from the Wi-Fi login page. Disconnect from Wi-Fi and reconnect to open the login page again."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          planId: selectedPlan.id,
          macAddress,
          ipAddress,
          linkLogin,
          linkOrig,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.checkoutRequestId) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not initiate M-Pesa payment. Please try again."
        );
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setPaymentStarted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Header />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Nairika Labs Wi-Fi
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Choose Your Wi-Fi Plan
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Select a package, pay securely with M-Pesa, and wait while your
            connection is activated.
          </p>
        </div>

        {!paymentStarted ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => selectPlan(plan)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-400/10 ring-2 ring-emerald-400/30"
                        : "border-white/10 bg-white/5 hover:border-emerald-400/60 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{plan.name}</h2>

                      {isSelected && (
                        <span className="rounded-full bg-emerald-400 px-2 py-1 text-xs font-bold text-slate-950">
                          SELECTED
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-3xl font-bold">
                      KES {plan.price.toLocaleString("en-KE")}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Valid for {plan.validity}
                    </p>

                    <p className="mt-4 text-sm font-medium text-emerald-300">
                      {isSelected ? "Selected plan" : "Select this plan →"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <h2 className="text-2xl font-bold">Pay with M-Pesa</h2>

              <p className="mt-2 text-sm text-slate-300">
                Select a plan above, enter your M-Pesa number, and approve the
                payment prompt on your phone.
              </p>

              {selectedPlan ? (
                <div className="mt-5 rounded-xl bg-slate-900 p-4">
                  <div className="text-sm text-slate-400">Selected package</div>
                  <div className="mt-1 font-semibold">{selectedPlan.name}</div>
                  <div className="mt-1 text-xl font-bold text-emerald-400">
                    KES {selectedPlan.price.toLocaleString("en-KE")}
                  </div>
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                  Select a Wi-Fi package above to continue.
                </p>
              )}

              <form onSubmit={handlePayment} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="mpesaPhone"
                    className="mb-2 block text-sm font-medium"
                  >
                    M-Pesa phone number
                  </label>

                  <input
                    id="mpesaPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0712345678"
                    value={mpesaPhone}
                    onChange={(event) => setMpesaPhone(event.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !selectedPlan}
                  className="w-full rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Initiating M-Pesa..."
                    : selectedPlan
                      ? `Pay KES ${selectedPlan.price.toLocaleString("en-KE")}`
                      : "Select a plan to continue"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                Your connection is activated only after payment is confirmed
                and the MikroTik activation process succeeds.
              </p>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-3xl text-emerald-400">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Complete Your Payment
            </h2>

            <p className="mt-3 text-slate-300">
              Approve the M-Pesa prompt on your phone. Keep this page open
              while we verify payment and wait for your Wi-Fi access to be
              activated.
            </p>

            <div className="mt-5 rounded-xl bg-slate-900 p-4 text-left">
              <div className="text-sm text-slate-400">Package</div>
              <div className="font-semibold">{selectedPlan?.name}</div>

              <div className="mt-3 text-sm text-slate-400">Amount</div>
              <div className="font-bold text-emerald-400">
                KES {selectedPlan?.price.toLocaleString("en-KE")}
              </div>

              <div className="mt-3 text-sm text-slate-400">Device MAC</div>
              <div className="break-all font-mono text-sm">
                {macAddress || "Not provided"}
              </div>
            </div>

            {checkoutRequestId && (
              <MpesaPaymentMonitor
                checkoutRequestId={checkoutRequestId}
                linkLogin={linkLogin}
                linkOrig={linkOrig}
              />
            )}

            <button
              type="button"
              onClick={() => {
                setPaymentStarted(false);
                setCheckoutRequestId("");
                setError("");
              }}
              className="mt-6 text-sm text-slate-400 underline hover:text-white"
            >
              Return to plans
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          Loading Wi-Fi plans...
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
