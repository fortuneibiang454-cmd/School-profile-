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


/* =========================
   ELEMENTS
========================= */

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

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
const communityPosts =
  document.getElementById("communityPosts");

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


let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;


/* =========================
   LOGIN / SIGNUP SWITCH
========================= */

if (switchAuth) {

  switchAuth.addEventListener("click", () => {

    signupMode = !signupMode;

    if (authMessage) {
      authMessage.textContent = "";
    }

    if (signupMode) {

      loginForm?.classList.add("hidden");
      signupForm?.classList.remove("hidden");

      switchAuth.textContent =
        "Already have an account? Login";

    } else {

      signupForm?.classList.add("hidden");
      loginForm?.classList.remove("hidden");

      switchAuth.textContent =
        "Create an account";
    }

  });

}


/* =========================
   SIGN UP
========================= */

if (signupForm) {

  signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Creating your account...";

    const name =
      document.getElementById("signupName")?.value.trim();

    const email =
      document.getElementById("signupEmail")?.value.trim();

    const password =
      document.getElementById("signupPassword")?.value;

    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: name,
          email: email,
          profileComplete: false,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      window.location.href = "profile.html";

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        getFirebaseError(error);
    }

  });

}


/* =========================
   LOGIN
========================= */

if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Logging in...";

    const email =
      document.getElementById("loginEmail")?.value.trim();

    const password =
      document.getElementById("loginPassword")?.value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      window.location.href = "dashboard.html";

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        getFirebaseError(error);
    }

  });

}


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (!user) return;

  await loadProfile();
  await loadDiscoverStudents();
  await loadCommunities();
  await loadChatUsers();

});


/* =========================
   LOGOUT
========================= */

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await signOut(auth);

      window.location.href = "index.html";

    } catch (error) {

      console.error(error);

    }

  });

}


/* =========================
   NAVIGATION
========================= */

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const page = button.dataset.page;

      document
        .querySelectorAll(".page")
        .forEach(section => {
          section.classList.remove("active");
        });

      const target =
        document.getElementById(`page-${page}`);

      if (target) {

        target.classList.add("active");

        window.scrollTo(0, 0);

      }

    });

  });


/* =========================
   PROFILE
========================= */

async function loadProfile() {

  if (!currentUser) return;

  try {

    const profileSnapshot =
      await getDoc(
        doc(db, "users", currentUser.uid)
      );

    if (!profileSnapshot.exists()) return;

    const data = profileSnapshot.data();

    if (profileName)
      profileName.textContent =
        data.displayName || "Not set";

    if (profileEmail)
      profileEmail.textContent =
        data.email || currentUser.email || "";

    if (profileLevel)
      profileLevel.textContent =
        data.level || "Not set";

    if (profileSubject)
      profileSubject.textContent =
        data.subject || "Not set";

    if (profileInterest)
      profileInterest.textContent =
        data.interest || "Not set";

    const welcome =
      document.getElementById("welcomeMessage");

    if (welcome && data.displayName) {

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


/* =========================
   DISCOVER STUDENTS
========================= */

async function loadDiscoverStudents() {

  if (!discoverList) return;

  discoverList.innerHTML =
    `<div class="card">Loading students...</div>`;

  try {

    const q = query(
      collection(db, "discoverableProfiles"),
      where("discoverable", "==", true)
    );

    const snapshot = await getDocs(q);

    discoverList.innerHTML = "";

    if (snapshot.empty) {

      discoverList.innerHTML =
        `<div class="card">
          <h3>No students yet</h3>
          <p>More students will appear here as they join StudentConnect.</p>
        </div>`;

      return;
    }

    snapshot.forEach(studentDoc => {

      const student = studentDoc.data();

      if (studentDoc.id === currentUser?.uid)
        return;

      const card =
        document.createElement("div");

      card.className =
        "card student-card";

      card.innerHTML = `
        <h3>👤 ${escapeHTML(student.displayName || "Student")}</h3>

        <p>
          🌍 ${escapeHTML(student.country || "Unknown")}
        </p>

        <p>
          📍 ${escapeHTML(student.region || "Unknown")}
        </p>

        <p>
          🏫 ${escapeHTML(student.school || "School not listed")}
        </p>

        <p>
          🎓 ${escapeHTML(student.level || "Level not listed")}
        </p>

        <p>
          📚 ${escapeHTML(student.subject || "Subject not listed")}
        </p>

        <p>
          ⭐ ${escapeHTML(student.interest || "Interest not listed")}
        </p>

        <button
          class="action-btn"
          data-chat="${studentDoc.id}"
        >
          Message
        </button>
      `;

      discoverList.appendChild(card);

    });

    document
      .querySelectorAll("[data-chat]")
      .forEach(button => {

        button.addEventListener("click", () => {

          openChatWith(button.dataset.chat);

        });

      });

  } catch (error) {

    console.error(
      "Discover error:",
      error
    );

    discoverList.innerHTML =
      `<div class="card">
        Unable to load students.
      </div>`;
  }

}


/* =========================
   COMMUNITIES
========================= */

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

  if (!communityList) return;

  communityList.innerHTML = "";

  communities.forEach(community => {

    const card =
      document.createElement("div");

    card.className =
      "card community-card";

    card.innerHTML = `
      <h3>${community.name}</h3>

      <p>
        ${community.description}
      </p>

      <button
        class="action-btn"
        data-community="${community.id}"
      >
        Open Community
      </button>
    `;

    communityList.appendChild(card);

  });

  document
    .querySelectorAll("[data-community]")
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
      community => community.id === id
    );

  if (!currentCommunity) return;

  communityList?.classList.add("hidden");
  communityView?.classList.remove("hidden");

  communityTitle.textContent =
    currentCommunity.name;

  communityDescription.textContent =
    currentCommunity.description;

  await loadCommunityPosts(id);

}


if (backToCommunities) {

  backToCommunities.addEventListener(
    "click",
    () => {

      communityView?.classList.add("hidden");
      communityList?.classList.remove("hidden");

      currentCommunity = null;

    }
  );

}


/* =========================
   COMMUNITY POSTS
========================= */

if (postButton) {

  postButton.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        alert("Please log in first.");
        return;

      }

      const text =
        postInput.value.trim();

      if (!text) {

        alert("Write something first.");
        return;

      }

      if (!currentCommunity) return;

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

            text: text,

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

        postInput.value = "";

        await loadCommunityPosts(
          currentCommunity.id
        );

      } catch (error) {

        console.error(error);

        alert(
          "Could not publish your post."
        );

      }

      postButton.disabled = false;

    }
  );

}


async function loadCommunityPosts(id) {

  if (!communityPosts) return;

  communityPosts.innerHTML =
    `<div class="card">Loading discussions...</div>`;

  try {

    const q = query(
      collection(
        db,
        "communities",
        id,
        "posts"
      ),
      orderBy("createdAt", "desc")
    );

    const snapshot =
      await getDocs(q);

    communityPosts.innerHTML = "";

    if (snapshot.empty) {

      communityPosts.innerHTML =
        `<div class="card">
          <p>No discussions yet.</p>
          <p>Be the first student to start one!</p>
        </div>`;

      return;
    }

    snapshot.forEach(postDoc => {

      const post =
        postDoc.data();

      const article =
        document.createElement("article");

      article.className = "post";

      const date =
        post.createdAt?.toDate
          ? post.createdAt.toDate()
              .toLocaleString()
          : "Just now";

      article.innerHTML = `

        <div class="post-meta">
          👤 ${escapeHTML(post.displayName || "Student")}
          • ${escapeHTML(date)}
        </div>

        <div>
          ${escapeHTML(post.text || "")}
        </div>

      `;

      communityPosts.appendChild(article);

    });

  } catch (error) {

    console.error(error);

    communityPosts.innerHTML =
      `<div class="card">
        Unable to load discussions.
      </div>`;

  }

}


/* =========================
   CHAT USERS
========================= */

async function loadChatUsers() {

  if (!chatUsers) return;

  chatUsers.innerHTML =
    "Loading students...";

  try {

    const q = query(
      collection(db, "discoverableProfiles"),
      where("discoverable", "==", true)
    );

    const snapshot =
      await getDocs(q);

    chatUsers.innerHTML = "";

    snapshot.forEach(studentDoc => {

      if (
        studentDoc.id ===
        currentUser?.uid
      ) return;

      const student =
        studentDoc.data();

      const button =
        document.createElement("button");

      button.className =
        "user-item";

      button.textContent =
        `👤 ${student.displayName || "Student"}`;

      button.addEventListener(
        "click",
        () => {

          openChatWith(
            studentDoc.id
          );

        }
      );

      chatUsers.appendChild(button);

    });

  } catch (error) {

    console.error(error);

    chatUsers.innerHTML =
      "Unable to load students.";

  }

}


/* =========================
   CHAT
========================= */

async function openChatWith(uid) {

  selectedChatUser = uid;

  if (!messageInput) return;

  messageInput.disabled = false;

  chatTitle.textContent =
    "💬 Chat";

  chatMessages.innerHTML =
    "<p>Loading conversation...</p>";

  try {

    const student =
      await getDoc(
        doc(
          db,
          "discoverableProfiles",
          uid
        )
      );

    if (student.exists()) {

      chatTitle.textContent =
        `💬 ${student.data().displayName || "Student"}`;

    }

  } catch (error) {

    console.error(error);

  }

  chatMessages.innerHTML = `
    <div class="card">
      <p>Chat is ready.</p>
      <p>Send a message below.</p>
    </div>
  `;

}


if (chatForm) {

  chatForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (!currentUser || !selectedChatUser)
        return;

      const text =
        messageInput.value.trim();

      if (!text) return;

      try {

        const chatId =
          [currentUser.uid, selectedChatUser]
            .sort()
            .join("_");

        await addDoc(
          collection(
            db,
            "chats",
            chatId,
            "messages"
          ),
          {

            senderId:
              currentUser.uid,

            receiverId:
              selectedChatUser,

            text: text,

            createdAt:
              serverTimestamp()

          }
        );

        const message =
          document.createElement("div");

        message.className =
          "message mine";

        message.textContent =
          text;

        chatMessages.appendChild(message);

        messageInput.value = "";

      } catch (error) {

        console.error(error);

        alert(
          "Could not send message."
        );

      }

    }
  );

}


/* =========================
   AI STUDY ASSISTANT
========================= */

if (aiBtn) {

  aiBtn.addEventListener(
    "click",
    () => {

      alert(
        "AI Study Assistant is the next feature to connect."
      );

    }
  );

}


/* =========================
   SECURITY HELPER
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   FIREBASE ERRORS
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
      return "Password must be at least 6 characters.";

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/user-not-found":
      return "No account was found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/network-request-failed":
      return "Network connection problem. Check your internet and try again.";

    default:
      return error?.message ||
        "Something went wrong. Please try again.";

  }

}
