const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const seedSuperAdmin = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '123456789',
    database: process.env.DB_NAME || 'Ecommercess',
  });

  try {
    // Generate hashed password
    const plainPassword = 'Super@123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Check if superadmin already exists
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['superadmin@example.com']
    );

    if (rows.length > 0) {
      console.log('✓ Superadmin user already exists');
      return;
    }

    // Insert superadmin user
    await connection.execute(
      `INSERT INTO users (id, email, password, firstName, lastName, role, isActive, createdAt, updatedAt)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'superadmin@example.com',
        hashedPassword,
        'Super',
        'Admin',
        'SUPER_ADMIN',
        true,
      ]
    );

    console.log('✅ Superadmin user created successfully!');
    console.log('Email: superadmin@example.com');
    console.log('Password: Super@123');

  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

seedSuperAdmin().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});
