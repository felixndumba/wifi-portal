   
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPaymentStatuses(resultCode: number): {
  status: "completed" | "cancelled" | "expired" | "failed";
  paymentStatus: string;
} {
  if (resultCode === 0) {
    return { status: "completed", paymentStatus: "paid" };
  }

  if (resultCode === 1032) {
    return { status: "cancelled", paymentStatus: "cancelled" };
  }

  if (resultCode === 1037) {
    return { status: "expired", paymentStatus: "timeout" };
  }

  return { status: "failed", paymentStatus: "failed" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    console.log("M-PESA CALLBACK:", JSON.stringify(body, null, 2));

    if (!callback?.CheckoutRequestID) {
      console.error("Callback missing CheckoutRequestID.");

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received",
      });
    }

    const checkoutRequestId = String(callback.CheckoutRequestID);
    const merchantRequestId = callback.MerchantRequestID
      ? String(callback.MerchantRequestID)
      : null;
    const resultCode = Number(callback.ResultCode);
    const resultDesc = String(callback.ResultDesc || "");

    const { status, paymentStatus } = getPaymentStatuses(resultCode);

    let receipt: string | null = null;
    let amount: number | null = null;
    let phoneNumber: string | null = null;
    let paidAt: string | null = null;

    if (resultCode === 0) {
      const items = callback.CallbackMetadata?.Item || [];

      const getValue = (name: string): unknown =>
        items.find(
          (item: { Name?: string; Value?: unknown }) =>
            item.Name === name
        )?.Value ?? null;

      const rawReceipt = getValue("MpesaReceiptNumber");
      const rawAmount = getValue("Amount");
      const rawPhone = getValue("PhoneNumber");
      const rawDate = getValue("TransactionDate");

      receipt = rawReceipt == null ? null : String(rawReceipt);
      amount = rawAmount == null ? null : Number(rawAmount);
      phoneNumber = rawPhone == null ? null : String(rawPhone);

      if (rawDate != null && /^\d{14}$/.test(String(rawDate))) {
        const date = String(rawDate);
        paidAt =
          `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ` +
          `${date.slice(8, 10)}:${date.slice(10, 12)}:${date.slice(12, 14)}`;
      }

      if (!receipt || amount === null || !Number.isFinite(amount)) {
        console.error("Successful callback has incomplete metadata.", {
          checkoutRequestId,
          receipt,
          amount,
        });

        return NextResponse.json({
          ResultCode: 0,
          ResultDesc: "Callback received",
        });
      }
    }

    // Update the existing payment row; never insert a duplicate.
    const [result]: any = await db.execute(
      `UPDATE payments
       SET status = ?,
           payment_status = ?,
           merchant_request_id = COALESCE(?, merchant_request_id),
           mpesa_receipt = COALESCE(?, mpesa_receipt),
           amount = CASE
             WHEN ? IS NOT NULL THEN ?
             ELSE amount
           END,
           phone_number = COALESCE(?, phone_number),
           paid_at = CASE
             WHEN ? = 0 THEN COALESCE(?, paid_at)
             ELSE paid_at
           END,
           updated_at = NOW()
       WHERE checkout_request_id = ?`,
      [
        status,
        paymentStatus,
        merchantRequestId,
        receipt,
        amount,
        amount,
        phoneNumber,
        resultCode,
        paidAt,
        checkoutRequestId,
      ]
    );

    if (result.affectedRows === 0) {
      const [rows]: any = await db.execute(
        `SELECT ID, checkout_request_id, status, payment_status
         FROM payments
         WHERE checkout_request_id = ?
         LIMIT 1`,
        [checkoutRequestId]
      );

      if (!rows.length) {
        console.error(
          "No payment row matches callback:",
          checkoutRequestId
        );
      } else {
        console.log("Payment row already has these values:", rows[0]);
      }
    }

    console.log("M-PESA CALLBACK PROCESSED:", {
      checkoutRequestId,
      resultCode,
      resultDesc,
      status,
      paymentStatus,
      receipt,
    });

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    console.error("M-Pesa callback/database error:", error);

    return NextResponse.json(
      { ResultCode: 0, ResultDesc: "Callback received" },
      { status: 200 }
    );
  }
}
   