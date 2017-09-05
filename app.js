// @flow

let electionResults = require("./electionResults");
let database = require("./database");

const ELECTION_PATH = "/2017/st";

async function run() {
  let db = await database.initialize();
  console.log("initialized database");
  await electionResults.storeNewResults(ELECTION_PATH, db);
  console.log("stored results from api");
  console.log("done, exiting");
  process.exit(0);
}

run();
