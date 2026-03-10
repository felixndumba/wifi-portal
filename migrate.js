require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "website",
      multipleStatements: true
    });

    // Read and execute SQL file
    const sql = fs.readFileSync('./setup-database.sql', 'utf8');
    await connection.query(sql);
    
    console.log('Database migration completed successfully!');
    
    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables);
    
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();

