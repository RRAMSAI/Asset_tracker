const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const MaintenanceHistory = require('./models/MaintenanceHistory');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await MaintenanceHistory.deleteMany({});

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@warranty.com',
      password: 'admin123',
      role: 'admin',
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'john@warranty.com',
      password: 'user123',
      role: 'user',
    });

    console.log('✅ Users created');

    // Create products
    const products = await Product.insertMany([
      {
        user: user._id,
        name: 'MacBook Pro 16"',
        brand: 'Apple',
        category: 'Electronics',
        model: 'MacBook Pro M3 Max',
        serialNumber: 'FVFC2XH1Q6',
        purchaseDate: new Date('2024-06-15'),
        purchasePrice: 2499,
        warrantyPeriod: 24,
        warrantyExpiryDate: new Date('2026-06-15'),
        retailer: 'Apple Store',
        notes: 'Company laptop with AppleCare+',
      },
      {
        user: user._id,
        name: 'Samsung 65" OLED TV',
        brand: 'Samsung',
        category: 'Electronics',
        model: 'QN65S95D',
        serialNumber: 'SAM-TV-2024-8821',
        purchaseDate: new Date('2024-12-20'),
        purchasePrice: 1799,
        warrantyPeriod: 12,
        warrantyExpiryDate: new Date('2025-12-20'),
        retailer: 'Best Buy',
        notes: 'Living room main TV',
      },
      {
        user: user._id,
        name: 'Dyson V15 Detect',
        brand: 'Dyson',
        category: 'Appliances',
        model: 'V15 Detect Absolute',
        serialNumber: 'DYS-V15-99281',
        purchaseDate: new Date('2025-01-10'),
        purchasePrice: 749,
        warrantyPeriod: 24,
        warrantyExpiryDate: new Date('2027-01-10'),
        retailer: 'Amazon',
        notes: 'Cordless vacuum cleaner',
      },
      {
        user: user._id,
        name: 'Herman Miller Aeron',
        brand: 'Herman Miller',
        category: 'Furniture',
        model: 'Aeron Remastered Size B',
        serialNumber: 'HM-AERON-44592',
        purchaseDate: new Date('2023-08-05'),
        purchasePrice: 1395,
        warrantyPeriod: 12,
        warrantyExpiryDate: new Date('2024-08-05'),
        retailer: 'Herman Miller',
        notes: 'Office chair - warranty expired',
      },
      {
        user: user._id,
        name: 'Sony WH-1000XM5',
        brand: 'Sony',
        category: 'Electronics',
        model: 'WH-1000XM5',
        serialNumber: 'SONY-XM5-77234',
        purchaseDate: new Date('2025-03-01'),
        purchasePrice: 349,
        warrantyPeriod: 12,
        warrantyExpiryDate: new Date('2026-03-01'),
        retailer: 'Amazon',
        notes: 'Noise cancelling headphones',
      },
      {
        user: user._id,
        name: 'LG Washing Machine',
        brand: 'LG',
        category: 'Appliances',
        model: 'WM4000HWA',
        serialNumber: 'LG-WM-20240915',
        purchaseDate: new Date('2026-04-01'),
        purchasePrice: 899,
        warrantyPeriod: 1,
        warrantyExpiryDate: new Date('2026-05-01'),
        retailer: 'Home Depot',
        notes: 'Front load washer - expiring soon!',
      },
      {
        user: admin._id,
        name: 'Dell XPS 15',
        brand: 'Dell',
        category: 'Electronics',
        model: 'XPS 15 9530',
        serialNumber: 'DELL-XPS-88421',
        purchaseDate: new Date('2024-09-01'),
        purchasePrice: 1899,
        warrantyPeriod: 36,
        warrantyExpiryDate: new Date('2027-09-01'),
        retailer: 'Dell.com',
        notes: 'Admin laptop with ProSupport',
      },
    ]);

    console.log('✅ Products created');

    // Create maintenance records
    await MaintenanceHistory.insertMany([
      {
        product: products[0]._id,
        user: user._id,
        type: 'Service',
        description: 'Battery replacement under AppleCare',
        serviceDate: new Date('2025-03-10'),
        cost: 0,
        serviceProvider: 'Apple Genius Bar',
        notes: 'Battery was at 78% health. Replaced for free.',
      },
      {
        product: products[1]._id,
        user: user._id,
        type: 'Repair',
        description: 'Screen panel replacement',
        serviceDate: new Date('2025-06-15'),
        cost: 0,
        serviceProvider: 'Samsung Service Center',
        notes: 'Dead pixel issue fixed under warranty',
      },
      {
        product: products[3]._id,
        user: user._id,
        type: 'Inspection',
        description: 'Annual chair adjustment and cleaning',
        serviceDate: new Date('2024-08-01'),
        cost: 150,
        serviceProvider: 'Office Furniture Pro',
        notes: 'Adjusted tilt mechanism and replaced armrest pads',
      },
      {
        product: products[5]._id,
        user: user._id,
        type: 'Service',
        description: 'Drum cleaning and filter replacement',
        serviceDate: new Date('2026-04-10'),
        cost: 75,
        serviceProvider: 'LG Service',
        notes: 'Regular maintenance',
      },
    ]);

    console.log('✅ Maintenance records created');

    console.log('\n📋 Seed Data Summary:');
    console.log('─────────────────────');
    console.log('Admin:  admin@warranty.com / admin123');
    console.log('User:   john@warranty.com  / user123');
    console.log(`Products: ${products.length}`);
    console.log('Maintenance Records: 4');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    process.exit(1);
  }
};

seedData();
