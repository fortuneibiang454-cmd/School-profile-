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
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   STATE
========================= */

let signupMode = false;

let currentUser = null;

let currentCommunity = null;

let selectedChatUser = null;


/* =========================
   AUTH SWITCH
========================= */

switchAuth?.addEventListener(
  "click",
  () => {

    signupMode = !signupMode;

    if (authMessage)
      authMessage.textContent = "";

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


/* =========================
   SIGN UP
========================= */

signupForm?.addEventListener(
  "submit",
  async event => {

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

      const user = result.user;


      await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
      ).then(async firestore => {

        await firestore.setDoc(
          doc(db, "users", user.uid),
          {

            uid: user.uid,

            displayName: name,

            email,

            profileComplete: false,

            discoverable: false,

            createdAt:
              serverTimestamp()

          },
          { merge: true }
        );

      });


      window.location.href =
        "profile.html";

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        getFirebaseError(error);
    }
  }
);


/* =========================
   LOGIN
========================= */

loginForm?.addEventListener(
  "submit",
  async event => {

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
  }
);


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(
  auth,
  async user => {

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


    authScreen?.classList.add(
      "hidden"
    );

    app?.classList.remove(
      "hidden"
    );


    await loadProfile();

    await loadDiscoverStudents();

    await loadCommunities();

    await loadChatUsers();
  }
);


/* =========================
   LOGOUT
========================= */

async function logout() {

  try {

    await signOut(auth);

    window.location.href =
      "index.html";

  } catch (error) {

    console.error(error);
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


/* =========================
   PROFILE
========================= */

async function loadProfile() {

  if (!currentUser)
    return;

  try {

    const profileSnapshot =
      await getDoc(
        doc(
          db,
          "users",
          currentUser.uid
        )
      );


    if (!profileSnapshot.exists())
      return;


    const data =
      profileSnapshot.data();


    if (profileName)
      profileName.textContent =
        data.displayName || "Not set";


    if (profileEmail)
      profileEmail.textContent =
        data.email ||
        currentUser.email ||
        "";


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
    `<div class="loading-card">
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


    document
      .querySelectorAll("[data-chat]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            openChatWith(
              button.dataset.chat
            );


            document
              .querySelectorAll(".page")
              .forEach(page =>
                page.classList.remove(
                  "active"
                )
              );


            document
              .getElementById(
                "page-messages"
              )
              ?.classList.add(
                "active"
              );
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

  if (!communityList)
    return;


  communityList.innerHTML = "";


  communities.forEach(
    community => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "community-card";


      card.innerHTML = `

        <div class="community-icon">
          ${community.name.split(" ")[0]}
        </div>

        <div>

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
            class="primary-btn small-btn"
            data-community="${community.id}"
          >
            Open Community
          </button>

        </div>
      `;


      communityList.appendChild(card);
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


  if (!currentCommunity)
    return;


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


/* =========================
   COMMUNITY POSTS
========================= */

postButton?.addEventListener(
  "click",
  async () => {

    if (!currentUser) {

      alert("Please log in first.");

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


    if (!currentCommunity)
      return;


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

      console.error(error);

      alert(
        "Could not publish your post."
      );

    }


    postButton.disabled = false;
  }
);


async function loadCommunityPosts(id) {

  if (!communityPosts)
    return;


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

    console.error(error);

    communityPosts.innerHTML = `

      <div class="error-card">
        Unable to load discussions.
      </div>
    `;
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


    if (count === 0) {

      chatUsers.innerHTML =
        `<p class="muted">
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

  selectedChatUser = uid;


  if (!messageInput)
    return;


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
        `💬 ${
          student.data().displayName ||
          "Student"
        }`;
    }

  } catch (error) {

    console.error(error);
  }


  await loadMessages();
}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages() {

  if (
    !currentUser ||
    !selectedChatUser
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
      "Message loading error:",
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

          text,

          createdAt:
            serverTimestamp()
        }
      );


      messageInput.value = "";


      await loadMessages();

    } catch (error) {

      console.error(error);

      alert(
        "Could not send message."
      );
    }
  }
);


/* =========================
   AI ASSISTANT
========================= */

aiBtn?.addEventListener(
  "click",
  () => {

    alert(
      "The AI Study Assistant will be connected in the next stage."
    );

  }
);


/* =========================
   SECURITY
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
      return (
        error?.message ||
        "Something went wrong. Please try again."
      );
  }
}
