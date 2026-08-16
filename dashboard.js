import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const welcomeMessage = document.getElementById("welcomeMessage");
const studentLevel = document.getElementById("studentLevel");
const studentSubject = document.getElementById("studentSubject");
const studentInterest = document.getElementById("studentInterest");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (profileSnapshot.exists()) {

      const profile = profileSnapshot.data();

      welcomeMessage.textContent =
        `Welcome, ${profile.displayName} 👋`;

      studentLevel.textContent = profile.level;
      studentSubject.textContent = profile.subject;
      studentInterest.textContent = profile.interest;

    } else {

      welcomeMessage.textContent =
        "Welcome to StudentConnect 👋";

    }

  } catch (error) {

    console.error(error);

    welcomeMessage.textContent =
      "Welcome to StudentConnect 👋";

  }

});
