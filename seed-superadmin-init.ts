import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

dotenv.config();

const seedSuperAdmin = async () => {
  const dbName = process.env.DATABASE_NAME || process.env.DB_NAME || 'Ecommerce';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await client.connect();

    // Check if database exists
    const result = await client.query(
      `SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower($1));`,
      [dbName]
    );

    const dbExists = result.rows[0].exists;

    if (!dbExists) {
      console.log(`📁 Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created`);
    } else {
      console.log(`✓ Database "${dbName}" already exists`);
    }

    // Close connection to default db
    await client.end();

    // Now connect to the actual database
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD,
      database: dbName,
    });

    console.log(`🔗 Connecting to "${dbName}"...`);
    await dbClient.connect();

    // Check if users table exists
    const tableCheck = await dbClient.query(`
      SELECT EXISTS(
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📊 Creating users table...');
      await dbClient.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(255),
          "lastName" VARCHAR(255),
          "permissionsRoleId" UUID,
          "permissionsRoleName" VARCHAR(255),
          role VARCHAR(50) NOT NULL DEFAULT 'SALES_MAN',
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Users table created');
    } else {
      console.log('✓ Users table already exists');
    }

    // Check if superadmin already exists
    const checkUser = await dbClient.query(
      'SELECT id FROM users WHERE email = $1',
      ['superadmin@example.com']
    );

    if (checkUser.rows.length > 0) {
      console.log('✓ Superadmin user already exists');
      await dbClient.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Super@123', 10);

    // Insert superadmin user
    await dbClient.query(
      `INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['superadmin@example.com', hashedPassword, 'Super', 'Admin', 'SUPER_ADMIN', true]
    );

    console.log('✅ Superadmin user created successfully!');
    console.log('📧 Email: superadmin@example.com');
    console.log('🔐 Password: Super@123');

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

seedSuperAdmin();
