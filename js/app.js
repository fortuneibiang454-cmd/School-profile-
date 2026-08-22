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
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

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

const postInput =
  document.getElementById("postInput");

const postButton =
  document.getElementById("postButton");

/*
 * IMPORTANT:
 * Your HTML uses id="postsList".
 */
const communityPosts =
  document.getElementById("postsList");

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

const profileCountry =
  document.getElementById("profileCountry");

const profileSchool =
  document.getElementById("profileSchool");

const profileLevel =
  document.getElementById("profileLevel");

const profileSubject =
  document.getElementById("profileSubject");

const profileInterest =
  document.getElementById("profileInterest");

const aiBtn =
  document.getElementById("aiBtn");

const aiArea =
  document.getElementById("aiArea");

const aiInput =
  document.getElementById("aiInput");

const aiAskButton =
  document.getElementById("aiAskButton");

const aiResponse =
  document.getElementById("aiResponse");


/* =====================================================
   VARIABLES
===================================================== */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;

let unsubscribeDiscover = null;
let unsubscribeChatUsers = null;
let unsubscribeMessages = null;


/* =====================================================
   AUTH LOGIN / SIGNUP SWITCH
===================================================== */

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


/* =====================================================
   SIGN UP
===================================================== */

if (signupForm) {

  signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Creating your account...";

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

      authMessage.textContent =
        getFirebaseError(error);
    }

  });

}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    authMessage.textContent =
      "Logging in...";

    const email =
      document
        .getElementById("loginEmail")
        ?.value
        .trim();

    const password =
      document
        .getElementById("loginPassword")
        ?.value;

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

      authMessage.textContent =
        getFirebaseError(error);
    }

  });

}


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    if (!user) {

      cleanupListeners();

      return;
    }

    console.log(
      "Logged in user:",
      user.uid,
      user.email
    );

    await loadProfile();

    startDiscoverListener();

    loadCommunities();

    startChatUsersListener();

  }
);


/* =====================================================
   LOGOUT
===================================================== */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        cleanupListeners();

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
  );

}


/* =====================================================
   NAVIGATION
===================================================== */

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

  });


/* =====================================================
   PROFILE
===================================================== */

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

    if (profileCountry) {

      profileCountry.textContent =
        data.country ||
        "Not set";

    }

    if (profileSchool) {

      profileSchool.textContent =
        data.school ||
        "Not set";

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


/* =====================================================
   DISCOVER STUDENTS - REAL TIME
===================================================== */

function startDiscoverListener() {

  if (!discoverList || !currentUser)
    return;

  if (unsubscribeDiscover) {

    unsubscribeDiscover();

  }

  discoverList.innerHTML =
    `<div class="card">
      Loading students...
    </div>`;

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

  unsubscribeDiscover =
    onSnapshot(
      q,
      (snapshot) => {

        discoverList.innerHTML = "";

        let numberOfStudents = 0;

        snapshot.forEach(
          studentDoc => {

            /*
             * Don't show yourself.
             */

            if (
              studentDoc.id ===
              currentUser.uid
            ) {

              return;

            }

            numberOfStudents++;

            const student =
              studentDoc.data();

            const card =
              document.createElement(
                "div"
              );

            card.className =
              "card student-card";

            card.innerHTML = `

              <div class="student-name">
                👤 ${escapeHTML(
                  student.displayName ||
                  "Student"
                )}
              </div>

              <div class="student-info">
                🌍 ${escapeHTML(
                  student.country ||
                  "Country not listed"
                )}
              </div>

              <div class="student-info">
                📍 ${escapeHTML(
                  student.region ||
                  "Region not listed"
                )}
              </div>

              <div class="student-info">
                🏫 ${escapeHTML(
                  student.school ||
                  "School not listed"
                )}
              </div>

              <div class="student-info">
                🎓 ${escapeHTML(
                  student.level ||
                  "Level not listed"
                )}
              </div>

              <div class="student-info">
                📚 ${escapeHTML(
                  student.subject ||
                  "Subject not listed"
                )}
              </div>

              <div class="student-info">
                ⭐ ${escapeHTML(
                  student.interest ||
                  "Interest not listed"
                )}
              </div>

              <button
                class="action-btn message-student-btn"
                data-chat="${studentDoc.id}"
              >
                💬 Message
              </button>

            `;

            discoverList.appendChild(
              card
            );

          }
        );

        if (numberOfStudents === 0) {

          discoverList.innerHTML = `
            <div class="card">

              <h3>
                No other students yet
              </h3>

              <p>
                Ask another student to
                create an account and
                choose "Yes, let students
                discover me" in their profile.
              </p>

            </div>
          `;

        }

        document
          .querySelectorAll(
            ".message-student-btn"
          )
          .forEach(button => {

            button.addEventListener(
              "click",
              () => {

                openChatWith(
                  button.dataset.chat
                );

              }
            );

          });

      },

      error => {

        console.error(
          "Discover listener error:",
          error
        );

        discoverList.innerHTML = `
          <div class="card">

            <h3>
              Unable to load students
            </h3>

            <p>
              Check your Firestore
              security rules and internet
              connection.
            </p>

          </div>
        `;

      }
    );

}


/* =====================================================
   COMMUNITIES
===================================================== */

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


function loadCommunities() {

  if (!communityList)
    return;

  communityList.innerHTML = "";

  communities.forEach(
    community => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "card community-card";

      card.innerHTML = `

        <div class="community-icon">
          ${community.name.split(" ")[0]}
        </div>

        <h3>
          ${escapeHTML(
            community.name.substring(
              community.name.indexOf(" ") + 1
            )
          )}
        </h3>

        <p>
          ${escapeHTML(
            community.description
          )}
        </p>

        <button
          class="action-btn"
          data-community="${community.id}"
        >
          Open Community
        </button>

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


/* =====================================================
   OPEN COMMUNITY
===================================================== */

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


/* =====================================================
   BACK TO COMMUNITIES
===================================================== */

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


/* =====================================================
   CREATE COMMUNITY POST
===================================================== */

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
          "Please choose a community first."
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

        if (postInput) {

          postInput.value = "";

        }

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


/* =====================================================
   LOAD COMMUNITY POSTS
===================================================== */

async function loadCommunityPosts(id) {

  if (!communityPosts)
    return;

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

      communityPosts.innerHTML = `
        <div class="card">

          <p>
            No discussions yet.
          </p>

          <p>
            Be the first student to
            start one!
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

            •

            ${escapeHTML(date)}

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

      }
    );

  } catch (error) {

    console.error(
      "Community posts error:",
      error
    );

    communityPosts.innerHTML = `
      <div class="card">

        <p>
          Unable to load discussions.
        </p>

      </div>
    `;

  }

}


/* =====================================================
   CHAT USERS - REAL TIME
===================================================== */

function startChatUsersListener() {

  if (!chatUsers || !currentUser)
    return;

  if (unsubscribeChatUsers) {

    unsubscribeChatUsers();

  }

  chatUsers.innerHTML =
    "Loading students...";

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

  unsubscribeChatUsers =
    onSnapshot(
      q,
      snapshot => {

        chatUsers.innerHTML = "";

        let numberOfStudents = 0;

        snapshot.forEach(
          studentDoc => {

            if (
              studentDoc.id ===
              currentUser.uid
            ) {

              return;

            }

            numberOfStudents++;

            const student =
              studentDoc.data();

            const button =
              document.createElement(
                "button"
              );

            button.className =
              "user-item";

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

          }
        );

        if (
          numberOfStudents === 0
        ) {

          chatUsers.innerHTML = `
            <p>
              No other discoverable
              students yet.
            </p>
          `;

        }

      },

      error => {

        console.error(
          "Chat users error:",
          error
        );

        chatUsers.innerHTML =
          "Unable to load students.";

      }
    );

}


/* =====================================================
   OPEN CHAT
===================================================== */

async function openChatWith(uid) {

  if (!currentUser)
    return;

  selectedChatUser = uid;

  if (messageInput) {

    messageInput.disabled =
      false;

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

      chatTitle.textContent =
        `💬 ${
          data.displayName ||
          "Student"
        }`;

    } else {

      chatTitle.textContent =
        "💬 Student";

    }

  } catch (error) {

    console.error(
      "Chat profile error:",
      error
    );

    chatTitle.textContent =
      "💬 Student";

  }

  loadChatMessages();

}


/* =====================================================
   LOAD CHAT MESSAGES - REAL TIME
===================================================== */

function loadChatMessages() {

  if (
    !currentUser ||
    !selectedChatUser ||
    !chatMessages
  ) {

    return;

  }

  if (unsubscribeMessages) {

    unsubscribeMessages();

  }

  chatMessages.innerHTML =
    "<p>Loading conversation...</p>";

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

          chatMessages.innerHTML = `
            <div class="card">

              <p>
                No messages yet.
              </p>

              <p>
                Start the conversation!
              </p>

            </div>
          `;

          return;

        }

        snapshot.forEach(
          messageDoc => {

            const message =
              messageDoc.data();

            const div =
              document.createElement(
                "div"
              );

            div.className =
              "message";

            if (
              message.senderId ===
              currentUser.uid
            ) {

              div.classList.add(
                "mine"
              );

            }

            div.textContent =
              message.text || "";

            chatMessages.appendChild(
              div
            );

          }
        );

        chatMessages.scrollTop =
          chatMessages.scrollHeight;

      },

      error => {

        console.error(
          "Messages error:",
          error
        );

        chatMessages.innerHTML = `
          <div class="card">

            <p>
              Unable to load messages.
            </p>

          </div>
        `;

      }
    );

}


/* =====================================================
   SEND MESSAGE
===================================================== */

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
          "Select a student first."
        );

        return;

      }

      const text =
        messageInput?.value.trim();

      if (!text)
        return;

      try {

        const chatId =
          [
            currentUser.uid,
            selectedChatUser
          ]
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

            text:
              text,

            createdAt:
              serverTimestamp()

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

      }

    }
  );

}


/* =====================================================
   AI STUDY ASSISTANT
===================================================== */

if (aiBtn) {

  aiBtn.addEventListener(
    "click",
    () => {

      aiArea?.classList.toggle(
        "hidden"
      );

      aiInput?.focus();

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
          "Type a question first."
        );

        return;

      }

      if (aiResponse) {

        aiResponse.classList.remove(
          "hidden"
        );

        aiResponse.textContent =
          "The AI Study Assistant is not connected to an AI service yet. This part can be connected next.";

      }

    }
  );

}


/* =====================================================
   SECURITY HELPER
===================================================== */

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


/* =====================================================
   FIREBASE ERROR MESSAGES
===================================================== */

function getFirebaseError(error) {

  const code =
    error?.code || "";

  switch (code) {

    case "auth/email-already-in-use":

      return (
        "This email already has an account."
      );

    case "auth/invalid-email":

      return (
        "Please enter a valid email address."
      );

    case "auth/weak-password":

      return (
        "Password must be at least 6 characters."
      );

    case "auth/invalid-credential":

      return (
        "Incorrect email or password."
      );

    case "auth/user-not-found":

      return (
        "No account was found with this email."
      );

    case "auth/wrong-password":

      return (
        "Incorrect password."
      );

    case "auth/network-request-failed":

      return (
        "Network connection problem. Check your internet and try again."
      );

    default:

      return (
        error?.message ||
        "Something went wrong. Please try again."
      );

  }

}


/* =====================================================
   CLEANUP REAL-TIME LISTENERS
===================================================== */

function cleanupListeners() {

  if (unsubscribeDiscover) {

    unsubscribeDiscover();
    unsubscribeDiscover = null;

  }

  if (unsubscribeChatUsers) {

    unsubscribeChatUsers();
    unsubscribeChatUsers = null;

  }

  if (unsubscribeMessages) {

    unsubscribeMessages();
    unsubscribeMessages = null;

  }

}
