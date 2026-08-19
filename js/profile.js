import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
doc,
setDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const profileForm =
document.getElementById("profileForm");

const countrySelect =
document.getElementById("country");

const levelSelect =
document.getElementById("level");

/*
SCHOOL LEVELS BY COUNTRY

These are broad school-level labels.
Education systems can vary within countries,
so students can use the closest applicable level.
*/

const schoolLevels = {

Nigeria: [
"JSS1",
"JSS2",
"JSS3",
"SS1",
"SS2",
"SS3"
],

Ghana: [
"Basic 7",
"Basic 8",
"Basic 9",
"SHS 1",
"SHS 2",
"SHS 3"
],

Kenya: [
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

"South Africa": [
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

"United Kingdom": [
"Year 7",
"Year 8",
"Year 9",
"Year 10",
"Year 11",
"Year 12",
"Year 13"
],

"United States": [
"Grade 6",
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

Canada: [
"Grade 6",
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

Australia: [
"Year 7",
"Year 8",
"Year 9",
"Year 10",
"Year 11",
"Year 12"
],

"New Zealand": [
"Year 7",
"Year 8",
"Year 9",
"Year 10",
"Year 11",
"Year 12",
"Year 13"
],

India: [
"Class 6",
"Class 7",
"Class 8",
"Class 9",
"Class 10",
"Class 11",
"Class 12"
],

Pakistan: [
"Grade 6",
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

Bangladesh: [
"Class 6",
"Class 7",
"Class 8",
"Class 9",
"Class 10",
"Class 11",
"Class 12"
],

Philippines: [
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12"
],

Singapore: [
"Secondary 1",
"Secondary 2",
"Secondary 3",
"Secondary 4",
"Junior College 1",
"Junior College 2"
],

Malaysia: [
"Form 1",
"Form 2",
"Form 3",
"Form 4",
"Form 5"
],

Germany: [
"Grade 6",
"Grade 7",
"Grade 8",
"Grade 9",
"Grade 10",
"Grade 11",
"Grade 12",
"Grade 13"
],

France: [
"6ème",
"5ème",
"4ème",
"3ème",
"Seconde",
"Première",
"Terminale"
],

Brazil: [
"6º Ano",
"7º Ano",
"8º Ano",
"9º Ano",
"1º Ano",
"2º Ano",
"3º Ano"
]

};

/*
DEFAULT LEVELS

Used for countries whose education
system hasn't been specifically listed yet.
*/

const defaultLevels = [
"Lower Secondary",
"Middle School",
"Upper Secondary",
"High School",
"Other"
];

/*
UPDATE SCHOOL LEVELS
WHEN COUNTRY CHANGES
*/

function updateSchoolLevels() {

const country =
countrySelect.value;

const levels =
schoolLevels[country] ||
defaultLevels;

levelSelect.innerHTML = "";

const firstOption =
document.createElement("option");

firstOption.value = "";

firstOption.textContent =
"Choose your level";

levelSelect.appendChild(
firstOption
);

levels.forEach(
(level) => {

  const option =
    document.createElement(
      "option"
    );

  option.value = level;

  option.textContent = level;

  levelSelect.appendChild(
    option
  );

}

);

}

/*
COUNTRY CHANGE
*/

countrySelect.addEventListener(
"change",
updateSchoolLevels
);

/*
AUTHENTICATION
*/

onAuthStateChanged(
auth,
(user) => {

if (!user) {

  alert(
    "Please log in first."
  );

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


    const discoverableChoice =
      document.querySelector(
        'input[name="discoverable"]:checked'
      );


    if (!discoverableChoice) {

      alert(
        "Please choose your discoverability setting."
      );

      return;

    }


    const discoverable =
      discoverableChoice.value === "yes";


    try {

      /*
        SAVE MAIN PROFILE
      */

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
            discoverable,

          updatedAt:
            new Date()

        },
        {
          merge: true
        }
      );


      /*
        SAVE OR REMOVE
        DISCOVERABLE PROFILE
      */

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

      } else {

        await deleteDoc(
          discoverableRef
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
