import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let currentCommunity = null;
let selectedChatUser = null;
let allStudents = [];

let signupMode = false;


/* =====================================================
   ELEMENTS
===================================================== */

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

const authTitle =
  document.getElementById("authTitle");

const authSubtitle =
  document.getElementById("authSubtitle");

const logoutBtn =
  document.getElementById("logoutBtn");

const welcomeMessage =
  document.getElementById("welcomeMessage");

const discoverList =
  document.getElementById("discoverList");

const studentSearch =
  document.getElementById("studentSearch");

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

const profileCountry =
  document.getElementById("profileCountry");

const profileRegion =
  document.getElementById("profileRegion");

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

const reelsList =
  document.getElementById("reelsList");


/* =====================================================
   AUTH MODE SWITCH
===================================================== */

if (switchAuth) {

  switchAuth.addEventListener(
    "click",
    () => {

      signupMode =
        !signupMode;

      authMessage.textContent =
        "";

      if (signupMode) {

        loginForm.classList.add(
          "hidden"
        );

        signupForm.classList.remove(
          "hidden"
        );

        authTitle.textContent =
          "Create your StudentConnect account";

        authSubtitle.textContent =
          "Join students who learn and grow together.";

        switchAuth.textContent =
          "Already have an account? Login";

      } else {

        signupForm.classList.add(
          "hidden"
        );

        loginForm.classList.remove(
          "hidden"
        );

        authTitle.textContent =
          "Welcome to StudentConnect";

        authSubtitle.textContent =
          "Learn. Connect. Grow.";

        switchAuth.textContent =
          "Create an account";

      }

    }
  );

}


/* =====================================================
   SIGN UP
===================================================== */

if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

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


      authMessage.textContent =
        "Creating your account...";


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
          doc(
            db,
            "users",
            user.uid
          ),
          {

            uid:
              user.uid,

            displayName:
              name,

            email:
              email,

            profileComplete:
              false,

            createdAt:
              serverTimestamp()

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

    }
  );

}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        document
          .getElementById("loginEmail")
          .value
          .trim();

      const password =
        document
          .getElementById("loginPassword")
          .value;


      authMessage.textContent =
        "Logging in...";


      try {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


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


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser =
      user;


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

    loadReels();

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

        await signOut(auth);

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
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;


          document
            .querySelectorAll(".page")
            .forEach(
              section => {

                section.classList.remove(
                  "active"
                );

              }
            );


          document
            .querySelectorAll(".nav-item")
            .forEach(
              nav => {

                nav.classList.remove(
                  "active"
                );

              }
            );


          const target =
            document.getElementById(
              `page-${page}`
            );


          if (target) {

            target.classList.add(
              "active"
            );

          }


          document
            .querySelectorAll(
              `[data-page="${page}"]`
            )
            .forEach(
              item => {

                item.classList.add(
                  "active"
                );

              }
            );


          window.scrollTo(
            0,
            0
          );


          if (page === "reels") {

            loadReels();

          }

        }
      );

    }
  );


/* =====================================================
   PROFILE
===================================================== */

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


    if (profileName) {

      profileName.textContent =
        data.displayName ||
        "Student";

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


    if (profileRegion) {

      profileRegion.textContent =
        data.region ||
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


    if (welcomeMessage) {

      welcomeMessage.textContent =
        `Welcome, ${
          data.displayName || "Student"
        } 👋`;

    }

  } catch (error) {

    console.error(
      "Profile error:",
      error
    );

  }

}


/* =====================================================
   DISCOVER STUDENTS
===================================================== */

async function loadDiscoverStudents() {

  if (!discoverList)
    return;


  discoverList.innerHTML =
    `
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


    allStudents = [];


    snapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id ===
          currentUser?.uid
        ) {

          return;

        }


        allStudents.push({

          id:
            studentDoc.id,

          ...studentDoc.data()

        });

      }
    );


    renderStudents(
      allStudents
    );


  } catch (error) {

    console.error(
      "Discover error:",
      error
    );


    discoverList.innerHTML =
      `
        <div class="card">
          <h3>Unable to load students</h3>
          <p>
            Please check your Firebase
            Firestore rules and try again.
          </p>
        </div>
      `;

  }

}


/* =====================================================
   RENDER STUDENTS
===================================================== */

function renderStudents(
  students
) {

  if (!discoverList)
    return;


  discoverList.innerHTML =
    "";


  if (!students.length) {

    discoverList.innerHTML =
      `
        <div class="card">
          <h3>No other students yet</h3>
          <p>
            When another student completes
            their profile and allows discovery,
            they will appear here.
          </p>
        </div>
      `;

    return;

  }


  students.forEach(
    student => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card student-card";


      card.innerHTML =
        `
          <div class="student-avatar">
            👤
          </div>

          <h3>
            ${escapeHTML(
              student.displayName ||
              "Student"
            )}
          </h3>

          <p>
            🌍 ${
              escapeHTML(
                student.country ||
                "Unknown"
              )
            }
          </p>

          <p>
            🏫 ${
              escapeHTML(
                student.school ||
                "School not listed"
              )
            }
          </p>

          <p>
            🎓 ${
              escapeHTML(
                student.level ||
                "Level not listed"
              )
            }
          </p>

          <p>
            📚 ${
              escapeHTML(
                student.subject ||
                "Subject not listed"
              )
            }
          </p>

          <p>
            ⭐ ${
              escapeHTML(
                student.interest ||
                "Interest not listed"
              )
            }
          </p>

          <button
            class="primary-btn"
            data-chat="${student.id}"
          >
            Message
          </button>
        `;


      discoverList.appendChild(
        card
      );

    }
  );


  discoverList
    .querySelectorAll(
      "[data-chat]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openChatWith(
              button.dataset.chat
            );

            openPage(
              "chat"
            );

          }
        );

      }
    );

}


/* =====================================================
   STUDENT SEARCH
===================================================== */

if (studentSearch) {

  studentSearch.addEventListener(
    "input",
    () => {

      const search =
        studentSearch.value
          .trim()
          .toLowerCase();


      if (!search) {

        renderStudents(
          allStudents
        );

        return;

      }


      const filtered =
        allStudents.filter(
          student => {

            const text = [

              student.displayName,

              student.country,

              student.region,

              student.school,

              student.level,

              student.subject,

              student.interest

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


            return text.includes(
              search
            );

          }
        );


      renderStudents(
        filtered
      );

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
      "Discuss science and discover interesting ideas."

  },

  {
    id: "exam-prep",

    name: "📝 Exam Prep",

    description:
      "Prepare for exams and share study strategies."

  },

  {
    id: "creative-corner",

    name: "🎨 Creative Corner",

    description:
      "Share art, writing and creative projects."

  },

  {
    id: "sports-club",

    name: "⚽ Sports Club",

    description:
      "Talk about sports and connect with students."

  }

];


async function loadCommunities() {

  if (!communityList)
    return;


  communityList.innerHTML =
    "";


  communities.forEach(
    community => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "card community-card";


      card.innerHTML =
        `
          <h3>
            ${community.name}
          </h3>

          <p>
            ${escapeHTML(
              community.description
            )}
          </p>

          <button
            class="primary-btn"
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


  communityList
    .querySelectorAll(
      "[data-community]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openCommunity(
              button.dataset.community
            );

          }
        );

      }
    );

}


/* =====================================================
   OPEN COMMUNITY
===================================================== */

async function openCommunity(
  id
) {

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


  await loadCommunityPosts(
    id
  );

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

      currentCommunity =
        null;

    }
  );

}


/* =====================================================
   COMMUNITY POST
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


      if (!currentCommunity)
        return;


      const text =
        postInput.value.trim();


      if (!text) {

        alert(
          "Write something first."
        );

        return;

      }


      postButton.disabled =
        true;


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

            text:
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


        postInput.value =
          "";


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

      }


      postButton.disabled =
        false;

    }
  );

}


/* =====================================================
   LOAD COMMUNITY POSTS
===================================================== */

async function loadCommunityPosts(
  id
) {

  if (!communityPosts)
    return;


  communityPosts.innerHTML =
    `
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


    communityPosts.innerHTML =
      "";


    if (snapshot.empty) {

      communityPosts.innerHTML =
        `
          <div class="card">
            <h3>No discussions yet</h3>
            <p>
              Be the first student to
              start a discussion.
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


        article.innerHTML =
          `
            <div class="post-meta">

              👤 ${
                escapeHTML(
                  post.displayName ||
                  "Student"
                )
              }

              • ${
                escapeHTML(
                  date
                )
              }

            </div>

            <div class="post-body">

              ${
                escapeHTML(
                  post.text ||
                  ""
                )
              }

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
          Unable to load discussions.
        </div>
      `;

  }

}


/* =====================================================
   CHAT USERS
===================================================== */

async function loadChatUsers() {

  if (!chatUsers)
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


    chatUsers.innerHTML =
      "";


    snapshot.forEach(
      studentDoc => {

        if (
          studentDoc.id ===
          currentUser?.uid
        ) {

          return;

        }


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


    if (!chatUsers.children.length) {

      chatUsers.innerHTML =
        `
          <div class="empty-chat">
            No students available yet.
          </div>
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


/* =====================================================
   OPEN CHAT
===================================================== */

async function openChatWith(
  uid
) {

  selectedChatUser =
    uid;


  if (messageInput) {

    messageInput.disabled =
      false;

  }


  chatTitle.textContent =
    "💬 Chat";


  chatMessages.innerHTML =
    `
      <div class="loading-card">
        Loading conversation...
      </div>
    `;


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
          student.data()
            .displayName ||
          "Student"
        }`;

    }


    await loadMessages(
      uid
    );


  } catch (error) {

    console.error(
      "Open chat error:",
      error
    );

  }

}


/* =====================================================
   LOAD CHAT MESSAGES
===================================================== */

async function loadMessages(
  otherUserId
) {

  if (!currentUser)
    return;


  const chatId =
    [
      currentUser.uid,
      otherUserId
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


    chatMessages.innerHTML =
      "";


    if (snapshot.empty) {

      chatMessages.innerHTML =
        `
          <div class="empty-chat">
            No messages yet.
            Say hello!
          </div>
        `;

      return;

    }


    snapshot.forEach(
      messageDoc => {

        const message =
          messageDoc.data();


        const messageElement =
          document.createElement(
            "div"
          );


        messageElement.className =
          message.senderId ===
          currentUser.uid
            ? "message mine"
            : "message";


        messageElement.textContent =
          message.text ||
          "";


        chatMessages.appendChild(
          messageElement
        );

      }
    );


    chatMessages.scrollTop =
      chatMessages.scrollHeight;


  } catch (error) {

    console.error(
      "Messages error:",
      error
    );


    chatMessages.innerHTML =
      `
        <div class="empty-chat">
          Unable to load messages.
        </div>
      `;

  }

}


/* =====================================================
   SEND CHAT MESSAGE
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

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        messageInput.value =
          "";


        await loadMessages(
          selectedChatUser
        );


      } catch (error) {

        console.error(
          "Send message error:",
          error
        );


        alert(
          "Could not send the message."
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

      alert(
        "AI Study Assistant will be connected next."
      );

    }
  );

}


/* =====================================================
   REELS
===================================================== */

/*
 * We are intentionally keeping the video API
 * connection separate from Firebase.
 *
 * Add your approved video API key/config here
 * when we connect the Reels feed.
 */

const REELS_API_KEY =
  "";


async function loadReels() {

  if (!reelsList)
    return;


  if (!REELS_API_KEY) {

    reelsList.innerHTML =
      `
        <div class="card reels-empty">

          <div class="feature-icon">
            🎬
          </div>

          <h2>
            Educational Reels
          </h2>

          <p>
            The Reels feed is ready for
            the video API connection.
          </p>

          <p class="muted">
            We will connect the API after
            the core StudentConnect system
            is finished.
          </p>

        </div>
      `;

    return;

  }


  reelsList.innerHTML =
    `
      <div class="loading-card">
        Loading educational videos...
      </div>
    `;


  const searches = [
    "educational study motivation",
    "student study tips",
    "science explained",
    "coding for students",
    "exam preparation tips"
  ];


  try {

    const queryText =
      searches[
        Math.floor(
          Math.random() *
          searches.length
        )
      ];


    const url =
      new URL(
        "https://www.googleapis.com/youtube/v3/search"
      );


    url.searchParams.set(
      "part",
      "snippet"
    );

    url.searchParams.set(
      "type",
      "video"
    );

    url.searchParams.set(
      "videoEmbeddable",
      "true"
    );

    url.searchParams.set(
      "safeSearch",
      "strict"
    );

    url.searchParams.set(
      "maxResults",
      "8"
    );

    url.searchParams.set(
      "q",
      queryText
    );

    url.searchParams.set(
      "key",
      REELS_API_KEY
    );


    const response =
      await fetch(
        url.toString()
      );


    if (!response.ok) {

      throw new Error(
        "Video API request failed."
      );

    }


    const data =
      await response.json();


    renderReels(
      data.items || []
    );


  } catch (error) {

    console.error(
      "Reels error:",
      error
    );


    reelsList.innerHTML =
      `
        <div class="card">
          <h3>
            Reels couldn't load
          </h3>

          <p>
            Please try again later.
          </p>
        </div>
      `;

  }

}


/* =====================================================
   RENDER REELS
===================================================== */

function renderReels(
  videos
) {

  if (!reelsList)
    return;


  reelsList.innerHTML =
    "";


  if (!videos.length) {

    reelsList.innerHTML =
      `
        <div class="card">
          No educational videos found.
        </div>
      `;

    return;

  }


  videos.forEach(
    video => {

      const videoId =
        video.id?.videoId;


      if (!videoId)
        return;


      const title =
        video.snippet?.title ||
        "Educational video";


      const description =
        video.snippet?.description ||
        "";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "reel-card";


      card.innerHTML =
        `
          <div class="video-container">

            <iframe
              src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}"
              title="${escapeHTML(title)}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>

          </div>

          <div class="reel-info">

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(
                description.slice(
                  0,
                  180
                )
              )}
            </p>

          </div>
        `;


      reelsList.appendChild(
        card
      );

    }
  );

}


/* =====================================================
   PAGE HELPER
===================================================== */

function openPage(
  page
) {

  document
    .querySelectorAll(".page")
    .forEach(
      section => {

        section.classList.remove(
          "active"
        );

      }
    );


  document
    .querySelectorAll(".nav-item")
    .forEach(
      nav => {

        nav.classList.remove(
          "active"
        );

      }
    );


  document
    .getElementById(
      `page-${page}`
    )
    ?.classList.add(
      "active"
    );


  document
    .querySelectorAll(
      `[data-page="${page}"]`
    )
    .forEach(
      item => {

        item.classList.add(
          "active"
        );

      }
    );

}


/* =====================================================
   SECURITY HELPER
===================================================== */

function escapeHTML(
  value
) {

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

function getFirebaseError(
  error
) {

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

    default:

      return (
        error?.message ||
        "Something went wrong. Please try again."
      );

  }

}
