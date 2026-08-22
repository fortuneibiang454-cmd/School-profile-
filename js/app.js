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

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

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

/* IMPORTANT:
   Your HTML uses postsList.
*/
const communityPosts =
  document.getElementById("postsList");

const chatUsers = document.getElementById("chatUsers");
const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileCountry = document.getElementById("profileCountry");
const profileSchool = document.getElementById("profileSchool");
const profileLevel = document.getElementById("profileLevel");
const profileSubject = document.getElementById("profileSubject");
const profileInterest = document.getElementById("profileInterest");

const editProfileBtn =
  document.getElementById("editProfileBtn");

const aiBtn = document.getElementById("aiBtn");
const aiArea = document.getElementById("aiArea");
const aiInput = document.getElementById("aiInput");
const aiAskButton = document.getElementById("aiAskButton");
const aiResponse = document.getElementById("aiResponse");


/* =========================
   STATE
========================= */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;


/* =========================
   COMMUNITY DATA
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
  },

  {
    id: "exam-prep",
    name: "📖 Exam Prep",
    description:
      "Prepare for exams and exchange study strategies."
  }
];


/* =========================
   INITIAL UI
========================= */

function showLoggedOutScreen() {

  authScreen?.classList.remove("hidden");
  appScreen?.classList.add("hidden");

}


function showLoggedInScreen() {

  authScreen?.classList.add("hidden");
  appScreen?.classList.remove("hidden");

}


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

  signupForm.addEventListener("submit", async event => {

    event.preventDefault();

    const name =
      document.getElementById("signupName")?.value.trim();

    const email =
      document.getElementById("signupEmail")?.value.trim();

    const password =
      document.getElementById("signupPassword")?.value;

    if (!name || !email || !password) {
      authMessage.textContent =
        "Please complete all fields.";
      return;
    }

    authMessage.textContent =
      "Creating your account...";

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
          discoverable: false,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      authMessage.textContent =
        "Account created successfully!";

      /*
        We don't redirect to dashboard.html
        because your current HTML contains
        the complete application.
      */

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

  loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    const email =
      document.getElementById("loginEmail")?.value.trim();

    const password =
      document.getElementById("loginPassword")?.value;

    if (!email || !password) {

      authMessage.textContent =
        "Enter your email and password.";

      return;
    }

    authMessage.textContent =
      "Logging in...";

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

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

onAuthStateChanged(auth, async user => {

  currentUser = user;

  if (!user) {

    showLoggedOutScreen();

    return;
  }

  showLoggedInScreen();

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

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

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

      const page =
        button.dataset.page;

      document
        .querySelectorAll(".page")
        .forEach(section => {
          section.classList.remove("active");
        });

      const target =
        document.getElementById(
          `page-${page}`
        );

      if (target) {

        target.classList.add("active");

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

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
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    if (!profileSnapshot.exists()) {

      profileEmail.textContent =
        currentUser.email || "Not set";

      return;
    }

    const data =
      profileSnapshot.data();

    if (profileName)
      profileName.textContent =
        data.displayName || "Not set";

    if (profileEmail)
      profileEmail.textContent =
        data.email ||
        currentUser.email ||
        "Not set";

    if (profileCountry)
      profileCountry.textContent =
        data.country || "Not set";

    if (profileSchool)
      profileSchool.textContent =
        data.school || "Not set";

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
      document.getElementById(
        "welcomeMessage"
      );

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

  if (!discoverList || !currentUser)
    return;

  discoverList.innerHTML =
    `<div class="card">
      Loading students...
    </div>`;

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

    let foundStudent = false;

    snapshot.forEach(studentDoc => {

      if (
        studentDoc.id ===
        currentUser.uid
      ) {
        return;
      }

      foundStudent = true;

      const student =
        studentDoc.data();

      const card =
        document.createElement("div");

      card.className =
        "card student-card";

      const name =
        document.createElement("div");

      name.className =
        "student-name";

      name.textContent =
        `👤 ${student.displayName || "Student"}`;

      const country =
        createStudentInfo(
          "🌍",
          student.country,
          "Unknown"
        );

      const region =
        createStudentInfo(
          "📍",
          student.region,
          "Unknown"
        );

      const school =
        createStudentInfo(
          "🏫",
          student.school,
          "School not listed"
        );

      const level =
        createStudentInfo(
          "🎓",
          student.level,
          "Level not listed"
        );

      const subject =
        createStudentInfo(
          "📚",
          student.subject,
          "Subject not listed"
        );

      const interest =
        createStudentInfo(
          "⭐",
          student.interest,
          "Interest not listed"
        );

      const messageButton =
        document.createElement("button");

      messageButton.className =
        "action-btn";

      messageButton.textContent =
        "Message";

      messageButton.addEventListener(
        "click",
        () => {

          openChatWith(
            studentDoc.id
          );

          openPage("messages");

        }
      );

      card.append(
        name,
        country,
        region,
        school,
        level,
        subject,
        interest,
        messageButton
      );

      discoverList.appendChild(card);

    });

    if (!foundStudent) {

      discoverList.innerHTML =
        `<div class="card">
          <h3>No students yet</h3>
          <p>
            More students will appear here
            as they become discoverable.
          </p>
        </div>`;

    }

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


function createStudentInfo(
  icon,
  value,
  fallback
) {

  const p =
    document.createElement("p");

  p.className =
    "student-info";

  p.textContent =
    `${icon} ${value || fallback}`;

  return p;

}


/* =========================
   COMMUNITIES
========================= */

async function loadCommunities() {

  if (!communityList) return;

  communityList.innerHTML = "";

  communities.forEach(community => {

    const card =
      document.createElement("div");

    card.className =
      "card community-card";

    const icon =
      document.createElement("div");

    icon.className =
      "community-icon";

    icon.textContent =
      community.name.split(" ")[0];

    const title =
      document.createElement("h3");

    title.textContent =
      community.name
        .replace(/^[^\s]+\s/, "");

    const description =
      document.createElement("p");

    description.textContent =
      community.description;

    const button =
      document.createElement("button");

    button.className =
      "action-btn";

    button.textContent =
      "Open Community";

    button.addEventListener(
      "click",
      () => openCommunity(
        community.id
      )
    );

    card.append(
      icon,
      title,
      description,
      button
    );

    communityList.appendChild(card);

  });

}


async function openCommunity(id) {

  currentCommunity =
    communities.find(
      community =>
        community.id === id
    );

  if (!currentCommunity)
    return;

  communityList?.classList.add(
    "hidden"
  );

  communityView?.classList.remove(
    "hidden"
  );

  if (communityTitle)
    communityTitle.textContent =
      currentCommunity.name;

  if (communityDescription)
    communityDescription.textContent =
      currentCommunity.description;

  await loadCommunityPosts(id);

}


if (backToCommunities) {

  backToCommunities.addEventListener(
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

}


/* =========================
   COMMUNITY POSTS
========================= */

if (postButton) {

  postButton.addEventListener(
    "click",
    async () => {

      if (!currentUser) {

        alert(
          "Please log in first."
        );

        return;
      }

      if (!currentCommunity) {

        alert(
          "Please choose a community."
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

        postInput.value = "";

        await loadCommunityPosts(
          currentCommunity.id
        );

      } catch (error) {

        console.error(
          "Post error:",
          error
        );

        alert(
          "Could not publish your post."
        );

      } finally {

        postButton.disabled = false;

      }

    }
  );

}


async function loadCommunityPosts(id) {

  if (!communityPosts) return;

  communityPosts.innerHTML =
    `<div class="card">
      Loading discussions...
    </div>`;

  try {

    const q =
      query(
        collection(
          db,
          "communities",
          id,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const snapshot =
      await getDocs(q);

    communityPosts.innerHTML = "";

    if (snapshot.empty) {

      communityPosts.innerHTML =
        `<div class="card">
          <p>No discussions yet.</p>
          <p>
            Be the first student to
            start one!
          </p>
        </div>`;

      return;
    }

    snapshot.forEach(postDoc => {

      const post =
        postDoc.data();

      const article =
        document.createElement(
          "article"
        );

      article.className =
        "post";

      const meta =
        document.createElement("div");

      meta.className =
        "post-meta";

      const date =
        post.createdAt?.toDate
          ? post.createdAt
              .toDate()
              .toLocaleString()
          : "Just now";

      meta.textContent =
        `👤 ${post.displayName || "Student"} • ${date}`;

      const content =
        document.createElement("div");

      content.textContent =
        post.text || "";

      article.append(
        meta,
        content
      );

      communityPosts.appendChild(
        article
      );

    });

  } catch (error) {

    console.error(
      "Community posts error:",
      error
    );

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

  if (!chatUsers || !currentUser)
    return;

  chatUsers.innerHTML =
    "Loading students...";

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

    chatUsers.innerHTML = "";

    let found = false;

    snapshot.forEach(studentDoc => {

      if (
        studentDoc.id ===
        currentUser.uid
      ) {
        return;
      }

      found = true;

      const student =
        studentDoc.data();

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "user-item";

      button.textContent =
        `👤 ${student.displayName || "Student"}`;

      button.addEventListener(
        "click",
        () => openChatWith(
          studentDoc.id
        )
      );

      chatUsers.appendChild(
        button
      );

    });

    if (!found) {

      chatUsers.textContent =
        "No discoverable students yet.";

    }

  } catch (error) {

    console.error(
      "Chat users error:",
      error
    );

    chatUsers.textContent =
      "Unable to load students.";

  }

}


/* =========================
   OPEN CHAT
========================= */

async function openChatWith(uid) {

  if (!currentUser)
    return;

  selectedChatUser = uid;

  if (messageInput)
    messageInput.disabled = false;

  chatTitle.textContent =
    "💬 Loading...";

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

      const data =
        student.data();

      chatTitle.textContent =
        `💬 ${data.displayName || "Student"}`;

    }

    await loadChatMessages(uid);

  } catch (error) {

    console.error(
      "Open chat error:",
      error
    );

    chatMessages.innerHTML =
      `<p>Unable to load conversation.</p>`;

  }

}


/* =========================
   LOAD CHAT HISTORY
========================= */

async function loadChatMessages(uid) {

  if (!currentUser)
    return;

  const chatId =
    [currentUser.uid, uid]
      .sort()
      .join("_");

  try {

    const q =
      query(
        collection(
          db,
          "chats",
          chatId,
          "messages"
        ),
        orderBy(
          "createdAt",
          "asc"
        )
      );

    const snapshot =
      await getDocs(q);

    chatMessages.innerHTML = "";

    if (snapshot.empty) {

      chatMessages.innerHTML =
        `<div class="card">
          <p>No messages yet.</p>
          <p>Start the conversation below.</p>
        </div>`;

      return;

    }

    snapshot.forEach(messageDoc => {

      const message =
        messageDoc.data();

      const div =
        document.createElement("div");

      div.className =
        "message";

      if (
        message.senderId ===
        currentUser.uid
      ) {

        div.classList.add("mine");

      }

      div.textContent =
        message.text || "";

      chatMessages.appendChild(div);

    });

    chatMessages.scrollTop =
      chatMessages.scrollHeight;

  } catch (error) {

    console.error(
      "Chat history error:",
      error
    );

    chatMessages.innerHTML =
      `<p>
        Unable to load messages.
      </p>`;

  }

}


/* =========================
   SEND MESSAGE
========================= */

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      if (
        !currentUser ||
        !selectedChatUser
      ) {

        return;
      }

      const text =
        messageInput.value.trim();

      if (!text)
        return;

      const chatId =
        [
          currentUser.uid,
          selectedChatUser
        ]
          .sort()
          .join("_");

      try {

        messageInput.disabled = true;

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

            text,

            createdAt:
              serverTimestamp()
          }
        );

        messageInput.value = "";

        await loadChatMessages(
          selectedChatUser
        );

      } catch (error) {

        console.error(
          "Send message error:",
          error
        );

        alert(
          "Could not send message."
        );

      } finally {

        messageInput.disabled = false;

        messageInput.focus();

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

      aiArea?.classList.toggle(
        "hidden"
      );

      if (!aiArea?.classList.contains(
        "hidden"
      )) {

        aiInput?.focus();

      }

    }
  );

}


if (aiAskButton) {

  aiAskButton.addEventListener(
    "click",
    () => {

      const question =
        aiInput?.value.trim();

      if (!question) {

        aiResponse.textContent =
          "Please enter a question.";

        aiResponse.classList.remove(
          "hidden"
        );

        return;
      }

      /*
        AI API connection should be
        added through a secure backend.
        Never put a secret API key
        directly inside this JavaScript.
      */

      aiResponse.textContent =
        "Your AI Study Assistant is ready for connection. The secure AI backend will be added next.";

      aiResponse.classList.remove(
        "hidden"
      );

    }
  );

}


/* =========================
   EDIT PROFILE
========================= */

if (editProfileBtn) {

  editProfileBtn.addEventListener(
    "click",
    () => {

      alert(
        "Profile editing will be added next."
      );

    }
  );

}


/* =========================
   PAGE HELPER
========================= */

function openPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove(
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

}


/* =========================
   FIREBASE ERROR HANDLER
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
      return (
        error?.message ||
        "Something went wrong. Please try again."
      );

  }

}
