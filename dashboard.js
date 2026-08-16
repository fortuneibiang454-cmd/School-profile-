import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

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
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);

    alert("You have been logged out.");

    window.location.href = "index.html";

  } catch (error) {
    console.error(error);
    alert("Could not log out. Please try again.");
  }
});
  const messageBadge = document.getElementById("messageBadge");

onAuthStateChanged(auth, (user) => {

  if (!user) {
    return;
  }

  const chatsRef = collection(db, "chats");

  const chatsQuery = query(
    chatsRef,
    where("participants", "array-contains", user.uid)
  );

  onSnapshot(chatsQuery, (snapshot) => {

    if (snapshot.empty) {
      messageBadge.textContent = "";
      return;
    }

    messageBadge.textContent = " • New";
  });
});
});
