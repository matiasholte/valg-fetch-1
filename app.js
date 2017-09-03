let electionResults = require("./electionResults");
let database = require("./database");

const ELECTION_PATH = "/2015/ko";

async function run() {
  let db = await database.initialize();
  console.log("initialized database");
  await electionResults.storeNewResultsForElection(ELECTION_PATH, db);
  console.log("stored results from api");
  console.log("done, exiting");
  process.exit(0);
}

run();
