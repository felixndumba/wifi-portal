import pool from "../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get active subscriptions for the user
    const [subscriptions] = await pool.execute(
      `SELECT id, plan_name, plan_type, price, deposit, speed, status, 
              start_date, end_date, mikrotik_user 
       FROM subscriptions 
       WHERE user_id = ? AND status = 'active' 
       ORDER BY start_date DESC`,
      [userId]
    );

    return Response.json({
      success: true,
      subscriptions: subscriptions
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, planName, planType, price, deposit, speed } = body;

    if (!userId || !planName || !planType || !price) {
      return Response.json(
        { error: "User ID, plan name, plan type, and price are required" },
        { status: 400 }
      );
    }

    // Insert new subscription
    const [result] = await pool.execute(
      `INSERT INTO subscriptions (user_id, plan_name, plan_type, price, deposit, speed, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [userId, planName, planType, price, deposit || 0, speed || null]
    );

    return Response.json({
      success: true,
      message: "Subscription created successfully",
      subscriptionId: result.insertId
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

