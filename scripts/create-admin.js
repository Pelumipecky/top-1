import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
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

async function setupAdmin() {
  const adminEmail = "admin@topmint.com";
  const adminPassword = "TopMint@123"; // Using a simpler but still secure password

  try {
    console.log("Starting admin setup...");
    
    // Create auth account
    console.log("Creating authentication account...");
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    console.log("Authentication account created successfully!");

    // Create admin document in Firestore
    console.log("Creating admin document in Firestore...");
    const adminDoc = {
      name: "admin",
      email: adminEmail,
      admin: true,
      uid: user.uid,
      createdAt: new Date().toISOString()
    };

    const usersCol = collection(db, "userlogs");
    const docRef = await addDoc(usersCol, adminDoc);
    
    console.log("=== Admin Account Created Successfully ===");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("Document ID:", docRef.id);
    console.log("=====================================");
    console.log("You can now login at /signin_admin with these credentials.");
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Email already registered. Please use a different email or delete the existing account from Firebase Console.");
    } else {
      console.error("Error creating admin:", error.message);
      console.error("Error code:", error.code);
    }
  }
}

// Run the setup
setupAdmin();