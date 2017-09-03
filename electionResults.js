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
    let relatedRef = database.ref(relatedHrefToDbPath(relatedLink.hrefNavn));
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
