import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc
} from "firebase/firestore";

const conversationList =
  document.getElementById("conversationList");

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadConversations(user.uid);
});

function loadConversations(userId) {

  const chatsRef = collection(db, "chats");

  const chatsQuery = query(
    chatsRef,
    where("participants", "array-contains", userId)
  );

  onSnapshot(chatsQuery, async (snapshot) => {

    conversationList.innerHTML = "";

    if (snapshot.empty) {
      conversationList.innerHTML = `
        <div class="student-card">
          <h2>💬 No conversations yet</h2>
          <p>
            Go to Discover and message another student
            to start a conversation.
          </p>
        </div>
      `;
      return;
    }

    for (const chatDoc of snapshot.docs) {

      const chat = chatDoc.data();

      const otherUserId =
        chat.participants.find(
          (id) => id !== userId
        );

      if (!otherUserId) {
        continue;
      }

      let displayName = "Student";

      try {

        const profileSnapshot = await getDoc(
          doc(db, "discoverableProfiles", otherUserId)
        );

        if (profileSnapshot.exists()) {

          const profile =
            profileSnapshot.data();

          displayName =
            profile.displayName || "Student";
        }

      } catch (error) {

        console.error(
          "Profile loading error:",
          error
        );
      }

      const conversation =
        document.createElement("div");

      conversation.className =
        "conversation-card";

      conversation.innerHTML = `
        <h2>👤 ${displayName}</h2>

        <p>
          Private conversation
        </p>

        <button class="btn" type="button">
          Open Chat
        </button>
      `;

      conversation
        .querySelector("button")
        .addEventListener("click", () => {

          window.location.href =
            "chat.html?user=" + otherUserId;
        });

      conversationList.appendChild(
        conversation
      );
    }
  });
  }
