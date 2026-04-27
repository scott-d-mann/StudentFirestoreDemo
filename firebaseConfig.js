// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web apap's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// STUDENTS: Please replace the empty strings with your own Firebase configuration values. You can find these values in your Firebase project settings under the "General" tab. Make sure to keep these values secure and do not share them publicly.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };

