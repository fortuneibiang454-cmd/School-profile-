/* =========================================================
   STUDENTCONNECT - app.js
   Clean Firebase Authentication + App
========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
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
} from
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBeBJ2fzqhq_yUMUxyq-OHMgI5eBG9t9po",
  authDomain: "school-connect-11578.firebaseapp.com",
  databaseURL:
    "https://school-connect-11578-default-rtdb.firebaseio.com",
  projectId: "school-connect-11578",
  storageBucket:
    "school-connect-11578.firebasestorage.app",
  messagingSenderId: "85015597520",
  appId:
    "1:85015597520:web:6d1c895eade85026c4e9d5",
  measurementId: "G-XQTW122JZ3"
};

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);

const db =
  getFirestore(firebaseApp);

console.log("StudentConnect app.js loaded");
console.log("Firebase initialized successfully");


/* =========================================================
   ELEMENTS
========================================================= */

const authScreen =
  document.getElementById("authScreen");

const app =
  document.getElementById("app");

const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");

const switchAuth =
  document.getElementById("switchAuth");

const authMessage =
  document.getElementById("authMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const settingsLogout =
  document.getElementById("settingsLogout");

const discoverList =
  document.getElementById("discoverList");

const communityList =
  document.getElementById("communityList");

const communityView =
  document.getElementById("communityView");

const communityTitle =
  document.getElementById("communityTitle");

const communityDescription =
  document.getElementById(
    "communityDescription"
  );

const backToCommunities =
  document.getElementById(
    "backToCommunities"
  );

const postInput =
  document.getElementById("postInput");

const postButton =
  document.getElementById("postButton");

const communityPosts =
  document.getElementById(
    "communityPosts"
  );

const chatUsers =
  document.getElementById("chatUsers");

const chatTitle =
  document.getElementById("chatTitle");

const chatMessages =
  document.getElementById("chatMessages");

const chatForm =
  document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");

const profileName =
  document.getElementById("profileName");

const profileEmail =
  document.getElementById("profileEmail");

const profileLevel =
  document.getElementById("profileLevel");

const profileSubject =
  document.getElementById(
    "profileSubject"
  );

const profileInterest =
  document.getElementById(
    "profileInterest"
  );

const aiBtn =
  document.getElementById("aiBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;
let signupMode = false;


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLogin() {

  signupMode = false;

  loginForm?.classList.remove("hidden");
  signupForm?.classList.add("hidden");

  if (switchAuth) {
    switchAuth.textContent =
      "Create an account";
  }

  if (authMessage) {
    authMessage.textContent = "";
  }
}


function showSignup() {

  signupMode = true;

  loginForm?.classList.add("hidden");
  signupForm?.classList.remove("hidden");

  if (switchAuth) {
    switchAuth.textContent =
      "Already have an account? Login";
  }

  if (authMessage) {
    authMessage.textContent = "";
  }
}


switchAuth?.addEventListener(
  "click",
  () => {

    if (signupMode) {
      showLogin();
    } else {
      showSignup();
    }

  }
);


/* =========================================================
   SIGN UP
========================================================= */

signupForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const nameInput =
      document.getElementById(
        "signupName"
      );

    const emailInput =
      document.getElementById(
        "signupEmail"
      );

    const passwordInput =
      document.getElementById(
        "signupPassword"
      );

    if (
      !nameInput ||
      !emailInput ||
      !passwordInput
    ) {

      setAuthMessage(
        "Signup form is not connected correctly."
      );

      return;
    }


    const name =
      nameInput.value.trim();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!name) {

      setAuthMessage(
        "Please enter your name."
      );

      return;
    }


    if (!email) {

      setAuthMessage(
        "Please enter your email."
      );

      return;
    }


    if (password.length < 6) {

      setAuthMessage(
        "Password must be at least 6 characters."
      );

      return;
    }


    setAuthMessage(
      "Creating your account..."
    );


    try {

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        result.user;


      console.log(
        "ACCOUNT CREATED:",
        user.uid
      );


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
          discoverable: false,
          createdAt: serverTimestamp()
        },
        {
          merge: true
        }
      );


      setAuthMessage(
        "Account created! Opening your profile..."
      );


      /*
       * Firebase has already logged the user in.
       * Give the profile page a moment to open.
       */

      setTimeout(
        () => {
          window.location.href =
            "profile.html";
        },
        500
      );


    } catch (error) {

      console.error(
        "SIGNUP ERROR:",
        error
      );

      setAuthMessage(
        getFirebaseError(error)
      );

    }

  }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const emailInput =
      document.getElementById(
        "loginEmail"
      );

    const passwordInput =
      document.getElementById(
        "loginPassword"
      );


    if (
      !emailInput ||
      !passwordInput
    ) {

      setAuthMessage(
        "Login form is not connected correctly."
      );

      return;
    }


    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email) {

      setAuthMessage(
        "Please enter your email."
      );

      return;
    }


    if (!password) {

      setAuthMessage(
        "Please enter your password."
      );

      return;
    }


    setAuthMessage(
      "Logging in..."
    );


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


      setAuthMessage(
        "Login successful! Loading StudentConnect..."
      );


      /*
       * DO NOT redirect here.
       * Firebase auth state will handle it.
       */

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      setAuthMessage(
        getFirebaseError(error)
      );

    }

  }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "AUTH STATE:",
      user
        ? user.email
        : "NOT LOGGED IN"
    );


    currentUser = user;


    if (!user) {

      authScreen?.classList.remove(
        "hidden"
      );

      app?.classList.add(
        "hidden"
      );

      return;
    }


    /*
     * USER IS LOGGED IN
     */

    authScreen?.classList.add(
      "hidden"
    );

    app?.classList.remove(
      "hidden"
    );


    try {

      await loadProfile();

      await loadDiscoverStudents();

      await loadCommunities();

      await loadChatUsers();

      console.log(
        "StudentConnect loaded successfully."
      );

    } catch (error) {

      console.error(
        "APP LOAD ERROR:",
        error
      );

    }

  }
);


/* =========================================================
   AUTH MESSAGE
========================================================= */

function setAuthMessage(message) {

  if (authMessage) {
    authMessage.textContent =
      message;
  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await signOut(auth);

    console.log(
      "User logged out"
    );

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
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
        "No user profile found."
      );

      if (profileEmail) {
        profileEmail.textContent =
          currentUser.email || "";
      }

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
      "PROFILE ERROR:",
      error
    );

  }

}


/* =========================================================
   DISCOVER
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
              type="button"
              data-chat="${studentDoc.id}"
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
            No other students yet
          </h3>

          <p>
            Discoverable students will appear here.
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
      "DISCOVER ERROR:",
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
   PAGE NAVIGATION
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


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


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
      "Share study strategies and prepare for exams."
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
      "Talk about sports and connect with students."
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


      const parts =
        community.name.split(" ");


      const icon =
        parts.shift();


      const name =
        parts.join(" ");


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
            type="button"
            data-community="${community.id}"
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

    if (
      !currentUser ||
      !currentCommunity
    ) {
      return;
    }


    const text =
      postInput?.value.trim();


    if (!text) {
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
          text: text,
          uid: currentUser.uid,
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


      await loadCommunityPosts(
        currentCommunity.id
      );


    } catch (error) {

      console.error(
        "POST ERROR:",
        error
      );

      alert(
        "Could not publish your post."
      );

    }


    postButton.disabled = false;

  }
);


async function loadCommunityPosts(id) {

  if (!communityPosts) {
    return;
  }


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

      communityPosts.innerHTML = `
        <div class="empty-state">
          <span>💬</span>
          <h3>No discussions yet</h3>
          <p>Be the first student to start one!</p>
        </div>
      `;

      return;
    }


    snapshot.forEach(
      postDoc => {

        const post =
          postDoc.data();


        const article =
          document.createElement(
            "article"
          );


        article.className =
          "post";


        const date =
          post.createdAt?.toDate
            ? post.createdAt
                .toDate()
                .toLocaleString()
            : "Just now";


        article.innerHTML = `

          <div class="post-meta">

            👤 ${escapeHTML(
              post.displayName ||
              "Student"
            )}

            • ${escapeHTML(date)}

          </div>

          <div class="post-text">
            ${escapeHTML(
              post.text || ""
            )}
          </div>

        `;


        communityPosts.appendChild(
          article
        );

      }
    );


  } catch (error) {

    console.error(
      "COMMUNITY ERROR:",
      error
    );


    communityPosts.innerHTML = `
      <div class="error-card">
        Unable to load discussions.
      </div>
    `;

  }

}


/* =========================================================
   CHAT USERS
========================================================= */

async function loadChatUsers() {

  if (
    !chatUsers ||
    !currentUser
  ) {
    return;
  }


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


        const button =
          document.createElement(
            "button"
          );


        button.className =
          "user-item";


        button.type =
          "button";


        button.textContent =
          `👤 ${
            student.displayName ||
            "Student"
          }`;


        button.addEventListener(
          "click",
          async () => {

            await openChatWith(
              studentDoc.id
            );

          }
        );


        chatUsers.appendChild(
          button
        );

      }
    );


    if (count === 0) {

      chatUsers.innerHTML = `
        <p class="muted">
          No other discoverable students yet.
        </p>
      `;

    }


  } catch (error) {

    console.error(
      "CHAT USERS ERROR:",
      error
    );


    chatUsers.innerHTML = `
      <p class="muted">
        Unable to load students.
      </p>
    `;

  }

}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChatWith(uid) {

  if (!currentUser) {
    return;
  }


  selectedChatUser = uid;


  if (messageInput) {
    messageInput.disabled = false;
  }


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


      if (chatTitle) {

        chatTitle.textContent =
          `💬 ${
            data.displayName ||
            "Student"
          }`;

      }

    }


  } catch (error) {

    console.error(
      "OPEN CHAT ERROR:",
      error
    );

  }


  await loadMessages();

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

  if (
    !currentUser ||
    !selectedChatUser ||
    !chatMessages
  ) {
    return;
  }


  const chatId =
    [
      currentUser.uid,
      selectedChatUser
    ]
      .sort()
      .join("_");


  chatMessages.innerHTML = `
    <p class="muted">
      Loading messages...
    </p>
  `;


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

      chatMessages.innerHTML = `
        <div class="empty-state">
          <span>💬</span>
          <p>No messages yet. Say hello!</p>
        </div>
      `;

      return;
    }


    snapshot.forEach(
      messageDoc => {

        const message =
          messageDoc.data();


        const bubble =
          document.createElement(
            "div"
          );


        bubble.className =
          message.senderId ===
          currentUser.uid
            ? "message mine"
            : "message";


        bubble.textContent =
          message.text || "";


        chatMessages.appendChild(
          bubble
        );

      }
    );


    chatMessages.scrollTop =
      chatMessages.scrollHeight;


  } catch (error) {

    console.error(
      "LOAD MESSAGES ERROR:",
      error
    );


    chatMessages.innerHTML = `
      <div class="error-card">
        Unable to load messages.
      </div>
    `;

  }

}


/* =========================================================
   SEND MESSAGE
========================================================= */

chatForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !currentUser ||
      !selectedChatUser ||
      !messageInput
    ) {
      return;
    }


    const text =
      messageInput.value.trim();


    if (!text) {
      return;
    }


    const chatId =
      [
        currentUser.uid,
        selectedChatUser
      ]
        .sort()
        .join("_");


    try {

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

          type:
            "text",

          text:
            text,

          createdAt:
            serverTimestamp()
        }
      );


      messageInput.value = "";


      await loadMessages();


    } catch (error) {

      console.error(
        "SEND MESSAGE ERROR:",
        error
      );


      alert(
        "Could not send message."
      );

    }

  }
);


/* =========================================================
   AI
========================================================= */

aiBtn?.addEventListener(
  "click",
  () => {

    alert(
      "The AI Study Assistant will be connected next."
    );

  }
);


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   FIREBASE ERROR MESSAGES
========================================================= */

function getFirebaseError(error) {

  console.error(
    "Firebase error:",
    error?.code,
    error?.message
  );


  switch (error?.code) {

    case "auth/email-already-in-use":
      return "This email already has an account. Try Login.";

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
      return "Network error. Check your internet connection.";

    case "auth/operation-not-allowed":
      return "Email/password login is not enabled in Firebase.";

    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured correctly.";

    default:
      return (
        error?.message ||
        "Something went wrong. Please try again."
      );

  }

}


/* =========================================================
   FINAL CHECK
========================================================= */

console.log(
  "StudentConnect JavaScript is ready."
);
