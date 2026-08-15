hereimport { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Account created:", userCredential.user.uid);

    alert("Account created successfully!");

    window.location.href = "pages/profile.html";

  } catch (error) {
    console.error(error);

    alert(error.message);
  }
});
