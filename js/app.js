import { auth, db, storage, app } from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

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
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-ai.js";


/* =========================================================
   FIREBASE AI
========================================================= */

let aiModel = null;

try {

  const ai = getAI(app, {
    backend: new GoogleAIBackend()
  });

  aiModel = getGenerativeModel(ai, {
    model: "gemini-3.7-flash"
  });

  console.log("Firebase AI initialized");

} catch (error) {

  console.error(
    "Firebase AI initialization error:",
    error
  );
}


/* =========================================================
   ELEMENTS
========================================================= */

const authScreen =
  document.getElementById("authScreen");

const appElement =
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
  document.getElementById("communityDescription");

const backToCommunities =
  document.getElementById("backToCommunities");

const postInput =
  document.getElementById("postInput");

const postButton =
  document.getElementById("postButton");

const communityPosts =
  document.getElementById("communityPosts");

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

const attachmentBtn =
  document.getElementById("attachmentBtn");

const attachmentInput =
  document.getElementById("attachmentInput");

const voiceRecordBtn =
  document.getElementById("voiceRecordBtn");

const aiBtn =
  document.getElementById("aiBtn");

const profileName =
  document.getElementById("profileName");

const profileEmail =
  document.getElementById("profileEmail");

const profileLevel =
  document.getElementById("profileLevel");

const profileSubject =
  document.getElementById("profileSubject");

const profileInterest =
  document.getElementById("profileInterest");


/* =========================================================
   STATE
========================================================= */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;

let unsubscribeMessages = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;


/* =========================================================
   AUTH SWITCH
========================================================= */

switchAuth?.addEventListener(
  "click",
  () => {

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
  }
);


/* =========================================================
   SIGN UP
========================================================= */

signupForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const name =
      document
        .getElementById("signupName")
        ?.value
        .trim();

    const email =
      document
        .getElementById("signupEmail")
        ?.value
        .trim();

    const password =
      document
        .getElementById("signupPassword")
        ?.value;

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

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          displayName: name,
          email,
          profileComplete: false,
          discoverable: false,
          createdAt: serverTimestamp()
        },
        {
          merge: true
        }
      );

      authMessage.textContent =
        "Account created successfully.";

      window.location.href =
        "profile.html";

    } catch (error) {

      console.error(
        "Signup error:",
        error
      );

      authMessage.textContent =
        getFirebaseError(error);
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

    const email =
      document
        .getElementById("loginEmail")
        ?.value
        .trim();

    const password =
      document
        .getElementById("loginPassword")
        ?.value;

    if (!email || !password) {

      authMessage.textContent =
        "Please enter your email and password.";

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

      authMessage.textContent =
        "Login successful!";

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      authMessage.textContent =
        getFirebaseError(error);
    }
  }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (!user) {

      authScreen?.classList.remove(
        "hidden"
      );

      appElement?.classList.add(
        "hidden"
      );

      stopRealtimeMessages();

      return;
    }

    authScreen?.classList.add(
      "hidden"
    );

    appElement?.classList.remove(
      "hidden"
    );

    try {

      await loadProfile();
      await loadDiscoverStudents();
      await loadCommunities();
      await loadChatUsers();

    } catch (error) {

      console.error(
        "Application loading error:",
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

    stopRealtimeMessages();

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

        showPage(
          button.dataset.page
        );

      }
    );

  });


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


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

  if (!currentUser) return;

  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );

    if (!snapshot.exists()) {
      return;
    }

    const data =
      snapshot.data();

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
      "Profile error:",
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

  discoverList.innerHTML =
    `<div class="loading-card">
      Loading students...
    </div>`;

  try {

    /*
     * First load the discoverableProfiles collection.
     */

    const discoverQuery =
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

    const discoverSnapshot =
      await getDocs(
        discoverQuery
      );

    const students = [];

    discoverSnapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id ===
          currentUser.uid
        ) {
          return;
        }

        students.push({
          id: studentDoc.id,
          data: studentDoc.data()
        });
      }
    );


    /*
     * FALLBACK
     *
     * If discoverableProfiles has no students,
     * check the users collection too.
     *
     * This makes Discover continue working if
     * an older profile was saved only in users.
     */

    if (students.length === 0) {

      const usersQuery =
        query(
          collection(
            db,
            "users"
          ),
          where(
            "discoverable",
            "==",
            true
          )
        );

      const usersSnapshot =
        await getDocs(
          usersQuery
        );

      usersSnapshot.forEach(
        studentDoc => {

          if (
            studentDoc.id ===
            currentUser.uid
          ) {
            return;
          }

          students.push({
            id: studentDoc.id,
            data: studentDoc.data()
          });
        }
      );
    }


    discoverList.innerHTML = "";

    if (students.length === 0) {

      discoverList.innerHTML = `
        <div class="empty-state large">
          <span>🌍</span>
          <h3>No other discoverable students yet</h3>
          <p>
            Students who choose to be discoverable
            will appear here.
          </p>
        </div>
      `;

      return;
    }


    students.forEach(
      studentItem => {

        const student =
          studentItem.data;

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
              data-chat="${studentItem.id}"
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


    document
      .querySelectorAll(
        "#discoverList [data-chat]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            await openChatWith(
              button.dataset.chat
            );

            showPage(
              "messages"
            );
          }
        );

      });

  } catch (error) {

    console.error(
      "Discover error:",
      error
    );

    discoverList.innerHTML =
      `<div class="error-card">
        Unable to load students.
      </div>`;
  }
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

  if (!communityList) return;

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

  if (!currentCommunity) return;

  communityList?.classList.add(
    "hidden"
  );

  communityView?.classList.remove(
    "hidden"
  );

  communityTitle.textContent =
    currentCommunity.name;

  communityDescription.textContent =
    currentCommunity.description;

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

    if (!currentUser) return;

    const text =
      postInput?.value.trim();

    if (!text) return;

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

      const data =
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
          uid: currentUser.uid,
          displayName:
            data.displayName ||
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


async function loadCommunityPosts(id) {

  if (!communityPosts) return;

  communityPosts.innerHTML =
    `<div class="loading-card">
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
        `<div class="empty-state">
          <span>💬</span>
          <h3>No discussions yet</h3>
          <p>Be the first student to start one!</p>
        </div>`;

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
      "Community error:",
      error
    );

    communityPosts.innerHTML =
      `<div class="error-card">
        Unable to load discussions.
      </div>`;
  }
}


/* =========================================================
   CHAT USERS
========================================================= */

async function loadChatUsers() {

  if (
    !chatUsers ||
    !currentUser
  ) return;

  chatUsers.innerHTML =
    "Loading students...";

  try {

    const students = [];


    /*
     * FIRST:
     * Load discoverable profiles.
     */

    const discoverQuery =
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

    const discoverSnapshot =
      await getDocs(
        discoverQuery
      );

    discoverSnapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id !==
          currentUser.uid
        ) {

          students.push({
            id: studentDoc.id,
            data: studentDoc.data()
          });

        }
      }
    );


    /*
     * FALLBACK:
     * Check users collection if needed.
     */

    if (students.length === 0) {

      const usersQuery =
        query(
          collection(
            db,
            "users"
          ),
          where(
            "discoverable",
            "==",
            true
          )
        );

      const usersSnapshot =
        await getDocs(
          usersQuery
        );

      usersSnapshot.forEach(
        studentDoc => {

          if (
            studentDoc.id !==
            currentUser.uid
          ) {

            students.push({
              id: studentDoc.id,
              data: studentDoc.data()
            });

          }
        }
      );
    }


    chatUsers.innerHTML = "";


    if (students.length === 0) {

      chatUsers.innerHTML =
        `<p class="muted">
          No other discoverable students yet.
        </p>`;

      return;
    }


    students.forEach(
      studentItem => {

        const student =
          studentItem.data;

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
              studentItem.id
            );

          }
        );

        chatUsers.appendChild(
          button
        );
      }
    );

  } catch (error) {

    console.error(
      "Chat users error:",
      error
    );

    chatUsers.innerHTML =
      `<p class="muted">
        Unable to load students.
      </p>`;
  }
}


/* =========================================================
   CREATE / VERIFY CHAT
========================================================= */

async function ensureChat(chatId, otherUserId) {

  if (!currentUser) return;

  const chatRef =
    doc(
      db,
      "chats",
      chatId
    );

  const chatSnap =
    await getDoc(chatRef);

  if (!chatSnap.exists()) {

    await setDoc(
      chatRef,
      {
        participants: [
          currentUser.uid,
          otherUserId
        ],

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

  }
}


/* =========================================================
   OPEN CHAT
========================================================= */

async function openChatWith(uid) {

  if (!currentUser || !uid) return;

  selectedChatUser = uid;

  if (messageInput) {
    messageInput.disabled = false;
  }

  const chatId =
    [
      currentUser.uid,
      uid
    ]
      .sort()
      .join("_");

  try {

    /*
     * Create the parent chat document.
     * This is required by the current Firestore
     * message rules.
     */

    await ensureChat(
      chatId,
      uid
    );

  } catch (error) {

    console.error(
      "Chat creation error:",
      error
    );

    alert(
      "Could not open this chat."
    );

    return;
  }


  try {

    let student =
      await getDoc(
        doc(
          db,
          "discoverableProfiles",
          uid
        )
      );


    /*
     * If the student exists only in users,
     * use that profile instead.
     */

    if (!student.exists()) {

      student =
        await getDoc(
          doc(
            db,
            "users",
            uid
          )
        );
    }


    if (student.exists()) {

      const data =
        student.data();

      if (chatTitle) {

        chatTitle.innerHTML =
          `💬 ${escapeHTML(
            data.displayName ||
            "Student"
          )}`;

      }
    }

  } catch (error) {

    console.error(
      "Chat profile error:",
      error
    );
  }

  startRealtimeMessages();
}


/* =========================================================
   REAL-TIME CHAT
========================================================= */

function startRealtimeMessages() {

  stopRealtimeMessages();

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

  unsubscribeMessages =
    onSnapshot(
      q,
      snapshot => {

        chatMessages.innerHTML = "";

        if (snapshot.empty) {

          chatMessages.innerHTML =
            `<div class="empty-state">
              <span>💬</span>
              <p>No messages yet. Say hello!</p>
            </div>`;

          return;
        }

        snapshot.forEach(
          messageDoc => {

            renderMessage(
              messageDoc.data()
            );

          }
        );

        chatMessages.scrollTop =
          chatMessages.scrollHeight;

      },
      error => {

        console.error(
          "Realtime chat error:",
          error
        );

        chatMessages.innerHTML =
          `<div class="error-card">
            Unable to load messages.
          </div>`;
      }
    );
}


function stopRealtimeMessages() {

  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;
  }
}


/* =========================================================
   RENDER MESSAGE
========================================================= */

function renderMessage(message) {

  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    message.senderId ===
    currentUser.uid
      ? "message mine"
      : "message";

  if (
    message.type === "file"
  ) {

    const link =
      document.createElement(
        "a"
      );

    link.href =
      message.fileUrl;

    link.target =
      "_blank";

    link.rel =
      "noopener noreferrer";

    link.textContent =
      `📎 ${
        message.fileName ||
        "Open attachment"
      }`;

    bubble.appendChild(
      link
    );

  } else if (
    message.type === "audio"
  ) {

    const audio =
      document.createElement(
        "audio"
      );

    audio.controls = true;

    audio.preload = "metadata";

    audio.src =
      message.fileUrl;

    bubble.appendChild(
      audio
    );

  } else {

    bubble.textContent =
      message.text || "";
  }

  chatMessages.appendChild(
    bubble
  );
}


/* =========================================================
   SEND TEXT
========================================================= */

chatForm?.addEventListener(
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

    if (!text) return;

    const chatId =
      [
        currentUser.uid,
        selectedChatUser
      ]
        .sort()
        .join("_");

    messageInput.disabled = true;

    try {

      /*
       * Make sure the chat parent exists
       * before creating the message.
       */

      await ensureChat(
        chatId,
        selectedChatUser
      );


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

          text,

          createdAt:
            serverTimestamp()
        }
      );


      /*
       * Update the chat timestamp.
       */

      await setDoc(
        doc(
          db,
          "chats",
          chatId
        ),
        {
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );


      messageInput.value = "";

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


/* =========================================================
   FILE ATTACHMENT
========================================================= */

attachmentBtn?.addEventListener(
  "click",
  () => {

    attachmentInput?.click();

  }
);


attachmentInput?.addEventListener(
  "change",
  async () => {

    const file =
      attachmentInput.files?.[0];

    if (!file) return;

    if (
      !currentUser ||
      !selectedChatUser
    ) {

      alert(
        "Select a student first."
      );

      attachmentInput.value = "";

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {

      alert(
        "File is too large. Maximum size is 10 MB."
      );

      attachmentInput.value = "";

      return;
    }

    try {

      attachmentBtn.disabled = true;

      attachmentBtn.textContent =
        "⏳";

      const chatId =
        [
          currentUser.uid,
          selectedChatUser
        ]
          .sort()
          .join("_");


      await ensureChat(
        chatId,
        selectedChatUser
      );


      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const path =
        `chatFiles/${chatId}/${Date.now()}_${safeName}`;

      const storageRef =
        ref(
          storage,
          path
        );

      await uploadBytes(
        storageRef,
        file,
        {
          contentType:
            file.type
        }
      );

      const fileUrl =
        await getDownloadURL(
          storageRef
        );

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
            "file",

          fileName:
            file.name,

          fileUrl,

          fileType:
            file.type ||
            "application/octet-stream",

          createdAt:
            serverTimestamp()
        }
      );


      await setDoc(
        doc(
          db,
          "chats",
          chatId
        ),
        {
          updatedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );

    } catch (error) {

      console.error(
        "File upload error:",
        error
      );

      alert(
        "Could not upload the file."
      );

    } finally {

      attachmentBtn.disabled = false;

      attachmentBtn.textContent =
        "📎";

      attachmentInput.value = "";
    }
  }
);


/* =========================================================
   VOICE MESSAGE
========================================================= */

voiceRecordBtn?.addEventListener(
  "click",
  async () => {

    if (isRecording) {

      stopVoiceRecording();

      return;
    }

    try {

      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true
          });

      audioChunks = [];

      mediaRecorder =
        new MediaRecorder(
          stream
        );

      mediaRecorder.addEventListener(
        "dataavailable",
        event => {

          if (
            event.data.size > 0
          ) {

            audioChunks.push(
              event.data
            );
          }
        }
      );

      mediaRecorder.addEventListener(
        "stop",
        async () => {

          stream
            .getTracks()
            .forEach(
              track =>
                track.stop()
            );

          const blob =
            new Blob(
              audioChunks,
              {
                type:
                  mediaRecorder.mimeType ||
                  "audio/webm"
              }
            );

          await uploadVoiceMessage(
            blob
          );
        }
      );

      mediaRecorder.start();

      isRecording = true;

      voiceRecordBtn.textContent =
        "⏹️";

      voiceRecordBtn.title =
        "Stop recording";

    } catch (error) {

      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Microphone permission was not granted."
      );
    }
  }
);


function stopVoiceRecording() {

  if (
    mediaRecorder &&
    mediaRecorder.state !==
      "inactive"
  ) {

    mediaRecorder.stop();
  }

  isRecording = false;

  voiceRecordBtn.textContent =
    "🎙️";

  voiceRecordBtn.title =
    "Voice message";
}


async function uploadVoiceMessage(blob) {

  if (
    !currentUser ||
    !selectedChatUser
  ) {
    return;
  }

  try {

    voiceRecordBtn.disabled = true;

    voiceRecordBtn.textContent =
      "⏳";

    const chatId =
      [
        currentUser.uid,
        selectedChatUser
      ]
        .sort()
        .join("_");


    await ensureChat(
      chatId,
      selectedChatUser
    );


    const path =
      `chatAudio/${chatId}/${Date.now()}.webm`;

    const storageRef =
      ref(
        storage,
        path
      );

    await uploadBytes(
      storageRef,
      blob,
      {
        contentType:
          "audio/webm"
      }
    );

    const fileUrl =
      await getDownloadURL(
        storageRef
      );

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
          "audio",

        fileUrl,

        createdAt:
          serverTimestamp()
      }
    );


    await setDoc(
      doc(
        db,
        "chats",
        chatId
      ),
      {
        updatedAt:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

  } catch (error) {

    console.error(
      "Voice upload error:",
      error
    );

    alert(
      "Could not send voice message."
    );

  } finally {

    voiceRecordBtn.disabled = false;

    voiceRecordBtn.textContent =
      "🎙️";
  }
}


/* =========================================================
   AI STUDY ASSISTANT
========================================================= */

aiBtn?.addEventListener(
  "click",
  openAIStudyAssistant
);


async function openAIStudyAssistant() {

  if (!currentUser) {

    alert(
      "Please log in first."
    );

    return;
  }

  if (!aiModel) {

    alert(
      "AI Study Assistant is not configured yet."
    );

    return;
  }

  const question =
    prompt(
      "What would you like help understanding?"
    );

  if (!question?.trim()) {
    return;
  }

  aiBtn.disabled = true;

  const original =
    aiBtn.innerHTML;

  aiBtn.innerHTML =
    "🤖 Thinking...";

  try {

    const promptText = `
You are the StudentConnect AI Study Assistant.

The user is a student.

Help them understand the following educational question.

Give a clear explanation suitable for a student.
Break difficult ideas into simple steps.
Do not simply give an answer when explaining a school concept.
Encourage learning and understanding.

Question:
${question}
`;

    const result =
      await aiModel.generateContent(
        promptText
      );

    const answer =
      result.response.text();

    showAIAnswer(
      question,
      answer
    );

  } catch (error) {

    console.error(
      "AI error:",
      error
    );

    alert(
      "The AI assistant could not respond right now. Check your Firebase AI setup."
    );

  } finally {

    aiBtn.disabled = false;

    aiBtn.innerHTML =
      original;
  }
}


function showAIAnswer(
  question,
  answer
) {

  const existing =
    document.getElementById(
      "aiAnswerBox"
    );

  existing?.remove();

  const box =
    document.createElement(
      "div"
    );

  box.id =
    "aiAnswerBox";

  box.className =
    "ai-answer-box";

  box.innerHTML = `

    <div class="ai-answer-header">
      🤖 StudentConnect AI
    </div>

    <p>
      <strong>
        Question:
      </strong>
      ${escapeHTML(question)}
    </p>

    <div class="ai-answer-text">
      ${escapeHTML(answer)
        .replaceAll(
          "\n",
          "<br>"
        )}
    </div>

    <button
      type="button"
      class="primary-btn small-btn"
      id="closeAIAnswer"
    >
      Close
    </button>
  `;

  const studyPage =
    document.getElementById(
      "page-study"
    );

  studyPage?.appendChild(
    box
  );

  document
    .getElementById(
      "closeAIAnswer"
    )
    ?.addEventListener(
      "click",
      () => box.remove()
    );
}


/* =========================================================
   SECURITY HELPERS
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
   FIREBASE ERROR HANDLER
========================================================= */

function getFirebaseError(error) {

  switch (
    error?.code
  ) {

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
      return "Network connection problem.";

    default:
      return (
        error?.message ||
        "Something went wrong. Please try again."
      );
  }
}
