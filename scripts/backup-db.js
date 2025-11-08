const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

// Collections to backup
const COLLECTIONS = [
    'userlogs',
    'investments',
    'withdrawals',
    'notifications',
    'chats',
    'withdrawalCodes'
];

async function backupCollection(collectionName) {
    console.log(`Backing up collection: ${collectionName}`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    return {
        count: data.length,
        data
    };
}

async function createBackup() {
    console.log('Starting database backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupPath = path.join(backupDir, `firebase-backup-${timestamp}.json`);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
        const backup = {};
        let totalDocuments = 0;

        // Backup each collection
        for (const collectionName of COLLECTIONS) {
            const result = await backupCollection(collectionName);
            backup[collectionName] = result.data;
            totalDocuments += result.count;
            console.log(`✓ ${collectionName}: ${result.count} documents`);
        }

        // Write backup to file
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

        console.log('\nBackup Summary:');
        console.log('---------------');
        console.log(`Total collections: ${COLLECTIONS.length}`);
        console.log(`Total documents: ${totalDocuments}`);
        console.log(`Backup saved to: ${backupPath}`);
        console.log('\nBackup completed successfully!');

    } catch (error) {
        console.error('Error during backup:', error);
        process.exit(1);
    }
}

// Run the backup
createBackup()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Backup failed:', error);
        process.exit(1);
    });