// @flow

let cmdParser = require("optimist");
let electionResults = require("./electionResults");
let database = require("./database");

let argv = cmdParser
  .usage(
    "Fetch Norwegian election results and put them in a Firebase instance.\nUsage:$0 (update|clear)"
  )
  .demand(1)
  .options("e", { alias: "electionPath", default: "/2017/st" })
  .options("i", { alias: "indexParty", default: "MDG" })
  .options("d", { alias: "depth", default: 3})
  .options("p", { alias: "parallel"}).argv;

const command = argv._[0];

if (command === "update") {
  update(argv.e, argv.i.split(","), argv.d, argv.p);
}
if (command === "clear") {
  clear(argv.e);
}

async function update(electionPath, indexParties, depth, parallel) {
  let db = await database.initialize();
  console.log("initialized database");
  await electionResults.storeNewResults({
    electionPath,
    database: db,
    settings: {
      indexParties,
      depth: depth,
      parallel: parallel
    }
  });
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
