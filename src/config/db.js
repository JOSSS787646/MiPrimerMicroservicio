// database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // 👈 Asegúrate de agregar esto
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Verificar la conexión
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a MySQL exitosa!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    process.exit(1); // Detener ejecución si no se conecta
  });

module.exports = pool;
