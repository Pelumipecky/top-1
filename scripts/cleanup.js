const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, writeBatch, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC8vKTKmR4upbwGyykH9N5sDeS08ZtZ7PE",
  authDomain: "mint9517-67eca.firebaseapp.com",
  projectId: "mint9517-67eca",
  storageBucket: "mint9517-67eca.appspot.com",
  messagingSenderId: "1018345673525",
  appId: "1:1018345673525:web:96ff96a7943bf0b808327c",
  measurementId: "G-EX8BM1LMES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BATCH_SIZE = 500;
const CLEANUP_CONFIG = {
    notifications: {
        maxAgeDays: 30,
        excludeTypes: ['withdrawal_code_expired', 'investment_complete']
    },
    chats: {
        maxAgeDays: 90
    },
    investments: {
        maxAgeDays: 180,
        statuses: ['completed', 'cancelled', 'failed']
    },
    withdrawalCodes: {
        maxAgeDays: 7
    }
};

// Helper to create timestamp for age comparison
const getTimestampForDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return Timestamp.fromDate(date);
};

// Helper to process documents in batches
async function processBatchDelete(querySnapshot, dryRun = true) {
    const batch = writeBatch(db);
    let count = 0;
    let batchCount = 0;

    for (const doc of querySnapshot.docs) {
        if (!dryRun) {
            batch.delete(doc.ref);
        }
        count++;

        if (count % BATCH_SIZE === 0) {
            if (!dryRun) {
                await batch.commit();
                batchCount++;
            }
        }
    }

    if (!dryRun && count % BATCH_SIZE !== 0) {
        await batch.commit();
        batchCount++;
    }

    return {
        totalDeleted: count,
        batchesCommitted: batchCount
    };
}

// Run cleanup for a specific collection
async function cleanupCollection(collectionName, dryRun = true) {
    try {
        const config = CLEANUP_CONFIG[collectionName];
        if (!config) {
            throw new Error(`No cleanup configuration for collection: ${collectionName}`);
        }

        const cutoffDate = getTimestampForDaysAgo(config.maxAgeDays);
        const collectionRef = collection(db, collectionName);
        
        let baseQuery = query(collectionRef, where('timestamp', '<=', cutoffDate));
        
        // Collection-specific query modifications
        if (collectionName === 'notifications' && config.excludeTypes) {
            baseQuery = query(baseQuery, where('type', 'not-in', config.excludeTypes));
        } else if (collectionName === 'investments' && config.statuses) {
            baseQuery = query(
                collectionRef,
                where('status', 'in', config.statuses),
                where('completedAt', '<=', cutoffDate)
            );
        } else if (collectionName === 'withdrawalCodes') {
            baseQuery = query(collectionRef, where('expiresAt', '<=', cutoffDate));
        }

        const snapshot = await getDocs(baseQuery);
        const result = await processBatchDelete(snapshot, dryRun);
        
        console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleted'} ${result.totalDeleted} items from ${collectionName}`);
        return result;
    } catch (error) {
        console.error(`Error cleaning up ${collectionName}:`, error);
        throw error;
    }
}

// Run all cleanup tasks
async function runFullCleanup(dryRun = true) {
    console.log(`\nStarting ${dryRun ? 'DRY RUN' : 'FULL'} database cleanup...`);
    console.log('----------------------------------------');
    const startTime = Date.now();

    try {
        const collections = Object.keys(CLEANUP_CONFIG);
        const results = {};
        
        for (const collectionName of collections) {
            console.log(`\nProcessing ${collectionName}...`);
            results[collectionName] = await cleanupCollection(collectionName, dryRun);
        }

        const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.totalDeleted, 0);
        const endTime = Date.now();
        
        console.log('\nCleanup Summary:');
        console.log('----------------');
        console.log(`Total items ${dryRun ? 'that would be deleted' : 'deleted'}: ${totalDeleted}`);
        console.log(`Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s`);
        
        return results;
    } catch (error) {
        console.error('\nError during full cleanup:', error);
        throw error;
    }
}

// Start the cleanup process
console.log('Running cleanup preview...');
runFullCleanup(true)
    .then((previewResults) => {
        console.log('\nWould you like to proceed with the actual cleanup? (y/n)');
        process.stdin.once('data', async (data) => {
            const answer = data.toString().trim().toLowerCase();
            if (answer === 'y') {
                console.log('\nStarting actual cleanup...');
                try {
                    await runFullCleanup(false);
                    console.log('\nCleanup completed successfully!');
                    process.exit(0);
                } catch (error) {
                    console.error('Cleanup failed:', error);
                    process.exit(1);
                }
            } else {
                console.log('Cleanup cancelled.');
                process.exit(0);
            }
        });
    })
    .catch((error) => {
        console.error('Preview failed:', error);
        process.exit(1);
    });