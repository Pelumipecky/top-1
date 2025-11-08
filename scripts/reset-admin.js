import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

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

async function resetAdmin() {
  // New admin credentials - simple and clear
  const adminEmail = "admin@topmint.com";
  const adminPassword = "Admin123!";

  try {
    console.log("Starting admin reset process...");

    // First, delete existing admin documents in Firestore
    console.log("Cleaning up existing admin documents...");
    const usersCol = collection(db, "userlogs");
    const adminQuery = query(usersCol, where("admin", "==", true));
    const querySnapshot = await getDocs(adminQuery);
    
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log("Cleaned up existing admin documents");

    // Create new admin account in Firebase Auth
    console.log("Creating new admin account in Firebase Auth...");
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    console.log("Admin auth account created successfully!");

    // Create new admin document in Firestore
    console.log("Creating new admin document in Firestore...");
    const adminDoc = {
      name: "admin",
      email: adminEmail,
      admin: true,
      uid: user.uid,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(usersCol, adminDoc);
    
    console.log("\n=== New Admin Account Created Successfully ===");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Document ID:", docRef.id);
    console.log("\nYou can now login at /signin_admin with these credentials");
    console.log("========================================\n");
    
  } catch (error) {
    console.error("Error during reset:", error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log("\nThis email is already registered. Please use the Firebase Console to delete the existing account first.");
    }
  }
}

// Run the reset
resetAdmin();

async function resetAdmin() {
  try {
    // New simpler credentials
    const adminEmail = "forexbinaryexchangebroker@gmail.com";
    const adminPassword = "Admin123!@#";

    console.log("Creating new admin account...");
    
    // Create new auth account
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log("Firebase Auth account created!");

    // Create admin document in Firestore
    const adminDoc = {
      name: "admin",
      email: adminEmail,
      admin: true,
      uid: userCredential.user.uid,
      createdAt: new Date().toISOString()
    };

    const usersCol = collection(db, "userlogs");
    const docRef = await addDoc(usersCol, adminDoc);
    
    console.log("Success! Admin account created");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Document ID:", docRef.id);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code === "auth/email-already-in-use") {
      console.log("Email already in use. Try signing in with the password 'Admin123!@#'");
    }
  }
}

resetAdmin();