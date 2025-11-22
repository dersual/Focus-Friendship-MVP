// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, connectAuthEmulator } from "firebase/auth"; // Add connectAuthEmulator
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"; // Add connectFirestoreEmulator

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to Firebase Emulators if in development mode 
if (process.env.NODE_ENV === 'development') {
  console.log('Connecting to Firebase Emulators...');
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

/**
 * Signs in the user anonymously and returns the user's UID.
 * @returns {Promise<string>} A promise that resolves with the user's UID.
 */
const signIn = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        throw error;
    }
};

export { app, auth, db, onAuthStateChanged, signIn };
