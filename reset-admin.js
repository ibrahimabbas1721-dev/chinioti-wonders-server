const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true }
    }, { timestamps: true });

    const Admin = mongoose.model('Admin', adminSchema, 'admins');

    // Delete existing admin
    const deleteResult = await Admin.deleteOne({ email: 'admin@furniture.com' });
    console.log('🗑️  Deleted existing admin (deleted count:', deleteResult.deletedCount + ')');

    // Create new admin with known password
    const password = 'Admin@123456';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const admin = await Admin.create({
      email: 'admin@furniture.com',
      passwordHash
    });

    console.log('✅ New admin account created!');
    console.log('Email: admin@furniture.com');
    console.log('Password: ' + password);
    console.log('ID:', admin._id);

    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetAdmin();
