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

  studentList.innerHTML = "<p>Finding students for you...</p>";

  try {

    // Get YOUR profile
    const myProfileRef = doc(db, "users", user.uid);
    const myProfileSnapshot = await getDoc(myProfileRef);

    if (!myProfileSnapshot.exists()) {
      studentList.innerHTML = `
        <p>Your profile hasn't been completed yet.</p>
        <a href="profile.html" class="btn">Complete Profile</a>
      `;
      return;
    }

    const myProfile = myProfileSnapshot.data();

    // Get discoverable profiles
    const profilesSnapshot = await getDocs(
      collection(db, "discoverableProfiles")
    );

    const students = [];

    profilesSnapshot.forEach((profileDoc) => {

      // Don't show yourself
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
        id: profileDoc.id,
        ...student,
        score: score
      });

    });

    // Highest matches first
    students.sort((a, b) => b.score - a.score);

    studentList.innerHTML = "";

    if (students.length === 0) {

      studentList.innerHTML = `
        <div class="student-card">
          <h2>🌍 No students yet</h2>
          <p>
            There are no other discoverable students yet.
            Invite more students to join StudentConnect!
          </p>
        </div>
      `;

      return;
    }

    students.forEach((student) => {

      let matchText = "New connection";

      if (student.score >= 7) {
        matchText = "🔥 Great match";
      } else if (student.score >= 4) {
        matchText = "⭐ Good match";
      } else if (student.score >= 1) {
        matchText = "✨ Some things in common";
      }

      const card = document.createElement("div");

      card.className = "student-card";

      card.innerHTML = `
        <h2>👤 ${student.displayName || "Student"}</h2>

        <p>
          <strong>School Level:</strong>
          ${student.level || "Not provided"}
        </p>

        <p>
          <strong>Favorite Subject:</strong>
          ${student.subject || "Not provided"}
        </p>

        <p>
          <strong>Main Interest:</strong>
          ${student.interest || "Not provided"}
        </p>

        <p>
          <strong>${matchText}</strong>
        </p>

        <button
  class="btn"
  type="button"
  onclick="window.location.href='chat.html?user=${student.id}'"
>
  Message
</button>
      `;

      studentList.appendChild(card);

    });

  } catch (error) {

    console.error("Discover error:", error);

    studentList.innerHTML = `
      <div class="student-card">
        <h2>⚠️ Something went wrong</h2>

        <p>
          We couldn't load student recommendations.
        </p>

        <p>
          Please refresh the page and try again.
        </p>
      </div>
    `;

  }

});
