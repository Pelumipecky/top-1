import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../database/firebaseConfig';

const BATCH_SIZE = 500; // Firestore batch size limit
const CLEANUP_CONFIG = {
    notifications: {
        maxAgeDays: 30, // Keep notifications for 30 days
        excludeTypes: ['withdrawal_code_expired', 'investment_complete'] // Important notifications to keep longer
    },
    chats: {
        maxAgeDays: 90 // Keep chat messages for 90 days
    },
    investments: {
        maxAgeDays: 180, // Keep completed investments for 180 days
        statuses: ['completed', 'cancelled', 'failed']
    },
    withdrawalCodes: {
        maxAgeDays: 7 // Keep expired codes for 7 days after expiry
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

        // Commit batch when size limit is reached
        if (count % BATCH_SIZE === 0) {
            if (!dryRun) {
                await batch.commit();
                batchCount++;
            }
        }
    }

    // Commit any remaining documents
    if (!dryRun && count % BATCH_SIZE !== 0) {
        await batch.commit();
        batchCount++;
    }

    return {
        totalDeleted: count,
        batchesCommitted: batchCount
    };
}

// Cleanup old notifications
export async function cleanupNotifications(dryRun = true) {
    try {
        const cutoffDate = getTimestampForDaysAgo(CLEANUP_CONFIG.notifications.maxAgeDays);
        const notificationsRef = collection(db, 'notifications');
        const oldNotificationsQuery = query(
            notificationsRef,
            where('timestamp', '<=', cutoffDate),
            where('type', 'not-in', CLEANUP_CONFIG.notifications.excludeTypes)
        );

        const snapshot = await getDocs(oldNotificationsQuery);
        const result = await processBatchDelete(snapshot, dryRun);
        
        console.log(`${dryRun ? '[DRY RUN] Would have deleted' : 'Deleted'} ${result.totalDeleted} old notifications`);
        return result;
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
        throw error;
    }
}

// Cleanup old chat messages
export async function cleanupChats(dryRun = true) {
    try {
        const cutoffDate = getTimestampForDaysAgo(CLEANUP_CONFIG.chats.maxAgeDays);
        const chatsRef = collection(db, 'chats');
        const oldChatsQuery = query(
            chatsRef,
            where('timestamp', '<=', cutoffDate)
        );

        const snapshot = await getDocs(oldChatsQuery);
        const result = await processBatchDelete(snapshot, dryRun);
        
        console.log(`${dryRun ? '[DRY RUN] Would have deleted' : 'Deleted'} ${result.totalDeleted} old chat messages`);
        return result;
    } catch (error) {
        console.error('Error cleaning up chats:', error);
        throw error;
    }
}

// Cleanup old completed/cancelled investments
export async function cleanupInvestments(dryRun = true) {
    try {
        const cutoffDate = getTimestampForDaysAgo(CLEANUP_CONFIG.investments.maxAgeDays);
        const investmentsRef = collection(db, 'investments');
        const oldInvestmentsQuery = query(
            investmentsRef,
            where('status', 'in', CLEANUP_CONFIG.investments.statuses),
            where('completedAt', '<=', cutoffDate)
        );

        const snapshot = await getDocs(oldInvestmentsQuery);
        const result = await processBatchDelete(snapshot, dryRun);
        
        console.log(`${dryRun ? '[DRY RUN] Would have deleted' : 'Deleted'} ${result.totalDeleted} old completed/cancelled investments`);
        return result;
    } catch (error) {
        console.error('Error cleaning up investments:', error);
        throw error;
    }
}

// Enhanced cleanup of expired withdrawal codes
export async function cleanupWithdrawalCodes(dryRun = true) {
    try {
        const now = new Date();
        const cutoffDate = getTimestampForDaysAgo(CLEANUP_CONFIG.withdrawalCodes.maxAgeDays);
        const codesRef = collection(db, 'withdrawalCodes');
        const expiredCodesQuery = query(
            codesRef,
            where('expiresAt', '<=', cutoffDate)
        );

        const snapshot = await getDocs(expiredCodesQuery);
        const result = await processBatchDelete(snapshot, dryRun);
        
        console.log(`${dryRun ? '[DRY RUN] Would have deleted' : 'Deleted'} ${result.totalDeleted} expired withdrawal codes`);
        return result;
    } catch (error) {
        console.error('Error cleaning up withdrawal codes:', error);
        throw error;
    }
}

// Run all cleanup tasks
export async function runFullCleanup(dryRun = true) {
    console.log(`Starting ${dryRun ? 'DRY RUN' : 'FULL'} database cleanup...`);
    const startTime = Date.now();

    try {
        const results = {
            notifications: await cleanupNotifications(dryRun),
            chats: await cleanupChats(dryRun),
            investments: await cleanupInvestments(dryRun),
            withdrawalCodes: await cleanupWithdrawalCodes(dryRun)
        };

        const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.totalDeleted, 0);
        const endTime = Date.now();
        
        console.log('Cleanup Summary:');
        console.log('----------------');
        console.log(`Total items ${dryRun ? 'that would be deleted' : 'deleted'}: ${totalDeleted}`);
        console.log(`Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s`);
        console.log('Details:', results);
        
        return results;
    } catch (error) {
        console.error('Error during full cleanup:', error);
        throw error;
    }
}