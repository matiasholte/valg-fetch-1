// @flow

let cmdParser = require("optimist");
let electionResults = require("./electionResults");
let database = require("./database");

let argv = cmdParser
  .usage(
    "Fetch Norwegian election results and put them in a Firebase instance.\nUsage:$0"
  )
  .demand(1)
  .options("e", { alias: "electionPath", default: "/2017/st" }).argv;

const command = argv._[0];

if (command === "update") {
  update(argv.e);
}
if (command === "clear") {
  clear(argv.e);
}
if (command === "init") {
  init(argv.e);
}

async function update(electionPath) {
  let db = await database.initialize();
  console.log("initialized database");
  await electionResults.storeNewResults(electionPath, db);
  console.log("stored results from api");
  process.exit(0);
}

async function clear(electionPath) {
  let db = await database.initialize();
  console.log("initialized database");
  await db.ref(electionPath).remove();
  console.log("deleted election", electionPath);
  process.exit(0);
}

async function init(electionPath) {
  let db = await database.initialize();
  console.log("initialized database");
  await electionResults.storeAllResults(electionPath, db);
  console.log("stored results from api");
  process.exit(0);
}
