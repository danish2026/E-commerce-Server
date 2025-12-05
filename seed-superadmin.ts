import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './src/users/user.entity';
import { Role } from './src/common/enums/role.enum';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    const dbName = process.env.DATABASE_NAME || process.env.DB_NAME || 'Ecommerce';
    console.log(`🔗 Connecting to database: ${dbName}`);

    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD,
      database: dbName,
      entities: [User],
      synchronize: false,
      logging: true,
    });

    const userRepository = connection.getRepository(User);

    // Check if superadmin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'superadmin@example.com' },
    });

    if (existingAdmin) {
      console.log('✓ Superadmin user already exists');
      await connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Super@123', 10);

    // Create superadmin user
    const superAdmin = userRepository.create({
      email: 'superadmin@example.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
    });

    await userRepository.save(superAdmin);

    console.log('✅ Superadmin user created successfully!');
    console.log('📧 Email: superadmin@example.com');
    console.log('🔐 Password: Super@123');

    await connection.close();
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
