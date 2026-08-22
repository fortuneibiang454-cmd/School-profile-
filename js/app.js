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
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
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

/*
 * IMPORTANT:
 * Your HTML uses id="postsList"
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

const aiBtn = document.getElementById("aiBtn");
const aiArea = document.getElementById("aiArea");
const aiInput = document.getElementById("aiInput");
const aiAskButton = document.getElementById("aiAskButton");
const aiResponse = document.getElementById("aiResponse");


/* =========================
   VARIABLES
========================= */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;

let unsubscribeChat = null;
let unsubscribeCommunity = null;


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

      /*
       * Send new users to profile setup.
       */
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

      window.location.href =
        "dashboard.html";

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

  if (!user) {
    return;
  }

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

      if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
      }

      if (unsubscribeCommunity) {
        unsubscribeCommunity();
        unsubscribeCommunity = null;
      }

      await signOut(auth);

      window.location.href =
        "index.html";

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

    button.addEventListener("click", async () => {

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

      /*
       * Reload students whenever Discover
       * or Messages is opened.
       */
      if (page === "discover") {
        await loadDiscoverStudents();
      }

      if (page === "messages") {
        await loadChatUsers();
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

    const data =
      profileSnapshot.data();

    if (profileName) {
      profileName.textContent =
        data.displayName || "Not set";
    }

    if (profileEmail) {
      profileEmail.textContent =
        data.email ||
        currentUser.email ||
        "";
    }

    if (profileCountry) {
      profileCountry.textContent =
        data.country || "Not set";
    }

    if (profileSchool) {
      profileSchool.textContent =
        data.school || "Not set";
    }

    if (profileLevel) {
      profileLevel.textContent =
        data.level || "Not set";
    }

    if (profileSubject) {
      profileSubject.textContent =
        data.subject || "Not set";
    }

    if (profileInterest) {
      profileInterest.textContent =
        data.interest || "Not set";
    }

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

  if (!discoverList || !currentUser) return;

  discoverList.innerHTML =
    `<div class="card">Loading students...</div>`;

  try {

    const q = query(
      collection(db, "discoverableProfiles"),
      where("discoverable", "==", true)
    );

    const snapshot =
      await getDocs(q);

    discoverList.innerHTML = "";

    let foundStudent = false;

    snapshot.forEach(studentDoc => {

      /*
       * Don't show yourself.
       */
      if (studentDoc.id === currentUser.uid) {
        return;
      }

      foundStudent = true;

      const student =
        studentDoc.data();

      const card =
        document.createElement("div");

      card.className =
        "card student-card";

      card.innerHTML = `
        <div class="student-name">
          👤 ${escapeHTML(student.displayName || "Student")}
        </div>

        <div class="student-info">
          🌍 ${escapeHTML(student.country || "Unknown")}
        </div>

        <div class="student-info">
          📍 ${escapeHTML(student.region || "Unknown")}
        </div>

        <div class="student-info">
          🏫 ${escapeHTML(student.school || "School not listed")}
        </div>

        <div class="student-info">
          🎓 ${escapeHTML(student.level || "Level not listed")}
        </div>

        <div class="student-info">
          📚 ${escapeHTML(student.subject || "Subject not listed")}
        </div>

        <div class="student-info">
          ⭐ ${escapeHTML(student.interest || "Interest not listed")}
        </div>

        <button
          class="action-btn"
          data-chat="${studentDoc.id}"
          type="button"
        >
          💬 Message
        </button>
      `;

      discoverList.appendChild(card);

    });

    if (!foundStudent) {

      discoverList.innerHTML =
        `<div class="card">

          <h3>No other students found</h3>

          <p>
            Make sure another account has completed
            its profile and selected
            "Yes, let students discover me".
          </p>

        </div>`;

      return;
    }

    /*
     * Message buttons.
     */
    discoverList
      .querySelectorAll("[data-chat]")
      .forEach(button => {

        button.addEventListener("click", () => {

          openChatWith(
            button.dataset.chat
          );

          /*
           * Open Messages page.
           */
          document
            .querySelectorAll(".page")
            .forEach(section => {
              section.classList.remove("active");
            });

          document
            .getElementById("page-messages")
            ?.classList.add("active");

          window.scrollTo(0, 0);

        });

      });

  } catch (error) {

    console.error(
      "Discover error:",
      error
    );

    discoverList.innerHTML =
      `<div class="card">

        <h3>Unable to load students</h3>

        <p>
          ${escapeHTML(error.message)}
        </p>

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
      <h3>
        ${escapeHTML(community.name)}
      </h3>

      <p>
        ${escapeHTML(community.description)}
      </p>

      <button
        class="action-btn"
        data-community="${community.id}"
        type="button"
      >
        Open Community
      </button>
    `;

    communityList.appendChild(card);

  });

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

      if (unsubscribeCommunity) {
        unsubscribeCommunity();
        unsubscribeCommunity = null;
      }

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


/* =========================
   REAL-TIME COMMUNITY POSTS
========================= */

async function loadCommunityPosts(id) {

  if (!communityPosts) return;

  if (unsubscribeCommunity) {
    unsubscribeCommunity();
    unsubscribeCommunity = null;
  }

  communityPosts.innerHTML =
    `<div class="card">
      Loading discussions...
    </div>`;

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

    unsubscribeCommunity =
      onSnapshot(
        q,
        snapshot => {

          communityPosts.innerHTML = "";

          if (snapshot.empty) {

            communityPosts.innerHTML =
              `<div class="card">

                <p>
                  No discussions yet.
                </p>

                <p>
                  Be the first student to start one!
                </p>

              </div>`;

            return;
          }

          snapshot.forEach(postDoc => {

            const post =
              postDoc.data();

            const article =
              document.createElement("article");

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

              <div>
                ${escapeHTML(
                  post.text || ""
                )}
              </div>

            `;

            communityPosts.appendChild(
              article
            );

          });

        },
        error => {

          console.error(
            "Community listener error:",
            error
          );

          communityPosts.innerHTML =
            `<div class="card">
              Unable to load discussions.
            </div>`;

        }
      );

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

  if (!chatUsers || !currentUser) return;

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

    let foundStudent = false;

    snapshot.forEach(studentDoc => {

      /*
       * Don't show yourself.
       */
      if (studentDoc.id === currentUser.uid) {
        return;
      }

      foundStudent = true;

      const student =
        studentDoc.data();

      const button =
        document.createElement("button");

      button.className =
        "user-item";

      button.type = "button";

      button.textContent =
        `👤 ${
          student.displayName ||
          "Student"
        }`;

      button.addEventListener(
        "click",
        () => {

          openChatWith(
            studentDoc.id
          );

        }
      );

      chatUsers.appendChild(
        button
      );

    });

    if (!foundStudent) {

      chatUsers.innerHTML =
        `<p>
          No other discoverable students yet.
        </p>`;

    }

  } catch (error) {

    console.error(error);

    chatUsers.innerHTML =
      "Unable to load students.";

  }

}


/* =========================
   OPEN CHAT
========================= */

async function openChatWith(uid) {

  if (!currentUser || !uid) return;

  selectedChatUser = uid;

  messageInput.disabled = false;

  chatTitle.textContent =
    "💬 Loading chat...";

  chatMessages.innerHTML =
    "<p>Loading conversation...</p>";


  /*
   * Stop previous real-time listener.
   */
  if (unsubscribeChat) {

    unsubscribeChat();
    unsubscribeChat = null;

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

      chatTitle.textContent =
        `💬 ${
          student.data().displayName ||
          "Student"
        }`;

    } else {

      chatTitle.textContent =
        "💬 Student";

    }

  } catch (error) {

    console.error(error);

    chatTitle.textContent =
      "💬 Student";

  }


  /*
   * Create the same chat ID on both phones.
   */
  const chatId =
    [currentUser.uid, uid]
      .sort()
      .join("_");


  /*
   * Listen for messages in real time.
   */
  const messagesRef =
    collection(
      db,
      "chats",
      chatId,
      "messages"
    );


  const messagesQuery =
    query(
      messagesRef,
      orderBy("createdAt", "asc")
    );


  unsubscribeChat =
    onSnapshot(
      messagesQuery,
      snapshot => {

        chatMessages.innerHTML = "";

        if (snapshot.empty) {

          chatMessages.innerHTML =
            `<div class="card">
              <p>No messages yet.</p>
              <p>Say hello! 👋</p>
            </div>`;

          return;
        }


        snapshot.forEach(messageDoc => {

          const message =
            messageDoc.data();

          const messageElement =
            document.createElement("div");

          messageElement.className =
            "message";


          if (
            message.senderId ===
            currentUser.uid
          ) {

            messageElement.classList.add(
              "mine"
            );

          }


          messageElement.textContent =
            message.text || "";


          chatMessages.appendChild(
            messageElement
          );

        });


        /*
         * Scroll to newest message.
         */
        chatMessages.scrollTop =
          chatMessages.scrollHeight;

      },
      error => {

        console.error(
          "Chat listener error:",
          error
        );

        chatMessages.innerHTML =
          `<div class="card">
            <p>
              Unable to load this conversation.
            </p>
          </div>`;

      }
    );

}


/* =========================
   SEND CHAT MESSAGE
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

        alert(
          "Please select a student first."
        );

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

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );

        messageInput.value = "";

      } catch (error) {

        console.error(error);

        alert(
          "Could not send message: " +
          error.message
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

      aiArea?.classList.toggle(
        "hidden"
      );

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

        alert(
          "Please type a question first."
        );

        return;

      }

      if (aiResponse) {

        aiResponse.classList.remove(
          "hidden"
        );

        aiResponse.textContent =
          "The AI Study Assistant has not been connected to an AI API yet. Your question was: " +
          question;

      }

    }
  );

}


/* =========================
   SECURITY HELPER
========================= */

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
