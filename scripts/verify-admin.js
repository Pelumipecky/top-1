import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

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

async function verifyAdmin() {
  try {
    console.log("Attempting to verify admin account...");
    
    // Try to sign in
    console.log("Attempting to sign in...");
    await signInWithEmailAndPassword(
      auth, 
      "forexbinaryexchangebroker@gmail.com", 
      "forexbinaryexchangebroker@123"
    );
    console.log("Successfully signed in with Firebase Auth!");

    // Check admin status in Firestore
    console.log("Checking admin status in Firestore...");
    const usersCol = collection(db, "userlogs");
    const q = query(
      usersCol, 
      where("email", "==", "forexbinaryexchangebroker@gmail.com"),
      where("admin", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    console.log("Number of admin documents found:", querySnapshot.size);
    
    if (!querySnapshot.empty) {
      console.log("Admin document found:", querySnapshot.docs[0].data());
    } else {
      console.log("No admin document found in Firestore!");
    }
    
  } catch (error) {
    console.error("Error during verification:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  }
}

console.log("Starting admin verification...");
verifyAdmin();