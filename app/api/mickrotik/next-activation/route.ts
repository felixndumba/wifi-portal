
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const token = process.env.MIKROTIK_ACTIVATION_TOKEN;

  if (!token) return false;

  return (
    request.headers.get("authorization") === `Bearer ${token}`
  );
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only claim payments confirmed as successful by the M-Pesa callback.
    const [rows]: any = await db.execute(
      `SELECT ID, checkout_request_id, mac_address, duration_minutes
       FROM payments
       WHERE status = 'completed'
         AND payment_status = 'paid'
         AND activation_status = 'pending'
         AND mac_address IS NOT NULL
         AND mac_address <> ''
         AND duration_minutes > 0
       ORDER BY created_at ASC
       LIMIT 1`
    );

    if (!rows.length) {
      return NextResponse.json({ found: false });
    }

    const payment = rows[0];

    // Claim the payment so concurrent polling requests cannot both activate it.
    const [claim]: any = await db.execute(
      `UPDATE payments
       SET activation_status = 'processing',
           activation_error = NULL,
           updated_at = NOW()
       WHERE ID = ?
         AND activation_status = 'pending'
         AND status = 'completed'
         AND payment_status = 'paid'`,
      [payment.ID]
    );

    if (claim.affectedRows !== 1) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      payment: {
        checkoutRequestId: payment.checkout_request_id,
        macAddress: payment.mac_address,
        durationMinutes: Number(payment.duration_minutes),
      },
    });
  } catch (error) {
    console.error("MikroTik activation GET error:", error);
    return NextResponse.json(
      { error: "Activation lookup failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const checkoutRequestId = String(body?.checkoutRequestId || "");
    const result = String(body?.result || "");
    const message = String(body?.message || "").slice(0, 255);

    if (
      !checkoutRequestId ||
      !["activated", "failed"].includes(result)
    ) {
      return NextResponse.json(
        { error: "Invalid acknowledgement" },
        { status: 400 }
      );
    }

    const [update]: any = await db.execute(
      `UPDATE payments
       SET activation_status = ?,
           activated_at = CASE
             WHEN ? = 'activated' THEN NOW()
             ELSE activated_at
           END,
           activation_error = ?,
           updated_at = NOW()
       WHERE checkout_request_id = ?
         AND activation_status = 'processing'
         AND status = 'completed'
         AND payment_status = 'paid'`,
      [
        result,
        result,
        result === "failed" ? message || "Router activation failed" : null,
        checkoutRequestId,
      ]
    );

    if (update.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Payment not found or not awaiting acknowledgement" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MikroTik activation acknowledgement error:", error);
    return NextResponse.json(
      { error: "Acknowledgement failed" },
      { status: 500 }
    );
  }
}
