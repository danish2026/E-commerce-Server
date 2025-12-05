import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

dotenv.config();

/**
 * Comprehensive database schema fix script
 * This script ensures all required columns have proper constraints and no NULL values
 */
const fixDatabaseSchema = async () => {
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

    // Define required columns that must NOT be NULL
    const requiredColumns = [
      { name: 'email', type: 'VARCHAR(255)', defaultValue: null },
      { name: 'password', type: 'VARCHAR(255)', defaultValue: null },
      { name: 'role', type: 'VARCHAR(50)', defaultValue: "'SALES_MAN'" },
    ];

    console.log('🔍 Checking for NULL values in required columns...\n');

    // Check and fix each required column
    for (const column of requiredColumns) {
      const nullCountResult = await dbClient.query(
        `SELECT COUNT(*) as count FROM users WHERE "${column.name}" IS NULL`
      );
      const nullCount = parseInt(nullCountResult.rows[0].count);

      if (nullCount > 0) {
        console.log(`⚠️  Found ${nullCount} user(s) with NULL ${column.name}`);

        // Get users with NULL values
        const nullUsers = await dbClient.query(
          `SELECT id, email, "firstName", "lastName", role FROM users WHERE "${column.name}" IS NULL`
        );

        console.log(`   Affected users:`);
        nullUsers.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email || 'NULL'}, Role: ${user.role || 'NULL'}`);
        });

        // Handle each column differently
        if (column.name === 'email') {
          // Email is required - delete users without email
          console.log(`\n🗑️  Deleting users without email...`);
          await dbClient.query(`DELETE FROM users WHERE email IS NULL`);
          console.log(`✅ Deleted ${nullCount} user(s) without email\n`);
        } else if (column.name === 'password') {
          // Password is required - delete users without password
          console.log(`\n🗑️  Deleting users without password...`);
          await dbClient.query(`DELETE FROM users WHERE password IS NULL`);
          console.log(`✅ Deleted ${nullCount} user(s) without password\n`);
        } else if (column.name === 'role') {
          // Role can have a default - set default for NULL roles
          console.log(`\n🔧 Setting default role for users without role...`);
          await dbClient.query(
            `UPDATE users SET role = ${column.defaultValue} WHERE role IS NULL`
          );
          console.log(`✅ Updated ${nullCount} user(s) with default role\n`);
        }
      } else {
        console.log(`✅ No NULL values found in ${column.name} column`);
      }
    }

    console.log('\n🔧 Fixing column constraints...\n');

    // Fix email column constraint
    try {
      await dbClient.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
      await dbClient.query(`ALTER TABLE users ALTER COLUMN email SET NOT NULL`);
      console.log('✅ Email column constraint fixed');
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        console.log(`⚠️  Email constraint: ${error.message}`);
      }
    }

    // Fix password column constraint
    try {
      await dbClient.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
      await dbClient.query(`ALTER TABLE users ALTER COLUMN password SET NOT NULL`);
      console.log('✅ Password column constraint fixed');
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        console.log(`⚠️  Password constraint: ${error.message}`);
      }
    }

    // Fix role column constraint
    try {
      await dbClient.query(`ALTER TABLE users ALTER COLUMN role DROP NOT NULL`);
      await dbClient.query(`ALTER TABLE users ALTER COLUMN role SET NOT NULL`);
      await dbClient.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'SALES_MAN'`);
      console.log('✅ Role column constraint fixed');
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        console.log(`⚠️  Role constraint: ${error.message}`);
      }
    }

    // Verify all users are valid
    console.log('\n📊 Verifying database integrity...\n');
    const allUsers = await dbClient.query(
      `SELECT 
        id, 
        email, 
        CASE WHEN password IS NULL THEN 'NULL' ELSE 'SET' END as password_status,
        role,
        "firstName",
        "lastName"
      FROM users 
      ORDER BY "createdAt"`
    );

    if (allUsers.rows.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('💡 Run "npm run seed:all-users" to create default users.\n');
    } else {
      console.log(`✅ Found ${allUsers.rows.length} valid user(s):`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName || ''} ${user.lastName || ''}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password_status}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Final verification
    const finalCheck = {
      email: await dbClient.query('SELECT COUNT(*) as count FROM users WHERE email IS NULL'),
      password: await dbClient.query('SELECT COUNT(*) as count FROM users WHERE password IS NULL'),
      role: await dbClient.query('SELECT COUNT(*) as count FROM users WHERE role IS NULL'),
    };

    const hasIssues = 
      parseInt(finalCheck.email.rows[0].count) > 0 ||
      parseInt(finalCheck.password.rows[0].count) > 0 ||
      parseInt(finalCheck.role.rows[0].count) > 0;

    if (hasIssues) {
      console.log('\n⚠️  WARNING: Some issues remain:');
      if (parseInt(finalCheck.email.rows[0].count) > 0) {
        console.log(`   - ${finalCheck.email.rows[0].count} user(s) with NULL email`);
      }
      if (parseInt(finalCheck.password.rows[0].count) > 0) {
        console.log(`   - ${finalCheck.password.rows[0].count} user(s) with NULL password`);
      }
      if (parseInt(finalCheck.role.rows[0].count) > 0) {
        console.log(`   - ${finalCheck.role.rows[0].count} user(s) with NULL role`);
      }
    } else {
      console.log('\n✅ All database constraints are properly set!');
      console.log('✅ No NULL values in required columns!');
      console.log('✅ You can now start your application safely!\n');
    }

    await dbClient.end();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
};

fixDatabaseSchema();

