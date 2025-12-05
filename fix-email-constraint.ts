import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const fixEmailConstraint = async () => {
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

    // First, ensure no NULL emails exist
    const nullCount = await dbClient.query(
      'SELECT COUNT(*) as count FROM users WHERE email IS NULL'
    );

    if (parseInt(nullCount.rows[0].count) > 0) {
      console.log(`⚠️  Found ${nullCount.rows[0].count} users with NULL emails. Deleting...`);
      await dbClient.query('DELETE FROM users WHERE email IS NULL');
      console.log('✅ Cleaned up NULL emails\n');
    } else {
      console.log('✅ No NULL emails found\n');
    }

    // Check current column definition
    const columnInfo = await dbClient.query(`
      SELECT 
        column_name,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email'
    `);

    if (columnInfo.rows.length === 0) {
      console.log('❌ Email column not found!');
      await dbClient.end();
      return;
    }

    const col = columnInfo.rows[0];
    console.log('📋 Current Email Column State:');
    console.log(`   Is Nullable: ${col.is_nullable}`);
    console.log(`   Max Length: ${col.character_maximum_length || 'N/A'}\n`);

    // Drop existing NOT NULL constraint if it exists (it might have a specific name)
    try {
      // Try to drop any existing NOT NULL constraint
      await dbClient.query(`
        ALTER TABLE users 
        ALTER COLUMN email DROP NOT NULL
      `);
      console.log('✓ Dropped existing NOT NULL constraint');
    } catch (error: any) {
      if (error.message && error.message.includes('does not exist')) {
        console.log('✓ No existing NOT NULL constraint to drop');
      } else {
        console.log('⚠️  Could not drop NOT NULL constraint (might not exist)');
      }
    }

    // Now add NOT NULL constraint back properly
    try {
      await dbClient.query(`
        ALTER TABLE users 
        ALTER COLUMN email SET NOT NULL
      `);
      console.log('✅ Added NOT NULL constraint to email column\n');
    } catch (error: any) {
      console.error('❌ Error adding NOT NULL constraint:', error.message);
      if (error.message && error.message.includes('contains null')) {
        console.log('\n⚠️  There are still NULL values! Trying to find them...');
        const checkNull = await dbClient.query(
          'SELECT id, email FROM users WHERE email IS NULL'
        );
        console.log(`Found ${checkNull.rows.length} rows with NULL email`);
      }
      throw error;
    }

    // Verify the constraint
    const verifyInfo = await dbClient.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email'
    `);

    if (verifyInfo.rows[0].is_nullable === 'NO') {
      console.log('✅ Email column is now properly set to NOT NULL');
      console.log('✅ You can now restart your application!');
    } else {
      console.log('⚠️  Warning: Email column is still nullable');
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

fixEmailConstraint();

