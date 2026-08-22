import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const communityTitle =
  document.getElementById("communityTitle");

const communityDescription =
  document.getElementById("communityDescription");

const postInput =
  document.getElementById("postInput");

const postButton =
  document.getElementById("postButton");

const postsList =
  document.getElementById("communityPosts");


const communities = {

  "study-hub": {
    name: "📚 Study Hub",
    description:
      "Study together and share useful learning tips."
  },

  "coding-club": {
    name: "💻 Coding Club",
    description:
      "Learn programming and build projects together."
  },

  "science-zone": {
    name: "🔬 Science Zone",
    description:
      "Discuss science subjects and school projects."
  },

  "creative-corner": {
    name: "🎨 Creative Corner",
    description:
      "Share art, design, writing, and creative ideas."
  },

  "sports-club": {
    name: "⚽ Sports Club",
    description:
      "Talk about sports and share your favourite teams."
  },

  "exam-prep": {
    name: "📖 Exam Prep",
    description:
      "Prepare for exams together and exchange study strategies."
  }

};


const params =
  new URLSearchParams(window.location.search);

const communityId =
  params.get("community");


if (
  !communityId ||
  !communities[communityId]
) {

  if (communityTitle) {
    communityTitle.textContent =
      "Community not found";
  }

  if (communityDescription) {
    communityDescription.textContent =
      "Please return to the Communities page.";
  }

  if (postButton) {
    postButton.disabled = true;
  }

} else {

  communityTitle.textContent =
    communities[communityId].name;

  communityDescription.textContent =
    communities[communityId].description;

}


onAuthStateChanged(
  auth,
  (user) => {

    if (!user) {

      window.location.href =
        "index.html";

      return;

    }

    if (
      communityId &&
      communities[communityId]
    ) {

      loadPosts();

    }

  }
);


function loadPosts() {

  if (!postsList) {
    console.error(
      "communityPosts element was not found."
    );
    return;
  }


  const postsRef =
    collection(
      db,
      "communityPosts"
    );


  const postsQuery =
    query(
      postsRef,
      where(
        "communityId",
        "==",
        communityId
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  onSnapshot(
    postsQuery,
    (snapshot) => {

      postsList.innerHTML = "";


      if (snapshot.empty) {

        postsList.innerHTML = `
          <div class="community-card">
            <p>
              No discussions yet.
              Be the first to start one!
            </p>
          </div>
        `;

        return;
      }


      snapshot.forEach(
        (postDoc) => {

          const post =
            postDoc.data();


          const postCard =
            document.createElement(
              "div"
            );

          postCard.className =
            "community-card";


          const date =
            post.createdAt?.toDate
              ? post.createdAt.toDate()
              : null;


          postCard.innerHTML = `

            <p>
              <strong>
                👤 Student
              </strong>
            </p>

            <p>
              ${escapeHTML(post.text || "")}
            </p>

            ${
              date
                ? `<small>${date.toLocaleString()}</small>`
                : ""
            }

          `;


          postsList.appendChild(
            postCard
          );

        }
      );

    },
    (error) => {

      console.error(
        "Community loading error:",
        error
      );

      postsList.innerHTML = `
        <div class="community-card">
          <p>
            We couldn't load the discussions.
          </p>
        </div>
      `;

    }
  );

}


if (postButton) {

  postButton.addEventListener(
    "click",
    async () => {

      const text =
        postInput.value.trim();


      if (!text) {

        alert(
          "Please write something first."
        );

        return;

      }


      if (text.length > 500) {

        alert(
          "Your post is too long."
        );

        return;

      }


      const user =
        auth.currentUser;


      if (!user) {

        window.location.href =
          "index.html";

        return;

      }


      try {

        postButton.disabled = true;

        postButton.textContent =
          "Posting...";


        await addDoc(
          collection(
            db,
            "communityPosts"
          ),
          {

            communityId:
              communityId,

            userId:
              user.uid,

            text:
              text,

            createdAt:
              serverTimestamp()

          }
        );


        postInput.value = "";


      } catch (error) {

        console.error(
          "Post error:",
          error
        );

        alert(
          "Your post could not be created. Please try again."
        );

      } finally {

        postButton.disabled = false;

        postButton.textContent =
          "Post";

      }

    }
  );

}


function escapeHTML(text) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    text;

  return div.innerHTML;

}
