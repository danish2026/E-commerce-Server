import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const checkDbSchema = async () => {
  const dbName = process.env.DATABASE_NAME || process.env.DB_NAME || 'Ecommerce';
  const dbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: dbName,
  });

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await dbClient.connect();
    console.log(`✅ Connected to database "${dbName}"\n`);

    // Check email column constraints
    const columnInfo = await dbClient.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email'
    `);

    if (columnInfo.rows.length > 0) {
      console.log('📋 Email Column Info:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const col = columnInfo.rows[0];
      console.log(`Column Name: ${col.column_name}`);
      console.log(`Data Type: ${col.data_type}`);
      console.log(`Is Nullable: ${col.is_nullable}`);
      console.log(`Default: ${col.column_default || 'None'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Check for NULL values
    const nullCount = await dbClient.query(
      'SELECT COUNT(*) as count FROM users WHERE email IS NULL'
    );
    console.log(`Users with NULL email: ${nullCount.rows[0].count}`);

    // Check for empty string emails
    const emptyEmailCount = await dbClient.query(
      "SELECT COUNT(*) as count FROM users WHERE email = '' OR email IS NULL"
    );
    console.log(`Users with empty/NULL email: ${emptyEmailCount.rows[0].count}`);

    // List all users with their emails
    const allUsers = await dbClient.query(
      'SELECT id, email, "firstName", "lastName", role FROM users ORDER BY "createdAt"'
    );
    
    console.log(`\n📊 All Users (${allUsers.rows.length} total):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    allUsers.rows.forEach((user, index) => {
      const emailStatus = user.email ? `"${user.email}"` : 'NULL/EMPTY';
      console.log(`${index + 1}. ${user.firstName || ''} ${user.lastName || ''} | Email: ${emailStatus} | Role: ${user.role || 'N/A'}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check unique constraint
    const uniqueConstraints = await dbClient.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
      AND conname LIKE '%email%'
    `);

    if (uniqueConstraints.rows.length > 0) {
      console.log('🔒 Email Constraints:');
      uniqueConstraints.rows.forEach((constraint) => {
        console.log(`  - ${constraint.constraint_name} (${constraint.constraint_type})`);
      });
    }

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
};

checkDbSchema();

