import { initializeApp } from 'firebase/app';
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
const db = getFirestore(app);

async function setupFirestore() {
  const adminEmail = "forexbinaryexchangebroker@gmail.com";

  try {
    console.log("Creating admin document in Firestore...");
    
    // Create admin document
    const adminDoc = {
      name: "admin",
      email: adminEmail,
      admin: true,
      createdAt: new Date().toISOString()
    };

    // Create userlogs collection and add admin document
    const usersCol = collection(db, "userlogs");
    const docRef = await addDoc(usersCol, adminDoc);
    
    console.log("=== Firestore Setup Complete ===");
    console.log("Collection: userlogs");
    console.log("Admin document created!");
    console.log("Document ID:", docRef.id);
    console.log("============================");
    
  } catch (error) {
    console.error("Error during Firestore setup:", error);
  }
}

// Run the setup
setupFirestore();