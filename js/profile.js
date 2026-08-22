import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const profileForm = document.getElementById("profileForm");
const countrySelect = document.getElementById("country");
const levelSelect = document.getElementById("level");


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

  if (!countrySelect || !levelSelect) return;

  const country = countrySelect.value;

  const currentLevel = levelSelect.value;

  levelSelect.innerHTML = "";

  const firstOption = document.createElement("option");

  firstOption.value = "";

  firstOption.textContent =
    country
      ? "Choose your level"
      : "Choose your country first";

  levelSelect.appendChild(firstOption);

  if (!country) {

    levelSelect.disabled = true;

    return;
  }

  levelSelect.disabled = false;

  const levels =
    schoolLevels[country] ||
    schoolLevels.default;

  levels.forEach(level => {

    const option =
      document.createElement("option");

    option.value = level;

    option.textContent = level;

    levelSelect.appendChild(option);

  });

  if (currentLevel &&
      levels.includes(currentLevel)) {

    levelSelect.value = currentLevel;

  }

}


/* =========================
   COUNTRY CHANGE
========================= */

if (countrySelect) {

  countrySelect.addEventListener(
    "change",
    () => {

      levelSelect.value = "";

      updateSchoolLevels();

    }
  );

}


/* =========================
   AUTH
========================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      alert("Please log in first.");

      window.location.href =
        "index.html";

      return;
    }


    /* =========================
       LOAD EXISTING PROFILE
    ========================= */

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


        const displayName =
          document.getElementById(
            "displayName"
          );

        const region =
          document.getElementById(
            "region"
          );

        const school =
          document.getElementById(
            "school"
          );

        const subject =
          document.getElementById(
            "subjects"
          );

        const interest =
          document.getElementById(
            "interests"
          );


        if (displayName)
          displayName.value =
            data.displayName || "";


        if (countrySelect &&
            data.country) {

          countrySelect.value =
            data.country;

          updateSchoolLevels();

        }


        if (region)
          region.value =
            data.region || "";


        if (school)
          school.value =
            data.school || "";


        if (levelSelect)
          levelSelect.value =
            data.level || "";


        if (subject)
          subject.value =
            data.subject || "";


        if (interest)
          interest.value =
            data.interest || "";


        if (
          data.discoverable !==
          undefined
        ) {

          const radio =
            document.querySelector(
              `input[name="discoverable"][value="${
                data.discoverable
                  ? "yes"
                  : "no"
              }"]`
            );

          if (radio) {
            radio.checked = true;
          }

        }

      }

    } catch (error) {

      console.error(
        "Could not load profile:",
        error
      );

    }


    /* =========================
       SAVE PROFILE
    ========================= */

    if (!profileForm) return;


    profileForm.addEventListener(
      "submit",
      async event => {

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
            "Please choose whether other students can discover you."
          );

          return;
        }


        const discoverable =
          selectedRadio.value === "yes";


        try {

          /* =========================
             SAVE MAIN USER PROFILE
          ========================= */

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


          /* =========================
             DISCOVERABLE PROFILE
          ========================= */

          const discoverableRef =
            doc(
              db,
              "discoverableProfiles",
              user.uid
            );


          if (discoverable) {

            await setDoc(
              discoverableRef,
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

                discoverable:
                  true,

                updatedAt:
                  serverTimestamp()

              },
              {
                merge: true
              }
            );

          } else {

            /*
             * If the student changes their
             * setting to private, remove
             * their discoverable profile.
             */

            await deleteDoc(
              discoverableRef
            );

          }


          alert(
            "Profile saved successfully! 🎉"
          );


          window.location.href =
            "dashboard.html";


        } catch (error) {

          console.error(
            "Profile save error:",
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
