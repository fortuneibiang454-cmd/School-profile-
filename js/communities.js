import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

const buttons = document.querySelectorAll(".join-community");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  buttons.forEach((button) => {

    const communityId = button.dataset.community;

    checkMembership(
      user.uid,
      communityId,
      button
    );

    button.addEventListener("click", async () => {

      const membershipRef = doc(
        db,
        "communityMembers",
        `${communityId}_${user.uid}`
      );

      try {

        const membership =
          await getDoc(membershipRef);

        if (membership.exists()) {

          await deleteDoc(membershipRef);

          button.textContent =
            "Join Community";

          alert("You left the community.");

        } else {

          await setDoc(
            membershipRef,
            {
              communityId: communityId,
              userId: user.uid,
              joinedAt: new Date()
            }
          );

          button.textContent =
            "Leave Community";

          alert("You joined the community!");

        }

      } catch (error) {

        console.error(
          "Community error:",
          error
        );

        alert(
          "Something went wrong. Please try again."
        );
      }
    });
  });
});

async function checkMembership(
  userId,
  communityId,
  button
) {

  const membershipRef = doc(
    db,
    "communityMembers",
    `${communityId}_${userId}`
  );

  const membership =
    await getDoc(membershipRef);

  if (membership.exists()) {
    button.textContent =
      "Leave Community";
  }
}
