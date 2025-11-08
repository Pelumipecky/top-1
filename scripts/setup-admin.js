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

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin(email, password) {
  try {
    // First check if admin already exists
    const usersCol = collection(db, "userlogs");
    const existingQuery = query(usersCol, where("admin", "==", true));
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      console.log("Admin account already exists!");
      return;
    }

    console.log("Creating admin account...");
    
    // Create auth account first
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Firebase Auth account created successfully!");

    // Then create admin document
    const adminDoc = {
      name: "admin",
      email: email,
      admin: true,
      uid: user.uid,
      createdAt: new Date().toISOString()
    };

    // Add to userlogs collection
    const docRef = await addDoc(usersCol, adminDoc);
    console.log("Admin account created successfully in Firestore!");
    console.log("Admin Document ID:", docRef.id);
    
  } catch (error) {
    console.error("Error creating admin:", error.message);
  }
}

// Admin credentials
const adminEmail = "forexbinaryexchangebroker@gmail.com";
const adminPassword = "forexbinaryexchangebroker@123";

console.log("Starting admin creation process...");
createAdmin(adminEmail, adminPassword);