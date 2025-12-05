import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

dotenv.config();

// Define all users to create
const usersToSeed = [
  {
    email: 'superadmin@example.com',
    password: 'Super@123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'salesmanager@example.com',
    password: 'Manager@123',
    firstName: 'Sales',
    lastName: 'Manager',
    role: 'SALES_MANAGER',
  },
  {
    email: 'salesman@example.com',
    password: 'Sales@123',
    firstName: 'Sales',
    lastName: 'Man',
    role: 'SALES_MAN',
  },
];

const seedAllUsers = async () => {
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

    // Clean up any NULL emails first
    const nullEmailCount = await dbClient.query(
      'SELECT COUNT(*) FROM users WHERE email IS NULL'
    );
    
    if (parseInt(nullEmailCount.rows[0].count) > 0) {
      console.log(`⚠️  Found ${nullEmailCount.rows[0].count} user(s) with NULL emails. Cleaning up...`);
      await dbClient.query('DELETE FROM users WHERE email IS NULL');
      console.log('✅ Cleaned up NULL email users');
    }

    console.log('\n👥 Seeding users for all roles...\n');

    // Seed all users
    for (const userData of usersToSeed) {
      // Check if user already exists
      const checkUser = await dbClient.query(
        'SELECT id, email FROM users WHERE email = $1',
        [userData.email]
      );

      if (checkUser.rows.length > 0) {
        console.log(`✓ User with email "${userData.email}" already exists (Role: ${userData.role})`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Insert user
      await dbClient.query(
        `INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.role,
          true,
        ]
      );

      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔐 Password: ${userData.password}\n`);
    }

    console.log('✅ All users seeded successfully!');
    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    usersToSeed.forEach((user) => {
      console.log(`Role: ${user.role.padEnd(15)} | Email: ${user.email.padEnd(30)} | Password: ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
};

seedAllUsers();

