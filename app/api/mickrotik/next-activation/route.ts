
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

function authorized(request: NextRequest) {
  const token = process.env.MIKROTIK_ACTIVATION_TOKEN;

  if (!token) {
    console.error("MIKROTIK_ACTIVATION_TOKEN is not configured.");
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${token}`;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: HEADERS });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    /*
     * A processing payment can be reclaimed if the router claimed it
     * more than five minutes ago but never acknowledged the result.
     *
     * Keep only confirmed payments with valid device and duration data.
     */
    const [rows]: any = await db.execute(
      `SELECT
         ID,
         checkout_request_id,
         mac_address,
         duration_minutes
       FROM payments
       WHERE status = 'completed'
         AND payment_status = 'paid'
         AND activation_status IN ('pending', 'processing')
         AND (
           activation_status = 'pending'
           OR (
             activation_status = 'processing'
             AND updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           )
         )
         AND mac_address IS NOT NULL
         AND TRIM(mac_address) <> ''
         AND duration_minutes > 0
       ORDER BY created_at ASC
       LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return json({ found: false });
    }

    const payment = rows[0];

    /*
     * Atomic claim:
     * - pending rows can be claimed immediately;
     * - stale processing rows can be reclaimed after five minutes;
     * - fresh processing rows cannot be claimed by another request.
     */
    const [claim]: any = await db.execute(
      `UPDATE payments
       SET activation_status = 'processing',
           activation_error = NULL,
           updated_at = NOW()
       WHERE ID = ?
         AND status = 'completed'
         AND payment_status = 'paid'
         AND (
           activation_status = 'pending'
           OR (
             activation_status = 'processing'
             AND updated_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           )
         )
         AND mac_address IS NOT NULL
         AND TRIM(mac_address) <> ''
         AND duration_minutes > 0`,
      [payment.ID]
    );

    if (!claim || claim.affectedRows !== 1) {
      return json({ found: false });
    }

    console.log(
      "[MIKROTIK ACTIVATION] Payment claimed:",
      payment.checkout_request_id
    );

    return json({
      found: true,
      payment: {
        checkoutRequestId: payment.checkout_request_id,
        macAddress: payment.mac_address,
        durationMinutes: Number(payment.duration_minutes),
      },
    });
  } catch (error) {
    console.error("[MIKROTIK ACTIVATION GET ERROR]", error);

    return json(
      { error: "Activation lookup failed" },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    let body: any;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const checkoutRequestId = String(
      body?.checkoutRequestId || ""
    ).trim();

    const result = String(body?.result || "")
      .trim()
      .toLowerCase();

    const message = String(body?.message || "")
      .trim()
      .slice(0, 255);

    if (
      !checkoutRequestId ||
      !["activated", "failed"].includes(result)
    ) {
      return json(
        { error: "Invalid acknowledgement" },
        400
      );
    }

    const [update]: any = await db.execute(
      `UPDATE payments
       SET activation_status = ?,
           activated_at = CASE
             WHEN ? = 'activated' THEN NOW()
             ELSE activated_at
           END,
           activation_error = CASE
             WHEN ? = 'failed'
               THEN COALESCE(NULLIF(?, ''), 'Router activation failed')
             ELSE NULL
           END,
           updated_at = NOW()
       WHERE checkout_request_id = ?
         AND activation_status = 'processing'
         AND status = 'completed'
         AND payment_status = 'paid'`,
      [
        result,
        result,
        result,
        message,
        checkoutRequestId,
      ]
    );

    if (!update || update.affectedRows !== 1) {
      return json(
        {
          error:
            "Payment not found or not awaiting acknowledgement",
        },
        409
      );
    }

    console.log(
      "[MIKROTIK ACTIVATION] Acknowledgement received:",
      checkoutRequestId,
      result
    );

    return json({ success: true });
  } catch (error) {
    console.error(
      "[MIKROTIK ACTIVATION ACKNOWLEDGEMENT ERROR]",
      error
    );

    return json(
      { error: "Acknowledgement failed" },
      500
    );
  }
}
