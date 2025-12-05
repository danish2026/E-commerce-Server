import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const fixNullEmails = async () => {
  const dbName = process.env.DATABASE_NAME || process.env.DB_NAME;
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
    console.log(`✅ Connected to database "${dbName}"`);

    // Check for users with NULL emails
    const nullEmailUsers = await dbClient.query(
      'SELECT id, email, "firstName", "lastName", role FROM users WHERE email IS NULL'
    );

    if (nullEmailUsers.rows.length === 0) {
      console.log('✅ No users with NULL emails found. Database is clean!');
      await dbClient.end();
      return;
    }

    console.log(`⚠️  Found ${nullEmailUsers.rows.length} user(s) with NULL emails:`);
    nullEmailUsers.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Name: ${user.firstName || ''} ${user.lastName || ''}, Role: ${user.role || 'N/A'}`);
    });

    // Delete users with NULL emails (since email is required)
    console.log('\n🗑️  Deleting users with NULL emails...');
    const deleteResult = await dbClient.query(
      'DELETE FROM users WHERE email IS NULL'
    );

    console.log(`✅ Deleted ${deleteResult.rowCount} user(s) with NULL emails`);

    // Verify the fix
    const remainingNullEmails = await dbClient.query(
      'SELECT COUNT(*) FROM users WHERE email IS NULL'
    );

    if (parseInt(remainingNullEmails.rows[0].count) === 0) {
      console.log('✅ All NULL emails have been cleaned up!');
      console.log('✅ You can now restart your application.');
    } else {
      console.log(`⚠️  Warning: Still ${remainingNullEmails.rows[0].count} user(s) with NULL emails`);
    }

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

fixNullEmails();

