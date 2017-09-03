import firebase from "firebase";
var config = require("./secrets");

async function run() {
  // Initialize Firebase
  firebase.initializeApp(config.fb);
  try {
    await firebase
      .auth()
      .signInWithEmailAndPassword(config.fbUser.email, config.fbUser.password);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("logged in!");
}

run();
