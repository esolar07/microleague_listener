import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple migration script to convert depositDate from string to Date format
 * Run this script to update existing deposit records
 */
async function migrateDepositDates() {
  const mongoUri = process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/xhift';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const depositsCollection = db.collection('deposits');
    
    console.log('Starting deposit date migration...');
    
    // Find all deposits with string depositDate
    const deposits = await depositsCollection.find({
      depositDate: { $type: 'string' }
    }).toArray();
    
    console.log(`Found ${deposits.length} deposits with string depositDate`);
    
    let updated = 0;
    let errors = 0;
    
    for (const deposit of deposits) {
      try {
        let newDate: Date;
        const depositDateValue = deposit.depositDate;
        
        // Handle different date formats
        if (typeof depositDateValue === 'string') {
          // Check if it's already in ISO format
          if (depositDateValue.includes('T') || depositDateValue.includes('Z')) {
            newDate = new Date(depositDateValue);
          } else if (depositDateValue.includes('/')) {
            // Handle MM/DD/YYYY format
            const [month, day, year] = depositDateValue.split('/');
            newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (depositDateValue.includes('-')) {
            // Handle YYYY-MM-DD format
            newDate = new Date(depositDateValue);
          } else {
            // Try to parse as-is
            newDate = new Date(depositDateValue);
          }
          
          // Validate the date
          if (isNaN(newDate.getTime())) {
            console.error(`Invalid date for deposit ${deposit._id}: ${depositDateValue}`);
            errors++;
            continue;
          }
          
          // Update the deposit
          await depositsCollection.updateOne(
            { _id: deposit._id },
            { $set: { depositDate: newDate } }
          );
          
          updated++;
          console.log(`Updated deposit ${deposit._id}: ${depositDateValue} -> ${newDate.toISOString()}`);
        }
      } catch (error) {
        console.error(`Error updating deposit ${deposit._id}:`, error);
        errors++;
      }
    }
    
    console.log(`Migration completed:`);
    console.log(`- Updated: ${updated} deposits`);
    console.log(`- Errors: ${errors} deposits`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateDepositDates()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateDepositDates };