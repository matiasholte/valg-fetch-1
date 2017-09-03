let electionResults = require("./electionResults");
let database = require("./database");

async function run() {
  let db = await database.initialize();
  console.log("initialized database");
  let topLevelResults = await electionResults.topLevel();
  console.log("got results from api");
  await electionResults.store(topLevelResults, db);
  console.log("stored results in database");
  console.log("done, exiting");
  process.exit(0);
}

run();
