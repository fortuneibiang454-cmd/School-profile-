try {

  const chatId = getChatId(
    currentUser.uid,
    otherUserId
  );

  await setDoc(
    doc(db, "chats", chatId),
    {
      participants: [currentUser.uid, otherUserId],
      updatedAt: serverTimestamp()
    },
    { merge: true }
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
