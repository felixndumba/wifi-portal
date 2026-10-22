    
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const FINAL_STATUSES = new Set([
  "paid",
  "completed",
  "cancelled",
  "failed",
  "timeout",
  "expired",
]);

function normalizeStatus(value) {
  const normalized = String(value || "pending").toLowerCase();

  if (normalized === "completed" || normalized === "success") {
    return "paid";
  }

  if (normalized === "expired") {
    return "timeout";
  }

  return normalized;
}

export default function MpesaPaymentMonitor({ checkoutRequestId }) {
  const router = useRouter();

  const [status, setStatus] = useState("pending");
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState(
    "Check your phone and enter your M-Pesa PIN."
  );
  const [checking, setChecking] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const statusRef = useRef("pending");
  const checkingRef = useRef(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  const updateStatus = useCallback((nextStatus) => {
    const normalized = normalizeStatus(nextStatus);

    statusRef.current = normalized;
    setStatus(normalized);

    return normalized;
  }, []);

  const checkStatus = useCallback(async () => {
    if (!checkoutRequestId || checkingRef.current) {
      return null;
    }

    // Never check again after a final status has been received.
    if (FINAL_STATUSES.has(statusRef.current)) {
      return statusRef.current;
    }

    checkingRef.current = true;

    if (mountedRef.current) {
      setChecking(true);
    }

    try {
      const response = await fetch(
        `/api/mpesa/status?checkoutRequestId=${encodeURIComponent(
          checkoutRequestId
        )}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!mountedRef.current) {
        return null;
      }

      if (!response.ok || !data.success || !data.payment) {
        setMessage(
          data.error ||
            "We could not confirm the payment status. Please check again."
        );

        return null;
      }

      const nextStatus = normalizeStatus(data.payment.status);

      setPayment(data.payment);
      updateStatus(nextStatus);
      setLastChecked(new Date());

      switch (nextStatus) {
        case "paid":
          setMessage("Payment confirmed successfully.");
          break;

        case "cancelled":
          setMessage(
            "The payment was cancelled. No internet access has been activated."
          );
          break;

        case "failed":
          setMessage(
            "M-Pesa reported that the payment failed. Check your M-Pesa messages before trying again."
          );
          break;

        case "timeout":
          setMessage(
            "The M-Pesa request timed out. Check your M-Pesa messages before requesting another payment."
          );
          break;

        case "pending":
          setMessage(
            "We are waiting for M-Pesa confirmation. Check your phone for the payment prompt."
          );
          break;

        default:
          setMessage(
            `Payment status: ${nextStatus}. Please contact support if you need assistance.`
          );
      }

      return nextStatus;
    } catch (error) {
      console.error("Could not check M-Pesa payment status:", error);

      if (mountedRef.current) {
        setMessage(
          "Connection interrupted while checking payment status. Your payment may still be processing."
        );
      }

      return null;
    } finally {
      checkingRef.current = false;

      if (mountedRef.current) {
        setChecking(false);
      }
    }
  }, [checkoutRequestId, updateStatus]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!checkoutRequestId) {
      return;
    }

    let stopped = false;
    const startedAt = Date.now();

    statusRef.current = "pending";
    setStatus("pending");
    setPayment(null);
    setDelayed(false);
    setLastChecked(null);
    setMessage("Check your phone and enter your M-Pesa PIN.");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const poll = async () => {
      if (stopped || !mountedRef.current) {
        return;
      }

      const result = await checkStatus();

      if (stopped || !mountedRef.current) {
        return;
      }

      // Critical fix: stop polling when the payment reaches a final status.
      const currentStatus = statusRef.current;

      if (
        FINAL_STATUSES.has(currentStatus) ||
        (result && FINAL_STATUSES.has(result))
      ) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        return;
      }

      if (Date.now() - startedAt >= 120000) {
        setDelayed(true);
      }

      timerRef.current = setTimeout(poll, 3000);
    };

    poll();

    return () => {
      stopped = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [checkoutRequestId, checkStatus]);

  useEffect(() => {
    if (status !== "paid") {
      return;
    }

    const timer = setTimeout(() => {
      router.push(
        `/payment/success?receipt=${encodeURIComponent(
          payment?.receipt || ""
        )}`
      );
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, payment?.receipt, router]);

  if (!checkoutRequestId) {
    return null;
  }

  const appearance = {
    paid: "border-green-200 bg-green-50 text-green-900",
    cancelled: "border-amber-200 bg-amber-50 text-amber-900",
    failed: "border-red-200 bg-red-50 text-red-900",
    timeout: "border-amber-200 bg-amber-50 text-amber-900",
    pending: "border-stone-200 bg-stone-50 text-stone-800",
  };

  const labels = {
    paid: "Payment confirmed",
    cancelled: "Payment cancelled",
    failed: "Payment failed",
    timeout: "Payment timed out",
    pending: "Waiting for payment",
  };

  const isFinal = FINAL_STATUSES.has(status);

  return (
    <section
      aria-live="polite"
      className={`mt-5 rounded-2xl border p-5 ${
        appearance[status] || appearance.pending
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">
          {status === "paid"
            ? "✓"
            : status === "cancelled"
              ? "!"
              : status === "failed" || status === "timeout"
                ? "×"
                : "…"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {labels[status] || `Payment status: ${status}`}
          </h3>

          <p className="mt-1 text-sm">{message}</p>

          {payment && (
            <div className="mt-3 space-y-1 text-sm">
              {payment.packageName && (
                <p>Plan: {payment.packageName}</p>
              )}

              {payment.amount != null && (
                <p>
                  Amount: KSh{" "}
                  {Number(payment.amount).toLocaleString("en-KE")}
                </p>
              )}

              {payment.receipt && (
                <p>
                  M-Pesa receipt: <strong>{payment.receipt}</strong>
                </p>
              )}
            </div>
          )}

          {delayed && status === "pending" && (
            <p className="mt-3 text-sm">
              Confirmation is taking longer than expected. Do not pay again
              yet. Check your M-Pesa messages before retrying.
            </p>
          )}

          {status === "paid" && (
            <p className="mt-3 text-sm">
              Redirecting you to the confirmation page…
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isFinal && (
              <button
                type="button"
                onClick={checkStatus}
                disabled={checking}
                className="rounded-lg border border-current px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? "Checking…" : "Check payment status"}
              </button>
            )}

            {status !== "paid" && (
              <button
                type="button"
                onClick={() => router.push("/plans")}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                {isFinal ? "Return to plans" : "Close"}
              </button>
            )}
          </div>

          {lastChecked && (
            <p className="mt-3 text-xs opacity-70">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
      