let fetch = require("node-fetch");

async function storeNewResultsForElection(electionPath, database) {
  let topLevelResults = await fetchResult(electionPath);
  await storeResults(
    topLevelResults,
    database,
    relatedHrefToDbPath(electionPath)
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
    if (
      await newResult(
        relatedResult,
        relatedHrefToDbPath(hrefOfRelated(relatedResult)),
        database
      )
    ) {
      await storeRelated(relatedResult, database);
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

function hrefOfRelated(related) {
  return related.href;
}

function relatedHrefToDbPath(relatedHref) {
  const DB_ROOT = "/valgresultat";
  return `${DB_ROOT}${relatedHref.slice(0, 8)}${relatedHref
    .slice(8)
    .replace(/\//g, "/underordnet/")}`;
}

async function storeRelated(related, database) {
  let fetchedResults = await fetchResult(hrefOfRelated(related));

  await storeResults(
    fetchedResults,
    database,
    relatedHrefToDbPath(hrefOfRelated(related))
  );
}

module.exports = { storeNewResultsForElection };
