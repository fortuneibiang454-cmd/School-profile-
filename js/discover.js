import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

const studentList = document.getElementById("studentList");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));

    studentList.innerHTML = "";

    let foundStudents = 0;

    usersSnapshot.forEach((studentDoc) => {

      // Don't show the currently logged-in student
      if (studentDoc.id === user.uid) {
        return;
      }

      const student = studentDoc.data();

      const card = document.createElement("div");
      card.className = "student-card";

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

        <button class="btn">
          View Profile
        </button>
      `;

      studentList.appendChild(card);
      foundStudents++;
    });

    if (foundStudents === 0) {
      studentList.innerHTML = `
        <p>
          No other students have joined yet.
          Check back later!
        </p>
      `;
    }

  } catch (error) {

    console.error(error);

    studentList.innerHTML = `
      <p>
        We couldn't load students right now.
        Please try again later.
      </p>
    `;
  }

});
