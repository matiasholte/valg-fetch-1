let firebase = require("firebase");
let config = require("./secrets");

async function initializeFirebase() {
  firebase.initializeApp(config.fb);
  try {
    await firebase
      .auth()
      .signInWithEmailAndPassword(config.fbUser.email, config.fbUser.password);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return firebase.database();
}

module.exports = { initialize: initializeFirebase };
