/**
 * Migration Script: Assign userId to old products & maintenance records
 * 
 * This script finds all products and maintenance records that are missing
 * the `user` field and assigns them to a default user (the first admin, 
 * or the first user found in the database).
 * 
 * Usage: node migrate.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const MaintenanceHistory = require('./models/MaintenanceHistory');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Find a default user to assign orphaned records to
    // Priority: first admin user, then first regular user
    let defaultUser = await User.findOne({ role: 'admin' });
    if (!defaultUser) {
      defaultUser = await User.findOne({});
    }

    if (!defaultUser) {
      console.error('❌ No users found in database. Please create a user first (register or run seed).');
      process.exit(1);
    }

    console.log(`\n📌 Default user for orphaned records: ${defaultUser.name} (${defaultUser.email})\n`);

    // Step 2: Find and fix products without a `user` field
    const orphanedProducts = await Product.find({
      $or: [
        { user: null },
        { user: { $exists: false } },
      ],
    });

    console.log(`📦 Found ${orphanedProducts.length} product(s) without a user assignment.`);

    if (orphanedProducts.length > 0) {
      const result = await Product.updateMany(
        {
          $or: [
            { user: null },
            { user: { $exists: false } },
          ],
        },
        { $set: { user: defaultUser._id } }
      );
      console.log(`   ✅ Updated ${result.modifiedCount} product(s) → assigned to "${defaultUser.name}"`);
    }

    // Step 3: Also fix any products that have a `userId` field (from previous migration attempt)
    // Move `userId` data into `user` field
    const productsWithUserId = await Product.find({
      userId: { $exists: true, $ne: null },
    });

    if (productsWithUserId.length > 0) {
      console.log(`\n🔄 Found ${productsWithUserId.length} product(s) with old 'userId' field. Migrating...`);
      for (const product of productsWithUserId) {
        await Product.updateOne(
          { _id: product._id },
          {
            $set: { user: product.userId },
            $unset: { userId: '' },
          }
        );
      }
      console.log(`   ✅ Migrated ${productsWithUserId.length} product(s) from 'userId' → 'user'`);
    }

    // Step 4: Find and fix maintenance records without a `user` field
    const orphanedRecords = await MaintenanceHistory.find({
      $or: [
        { user: null },
        { user: { $exists: false } },
      ],
    });

    console.log(`\n🔧 Found ${orphanedRecords.length} maintenance record(s) without a user assignment.`);

    if (orphanedRecords.length > 0) {
      // Try to assign based on the product's owner
      let fixedByProduct = 0;
      let fixedByDefault = 0;

      for (const record of orphanedRecords) {
        const product = await Product.findById(record.product);
        if (product && product.user) {
          await MaintenanceHistory.updateOne(
            { _id: record._id },
            { $set: { user: product.user } }
          );
          fixedByProduct++;
        } else {
          await MaintenanceHistory.updateOne(
            { _id: record._id },
            { $set: { user: defaultUser._id } }
          );
          fixedByDefault++;
        }
      }
      console.log(`   ✅ ${fixedByProduct} record(s) assigned to product owner`);
      console.log(`   ✅ ${fixedByDefault} record(s) assigned to default user "${defaultUser.name}"`);
    }

    // Also fix maintenance records with old `userId` field
    const maintenanceWithUserId = await MaintenanceHistory.find({
      userId: { $exists: true, $ne: null },
    });

    if (maintenanceWithUserId.length > 0) {
      console.log(`\n🔄 Found ${maintenanceWithUserId.length} maintenance record(s) with old 'userId' field. Migrating...`);
      for (const record of maintenanceWithUserId) {
        await MaintenanceHistory.updateOne(
          { _id: record._id },
          {
            $set: { user: record.userId },
            $unset: { userId: '' },
          }
        );
      }
      console.log(`   ✅ Migrated ${maintenanceWithUserId.length} record(s) from 'userId' → 'user'`);
    }

    // Step 5: Summary
    const totalProducts = await Product.countDocuments();
    const productsWithUser = await Product.countDocuments({ user: { $ne: null } });
    const totalMaintenance = await MaintenanceHistory.countDocuments();
    const maintenanceWithUser = await MaintenanceHistory.countDocuments({ user: { $ne: null } });

    console.log('\n────────────────────────────────');
    console.log('📋 Migration Summary:');
    console.log('────────────────────────────────');
    console.log(`Products:    ${productsWithUser}/${totalProducts} have a user assigned`);
    console.log(`Maintenance: ${maintenanceWithUser}/${totalMaintenance} have a user assigned`);
    console.log('────────────────────────────────');
    console.log('✅ Migration complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    process.exit(1);
  }
};

migrate();
