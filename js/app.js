import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   APP CHECK
========================================================= */

console.log("StudentConnect app.js loaded");
console.log("Firebase Auth:", auth);
console.log("Firebase Firestore:", db);


/* =========================================================
   ELEMENTS
========================================================= */

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");

const logoutBtn = document.getElementById("logoutBtn");
const settingsLogout = document.getElementById("settingsLogout");

const discoverList = document.getElementById("discoverList");

const communityList = document.getElementById("communityList");
const communityView = document.getElementById("communityView");
const communityTitle = document.getElementById("communityTitle");
const communityDescription =
  document.getElementById("communityDescription");
const backToCommunities =
  document.getElementById("backToCommunities");

const postInput = document.getElementById("postInput");
const postButton = document.getElementById("postButton");
const communityPosts = document.getElementById("communityPosts");

const chatUsers = document.getElementById("chatUsers");
const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileLevel = document.getElementById("profileLevel");
const profileSubject = document.getElementById("profileSubject");
const profileInterest = document.getElementById("profileInterest");

const aiBtn = document.getElementById("aiBtn");


/* =========================================================
   STATE
========================================================= */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


/* =========================================================
   AUTH SWITCH
========================================================= */

switchAuth?.addEventListener("click", () => {

  signupMode = !signupMode;

  if (authMessage) {
    authMessage.textContent = "";
  }

  if (signupMode) {

    loginForm?.classList.add("hidden");
    signupForm?.classList.remove("hidden");

    if (switchAuth) {
      switchAuth.textContent =
        "Already have an account? Login";
    }

  } else {

    signupForm?.classList.add("hidden");
    loginForm?.classList.remove("hidden");

    if (switchAuth) {
      switchAuth.textContent =
        "Create an account";
    }
  }
});


/* =========================================================
   SIGN UP
========================================================= */

signupForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (authMessage) {
    authMessage.textContent =
      "Creating your account...";
  }

  const nameInput =
    document.getElementById("signupName");

  const emailInput =
    document.getElementById("signupEmail");

  const passwordInput =
    document.getElementById("signupPassword");

  if (!nameInput || !emailInput || !passwordInput) {

    if (authMessage) {
      authMessage.textContent =
        "Signup form is not connected correctly.";
    }

    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!name || !email || !password) {

    if (authMessage) {
      authMessage.textContent =
        "Please complete all fields.";
    }

    return;
  }

  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = result.user;

    console.log(
      "Account created:",
      user.uid
    );

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        displayName: name,
        email: email,
        profileComplete: false,
        discoverable: false,
        createdAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    if (authMessage) {
      authMessage.textContent =
        "Account created successfully.";
    }

    window.location.href = "profile.html";

  } catch (error) {

    console.error(
      "SIGNUP ERROR:",
      error
    );

    console.error(
      "Firebase error code:",
      error?.code
    );

    if (authMessage) {
      authMessage.textContent =
        getFirebaseError(error);
    }
  }
});


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");

  if (!emailInput || !passwordInput) {

    console.error(
      "Login inputs were not found."
    );

    if (authMessage) {
      authMessage.textContent =
        "Login form is not connected correctly.";
    }

    return;
  }

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;

  if (!email || !password) {

    if (authMessage) {
      authMessage.textContent =
        "Please enter your email and password.";
    }

    return;
  }

  if (authMessage) {
    authMessage.textContent =
      "Logging in...";
  }

  try {

    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    console.log(
      "LOGIN SUCCESS:",
      result.user.uid
    );

    if (authMessage) {
      authMessage.textContent =
        "Login successful. Opening dashboard...";
    }

    /*
      Firebase has successfully authenticated
      the user.

      Redirect after a short delay so the user
      can see the success message.
    */

    setTimeout(() => {

      window.location.href =
        "dashboard.html";

    }, 500);

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    console.error(
      "Firebase error code:",
      error?.code
    );

    if (authMessage) {
      authMessage.textContent =
        getFirebaseError(error);
    }
  }
});


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    console.log(
      "AUTH STATE:",
      user ? user.uid : "No user"
    );

    currentUser = user;

    if (!user) {

      authScreen?.classList.remove("hidden");
      app?.classList.add("hidden");

      return;
    }

    authScreen?.classList.add("hidden");
    app?.classList.remove("hidden");

    try {

      await loadProfile();
      await loadDiscoverStudents();
      await loadCommunities();
      await loadChatUsers();

    } catch (error) {

      console.error(
        "App loading error:",
        error
      );
    }
  }
);


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await signOut(auth);

    window.location.href =
      "index.html";

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }
}


logoutBtn?.addEventListener(
  "click",
  logout
);

settingsLogout?.addEventListener(
  "click",
  logout
);


/* =========================================================
   NAVIGATION
========================================================= */

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;

        document
          .querySelectorAll(".page")
          .forEach(section => {

            section.classList.remove(
              "active"
            );

          });

        document
          .querySelectorAll(".nav-item")
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });

        const target =
          document.getElementById(
            `page-${page}`
          );

        if (target) {

          target.classList.add(
            "active"
          );

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }

        document
          .querySelectorAll(
            `.nav-item[data-page="${page}"]`
          )
          .forEach(item => {

            item.classList.add(
              "active"
            );

          });

      }
    );

  });


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

  if (!currentUser) {
    return;
  }

  try {

    const profileSnapshot =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    if (!profileSnapshot.exists()) {
      console.log(
        "No profile document found."
      );

      return;
    }

    const data =
      profileSnapshot.data();

    if (profileName) {
      profileName.textContent =
        data.displayName ||
        "Not set";
    }

    if (profileEmail) {
      profileEmail.textContent =
        data.email ||
        currentUser.email ||
        "";
    }

    if (profileLevel) {
      profileLevel.textContent =
        data.level ||
        "Not set";
    }

    if (profileSubject) {
      profileSubject.textContent =
        data.subject ||
        "Not set";
    }

    if (profileInterest) {
      profileInterest.textContent =
        data.interest ||
        "Not set";
    }

    const welcome =
      document.getElementById(
        "welcomeMessage"
      );

    if (
      welcome &&
      data.displayName
    ) {

      welcome.textContent =
        `Welcome, ${data.displayName} 👋`;
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );
  }
}


/* =========================================================
   DISCOVER STUDENTS
========================================================= */

async function loadDiscoverStudents() {

  if (
    !discoverList ||
    !currentUser
  ) {
    return;
  }

  discoverList.innerHTML = `
    <div class="loading-card">
      Loading students...
    </div>
  `;

  try {

    const q =
      query(
        collection(
          db,
          "discoverableProfiles"
        ),
        where(
          "discoverable",
          "==",
          true
        )
      );

    const snapshot =
      await getDocs(q);

    discoverList.innerHTML = "";

    let count = 0;

    snapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id ===
          currentUser.uid
        ) {
          return;
        }

        const student =
          studentDoc.data();

        count++;

        const card =
          document.createElement(
            "article"
          );

        card.className =
          "student-card";

        card.innerHTML = `

          <div class="student-avatar">
            👤
          </div>

          <div class="student-details">

            <h3>
              ${escapeHTML(
                student.displayName ||
                "Student"
              )}
            </h3>

            <p>
              🌍 ${escapeHTML(
                student.country ||
                "Unknown"
              )}
            </p>

            <p>
              🎓 ${escapeHTML(
                student.level ||
                "Level not listed"
              )}
            </p>

            <p>
              📚 ${escapeHTML(
                student.subject ||
                "Subject not listed"
              )}
            </p>

            <p>
              ⭐ ${escapeHTML(
                student.interest ||
                "Interest not listed"
              )}
            </p>

            <button
              class="primary-btn small-btn"
              data-chat="${studentDoc.id}"
              type="button"
            >
              Message
            </button>

          </div>
        `;

        discoverList.appendChild(
          card
        );
      }
    );

    if (count === 0) {

      discoverList.innerHTML = `

        <div class="empty-state large">

          <span>🌍</span>

          <h3>
            No other discoverable students yet
          </h3>

          <p>
            When another student completes
            their profile and chooses
            "Yes", they will appear here.
          </p>

        </div>
      `;
    }

    document
      .querySelectorAll(
        "[data-chat]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            await openChatWith(
              button.dataset.chat
            );

            showPage("messages");

          }
        );

      });

  } catch (error) {

    console.error(
      "Discover error:",
      error
    );

    discoverList.innerHTML = `

      <div class="error-card">
        Unable to load students.
      </div>

    `;
  }
}


/* =========================================================
   PAGE HELPER
========================================================= */

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {

      section.classList.remove(
        "active"
      );

    });

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });

  document
    .getElementById(
      `page-${page}`
    )
    ?.classList.add(
      "active"
    );

  document
    .querySelectorAll(
      `.nav-item[data-page="${page}"]`
    )
    .forEach(item => {

      item.classList.add(
        "active"
      );

    });

}


/* =========================================================
   COMMUNITIES
========================================================= */

const communities = [

  {
    id: "study-hub",
    name: "📚 Study Hub",
    description:
      "Ask questions, explain topics and study together."
  },

  {
    id: "coding-club",
    name: "💻 Coding Club",
    description:
      "Learn programming, build projects and share ideas."
  },

  {
    id: "science-zone",
    name: "🔬 Science Zone",
    description:
      "Discuss Biology, Chemistry, Physics and other sciences."
  },

  {
    id: "exam-prep",
    name: "📝 Exam Prep",
    description:
      "Share study strategies and prepare for exams together."
  },

  {
    id: "creative-corner",
    name: "🎨 Creative Corner",
    description:
      "Art, writing, music and creative projects."
  },

  {
    id: "sports-club",
    name: "⚽ Sports Club",
    description:
      "Talk about sports and connect with students who enjoy them."
  }

];


async function loadCommunities() {

  if (!communityList) {
    return;
  }

  communityList.innerHTML = "";

  communities.forEach(
    community => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "community-card";

      const icon =
        community.name.split(" ")[0];

      const name =
        community.name.substring(
          community.name.indexOf(" ") + 1
        );

      card.innerHTML = `

        <div class="community-icon">
          ${icon}
        </div>

        <div>

          <h3>
            ${escapeHTML(name)}
          </h3>

          <p>
            ${escapeHTML(
              community.description
            )}
          </p>

          <button
            class="primary-btn small-btn"
            data-community="${community.id}"
            type="button"
          >
            Open Community
          </button>

        </div>
      `;

      communityList.appendChild(
        card
      );
    }
  );

  document
    .querySelectorAll(
      "[data-community]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openCommunity(
            button.dataset.community
          );

        }
      );

    });
}


async function openCommunity(id) {

  currentCommunity =
    communities.find(
      community =>
        community.id === id
    );

  if (!currentCommunity) {
    return;
  }

  communityList?.classList.add(
    "hidden"
  );

  communityView?.classList.remove(
    "hidden"
  );

  if (communityTitle) {
    communityTitle.textContent =
      currentCommunity.name;
  }

  if (communityDescription) {
    communityDescription.textContent =
      currentCommunity.description;
  }

  await loadCommunityPosts(id);
}


backToCommunities?.addEventListener(
  "click",
  () => {

    communityView?.classList.add(
      "hidden"
    );

    communityList?.classList.remove(
      "hidden"
    );

    currentCommunity = null;

  }
);


/* =========================================================
   COMMUNITY POSTS
========================================================= */

postButton?.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      alert(
        "Please log in first."
      );

      return;
    }

    const text =
      postInput?.value.trim();

    if (!text) {

      alert(
        "Write something first."
      );

      return;
    }

    if (!currentCommunity) {
      return;
    }

    postButton.disabled = true;

    try {

      const profile =
        await getDoc(
          doc(
            db,
            "users",
            currentUser.uid
          )
        );

      const userData =
        profile.exists()
          ? profile.data()
          : {};

      await addDoc(
        collection(
          db,
          "communities",
          currentCommunity.id,
          "posts"
        ),
        {

          text,

          uid:
            currentUser.uid,

          displayName:
            userData.displayName ||
            currentUser.email ||
            "Student",

          createdAt:
            serverTimestamp()

        }
      );

      if (postInput) {
        postInput.value = "";
      }

      await
