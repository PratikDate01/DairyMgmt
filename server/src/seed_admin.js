import { connectDB } from './config/db.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function promoteAdmin() {
  try {
    await connectDB();
    
    const emailToPromote = process.argv[2] || 'pratikdate537@gmail.com';

    let user = await User.findOne({
      $or: [{ email: emailToPromote.toLowerCase() }, { phone: emailToPromote }]
    });

    if (!user) {
      console.log(`User with email/phone ${emailToPromote} not found. Creating new Admin user...`);
      user = new User({
        name: 'System Administrator',
        phone: emailToPromote.includes('@') ? emailToPromote : '9876543210',
        email: emailToPromote.includes('@') ? emailToPromote.toLowerCase() : 'admin@gauseva.com',
        role: 'admin',
        roles: ['admin', 'farmer', 'dairyOwner', 'medicalProvider', 'veterinarian']
      });
      await user.save();
      console.log(`✅ Admin account created successfully for: ${emailToPromote}`);
    } else {
      const rolesSet = new Set(user.roles || [user.role]);
      rolesSet.add('admin');
      user.roles = Array.from(rolesSet);
      user.role = 'admin'; // Primary active role
      await user.save();
      console.log(`✅ Granted Admin role to ${user.name} (${emailToPromote}). Current roles: ${JSON.stringify(user.roles)}`);
    }

  } catch (err) {
    console.error('Error promoting admin:', err.message);
  } finally {
    process.exit(0);
  }
}

promoteAdmin();
