import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../database/firebaseConfig';
import { config } from './config';

export async function cleanupExpiredCodes() {
  try {
    const now = new Date();
    const codesRef = collection(db, 'withdrawalCodes');
    const expiredQuery = query(codesRef, where('expiresAt', '<=', now));
    const snapshot = await getDocs(expiredQuery);

    if (snapshot.empty) return;

    // Batch delete expired codes
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    if (process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${snapshot.size} expired withdrawal codes`);
    }
  } catch (error) {
    console.error('Error cleaning up withdrawal codes:', error);
  }
}

// Add notification for expired codes
export async function notifyExpiredCodes() {
  try {
    const now = new Date();
    const codesRef = collection(db, 'withdrawalCodes');
    const expiredQuery = query(codesRef, 
      where('expiresAt', '<=', now),
      where('notifiedExpiry', '==', false)
    );
    const snapshot = await getDocs(expiredQuery);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'notifications');

    for (const doc of snapshot.docs) {
      const code = doc.data();
      
      // Create expiry notification
      const notification = {
        userId: code.userId,
        type: 'withdrawal_code_expired',
        title: 'Withdrawal Code Expired',
        message: `Your withdrawal code for $${parseFloat(code.amount).toLocaleString()} has expired. Please request a new code if needed.`,
        status: 'unseen',
        timestamp: now
      };

      batch.set(notificationsRef.doc(), notification);
      batch.update(doc.ref, { notifiedExpiry: true });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error notifying expired codes:', error);
  }
}