import firebase from "firebase";
import fetch from "node-fetch";
let config = require("./secrets");

async function run() {
  //  let database = await initializeDatabase();
  await checkElectionResults();
  process.exit(0);
}

async function checkElectionResults() {
  let result = await fetch("http://valgresultat.no/api/2015/ko");
  if (result.status !== 200) {
    console.error(result.status);
    return;
  }
  let body = await result.json();
  console.log(body);
}

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

run();
