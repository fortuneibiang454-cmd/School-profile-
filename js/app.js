
/* =========================================================
   STUDENTCONNECT - APP.JS
   Corrected complete version
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import { auth, db } from "../firebase.js";

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


console.log("=================================");
console.log("StudentConnect app.js loaded");
console.log("Firebase Auth:", auth);
console.log("Firebase Firestore:", db);
console.log("=================================");


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

    switchAuth.textContent =
      "Already have an account? Login";

  } else {

    signupForm?.classList.add("hidden");
    loginForm?.classList.remove("hidden");

    switchAuth.textContent =
      "Create an account";
  }

});


/* =========================================================
   SIGN UP
========================================================= */

signupForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  console.log("Signup form submitted");

  const nameInput =
    document.getElementById("signupName");

  const emailInput =
    document.getElementById("signupEmail");

  const passwordInput =
    document.getElementById("signupPassword");


  if (!nameInput || !emailInput || !passwordInput) {

    if (authMessage) {
      authMessage.textContent =
        "Signup form is not connected correctly.";
    }

    console.error(
      "Signup input elements missing."
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

    authMessage.textContent =
      "Please enter your display name.";

    return;
  }


  if (!email) {

    authMessage.textContent =
      "Please enter your email.";

    return;
  }


  if (!password) {

    authMessage.textContent =
      "Please create a password.";

    return;
  }


  if (password.length < 6) {

    authMessage.textContent =
      "Password must be at least 6 characters.";

    return;
  }


  authMessage.textContent =
    "Creating your account...";


  try {

    /*
      Create Firebase Authentication account
    */

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


    /*
      Save basic profile
    */

    try {

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

          discoverable:
            false,

          createdAt:
            serverTimestamp()

        },
        {
          merge: true
        }
      );

    } catch (firestoreError) {

      console.error(
        "Profile save error:",
        firestoreError
      );

      /*
        Do not prevent account creation
        if Firestore temporarily fails.
      */
    }


    authMessage.textContent =
      "Account created successfully!";


    /*
      Firebase has already signed the user in.
      Send them to the profile page.
    */

    setTimeout(() => {

      window.location.href =
        "profile.html";

    }, 500);


  } catch (error) {

    console.error(
      "SIGNUP ERROR:",
      error
    );

    console.error(
      "Firebase error code:",
      error?.code
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

loginForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  console.log("Login form submitted");


  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");


  if (!emailInput || !passwordInput) {

    authMessage.textContent =
      "Login form is not connected correctly.";

    console.error(
      "Login input elements missing."
    );

    return;
  }


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email) {

    authMessage.textContent =
      "Please enter your email.";

    return;
  }


  if (!password) {

    authMessage.textContent =
      "Please enter your password.";

    return;
  }


  authMessage.textContent =
    "Logging in...";


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


    authMessage.textContent =
      "Login successful!";


    /*
      IMPORTANT:
      We do NOT redirect here.

      onAuthStateChanged() handles
      showing the application.
    */


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    console.error(
      "Firebase error code:",
      error?.code
    );


    authMessage.textContent =
      getFirebaseError(error);

  }

});


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    console.log(
      "AUTH STATE:",
      user
        ? user.uid
        : "NO USER"
    );


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


    /*
      User is authenticated.
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

    await signOut(auth);

    console.log(
      "User logged out."
    );


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

        showPage(page);

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
              data-chat="${studentDoc.id}"
              type="button"
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


    discoverList.innerHTML = `

      <div class="error-card">
        Unable to load students.
      </div>

    `;

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
            data-community="${community.id}"
            type="button"
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

    }


    postButton.disabled = false;

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


    chatUsers.innerHTML =
      "";


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

  selectedChatUser =
    uid;


  if (messageInput) {

    messageInput.disabled =
      false;

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

        `;

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
   LOAD CHAT MESSAGES
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


    chatMessages.innerHTML =
      "";


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


        /*
          TEXT
        */

        if (
          message.type === "text" ||
          !message.type
        ) {

          bubble.textContent =
            message.text ||
            "";

        }


        /*
          FILE
        */

        else if (
          message.type === "file"
        ) {

          bubble.innerHTML = `

            <div class="file-message">

              📎

              <a
                href="${escapeHTML(
                  message.fileUrl ||
                  "#"
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >

                ${escapeHTML(
                  message.fileName ||
                  "Open attachment"
                )}

              </a>

            </div>

          `;

        }


        /*
          AUDIO
        */

        else if (
          message.type === "audio"
        ) {

          const audio =
            document.createElement(
              "audio"
            );


          audio.controls =
            true;


          audio.src =
            message.fileUrl ||
            "";


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
   SEND TEXT MESSAGE
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
      messageInput?.value.trim();


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


      if (messageInput) {
        messageInput.value = "";
      }


      await loadMessages();


    } catch (error) {

      console.error(
        "Send message error:",
        error
      );


      alert(
        "Could not send message. Check your connection and try again."
      );

    }

  }
);


/* =========================================================
   ATTACHMENT
========================================================= */

const attachmentBtn =
  document.getElementById(
    "attachmentBtn"
  );

const attachmentInput =
  document.getElementById(
    "attachmentInput"
  );


attachmentBtn?.addEventListener(
  "click",
  () => {

    attachmentInput?.click();

  }
);


attachmentInput?.addEventListener(
  "change",
  () => {

    const file =
      attachmentInput.files?.[0];


    if (!file) {
      return;
    }


    alert(
      `Selected: ${file.name}\n\nFirebase Storage upload will be connected when Storage is enabled.`
    );


    attachmentInput.value =
      "";

  }
);


/* =========================================================
   VOICE RECORDING
========================================================= */

const voiceRecordBtn =
  document.getElementById(
    "voiceRecordBtn"
  );


voiceRecordBtn?.addEventListener(
  "click",
  async () => {

    if (isRecording) {

      stopVoiceRecording();

      return;
    }


    try {

      const stream =
        await navigator
          .mediaDevices
          .getUserMedia({
            audio: true
          });


      audioChunks =
        [];


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
            audioUrl;


          if (chatMessages) {

            chatMessages.appendChild(
              audio
            );


            chatMessages.scrollTop =
              chatMessages.scrollHeight;

          }


          alert(
            "Voice recording created. Firebase Storage upload will be connected in the next step."
          );

        }
      );


      mediaRecorder.start();


      isRecording =
        true;


      if (voiceRecordBtn) {

        voiceRecordBtn.textContent =
          "⏹️";

      }


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


/* =========================================================
   STOP RECORDING
========================================================= */

function stopVoiceRecording() {

  if (
    mediaRecorder &&
    mediaRecorder.state !==
      "inactive"
  ) {

    mediaRecorder.stop();

  }


  isRecording =
    false;


  if (voiceRecordBtn) {

    voiceRecordBtn.textContent =
      "🎤";

  }

}


/* =========================================================
   AI ASSISTANT
========================================================= */

aiBtn?.addEventListener(
  "click",
  () => {

    alert(
      "The AI Study Assistant will be connected in the next stage."
    );

  }
);


/* =========================================================
   SECURITY
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

  const code =
    error?.code ||
    "";


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


    case "auth/operation-not-allowed":

      return (
        "Email/password login is not enabled in Firebase."
      );


    case "auth/network-request-failed":

      return (
        "Network connection problem. Check your internet and try again."
      );


    case "auth/too-many-requests":

      return (
        "Too many attempts. Please wait a little and try again."
      );


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
  "StudentConnect JavaScript initialized successfully."
);
