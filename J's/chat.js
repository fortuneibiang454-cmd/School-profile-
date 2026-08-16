import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const messagesBox = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const chatTitle = document.getElementById("chatTitle");

const params = new URLSearchParams(window.location.search);
const otherUserId = params.get("user");

let currentUser = null;

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  if (!otherUserId || otherUserId === currentUser.uid) {
    messagesBox.innerHTML = `
      <p>No valid student selected.</p>
    `;
    messageForm.style.display = "none";
    return;
  }

  startChat();
});

function getChatId(userA, userB) {
  return [userA, userB].sort().join("_");
}

function startChat() {

  const chatId = getChatId(currentUser.uid, otherUserId);

  const messagesRef = collection(
    db,
    "chats",
    chatId,
    "messages"
  );

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  onSnapshot(messagesQuery, (snapshot) => {

    messagesBox.innerHTML = "";

    if (snapshot.empty) {
      messagesBox.innerHTML = `
        <p>No messages yet. Start the conversation.</p>
      `;
      return;
    }

    snapshot.forEach((messageDoc) => {

      const message = messageDoc.data();

      const messageElement = document.createElement("div");

      messageElement.className =
        message.senderId === currentUser.uid
          ? "message mine"
          : "message theirs";

      messageElement.textContent = message.text;

      messagesBox.appendChild(messageElement);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
  });
}

messageForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text || !currentUser || !otherUserId) {
    return;
  }

  try {

    const chatId = getChatId(
      currentUser.uid,
      otherUserId
    );

    await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        senderId: currentUser.uid,
        receiverId: otherUserId,
        text: text,
        createdAt: serverTimestamp()
      }
    );

    messageInput.value = "";

  } catch (error) {

    console.error("Message error:", error);

    alert("Message could not be sent. Please try again.");
  }
});
