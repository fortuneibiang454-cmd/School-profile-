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

const aiBtn =
  document.getElementById("aiBtn");


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

signupForm?.addEventListener("submit", async event => {

  event.preventDefault();

  if (authMessage) {
    authMessage.textContent =
      "Creating your account...";
  }

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

    if (authMessage) {
      authMessage.textContent =
        "Please fill in all fields.";
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

    const user =
      result.user;

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

    window.location.href =
      "profile.html";

  } catch (error) {

    console.error(
      "Signup error:",
      error
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

loginForm?.addEventListener("submit", async event => {

  event.preventDefault();

  if (authMessage) {
    authMessage.textContent =
      "Logging in...";
  }

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

    if (authMessage) {
      authMessage.textContent =
        "Please enter your email and password.";
    }

    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.location.href =
      "dashboard.html";

  } catch (error) {

    console.error(
      "Login error:",
      error
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
  async user => {

    currentUser = user;

    if (!user) {

      authScreen?.classList.remove("hidden");
      app?.classList.add("hidden");

      return;
    }

    authScreen?.classList.add("hidden");
    app?.classList.remove("hidden");

    await loadProfile();
    await loadDiscoverStudents();
    await loadCommunities();
    await loadChatUsers();

    createChatToolbar();
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
              data-chat="${escapeHTML(studentDoc.id)}"
              type="button"
            >
              Message
            </button>

          </div>
        `;

        discoverList.appendChild(card);
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

    discoverList
      .querySelectorAll("[data-chat]")
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
   SHOW PAGE
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
    .getElementById(
      `page-${page}`
    )
    ?.classList.add("active");

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove(
        "active"
      );
    });

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
            data-community="${escapeHTML(community.id)}"
            type="button"
          >
            Open Community
          </button>

        </div>
      `;

      communityList.appendChild(card);
    }
  );

  communityList
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

    if (!postInput) {
      return;
    }

    const text =
      postInput.value.trim();

    if (!text) {

      alert(
        "Write something first."
      );

      return;
    }

    if (!currentCommunity) {

      alert(
        "Please open a community first."
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

  if (!communityPosts) {
    return;
  }

  communityPosts.innerHTML = `
    <div class="loading-card">
      Loading discussions...
    </div>
  `;

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

          <h3>
            No discussions yet
          </h3>

          <p>
            Be the first student
            to start one!
          </p>

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
      "Community posts error:",
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
          No other discoverable
          students yet.
        </p>
      `;
    }

  } catch (error) {

    console.error(
      "Chat users error:",
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

  if (!currentUser || !uid) {
    return;
  }

  selectedChatUser = uid;

  if (messageInput) {
    messageInput.disabled = false;
  }

  if (chatTitle) {
    chatTitle.textContent =
      "💬 Chat";
  }

  if (chatMessages) {
    chatMessages.innerHTML =
      "<p>Loading conversation...</p>";
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

        chatTitle.innerHTML = `

          <span class="chat-user-name">
            💬 ${escapeHTML(
              data.displayName ||
              "Student"
            )}
          </span>

          <div class="chat-actions">

            <button
              type="button"
              class="chat-action-btn"
              id="voiceCallBtn"
              title="Voice call"
            >
              📞
            </button>

            <button
              type="button"
              class="chat-action-btn"
              id="videoCallBtn"
              title="Video call"
            >
              🎥
            </button>

            <button
              type="button"
              class="chat-action-btn"
              id="chatMoreBtn"
              title="More"
            >
              ⋮
            </button>

          </div>
        `;

        setupChatActions();
      }
    }

  } catch (error) {

    console.error(
      "Chat user error:",
      error
    );
  }

  await loadMessages();
}


/* =========================================================
   CHAT ACTION BUTTONS
========================================================= */

function setupChatActions() {

  const voiceCallBtn =
    document.getElementById(
      "voiceCallBtn"
    );

  const videoCallBtn =
    document.getElementById(
      "videoCallBtn"
    );

  const chatMoreBtn =
    document.getElementById(
      "chatMoreBtn"
    );


  voiceCallBtn?.addEventListener(
    "click",
    () => {

      if (!selectedChatUser) {
        return;
      }

      alert(
        "Voice calling will be connected with secure calling technology in the next stage."
      );
    }
  );


  videoCallBtn?.addEventListener(
    "click",
    () => {

      if (!selectedChatUser) {
        return;
      }

      alert(
        "Video calling will be connected with secure calling technology in the next stage."
      );
    }
  );


  chatMoreBtn?.addEventListener(
    "click",
    showChatMenu
  );
}


/* =========================================================
   CHAT MENU
========================================================= */

function showChatMenu() {

  const existing =
    document.getElementById(
      "chatMenu"
    );

  if (existing) {

    existing.remove();

    return;
  }

  const menu =
    document.createElement(
      "div"
    );

  menu.id =
    "chatMenu";

  menu.className =
    "chat-menu";

  menu.innerHTML = `

    <button
      type="button"
      id="reportChatBtn"
    >
      🚩 Report
    </button>

    <button
      type="button"
      id="blockChatBtn"
    >
      🚫 Block
    </button>

    <button
      type="button"
      id="closeChatMenu"
    >
      Cancel
    </button>
  `;

  document.body.appendChild(
    menu
  );


  document
    .getElementById(
      "closeChatMenu"
    )
    ?.addEventListener(
      "click",
      () => menu.remove()
    );


  document
    .getElementById(
      "reportChatBtn"
    )
    ?.addEventListener(
      "click",
      () => {

        menu.remove();

        alert(
          "Thanks. The report system will be connected to the StudentConnect safety system."
        );
      }
    );


  document
    .getElementById(
      "blockChatBtn"
    )
    ?.addEventListener(
      "click",
      () => {

        menu.remove();

        alert(
          "The block system will be connected to StudentConnect safety controls."
        );
      }
    );
}


/* =========================================================
   GET CHAT ID
========================================================= */

function getChatId(uid1, uid2) {

  return [
    uid1,
    uid2
  ]
    .sort()
    .join("_");
}


/* =========================================================
   LOAD MESSAGES
   ONLY ONE VERSION
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
    getChatId(
      currentUser.uid,
      selectedChatUser
    );

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

          <p>
            No messages yet.
            Say hello!
          </p>

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


        /* TEXT */

        if (
          message.type === "text" ||
          !message.type
        ) {

          bubble.textContent =
            message.text || "";
        }


        /* FILE */

        else if (
          message.type === "file"
        ) {

          const fileMessage =
            document.createElement(
              "div"
            );

          fileMessage.className =
            "file-message";

          const icon =
            document.createElement(
              "span"
            );

          icon.textContent =
            "📎 ";

          const link =
            document.createElement(
              "a"
            );

          link.textContent =
            message.fileName ||
            "Open attachment";

          link.href =
            isSafeURL(
              message.fileUrl
            )
              ? message.fileUrl
              : "#";

          link.target =
            "_blank";

          link.rel =
            "noopener noreferrer";

          fileMessage.appendChild(
            icon
          );

          fileMessage.appendChild(
            link
          );

          bubble.appendChild(
            fileMessage
          );
        }


        /* AUDIO */

        else if (
          message.type === "audio"
        ) {

          const audio =
            document.createElement(
              "audio"
            );

          audio.controls =
            true;

          if (
            isSafeURL(
              message.fileUrl
            )
          ) {

            audio.src =
              message.fileUrl;
          }

          bubble.appendChild(
            audio
          );
        }


        chatMessages.appendChild(
          bubble
        );
      }
    );

    chatMessages.scrollTop =
      chatMessages.scrollHeight;

  } catch (error) {

    console.error(
      "Message loading error:",
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
   CHAT TOOLBAR
========================================================= */

function createChatToolbar() {

  const form =
    document.getElementById(
      "chatForm"
    );

  if (!form) {
    return;
  }

  if (
    document.getElementById(
      "chatToolbar"
    )
  ) {
    return;
  }

  const toolbar =
    document.createElement(
      "div"
    );

  toolbar.id =
    "chatToolbar";

  toolbar.className =
    "chat-toolbar";

  toolbar.innerHTML = `

    <button
      type="button"
      id="attachmentBtn"
      title="Attach file"
    >
      📎
    </button>

    <input
      type="file"
      id="attachmentInput"
      hidden
    >

    <button
      type="button"
      id="voiceRecordBtn"
      title="Voice message"
    >
      🎤
    </button>
  `;

  form.parentNode.insertBefore(
    toolbar,
    form
  );

  setupAttachment();
  setupVoiceRecorder();
}


/* =========================================================
   ATTACHMENT
========================================================= */

function setupAttachment() {

  const button =
    document.getElementById(
      "attachmentBtn"
    );

  const input =
    document.getElementById(
      "attachmentInput"
    );

  button?.addEventListener(
    "click",
    () => {

      input?.click();

    }
  );


  input?.addEventListener(
    "change",
    async () => {

      const file =
        input.files?.[0];

      if (!file) {
        return;
      }

      alert(
        `Selected: ${file.name}\n\nFirebase Storage upload will be connected in the next step.`
      );

      input.value = "";

    }
  );
}


/* =========================================================
   VOICE RECORDER
========================================================= */

function setupVoiceRecorder() {

  const button =
    document.getElementById(
      "voiceRecordBtn"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    async () => {

      if (isRecording) {

        stopVoiceRecording();

        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {

        alert(
          "Voice recording is not supported by this browser."
        );

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
          () => {

            stream
              .getTracks()
              .forEach(
                track =>
                  track.stop()
              );

            const audioBlob =
              new Blob(
                audioChunks,
                {
                  type:
                    "audio/webm"
                }
              );

            const audioUrl =
              URL.createObjectURL(
                audioBlob
              );

            const audio =
              document.createElement(
                "audio"
              );

            audio.controls =
              true;

            audio.src =
              audio
