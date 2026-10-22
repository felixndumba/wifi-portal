
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const checkoutRequestId = request.nextUrl.searchParams
    .get("checkoutRequestId")
    ?.trim();

  if (!checkoutRequestId) {
    return NextResponse.json(
      { success: false, error: "Missing checkoutRequestId." },
      { status: 400 }
    );
  }

  try {
    const [rows]: any = await db.execute(
      `SELECT
        checkout_request_id,
        status,
        payment_status,
        package_name,
        amount,
        mpesa_receipt
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
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const row = rows[0];

    const rawStatus = String(
      row.payment_status || row.status || "pending"
    ).toLowerCase();

    let status = rawStatus;

    if (rawStatus === "completed" || rawStatus === "success") {
      status = "paid";
    } else if (rawStatus === "expired") {
      status = "timeout";
    } else if (rawStatus === "cancelled") {
      status = "cancelled";
    } else if (rawStatus === "failed") {
      status = "failed";
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          checkoutRequestId: row.checkout_request_id,
          status,
          packageName: row.package_name,
          amount: Number(row.amount),
          receipt: row.mpesa_receipt || null,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[MPESA STATUS API ERROR]", error);

    return NextResponse.json(
      { success: false, error: "Could not check payment status." },
      { status: 500 }
    );
  }
}
  