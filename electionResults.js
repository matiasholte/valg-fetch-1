let fetch = require("node-fetch");

async function storeNewResults(electionPath, database) {
  let topLevelResults = await fetchResult(electionPath);
  await storeResults(
    topLevelResults,
    database,
    electionPathToDbPath(electionPath)
  );
}

async function fetchResult(electionPath) {
  //  console.warn(`[fetching: ${electionPath}]`);
  const API_ROOT = "http://valgresultat.no/api";
  let result = await fetch(`${API_ROOT}${electionPath}`);
  if (result.status !== 200) {
    throw new Error(`Unexpected status code: ${result.status}`);
  }
  let body = await result.json();
  return body;
}

async function storeResults(fetchedResults, database, path) {
  if (await newResult(fetchedResults, path, database)) {
    console.log(`NEW RESULTS: ${fetchedResults.id.navn}`);
    await storeResult(fetchedResults, path, database);
  } else {
    console.log(`NO CHANGE: ${fetchedResults.id.navn}`);
  }
  for (let relatedResult of fetchedResults["_links"].related) {
    let relatedPath = electionPathOfRelated(relatedResult);
    if (
      await newResult(
        relatedResult,
        electionPathToDbPath(relatedPath),
        database
      )
    ) {
      await storeNewResults(relatedPath, database);
    }
  }
}

async function newResult(fetched, dbPath, database) {
  let dbRef = database.ref(dbPath);
  let storedData = (await dbRef.once("value")).val();
  return (
    !storedData ||
    (storedData.rapportGenerert &&
      storedData.rapportGenerert !== fetched.rapportGenerert)
  );
}

async function storeResult(fetched, dbPath, database) {
  let dbRef = database.ref(dbPath);
  await dbRef.set(fetched);
}

function electionPathOfRelated(related) {
  return related.href;
}

function electionPathToDbPath(electionPath) {
  const DB_ROOT = "/valgresultat";
  return `${DB_ROOT}${electionPath.slice(0, 8)}${electionPath
    .slice(8)
    .replace(/\//g, "/underordnet/")}`;
}

module.exports = { storeNewResults };
