import {
  auth,
  db
} from "./firebase.js";


import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* -----------------------------
   ELEMENTS
----------------------------- */

const authScreen =
  document.getElementById("authScreen");

const appScreen =
  document.getElementById("appScreen");

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


let currentUser = null;

let currentProfile = null;

let selectedChatUser = null;

let unsubscribeMessages = null;

let selectedCommunity = null;


/* -----------------------------
   AUTH MODE
----------------------------- */

switchAuth.addEventListener(
  "click",
  () => {

    const signupVisible =
      !signupForm.classList.contains("hidden");


    if (signupVisible) {

      signupForm.classList.add("hidden");

      loginForm.classList.remove("hidden");

      switchAuth.textContent =
        "Create an account";

    } else {

      loginForm.classList.add("hidden");

      signupForm.classList.remove("hidden");

      switchAuth.textContent =
        "Back to Login";

    }

    authMessage.textContent = "";

  }
);


/* -----------------------------
   LOGIN
----------------------------- */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    authMessage.textContent = "";

    const email =
      document.getElementById(
        "loginEmail"
      ).value.trim();

    const password =
      document.getElementById(
        "loginPassword"
      ).value;


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        friendlyAuthError(error);

    }

  }
);


/* -----------------------------
   SIGN UP
----------------------------- */

signupForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    authMessage.textContent = "";


    const name =
      document.getElementById(
        "signupName"
      ).value.trim();

    const email =
      document.getElementById(
        "signupEmail"
      ).value.trim();

    const password =
      document.getElementById(
        "signupPassword"
      ).value;

    const level =
      document.getElementById(
        "signupLevel"
      ).value;

    const subject =
      document.getElementById(
        "signupSubject"
      ).value.trim();

    const interest =
      document.getElementById(
        "signupInterest"
      ).value.trim();


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

          displayName: name,

          level: level,

          subject: subject,

          interest: interest,

          discoverable: true,

          email: email,

          createdAt:
            serverTimestamp()

        }
      );


      authMessage.textContent =
        "Account created successfully.";

    } catch (error) {

      console.error(error);

      authMessage.textContent =
        friendlyAuthError(error);

    }

  }
);


/* -----------------------------
   AUTH STATE
----------------------------- */

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;


    if (!user) {

      authScreen.classList.remove(
        "hidden"
      );

      appScreen.classList.add(
        "hidden"
      );

      return;
    }


    authScreen.classList.add(
      "hidden"
    );

    appScreen.classList.remove(
      "hidden"
    );


    await loadProfile();

    await loadDiscover();

    await loadChatUsers();

    renderCommunities();

  }
);


/* -----------------------------
   LOGOUT
----------------------------- */

logoutBtn.addEventListener(
  "click",
  async () => {

    if (unsubscribeMessages) {

      unsubscribeMessages();

      unsubscribeMessages = null;

    }

    await signOut(auth);

  }
);


/* -----------------------------
   NAVIGATION
----------------------------- */

document
  .querySelectorAll(
    "[data-page]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


function showPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach((page) => {

      page.classList.remove(
        "active"
      );

    });


  const page =
    document.getElementById(
      `page-${pageName}`
    );


  if (page) {

    page.classList.add(
      "active"
    );

  }

}


/* -----------------------------
   PROFILE
----------------------------- */

async function loadProfile() {

  if (!currentUser) return;


  const profileRef =
    doc(
      db,
      "users",
      currentUser.uid
    );


  const snapshot =
    await getDoc(profileRef);


  if (!snapshot.exists()) {

    currentProfile = {

      displayName:
        currentUser.email || "Student",

      level: "",

      subject: "",

      interest: "",

      discoverable: true

    };

    return;

  }


  currentProfile =
    snapshot.data();


  document.getElementById(
    "welcomeMessage"
  ).textContent =
    `Welcome, ${
      currentProfile.displayName ||
      "Student"
    } 👋`;


  document.getElementById(
    "profileName"
  ).textContent =
    currentProfile.displayName ||
    "Not provided";


  document.getElementById(
    "profileEmail"
  ).textContent =
    currentUser.email ||
    "Not provided";


  document.getElementById(
    "profileLevel"
  ).textContent =
    currentProfile.level ||
    "Not provided";


  document.getElementById(
    "profileSubject"
  ).textContent =
    currentProfile.subject ||
    "Not provided";


  document.getElementById(
    "profileInterest"
  ).textContent =
    currentProfile.interest ||
    "Not provided";

}


/* -----------------------------
   DISCOVER
----------------------------- */

async function loadDiscover() {

  const list =
    document.getElementById(
      "discoverList"
    );


  list.innerHTML =
    "<div class='card'>Loading students...</div>";


  try {

    const studentsQuery =
      query(
        collection(db, "users"),
        where(
          "discoverable",
          "==",
          true
        )
      );


    const snapshot =
      await getDocs(
        studentsQuery
      );


    list.innerHTML = "";


    let count = 0;


    snapshot.forEach(
      (studentDoc) => {

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
            "div"
          );


        card.className =
          "card student-card";


        card.innerHTML = `

          <h3>
            👤 ${escapeHTML(
              student.displayName ||
              "Student"
            )}
          </h3>

          <div>
            <strong>Level:</strong>
            ${escapeHTML(
              student.level ||
              "Not provided"
            )}
          </div>

          <div>
            <strong>Subject:</strong>
            ${escapeHTML(
              student.subject ||
              "Not provided"
            )}
          </div>

          <div>
            <strong>Interest:</strong>
            ${escapeHTML(
              student.interest ||
              "Not provided"
            )}
          </div>

          <button
            class="action-btn message-student"
          >
            Message
          </button>

        `;


        const messageButton =
          card.querySelector(
            ".message-student"
          );


        messageButton.addEventListener(
          "click",
          () => {

            openChat(
              studentDoc.id,
              student
            );

          }
        );


        list.appendChild(card);

      }
    );


    if (count === 0) {

      list.innerHTML = `
        <div class="card">
          <h3>No students found yet.</h3>
          <p>
            When other students choose to
            be discoverable, they'll appear here.
          </p>
        </div>
      `;

    }

  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="card">
        Could not load students.
      </div>
    `;

  }

}


/* -----------------------------
   COMMUNITIES
----------------------------- */

const communities = [

  {
    id: "study-hub",
    name: "📚 Study Hub",
    description:
      "Study together and share useful learning tips."
  },

  {
    id: "coding-club",
    name: "💻 Coding Club",
    description:
      "Learn programming and build projects together."
  },

  {
    id: "science-zone",
    name: "🔬 Science Zone",
    description:
      "Discuss science subjects and school projects."
  },

  {
    id: "creative-corner",
    name: "🎨 Creative Corner",
    description:
      "Share art, design, writing and creative ideas."
  },

  {
    id: "sports-club",
    name: "⚽ Sports Club",
    description:
      "Talk about sports and your favourite teams."
  },

  {
    id: "exam-prep",
    name: "📖 Exam Prep",
    description:
      "Prepare for exams together."
  }

];


function renderCommunities() {

  const list =
    document.getElementById(
      "communityList"
    );


  list.innerHTML = "";


  communities.forEach(
    (community) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "card community-card";


      card.innerHTML = `

        <h3>
          ${community.name}
        </h3>

        <p>
          ${community.description}
        </p>

        <button
          class="action-btn"
        >
          Open Community
        </button>

      `;


      card
        .querySelector("button")
        .addEventListener(
          "click",
          () => {

            openCommunity(
              community
            );

          }
        );


      list.appendChild(card);

    }
  );

}


function openCommunity(
  community
) {

  selectedCommunity =
    community;


  document
    .getElementById(
      "communityList"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "communityView"
    )
    .classList.remove(
      "hidden"
    );


  document.getElementById(
    "communityTitle"
  ).textContent =
    community.name;


  document.getElementById(
    "communityDescription"
  ).textContent =
    community.description;


  loadCommunityPosts();

}


document
  .getElementById(
    "backToCommunities"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "communityView"
        )
        .classList.add(
          "hidden"
        );


      document
        .getElementById(
          "communityList"
        )
        .classList.remove(
          "hidden"
        );

    }
  );


/* -----------------------------
   COMMUNITY POSTS
----------------------------- */

async function loadCommunityPosts() {

  if (!selectedCommunity)
    return;


  const postsBox =
    document.getElementById(
      "communityPosts"
    );


  postsBox.innerHTML =
    "<div class='card'>Loading posts...</div>";


  const postsQuery =
    query(
      collection(
        db,
        "communityPosts"
      ),
      where(
        "communityId",
        "==",
        selectedCommunity.id
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  onSnapshot(
    postsQuery,
    (snapshot) => {

      postsBox.innerHTML = "";


      if (snapshot.empty) {

        postsBox.innerHTML = `
          <div class="card">
            <p>
              No discussions yet.
              Be the first to post!
            </p>
          </div>
        `;

        return;

      }


      snapshot.forEach(
        (postDoc) => {

          const post =
            postDoc.data();


          const div =
            document.createElement(
              "div"
            );


          div.className =
            "post";


          const date =
            post.createdAt?.toDate
              ? post.createdAt.toDate()
              : null;


          div.innerHTML = `

            <div class="post-meta">
              👤 Student
              ${
                date
                  ? " • " +
                    escapeHTML(
                      date.toLocaleString()
                    )
                  : ""
              }
            </div>

            <div>
              ${escapeHTML(
                post.text || ""
              )}
            </div>

          `;


          postsBox.appendChild(
            div
          );

        }
      );

    },
    (error) => {

      console.error(error);

      postsBox.innerHTML = `
        <div class="card">
          Unable to load posts.
        </div>
      `;

    }
  );

}


/* -----------------------------
   CREATE COMMUNITY POST
----------------------------- */

document
  .getElementById(
    "postButton"
  )
  .addEventListener(
    "click",
    async () => {

      const input =
        document.getElementById(
          "postInput"
        );


      const text =
        input.value.trim();


      if (!text) {

        alert(
          "Please write something first."
        );

        return;

      }


      if (!selectedCommunity) {

        return;

      }


      try {

        await addDoc(
          collection(
            db,
            "communityPosts"
          ),
          {

            communityId:
              selectedCommunity.id,

            userId:
              currentUser.uid,

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        input.value = "";


      } catch (error) {

        console.error(error);

        alert(
          "Post could not be created."
        );

      }

    }
  );


/* -----------------------------
   CHAT USERS
----------------------------- */

async function loadChatUsers() {

  const list =
    document.getElementById(
      "chatUsers"
    );


  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "users"
        )
      );


    list.innerHTML = "";


    let count = 0;


    snapshot.forEach(
      (studentDoc) => {

        if (
          studentDoc.id ===
          currentUser.uid
        ) {

          return;

        }


        const student =
          studentDoc.data();


        if (
          student.discoverable ===
          false
        ) {

          return;

        }


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

            openChat(
              studentDoc.id,
              student
            );

          }
        );


        list.appendChild(
          button
        );

      }
    );


    if (count === 0) {

      list.innerHTML =
        "No students available yet.";

    }

  } catch (error) {

    console.error(error);

    list.textContent =
      "Could not load students.";

  }

}


/* -----------------------------
   CHAT
----------------------------- */

function getChatId(
  firstUser,
  secondUser
) {

  return [
    firstUser,
    secondUser
  ]
    .sort()
    .join("_");

}


function openChat(
  userId,
  student
) {

  selectedChatUser = {

    uid: userId,

    ...student

  };


  showPage("messages");


  document.getElementById(
    "chatTitle"
  ).textContent =
    `Chat with ${
      student.displayName ||
      "Student"
    }`;


  document.getElementById(
    "messageInput"
  ).disabled = false;


  loadMessages();

}


function loadMessages() {

  if (!selectedChatUser)
    return;


  if (unsubscribeMessages) {

    unsubscribeMessages();

  }


  const chatId =
    getChatId(
      currentUser.uid,
      selectedChatUser.uid
    );


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


  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      (snapshot) => {

        const box =
          document.getElementById(
            "chatMessages"
          );


        box.innerHTML = "";


        snapshot.forEach(
          (messageDoc) => {

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


            box.appendChild(
              div
            );

          }
        );


        box.scrollTop =
          box.scrollHeight;

      },
      (error) => {

        console.error(error);

      }
    );

}


/* -----------------------------
   SEND MESSAGE
----------------------------- */

document
  .getElementById(
    "chatForm"
  )
  .addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      if (
        !selectedChatUser
      ) {

        alert(
          "Select a student first."
        );

        return;

      }


      const input =
        document.getElementById(
          "messageInput"
        );


      const text =
        input.value.trim();


      if (!text)
        return;


      const chatId =
        getChatId(
          currentUser.uid,
          selectedChatUser.uid
        );


      try {

        await setDoc(
          doc(
            db,
            "chats",
            chatId
          ),
          {

            participants: [
              currentUser.uid,
              selectedChatUser.uid
            ],

            updatedAt:
              serverTimestamp()

          },
          {
            merge: true
          }
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
              selectedChatUser.uid,

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        input.value = "";


      } catch (error) {

        console.error(error);

        alert(
          "Message could not be sent."
        );

      }

    }
  );


/* -----------------------------
   AI BUTTON
----------------------------- */

document
  .getElementById("aiBtn")
  .addEventListener(
    "click",
    () => {

      alert(
        "The AI Study Assistant will be connected to its server/API in the next step. 🤖📚"
      );

    }
  );


/* -----------------------------
   SECURITY-FRIENDLY TEXT
----------------------------- */

function escapeHTML(
  value
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

}


/* -----------------------------
   AUTH ERRORS
----------------------------- */

function friendlyAuthError(
  error
) {

  switch (error.code) {

    case "auth/invalid-credential":
      return "Email or password is incorrect.";

    case "auth/invalid-email":
      return "Please enter a valid email.";

    case "auth/email-already-in-use":
      return "That email is already registered.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    case "auth/network-request-failed":
      return "Check your internet connection.";

    default:
      return error.message ||
        "Something went wrong.";

  }

}
