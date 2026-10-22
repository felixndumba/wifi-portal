import crypto from "crypto";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function formatTimestamp(date = new Date()) {
  // yyyyMMddHHmmss
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function lipaNaMpesaPassword(shortCode, passkey, timestamp) {
  // base64( shortCode + passkey + timestamp )
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
}

export async function getMpesaAccessToken() {
  const consumerKey = requireEnv("MPESA_CONSUMER_KEY");
  const consumerSecret = requireEnv("MPESA_CONSUMER_SECRET");
  const tokenUrl = process.env.MPESA_OAUTH_URL || "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authString}`,
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Failed to get Mpesa access token. status=${res.status} body=${JSON.stringify(data)}`
    );
  }

  if (!data?.access_token) {
    throw new Error(`Mpesa token response missing access_token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export function buildStkPushPayload({ phoneNumber, amount, reference }) {
  const shortCode = requireEnv("MPESA_SHORTCODE");
  const passkey = requireEnv("MPESA_PASSKEY");
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";
  const callbackUrl = requireEnv("MPESA_CALLBACK_URL");

  // Mpesa uses format 2547XXXXXXXX or 2541XXXXXXXX. We'll rely on frontend normalization.
  const timestamp = formatTimestamp();
  const password = lipaNaMpesaPassword(shortCode, passkey, timestamp);

  const partyA = shortCode;
  const partyB = shortCode;
  const callBackURL = callbackUrl;
  const accountReference = reference || `wifi-portal-${Date.now()}`;
  const transactionDesc = process.env.MPESA_TRANSACTION_DESC || "Subscription payment";

  return {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: partyB,
    PhoneNumber: phoneNumber,
    CallBackURL: callBackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };
}

export async function initiateStkPush({ phoneNumber, amount, reference }) {
  const baseUrl = process.env.MPESA_STK_PUSH_URL || "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
  const accessToken = await getMpesaAccessToken();

  const payload = buildStkPushPayload({ phoneNumber, amount, reference });

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      `Failed to initiate Mpesa STK push. status=${res.status} body=${JSON.stringify(data)}`
    );
  }

  return data;
}

