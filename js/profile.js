import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const profileForm =
document.getElementById("profileForm");

onAuthStateChanged(
auth,
(user) => {

if (!user) {

  alert("Please log in first.");

  window.location.href =
    "login.html";

  return;

}


profileForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const displayName =
      document
        .getElementById("displayName")
        .value
        .trim();


    const country =
      document
        .getElementById("country")
        .value;


    const region =
      document
        .getElementById("region")
        .value
        .trim();


    const school =
      document
        .getElementById("school")
        .value
        .trim();


    const level =
      document
        .getElementById("level")
        .value;


    const subject =
      document
        .getElementById("subjects")
        .value;


    const interest =
      document
        .getElementById("interests")
        .value;


    const discoverable =
      document.querySelector(
        'input[name="discoverable"]:checked'
      ).value;


    try {

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {

          displayName:
            displayName,

          email:
            user.email || "",

          country:
            country,

          region:
            region,

          school:
            school,

          level:
            level,

          subject:
            subject,

          interest:
            interest,

          discoverable:
            discoverable === "yes",

          updatedAt:
            new Date()

        },
        {
          merge: true
        }
      );


      if (
        discoverable === "yes"
      ) {

        await setDoc(
          doc(
            db,
            "discoverableProfiles",
            user.uid
          ),
          {

            displayName:
              displayName,

            country:
              country,

            region:
              region,

            school:
              school,

            level:
              level,

            subject:
              subject,

            interest:
              interest

          },
          {
            merge: true
          }
        );

      }


      alert(
        "Profile saved successfully!"
      );


      window.location.href =
        "dashboard.html";


    } catch (error) {

      console.error(
        "Profile error:",
        error
      );

      alert(
        "Could not save your profile. Please try again."
      );

    }

  }
);

}
);
