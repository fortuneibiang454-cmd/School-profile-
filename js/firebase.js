import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBeBJ2fzqhq_yUMUxyq-OHMgI5eBG9t9po",
  authDomain: "school-connect-11578.firebaseapp.com",
  databaseURL: "https://school-connect-11578-default-rtdb.firebaseio.com",
  projectId: "school-connect-11578",
  storageBucket: "school-connect-11578.firebasestorage.app",
  messagingSenderId: "85015597520",
  appId: "1:85015597520:web:6d1c895eade85026c4e9d5",
  measurementId: "G-XQTW122JZ3"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
