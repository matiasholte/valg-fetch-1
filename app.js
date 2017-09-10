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
  .options("p", { alias: "parallel", describe: "download in parallel"})
  .options("r", { alias: "reloadTime", describe: "reload time in seconds (0 = never)", default: 30})
  .options("b", { alias: "backup", describe: "store old entries"}).argv;

const command = argv._[0];

if (command === "update") {
  update(argv.e, argv.i.split(","), argv.d, argv.p, argv.r, argv.b);
}
if (command === "clear") {
  clear(argv.e);
}

async function update(electionPath, indexParties, depth, parallel, reload, backup) {
  let db = await database.initialize();
  console.log("initialized database");
  let done = false;
  while (!done) {
    await electionResults.storeNewResults({
      electionPath,
      database: db,
      settings: {
        indexParties,
        depth: depth,
        parallel: parallel,
        backup: backup
      }
    });
    console.log("stored results from api");
    if (reload == 0) {
      done = true;
    } else {
      console.log("waiting " + 1000*reload + " ms");
      await new Promise(resolve => setTimeout(resolve, 1000*reload));
    }
  }
  process.exit(0);
}

async function clear(electionPath) {
  let db = await database.initialize();
  console.log("initialized database");
  await db.ref(electionPath).remove();
  console.log("deleted election", electionPath);
  process.exit(0);
}
