import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

const studentList = document.getElementById("studentList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Get the current student's profile
    const myProfileRef = doc(db, "users", user.uid);
    const myProfileSnapshot = await getDoc(myProfileRef);

    if (!myProfileSnapshot.exists()) {
      studentList.innerHTML = "<p>Your profile could not be found.</p>";
      return;
    }

    const myProfile = myProfileSnapshot.data();

    // Get profiles that students chose to make discoverable
    const profilesSnapshot = await getDocs(
      collection(db, "discoverableProfiles")
    );

    const students = [];

    profilesSnapshot.forEach((profileDoc) => {
      // Don't recommend yourself
      if (profileDoc.id === user.uid) {
        return;
      }

      const student = profileDoc.data();

      let score = 0;

      if (student.subject === myProfile.subject) {
        score += 3;
      }

      if (student.interest === myProfile.interest) {
        score += 3;
      }

      if (student.level === myProfile.level) {
        score += 2;
      }

      students.push({
        ...student,
        score: score
      });
    });

    // Highest matching students first
    students.sort((a, b) => b.score - a.score);

    studentList.innerHTML = "";

    if (students.length === 0) {
      studentList.innerHTML = `
        <p>
          No other discoverable students yet.
          Check back later!
        </p>
      `;
      return;
    }

    students.forEach((student) => {

      const card = document.createElement("div");
      card.className = "student-card";

      let matchText = "New connection";

      if (student.score >= 7) {
        matchText = "🔥 Great match";
      } else if (student.score >= 4) {
        matchText = "⭐ Good match";
      }

      card.innerHTML = `
        <h2>👤 ${student.displayName || "Student"}</h2>

        <p>
          <strong>Level:</strong>
          ${student.level || "Not provided"}
        </p>

        <p>
          <strong>Subject:</strong>
          ${student.subject || "Not provided"}
        </p>

        <p>
          <strong>Interest:</strong>
          ${student.interest || "Not provided"}
        </p>

        <p>
          <strong>${matchText}</strong>
        </p>

        <button class="btn" type="button">
          View Profile
        </button>
      `;

      studentList.appendChild(card);
    });

  } catch (error) {

    console.error("Matching error:", error);

    studentList.innerHTML = `
      <p>
        We couldn't load student matches.
        Please try again later.
      </p>
    `;
  }
});
