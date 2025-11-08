import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

async function createNewAdmin() {
  // Simple admin credentials
  const adminEmail = "admin@topmint.com";
  const adminPassword = "Admin123!";

  try {
    console.log("Creating new admin account...");

    // Create admin in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    // Create admin document in Firestore
    const adminDoc = {
      name: "admin",
      email: adminEmail,
      admin: true,
      uid: user.uid,
      createdAt: new Date().toISOString()
    };

    const usersCol = collection(db, "userlogs");
    const docRef = await addDoc(usersCol, adminDoc);
    
    console.log("\n=== Admin Account Created Successfully ===");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Document ID:", docRef.id);
    console.log("\nYou can now login at /signin_admin with these credentials");
    console.log("========================================\n");
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Error code:", error.code);
  }
}

// Create the admin account
createNewAdmin();