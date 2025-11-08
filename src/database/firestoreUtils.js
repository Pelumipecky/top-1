import { collection, doc, getDoc, setDoc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Retry logic for Firestore operations
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    throw lastError;
};

// Safe document creation with retry
export const safeAddDoc = async (collectionPath, data) => {
    return retryOperation(async () => {
        const colRef = collection(db, collectionPath);
        return await addDoc(colRef, {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });
};

// Safe document update with retry
export const safeUpdateDoc = async (collectionPath, docId, data) => {
    return retryOperation(async () => {
        const docRef = doc(db, collectionPath, docId);
        return await setDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    });
};

// Batch operations with retry
export const safeBatchOperation = async (operations) => {
    return retryOperation(async () => {
        const batch = writeBatch(db);
        for (const op of operations) {
            const { type, collection: col, doc: docId, data } = op;
            const docRef = doc(db, col, docId);
            
            if (type === 'set') {
                batch.set(docRef, {
                    ...data,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            } else if (type === 'delete') {
                batch.delete(docRef);
            }
        }
        await batch.commit();
    });
};

// Safe document fetch with retry
export const safeGetDoc = async (collectionPath, docId) => {
    return retryOperation(async () => {
        const docRef = doc(db, collectionPath, docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    });
};