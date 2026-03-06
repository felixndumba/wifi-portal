import pool from "../../../lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, password } = body;

    if (!name || !phone || !password) {
      return Response.json(
        { error: "Name, phone number, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await pool.execute(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (existingUser.length > 0) {
      return Response.json(
        { error: "User with this phone number already exists" },
        { status: 409 }
      );
    }

    // Insert new user
    const [result] = await pool.execute(
      "INSERT INTO users (name, phone, password) VALUES (?, ?, ?)",
      [name, phone, password]
    );

    return Response.json({
      success: true,
      message: "Registration successful",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

