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
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

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

/*
  IMPORTANT:
  Your HTML uses id="postsList"
*/
const communityPosts =
  document.getElementById("postsList");


/* CHAT */

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


/* PROFILE */

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


/* AI */

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


/* =========================
   VARIABLES
========================= */

let signupMode = false;
let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;

/*
  This stores the active chat listener.
  It prevents multiple listeners from
  running at the same time.
*/
let unsubscribeChat = null;


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

  signupForm.addEventListener(
    "submit",
    async (event) => {

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

        authMessage.textContent =
          "Please complete all fields.";

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

        /*
          After signup, send the user
          to the profile page.
        */

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

}


/* =========================
   LOGIN
========================= */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

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

      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        /*
          Your current project uses the
          main HTML as the app screen.
        */

        if (
          document.getElementById("appScreen")
        ) {

          showApp();

        } else {

          window.location.href =
            "index.html";

        }

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

}


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;

    if (!user) {

      showAuth();

      return;
    }

    showApp();

    await loadProfile();
    await loadDiscoverStudents();
    await loadCommunities();
    await loadChatUsers();

  }
);


/* =========================
   SHOW AUTH
========================= */

function showAuth() {

  const authScreen =
    document.getElementById("authScreen");

  const appScreen =
    document.getElementById("appScreen");

  authScreen?.classList.remove("hidden");

  appScreen?.classList.add("hidden");

}


/* =========================
   SHOW APP
========================= */

function showApp() {

  const authScreen =
    document.getElementById("authScreen");

  const appScreen =
    document.getElementById("appScreen");

  authScreen?.classList.add("hidden");

  appScreen?.classList.remove("hidden");

}


/* =========================
   LOGOUT
========================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        /*
          Stop chat listener before logout.
        */

        if (unsubscribeChat) {

          unsubscribeChat();

          unsubscribeChat = null;

        }

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


/* =========================
   NAVIGATION
========================= */

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

      console.log(
        "No profile document found."
      );

      return;
    }

    const data =
      profileSnapshot.data();


    /* NAME */

    if (profileName) {

      profileName.textContent =
        data.displayName ||
        "Not set";

    }


    /* EMAIL */

    if (profileEmail) {

      profileEmail.textContent =
        data.email ||
        currentUser.email ||
        "Not set";

    }


    /* COUNTRY */

    if (profileCountry) {

      profileCountry.textContent =
        data.country ||
        "Not set";

    }


    /* SCHOOL */

    if (profileSchool) {

      profileSchool.textContent =
        data.school ||
        "Not set";

    }


    /* LEVEL */

    if (profileLevel) {

      profileLevel.textContent =
        data.level ||
        "Not set";

    }


    /* SUBJECT */

    if (profileSubject) {

      profileSubject.textContent =
        data.subject ||
        "Not set";

    }


    /* INTEREST */

    if (profileInterest) {

      profileInterest.textContent =
        data.interest ||
        "Not set";

    }


    /* WELCOME MESSAGE */

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


/* =========================
   DISCOVER STUDENTS
========================= */

async function loadDiscoverStudents() {

  if (!discoverList) return;

  discoverList.innerHTML =
    `
      <div class="card">
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

    let studentsFound = 0;

    snapshot.forEach(
      studentDoc => {

        /*
          Don't display yourself.
        */

        if (
          studentDoc.id ===
          currentUser?.uid
        ) {

          return;

        }

        studentsFound++;

        const student =
          studentDoc.data();

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "card student-card";

        card.innerHTML = `

          <h3 class="student-name">
            👤 ${escapeHTML(
              student.displayName ||
              "Student"
            )}
          </h3>

          <p class="student-info">
            🌍 ${escapeHTML(
              student.country ||
              "Country not listed"
            )}
          </p>

          <p class="student-info">
            📍 ${escapeHTML(
              student.region ||
              "Region not listed"
            )}
          </p>

          <p class="student-info">
            🏫 ${escapeHTML(
              student.school ||
              "School not listed"
            )}
          </p>

          <p class="student-info">
            🎓 ${escapeHTML(
              student.level ||
              "Level not listed"
            )}
          </p>

          <p class="student-info">
            📚 ${escapeHTML(
              student.subject ||
              "Subject not listed"
            )}
          </p>

          <p class="student-info">
            ⭐ ${escapeHTML(
              student.interest ||
              "Interest not listed"
            )}
          </p>

          <button
            class="action-btn"
            data-chat="${studentDoc.id}"
            type="button"
          >
            💬 Message
          </button>

        `;

        discoverList.appendChild(
          card
        );

      }
    );


    if (studentsFound === 0) {

      discoverList.innerHTML =
        `
          <div class="card">

            <h3>
              No students yet
            </h3>

            <p>
              More students will appear
              here as they join
              StudentConnect.
            </p>

          </div>
        `;

      return;

    }


    /*
      Message buttons.
    */

    discoverList
      .querySelectorAll(
        "[data-chat]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openChatWith(
              button.dataset.chat
            );

            navigateToPage(
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
      `
        <div class="card">

          <h3>
            Unable to load students
          </h3>

          <p>
            Please check your Firebase
            Firestore rules and internet
            connection.
          </p>

        </div>
      `;

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
            community.name
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
          type="button"
        >
          Open Community
        </button>

      `;

      communityList.appendChild(
        card
      );

    }
  );


  communityList
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


/* =========================
   OPEN COMMUNITY
========================= */

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


/* =========================
   BACK TO COMMUNITIES
========================= */

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

      const text =
        postInput?.value.trim();

      if (!text) {

        alert(
          "Write something first."
        );

        return;

      }

      if (!currentCommunity) {

        alert(
          "Please select a community."
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


/* =========================
   LOAD COMMUNITY POSTS
========================= */

async function loadCommunityPosts(id) {

  if (!communityPosts) return;

  communityPosts.innerHTML =
    `
      <div class="card">
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

      communityPosts.innerHTML =
        `
          <div class="card">

            <p>
              No discussions yet.
            </p>

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

            •

            ${escapeHTML(
              date
            )}

          </div>

          <div>
            ${escapeHTML(
              post.text ||
              ""
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

    communityPosts.innerHTML =
      `
        <div class="card">

          <h3>
            Unable to load discussions
          </h3>

          <p>
            Check your Firestore rules
            and try again.
          </p>

        </div>
      `;

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

    let usersFound = 0;


    snapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id ===
          currentUser?.uid
        ) {

          return;

        }

        usersFound++;

        const student =
          studentDoc.data();

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


    if (usersFound === 0) {

      chatUsers.innerHTML =
        `
          <p>
            No discoverable students yet.
          </p>
        `;

    }

  } catch (error) {

    console.error(
      "Chat users error:",
      error
    );

    chatUsers.innerHTML =
      "Unable to load students.";

  }

}


/* =========================
   OPEN CHAT
========================= */

async function openChatWith(uid) {

  if (!currentUser) return;

  selectedChatUser = uid;

  /*
    Stop the previous real-time listener.
  */

  if (unsubscribeChat) {

    unsubscribeChat();

    unsubscribeChat = null;

  }


  if (messageInput) {

    messageInput.disabled =
      false;

    messageInput.focus();

  }


  if (chatTitle) {

    chatTitle.textContent =
      "💬 Loading chat...";

  }


  if (chatMessages) {

    chatMessages.innerHTML =
      `
        <p>
          Loading conversation...
        </p>
      `;

  }


  /*
    Get the student's profile.
  */

  try {

    const student =
      await getDoc(
        doc(
          db,
          "discoverableProfiles",
          uid
        )
      );

    if (
      student.exists() &&
      chatTitle
    ) {

      const data =
        student.data();

      chatTitle.textContent =
        `💬 ${
          data.displayName ||
          "Student"
        }`;

    }

  } catch (error) {

    console.error(
      "Student profile error:",
      error
    );

    if (chatTitle) {

      chatTitle.textContent =
        "💬 Chat";

    }

  }


  /*
    Create a consistent chat ID.

    Example:

    User A + User B

    becomes:

    smallerUID_largerUID

    This means both users use
    the same chat.
  */

  const chatId =
    [
      currentUser.uid,
      selectedChatUser
    ]
      .sort()
      .join("_");


  /*
    Listen for messages in real time.
  */

  try {

    const messagesQuery =
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


    unsubscribeChat =
      onSnapshot(
        messagesQuery,
        snapshot => {

          if (!chatMessages) return;

          chatMessages.innerHTML = "";


          if (snapshot.empty) {

            chatMessages.innerHTML =
              `
                <div class="card">

                  <p>
                    No messages yet.
                  </p>

                  <p>
                    Start the conversation below.
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
                message.text ||
                "";


              chatMessages.appendChild(
                div
              );

            }
          );


          /*
            Automatically scroll to
            the newest message.
          */

          chatMessages.scrollTop =
            chatMessages.scrollHeight;

        },

        error => {

          console.error(
            "Chat listener error:",
            error
          );

          if (chatMessages) {

            chatMessages.innerHTML =
              `
                <div class="card">

                  <p>
                    Unable to load this chat.
                  </p>

                </div>
              `;

          }

        }
      );

  } catch (error) {

    console.error(
      "Chat setup error:",
      error
    );

  }

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
          "Select a student first."
        );

        return;

      }


      const text =
        messageInput?.value.trim();


      if (!text) return;


      const sendButton =
        chatForm.querySelector(
          "button[type='submit']"
        );

      if (sendButton) {

        sendButton.disabled =
          true;

      }


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


        /*
          Do NOT manually add the message
          to the screen here.

          onSnapshot() will automatically
          display it.
        */

        if (messageInput) {

          messageInput.value = "";

          messageInput.focus();

        }

      } catch (error) {

        console.error(
          "Send message error:",
          error
        );

        alert(
          "Could not send message."
        );

      } finally {

        if (sendButton) {

          sendButton.disabled =
            false;

        }

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

      if (aiArea) {

        aiArea.classList.toggle(
          "hidden"
        );

      }

      if (
        aiArea &&
        !aiArea.classList.contains(
          "hidden"
        )
      ) {

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

        alert(
          "Enter a question first."
        );

        return;

      }


      if (aiResponse) {

        aiResponse.classList.remove(
          "hidden"
        );

        aiResponse.textContent =
          "🤖 AI Study Assistant is not connected to an AI service yet.\n\nYour question was:\n" +
          question +
          "\n\nThe next step is connecting StudentConnect to an AI API securely.";

      }

    }
  );

}


/* =========================
   NAVIGATION HELPER
========================= */

function navigateToPage(page) {

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
    error?.code ||
    "";


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


    case "permission-denied":

      return "Firebase permission denied. Check your Firestore security rules.";


    default:

      return (
        error?.message ||
        "Something went wrong. Please try again."
      );

  }

}
