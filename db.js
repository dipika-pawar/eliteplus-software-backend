const mysql = require('mysql2');
require('dotenv').config();

// Vercel वर localhost चालत नाही याची सुरक्षा तपासणी
if (process.env.VERCEL && (!process.env.DB_HOST || process.env.DB_HOST === 'localhost')) {
    console.error("❌ CRITICAL ERROR: 'localhost' cannot be used for DB_HOST on Vercel. You must use a remote cloud MySQL database host!");
}

// MySQL Connection Pool Matrix
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000 // 20 seconds timeout for cloud connections
});

// Test connection on startup to catch errors early
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err.message);
    } else {
        console.log("✅ Database Connected Successfully!");
        connection.release();
    }
});

module.exports = pool.promise();