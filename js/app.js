import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");

const switchAuth =
  document.getElementById("switchAuth");

const authMessage =
  document.getElementById("authMessage");

const authScreen =
  document.getElementById("authScreen");

const appScreen =
  document.getElementById("appScreen");

const logoutBtn =
  document.getElementById("logoutBtn");

const welcomeMessage =
  document.getElementById("welcomeMessage");


let signupMode = false;


/* =========================
   SWITCH LOGIN / SIGNUP
========================= */

switchAuth.addEventListener(
  "click",
  () => {

    signupMode = !signupMode;

    authMessage.textContent = "";

    if (signupMode) {

      loginForm.classList.add("hidden");

      signupForm.classList.remove("hidden");

      switchAuth.textContent =
        "Already have an account? Login";

    } else {

      signupForm.classList.add("hidden");

      loginForm.classList.remove("hidden");

      switchAuth.textContent =
        "Create an account";
    }

  }
);


/* =========================
   SIGN UP
========================= */

signupForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Creating your account...";

    const name =
      document
        .getElementById("signupName")
        .value
        .trim();

    const email =
      document
        .getElementById("signupEmail")
        .value
        .trim();

    const password =
      document
        .getElementById("signupPassword")
        .value;


    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        result.user;


      /*
       * Save the basic account information.
       * The complete student profile will be
       * collected on profile.html.
       */

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {

          uid: user.uid,

          displayName: name,

          email: email,

          profileComplete: false,

          createdAt:
            serverTimestamp()

        },
        {
          merge: true
        }
      );


      /*
       * Send the new student to
       * profile setup.
       */

      window.location.href =
        "profile.html";

    }

    catch (error) {

      console.error(
        "Signup error:",
        error
      );

      authMessage.textContent =
        getFirebaseError(error);

    }

  }
);


/* =========================
   LOGIN
========================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Logging in...";


    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim();

    const password =
      document
        .getElementById("loginPassword")
        .value;


    try {

      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        result.user;


      /*
       * Existing students go to the app.
       * New students without a completed
       * profile go to profile setup.
       */

      const profileRef =
        doc(
          db,
          "users",
          user.uid
        );


      /*
       * We don't need to read the profile
       * here just to log in.
       * Send the student to the main app.
       */

      window.location.href =
        "dashboard.html";

    }

    catch (error) {

      console.error(
        "Login error:",
        error
      );

      authMessage.textContent =
        getFirebaseError(error);

    }

  }
);


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      window.location.reload();

    }

    catch (error) {

      console.error(error);

    }

  }
);


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  (user) => {

    /*
     * Don't automatically hide the login
     * screen here if the user is on signup.
     *
     * Authentication is handled by the
     * forms above.
     */

    if (user) {

      if (welcomeMessage) {

        welcomeMessage.textContent =
          `Welcome to StudentConnect 👋`;

      }

    }

  }
);


/* =========================
   NAVIGATION
========================= */

document
  .querySelectorAll("[data-page]")
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;

          document
            .querySelectorAll(".page")
            .forEach(
              (section) => {
                section.classList.remove(
                  "active"
                );
              }
            );


          const target =
            document.getElementById(
              `page-${page}`
            );


          if (target) {

            target.classList.add(
              "active"
            );

            window.scrollTo(
              0,
              0
            );

          }

        }
      );

    }
  );


/* =========================
   AI BUTTON
========================= */

const aiBtn =
  document.getElementById("aiBtn");

if (aiBtn) {

  aiBtn.addEventListener(
    "click",
    () => {

      alert(
        "The AI Study Assistant will be added in the next stage."
      );

    }
  );

}


/* =========================
   FIREBASE ERROR MESSAGES
========================= */

function getFirebaseError(error) {

  const code =
    error?.code || "";

  switch (code) {

    case "auth/email-already-in-use":
      return "This email already has an account.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/weak-password":
      return "Your password must be at least 6 characters.";

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/user-not-found":
      return "No account was found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    default:
      return error?.message ||
        "Something went wrong. Please try again.";

  }

}
