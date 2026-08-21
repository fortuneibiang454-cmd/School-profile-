import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const profileForm =
  document.getElementById("profileForm");

const countrySelect =
  document.getElementById("country");

const levelSelect =
  document.getElementById("level");


/* =========================
   COUNTRY SCHOOL SYSTEMS
========================= */

const schoolLevels = {

  Nigeria: [
    "Primary 1",
    "Primary 2",
    "Primary 3",
    "Primary 4",
    "Primary 5",
    "Primary 6",
    "JSS1",
    "JSS2",
    "JSS3",
    "SS1",
    "SS2",
    "SS3",
    "University"
  ],

  Ghana: [
    "Basic 1",
    "Basic 2",
    "Basic 3",
    "Basic 4",
    "Basic 5",
    "Basic 6",
    "JHS1",
    "JHS2",
    "JHS3",
    "SHS1",
    "SHS2",
    "SHS3",
    "University"
  ],

  Kenya: [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "University"
  ],

  "United States": [
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "College / University"
  ],

  Canada: [
    "Kindergarten",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "College / University"
  ],

  "United Kingdom": [
    "Reception",
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "Year 10",
    "Year 11",
    "Year 12",
    "Year 13",
    "University"
  ],

  "South Africa": [
    "Grade R",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "University"
  ],

  India: [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
    "University"
  ],

  Australia: [
    "Prep / Foundation",
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "Year 10",
    "Year 11",
    "Year 12",
    "University"
  ],

  default: [
    "Primary School",
    "Lower Secondary",
    "Upper Secondary",
    "College",
    "University"
  ]

};


/* =========================
   UPDATE LEVELS
========================= */

function updateSchoolLevels() {

  const country =
    countrySelect.value;


  levelSelect.innerHTML = "";


  const firstOption =
    document.createElement("option");

  firstOption.value = "";

  firstOption.textContent =
    country
      ? "Choose your level"
      : "Choose your country first";

  levelSelect.appendChild(
    firstOption
  );


  if (!country) {
    levelSelect.disabled = true;
    return;
  }


  levelSelect.disabled = false;


  const levels =
    schoolLevels[country] ||
    schoolLevels.default;


  levels.forEach(
    (level) => {

      const option =
        document.createElement("option");

      option.value = level;

      option.textContent = level;

      levelSelect.appendChild(
        option
      );

    }
  );

}


/* =========================
   COUNTRY CHANGE
========================= */

countrySelect.addEventListener(
  "change",
  updateSchoolLevels
);


/* =========================
   AUTH CHECK
========================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      alert(
        "Please log in first."
      );

      window.location.href =
        "index.html";

      return;

    }


    /*
     * Load existing profile if one exists.
     */

    try {

      const profileRef =
        doc(
          db,
          "users",
          user.uid
        );

      const profileSnap =
        await getDoc(profileRef);


      if (profileSnap.exists()) {

        const data =
          profileSnap.data();


        if (data.country) {

          countrySelect.value =
            data.country;

          updateSchoolLevels();

        }


        if (data.displayName) {

          document
            .getElementById("displayName")
            .value =
              data.displayName;

        }


        if (data.region) {

          document
            .getElementById("region")
            .value =
              data.region;

        }


        if (data.school) {

          document
            .getElementById("school")
            .value =
              data.school;

        }


        if (data.level) {

          levelSelect.value =
            data.level;

        }


        if (data.subject) {

          document
            .getElementById("subjects")
            .value =
              data.subject;

        }


        if (data.interest) {

          document
            .getElementById("interests")
            .value =
              data.interest;

        }


        if (
          data.discoverable !==
          undefined
        ) {

          const value =
            data.discoverable
              ? "yes"
              : "no";


          const radio =
            document.querySelector(
              `input[name="discoverable"][value="${value}"]`
            );


          if (radio) {
            radio.checked = true;
          }

        }

      }

    }

    catch (error) {

      console.error(
        "Could not load profile:",
        error
      );

    }


    /* =========================
       SAVE PROFILE
    ========================= */

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
          countrySelect.value;


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
          levelSelect.value;


        const subject =
          document
            .getElementById("subjects")
            .value;


        const interest =
          document
            .getElementById("interests")
            .value;


        const selectedRadio =
          document.querySelector(
            'input[name="discoverable"]:checked'
          );


        if (!selectedRadio) {

          alert(
            "Please choose your discoverability setting."
          );

          return;

        }


        const discoverable =
          selectedRadio.value === "yes";


        try {

          /*
           * Save complete profile.
           */

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
                discoverable,

              profileComplete:
                true,

              updatedAt:
                serverTimestamp()

            },
            {
              merge: true
            }
          );


          /*
           * Add to discoverableProfiles
           * only when the student agrees.
           */

          if (discoverable) {

            await setDoc(
              doc(
                db,
                "discoverableProfiles",
                user.uid
              ),
              {

                uid:
                  user.uid,

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
                  interest,

                updatedAt:
                  serverTimestamp()

              },
              {
                merge: true
              }
            );

          }


          alert(
            "Profile saved successfully! 🎉"
          );


          /*
           * Go to dashboard.
           */

          window.location.href =
            "dashboard.html";

        }

        catch (error) {

          console.error(
            "Profile error:",
            error
          );

          alert(
            "Could not save your profile: " +
            error.message
          );

        }

      },
      {
        once: true
      }
    );

  }
);


/* =========================
   INITIAL LEVEL STATE
========================= */

updateSchoolLevels();
