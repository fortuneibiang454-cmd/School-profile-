import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
await setDoc(
  doc(db, "users", user.uid),
  {
    displayName: displayName,
    level: level,
    subject: subject,
    interest: interest,
    discoverable: discoverable === "yes"
  }
);
if (discoverable === "yes") {
  await setDoc(
    doc(db, "discoverableProfiles", user.uid),
    {
      displayName: displayName,
      level: level,
      subject: subject,
      interest: interest
    }
  );
}

const profileForm = document.getElementById("profileForm");

onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  profileForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const displayName =
      document.getElementById("displayName").value.trim();

    const level =
      document.getElementById("level").value;

    const subject =
      document.getElementById("subjects").value;

    const interest =
      document.getElementById("interests").value;
const discoverable =
  document.querySelector('input[name="discoverable"]:checked').value;
    try {

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName,
          level: level,
          subject: subject,
          interest: interest
        }
      );

      alert("Profile saved successfully!");

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error(error);

      alert("Could not save your profile. Please try again.");

    }

  });

});
