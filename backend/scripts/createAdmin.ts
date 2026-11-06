import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';
import Organization from '../src/models/Organization';

// Load .env relative to project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const name = process.env.INITIAL_ADMIN_NAME || 'MarginIQ Admin';

    if (!email || !password) {
      throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be provided via environment variables.');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`User ${email} already exists. No new admin was created.`);
      process.exit(0);
    }

    // Create primary organization
    const org = await Organization.create({
      name: 'MarginIQ Primary Organization',
      subscriptionPlan: 'Professional',
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || 'Admin';

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
      organizationId: org._id,
      isVerified: true,
    });

    console.log(`
========================================
MARGINIQ ADMIN ACCOUNT
========================================

Email: ${user.email}
Password: [the password supplied through environment]
Role: ${user.role}

Login:
http://localhost:5174/login
========================================
    `);

    process.exit(0);
  } catch (error: any) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
