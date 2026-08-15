hereimport { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "school-connect-11578.firebaseapp.com",
  projectId: "school-connect-11578",
  storageBucket: "school-connect-11578.firebasestorage.app",
  messagingSenderId: "85015597520",
  appId: "1:85015597520:web:6d1c895eade85026c4e9d5",
  measurementId: "G-XQTW122JZ3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "school-connect-11578.firebaseapp.com",
  projectId: "school-connect-11578",
  storageBucket: "school-connect-11578.firebasestorage.app",
  messagingSenderId: "85015597520",
  appId: "1:85015597520:web:6d1c895eade85026c4e9d5",
  measurementId: "G-XQTW122JZ3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "school-connect-11578.firebaseapp.com",
  projectId: "school-connect-11578",
  storageBucket: "school-connect-11578.firebasestorage.app",
  messagingSenderId: "85015597520",
  appId: "1:85015597520:web:6d1c895eade85026c4e9d5",
  measurementId: "G-XQTW122JZ3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
