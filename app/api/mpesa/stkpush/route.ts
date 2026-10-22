import { NextResponse } from "next/server";
import { isIP } from "node:net";
import db from "@/lib/db";

export const runtime = "nodejs";

const plans: Record<
  string,
  { name: string; price: number; durationMinutes: number }
> = {
  "1-hour": { name: "1 Hour Unlimited", price: 10, durationMinutes: 60 },
  "3-hours": { name: "3 Hours Unlimited", price: 25, durationMinutes: 180 },
  "8-hours": { name: "8 Hours Unlimited", price: 50, durationMinutes: 480 },
  "24-hours": { name: "24 Hours Unlimited", price: 80, durationMinutes: 1440 },
  "2-days": { name: "2 Days Unlimited", price: 150, durationMinutes: 2880 },
  weekly: { name: "Weekly Unlimited", price: 250, durationMinutes: 10080 },
  "monthly-one": {
    name: "Monthly — 1 Device",
    price: 600,
    durationMinutes: 43200,
  },
  "monthly-two": {
    name: "Monthly — 2 Devices",
    price: 800,
    durationMinutes: 43200,
  },
  "monthly-three": {
    name: "Monthly — 3 Devices",
    price: 950,
    durationMinutes: 43200,
  },
  "monthly-unlimited": {
    name: "Monthly — Unlimited Devices",
    price: 1100,
    durationMinutes: 43200,
  },
};

function normalizeKenyanPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const phone = value.trim().replace(/[\s()+-]/g, "");

  if (/^0[17]\d{8}$/.test(phone)) return `254${phone.slice(1)}`;
  if (/^254[17]\d{8}$/.test(phone)) return phone;

  return null;
}

function validMacAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const mac = value.trim().toUpperCase();
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac) ? mac : null;
}

function validIpAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const ip = value.trim();
  return isIP(ip) !== 0 ? ip : null;
}

export async function POST(request: Request) {
  try {
    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      planId,
      phoneNumber,
      macAddress: rawMacAddress,
      ipAddress: rawIpAddress,
      linkLogin,
      linkOrig,
    } = body ?? {};

    const plan = typeof planId === "string" ? plans[planId] : undefined;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Selected plan was not found." },
        { status: 400 }
      );
    }

    const phone = normalizeKenyanPhone(phoneNumber);

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid Kenyan mobile number, e.g. 0712345678.",
        },
        { status: 400 }
      );
    }

    // Device details are optional so checkout can still be tested manually.
    // For captive-portal traffic, the plans page should send both values.
    const macAddress =
      rawMacAddress == null || rawMacAddress === ""
        ? null
        : validMacAddress(rawMacAddress);

    const ipAddress =
      rawIpAddress == null || rawIpAddress === ""
        ? null
        : validIpAddress(rawIpAddress);

    if (rawMacAddress && !macAddress) {
      return NextResponse.json(
        { success: false, error: "The device MAC address is invalid." },
        { status: 400 }
      );
    }

    if (rawIpAddress && !ipAddress) {
      return NextResponse.json(
        { success: false, error: "The device IP address is invalid." },
        { status: 400 }
      );
    }

    // These are returned by MikroTik and may be needed by the browser after
    // payment. Do not use arbitrary client-supplied URLs for server-side fetches.
    const safeLinkLogin =
      typeof linkLogin === "string" ? linkLogin.slice(0, 1000) : "";
    const safeLinkOrig =
      typeof linkOrig === "string" ? linkOrig.slice(0, 1000) : "";

    const requiredVariables = [
      "MPESA_CONSUMER_KEY",
      "MPESA_CONSUMER_SECRET",
      "MPESA_SHORTCODE",
      "MPESA_PASSKEY",
      "MPESA_TILL_NUMBER",
      "MPESA_CALLBACK_URL",
    ];

    const missing = requiredVariables.filter(
      (name) => !process.env[name]?.trim()
    );

    if (missing.length) {
      console.error("Missing M-Pesa configuration:", missing);

      return NextResponse.json(
        {
          success: false,
          error: "M-Pesa configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    const production =
      process.env.MPESA_ENV?.toLowerCase() === "production";

    const baseUrl = production
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // 1. Obtain Daraja access token.
    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY!.trim()}:${process.env.MPESA_CONSUMER_SECRET!.trim()}`
    ).toString("base64");

    const tokenResponse = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const tokenText = await tokenResponse.text();
    let tokenData: any;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error("Invalid OAuth response:", {
        status: tokenResponse.status,
        response: tokenText.slice(0, 200),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Safaricom returned an invalid authentication response.",
        },
        { status: 502 }
      );
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("OAuth authentication failed:", {
        status: tokenResponse.status,
        error: tokenData.error,
        description: tokenData.error_description,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            tokenData.error_description ||
            tokenData.error ||
            "M-Pesa authentication failed.",
        },
        { status: 502 }
      );
    }

    // 2. Prepare the STK Push request.
    const shortcode = process.env.MPESA_SHORTCODE!.trim();
    const tillNumber = process.env.MPESA_TILL_NUMBER!.trim();
    const passkey = process.env.MPESA_PASSKEY!.trim();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: plan.price,
      PartyA: phone,
      PartyB: tillNumber,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL!.trim(),
      AccountReference: `WIFI-${planId}`,
      TransactionDesc: plan.name,
    };

    // 3. Send STK Push to Safaricom.
    const stkResponse = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      }
    );

    const stkText = await stkResponse.text();
    let stkData: any;

    try {
      stkData = JSON.parse(stkText);
    } catch {
      console.error("Invalid STK response:", {
        status: stkResponse.status,
        response: stkText.slice(0, 300),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Safaricom returned an invalid STK response.",
        },
        { status: 502 }
      );
    }

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      console.error("STK Push rejected:", {
        status: stkResponse.status,
        responseCode: stkData.ResponseCode,
        error: stkData.errorMessage || stkData.ResponseDescription,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "Safaricom could not initiate the payment.",
        },
        { status: 502 }
      );
    }

    const checkoutRequestId = stkData.CheckoutRequestID;
    const merchantRequestId = stkData.MerchantRequestID;

    if (!checkoutRequestId) {
      console.error("STK response has no CheckoutRequestID.");

      return NextResponse.json(
        {
          success: false,
          error: "Safaricom did not return a checkout request ID.",
        },
        { status: 502 }
      );
    }

    // 4. Save the accepted STK request with the device and plan details.
    // These columns must exist in the payments table:
    // mac_address, ip_address, duration_minutes.
    try {
      await db.execute(
        `INSERT INTO payments (
          phone_number,
          package_id,
          package_name,
          amount,
          duration_minutes,
          mac_address,
          ip_address,
          checkout_request_id,
          merchant_request_id,
          status,
          payment_status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', NOW(), NOW())`,
        [
          phone,
          planId,
          plan.name,
          plan.price,
          plan.durationMinutes,
          macAddress,
          ipAddress,
          checkoutRequestId,
          merchantRequestId || null,
        ]
      );
    } catch (dbError) {
      console.error(
        "CRITICAL: STK was accepted but saving the pending payment failed.",
        {
          checkoutRequestId,
          error:
            dbError instanceof Error ? dbError.message : String(dbError),
        }
      );

      // Do not retry the STK request automatically; it may charge the customer twice.
      return NextResponse.json(
        {
          success: false,
          paymentInitiated: true,
          checkoutRequestId,
          error:
            "Safaricom accepted the payment request, but the payment record could not be saved. Check the database before trying again.",
        },
        { status: 500 }
      );
    }

    console.log("Pending payment saved:", {
      checkoutRequestId,
      planId,
      amount: plan.price,
      phone,
      macAddress,
      ipAddress,
      durationMinutes: plan.durationMinutes,
      hasLinkLogin: Boolean(safeLinkLogin),
      hasLinkOrig: Boolean(safeLinkOrig),
    });

    // 5. Return the payment tracking ID. Internet access is NOT granted here.
    return NextResponse.json({
      success: true,
      message: "STK Push sent. Enter your M-Pesa PIN on your phone.",
      checkoutRequestId,
      merchantRequestId,
      planId,
      amount: plan.price,
      phoneNumber: phone,
      paymentStatus: "pending",
      device: {
        macAddress,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("STK initiation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
