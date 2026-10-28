
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const checkoutRequestId = request.nextUrl.searchParams
    .get("checkoutRequestId")
    ?.trim();

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };

  if (!checkoutRequestId) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing checkoutRequestId.",
      },
      { status: 400, headers }
    );
  }

  try {
    const [rows]: any = await db.execute(
      `SELECT
        checkout_request_id,
        status,
        payment_status,
        activation_status,
        package_name,
        amount,
        mpesa_receipt,
        activation_error,
        activated_at
      FROM payments
      WHERE checkout_request_id = ?
      LIMIT 1`,
      [checkoutRequestId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          status: "unknown",
          error: "Payment record not found.",
        },
        { status: 404, headers }
      );
    }

    const row = rows[0];

    // Payment and activation are separate states.
    const rawPaymentStatus = String(
      row.payment_status || row.status || "pending"
    ).toLowerCase();

    let paymentStatus = rawPaymentStatus;

    if (
      rawPaymentStatus === "completed" ||
      rawPaymentStatus === "success"
    ) {
      paymentStatus = "paid";
    } else if (rawPaymentStatus === "expired") {
      paymentStatus = "timeout";
    } else if (
      rawPaymentStatus === "cancelled" ||
      rawPaymentStatus === "canceled"
    ) {
      paymentStatus = "cancelled";
    } else if (
      rawPaymentStatus === "failed" ||
      rawPaymentStatus === "error"
    ) {
      paymentStatus = "failed";
    }

    const activationStatus = String(
      row.activation_status || "pending"
    ).toLowerCase();

    return NextResponse.json(
      {
        success: true,
        payment: {
          checkoutRequestId: row.checkout_request_id,

          // Kept for compatibility with the existing monitor.
          status: paymentStatus,
          payment_status: paymentStatus,

          activation_status: activationStatus,
          activationStatus,

          packageName: row.package_name || null,
          amount: Number(row.amount || 0),
          receipt: row.mpesa_receipt || null,

          activationError: row.activation_error || null,
          activatedAt: row.activated_at || null,
        },
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("[MPESA STATUS API ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not check payment status.",
      },
      { status: 500, headers }
    );
  }
}
