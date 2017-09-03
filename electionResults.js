let fetch = require("node-fetch");

const ELECTION_ROOT = "/2015/ko";

async function topLevelResults() {
  return await fetchResult(ELECTION_ROOT);
}

async function fetchResult(path) {
  //  console.warn(`[fetching: ${path}]`);
  const API_ROOT = "http://valgresultat.no/api";
  let result = await fetch(`${API_ROOT}${path}`);
  if (result.status !== 200) {
    throw new Error(`Unexpected status code: ${result.status}`);
  }
  let body = await result.json();
  return body;
}

async function storeResults(results, database) {
  await _storeResults(results, database, relatedHrefToDbPath(ELECTION_ROOT));
}

async function newResult(fetched, dbPath, database) {
  let dbRef = database.ref(dbPath);
  let storedData = (await dbRef.once("value")).val();
  return;
  !storedData ||
    (storedData.rapportGenerert &&
      storedData.rapportGenerert !== fetched.rapportGenerert);
}

async function storeResult(fetched, dbPath, database) {
  let dbRef = database.ref(dbPath);
  await dbRef.set(fetched);
}

async function _storeResults(fetchedResults, database, path) {
  if (newResult(fetchedResults, path, database)) {
    console.log(`* ${fetchedResults.id.navn}`);
    await storeResult(fetchedResults, path, database);
  }
  for (let relatedResult of fetchedResults["_links"].related) {
    if (
      newResult(
        relatedResult,
        relatedHrefToDbPath(relatedResult.hrefNavn),
        database
      )
    ) {
      await storeRelated(relatedResult, database);
    }
  }
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

  await _storeResults(
    fetchedResults,
    database,
    relatedHrefToDbPath(hrefOfRelated(related))
  );
}

module.exports = { topLevel: topLevelResults, store: storeResults };
