export async function POST(req) {
  try {
    const payload = await req.json().catch(() => null);

    console.log("[MPesa Callback] payload:", JSON.stringify(payload, null, 2));

    // Safaricom sandbox payload example contains:
    // Body -> stkCallback -> CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata
    const stkCallback = payload?.Body?.stkCallback;
    const checkoutRequestId = stkCallback?.CheckoutRequestID;
    const resultCode = stkCallback?.ResultCode;
    const resultDesc = stkCallback?.ResultDesc;

    // Demo mode: we only acknowledge callback.
    // If you later add a payments table, you can store checkoutRequestId and mark paid here.

    return Response.json({
      success: true,
      received: true,
      checkoutRequestId: checkoutRequestId || null,
      resultCode: resultCode ?? null,
      resultDesc: resultDesc || null,
    });
  } catch (error) {
    console.error("[MPesa Callback] error:", error);
    return Response.json(
      { success: false, error: "Invalid callback payload" },
      { status: 400 }
    );
  }
}

