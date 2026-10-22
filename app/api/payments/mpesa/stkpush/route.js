import { initiateStkPush } from "../../../../../lib/mpesa";

export async function POST(req) {
  try {
    const body = await req.json();
    const { phoneNumber, amount, reference, userId, planName } = body;

    if (!phoneNumber || !amount) {
      return Response.json(
        { error: "phoneNumber and amount are required" },
        { status: 400 }
      );
    }

    const effectiveReference =
      reference || `wifi-portal-${userId || "user"}-${Date.now()}`;

    const data = await initiateStkPush({
      phoneNumber,
      amount,
      reference: effectiveReference,
    });

    // checkoutRequestId should be inside stkPush response (typically: data.CheckoutRequestID)
    const checkoutRequestId =
      data?.CheckoutRequestID || data?.checkoutRequestId || null;

    return Response.json({
      success: true,
      checkoutRequestId,
      reference: effectiveReference,
      raw: data,
      meta: { userId: userId || null, planName: planName || null },
    });
  } catch (error) {
    console.error("STK push error:", error);
    return Response.json(
      {
        error: "Failed to initiate M-Pesa payment",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

