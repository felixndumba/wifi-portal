
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PAYMENT_FAILURES = new Set([
  "cancelled",
  "failed",
  "timeout",
  "expired",
]);

function normalizeStatus(value) {
  const normalized = String(value || "pending").toLowerCase();

  if (["completed", "success", "paid"].includes(normalized)) {
    return "paid";
  }

  if (["expired", "timed_out"].includes(normalized)) {
    return "timeout";
  }

  if (["cancelled", "canceled"].includes(normalized)) {
    return "cancelled";
  }

  return normalized;
}

function normalizeActivation(value) {
  const normalized = String(value || "pending").toLowerCase();

  if (["activated", "active", "success"].includes(normalized)) {
    return "activated";
  }

  if (["failed", "error"].includes(normalized)) {
    return "failed";
  }

  return normalized;
}

export default function MpesaPaymentMonitor({
  checkoutRequestId,
  linkLogin = "",
  linkOrig = "",
}) {
  const router = useRouter();

  const [status, setStatus] = useState("pending");
  const [payment, setPayment] = useState(null);
  const [activationStatus, setActivationStatus] = useState("pending");
  const [message, setMessage] = useState(
    "Check your phone and enter your M-Pesa PIN."
  );
  const [checking, setChecking] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const mountedRef = useRef(false);
  const checkingRef = useRef(false);
  const timerRef = useRef(null);
  const redirectedRef = useRef(false);
  const statusRef = useRef("pending");
  const activationRef = useRef("pending");
  const startedAtRef = useRef(Date.now());

  const updatePaymentStatus = useCallback((value) => {
    const normalized = normalizeStatus(value);
    statusRef.current = normalized;
    setStatus(normalized);
    return normalized;
  }, []);

  const updateActivationStatus = useCallback((value) => {
    const normalized = normalizeActivation(value);
    activationRef.current = normalized;
    setActivationStatus(normalized);
    return normalized;
  }, []);

  const checkStatus = useCallback(async () => {
    if (!checkoutRequestId || checkingRef.current) {
      return;
    }

    if (PAYMENT_FAILURES.has(statusRef.current)) {
      return;
    }

    if (
      statusRef.current === "paid" &&
      ["activated", "failed"].includes(activationRef.current)
    ) {
      return;
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

      const data = await response.json().catch(() => ({}));

      if (!mountedRef.current) {
        return;
      }

      if (!response.ok || !data.success || !data.payment) {
        setMessage(
          data.error ||
            "We could not retrieve your payment status. We will try again automatically."
        );
        return;
      }

      const currentPayment = data.payment;
      const nextStatus = updatePaymentStatus(
        currentPayment.payment_status === "paid"
          ? "paid"
          : currentPayment.status
      );

      const nextActivation = updateActivationStatus(
        currentPayment.activation_status ??
          currentPayment.activationStatus ??
          "pending"
      );

      setPayment(currentPayment);
      setLastChecked(new Date());

      if (nextStatus === "paid") {
        if (nextActivation === "activated") {
          setMessage(
            "Payment confirmed and internet access activated. Connecting your device..."
          );
        } else if (nextActivation === "failed") {
          setMessage(
            "Payment was received, but automatic internet activation needs attention. Please contact support. Do not pay again."
          );
        } else {
          setMessage(
            "Payment confirmed. Waiting for the Wi-Fi router to activate your device..."
          );
        }

        return;
      }

      if (nextStatus === "cancelled") {
        setMessage(
          "The payment was cancelled. No internet access has been activated."
        );
      } else if (nextStatus === "failed") {
        setMessage(
          "M-Pesa reported that the payment failed. Check your M-Pesa messages before trying again."
        );
      } else if (nextStatus === "timeout") {
        setMessage(
          "The payment request timed out. Check your M-Pesa messages before requesting another payment."
        );
      } else {
        setMessage(
          "Waiting for M-Pesa confirmation. Check your phone for the payment prompt."
        );
      }
    } catch (error) {
      console.error("M-Pesa status check failed:", error);

      if (mountedRef.current) {
        setMessage(
          "Connection interrupted while checking payment status. Your payment may still be processing."
        );
      }
    } finally {
      checkingRef.current = false;

      if (mountedRef.current) {
        setChecking(false);
      }
    }
  }, [checkoutRequestId, updatePaymentStatus, updateActivationStatus]);

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

    statusRef.current = "pending";
    activationRef.current = "pending";
    redirectedRef.current = false;
    startedAtRef.current = Date.now();

    setStatus("pending");
    setActivationStatus("pending");
    setPayment(null);
    setDelayed(false);
    setLastChecked(null);
    setMessage("Check your phone and enter your M-Pesa PIN.");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const poll = async () => {
      if (stopped || !mountedRef.current) {
        return;
      }

      await checkStatus();

      if (stopped || !mountedRef.current) {
        return;
      }

      const paymentStatus = statusRef.current;
      const activation = activationRef.current;

      if (PAYMENT_FAILURES.has(paymentStatus)) {
        return;
      }

      if (
        paymentStatus === "paid" &&
        ["activated", "failed"].includes(activation)
      ) {
        return;
      }

      if (Date.now() - startedAtRef.current >= 120000) {
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
    if (
      status !== "paid" ||
      activationStatus !== "activated" ||
      redirectedRef.current
    ) {
      return;
    }

    redirectedRef.current = true;

    // Use the original MikroTik login URL when it is valid.
    if (linkLogin) {
      try {
        const target = new URL(linkLogin);

        if (
          target.protocol === "http:" ||
          target.protocol === "https:"
        ) {
          window.location.assign(target.href);
          return;
        }
      } catch (error) {
        console.error("Invalid hotspot login URL:", error);
      }
    }

    // Fallback when no valid login URL was supplied.
    router.replace(
      `/payment/success?receipt=${encodeURIComponent(
        payment?.receipt || ""
      )}`
    );
  }, [
    status,
    activationStatus,
    linkLogin,
    payment?.receipt,
    router,
  ]);

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

  const paymentFailed = PAYMENT_FAILURES.has(status);
  const activationFailed =
    status === "paid" && activationStatus === "failed";

  return (
    <section
      aria-live="polite"
      className={`mt-5 rounded-2xl border p-5 ${
        appearance[status] || appearance.pending
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">
          {status === "paid" && activationStatus === "activated"
            ? "✓"
            : paymentFailed || activationFailed
              ? "!"
              : "…"}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {labels[status] || `Payment status: ${status}`}
          </h3>

          <p className="mt-1 text-sm">{message}</p>

          {payment && (
            <div className="mt-3 space-y-1 text-sm">
              {(payment.packageName || payment.package_name) && (
                <p>
                  Plan: {payment.packageName || payment.package_name}
                </p>
              )}

              {payment.amount != null && (
                <p>
                  Amount: KSh{" "}
                  {Number(payment.amount).toLocaleString("en-KE")}
                </p>
              )}

              {(payment.receipt || payment.mpesa_receipt_number) && (
                <p>
                  M-Pesa receipt:{" "}
                  <strong>
                    {payment.receipt || payment.mpesa_receipt_number}
                  </strong>
                </p>
              )}
            </div>
          )}

          {status === "paid" && (
            <div className="mt-3 rounded-lg border border-current/20 p-3 text-sm">
              <p>
                <strong>Internet activation:</strong>{" "}
                {activationStatus === "activated"
                  ? "Activated"
                  : activationStatus === "failed"
                    ? "Needs attention"
                    : activationStatus === "processing"
                      ? "Router is processing your connection"
                      : "Waiting for router"}
              </p>
            </div>
          )}

          {delayed && !paymentFailed && status !== "paid" && (
            <p className="mt-3 text-sm">
              Confirmation is taking longer than expected. Do not pay again
              yet. Check your M-Pesa messages before retrying.
            </p>
          )}

          {delayed && status === "paid" && activationStatus !== "activated" && (
            <p className="mt-3 text-sm">
              Activation is taking longer than expected. Your payment is
              confirmed; please do not pay again.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!paymentFailed &&
              !(status === "paid" && activationStatus === "activated") &&
              !activationFailed && (
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={checking}
                  className="rounded-lg border border-current px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking ? "Checking..." : "Check status"}
                </button>
              )}

            {(paymentFailed || activationFailed) && (
              <button
                type="button"
                onClick={() => router.push("/plans")}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                Return to plans
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
