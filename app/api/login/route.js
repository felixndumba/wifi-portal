
import pool from "../../../lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return Response.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // Find user and verify password
    const [users] = await pool.execute(
      "SELECT id, name, phone FROM users WHERE phone = ? AND password = ?",
      [phone, password]
    );

    if (users.length === 0) {
      return Response.json(
        { error: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    return Response.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

