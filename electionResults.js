let fetch = require("node-fetch");

const API_ROOT = "/api/2015/ko";

async function topLevelResults() {
  return await fetchResult(API_ROOT);
}

async function fetchResult(path) {
  //  console.warn(`[fetching: ${path}]`);
  let result = await fetch(`http://valgresultat.no${path}`);
  if (result.status !== 200) {
    throw new Error(`Unexpected status code: ${result.status}`);
  }
  let body = await result.json();
  return body;
}

async function storeResults(results, database) {
  await _storeResults(results, database, API_ROOT);
}

async function _storeResults(fetchedResults, database, path) {
  let dbRef = database.ref(path);
  let storedData = (await dbRef.once("value")).val();
  if (
    !storedData ||
    (storedData.rapportGenerert &&
      storedData.rapportGenerert !== fetchedResults.rapportGenerert)
  ) {
    console.log(`* ${fetchedResults.id.navn}`);
    await dbRef.set(fetchedResults);
  }
  for (let relatedLink of fetchedResults["_links"].related) {
    let relatedRef = database.ref(hrefNavnToDbPath(relatedLink.hrefNavn));
    let relatedData = (await relatedRef.once("value")).val();
    //    console.log(`relatedData: ${relatedData}`, `related: ${relatedLink}`);
    if (
      !relatedData ||
      (relatedData.rapportGenerert &&
        relatedData.rapportGenerert !== relatedLink.rapportGenerert)
    ) {
      await storeRelated(relatedLink, database);
    }
  }
}

function hrefNavnToDbPath(hrefNavn) {
  return `/api${hrefNavn.slice(0, 8)}${hrefNavn
    .slice(8)
    .replace(/\//g, "/underordnet/")}`;
}

async function storeRelated(related, database) {
  let apiPath = `/api${related.hrefNavn}`;
  let fetchedResults = await fetchResult(apiPath);

  await _storeResults(
    fetchedResults,
    database,
    hrefNavnToDbPath(related.hrefNavn)
  );
}

module.exports = { topLevel: topLevelResults, store: storeResults };
