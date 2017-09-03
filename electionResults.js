let fetch = require("node-fetch");

const API_ROOT = "/api/2015/ko";

async function topLevelResults() {
  return await fetchResult(API_ROOT);
}

async function fetchResult(path) {
  console.warn(`[fetching: ${path}]`);
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
  let relatedResultsWithNewData = fetchedResults[
    "_links"
  ].related.filter(async related => {
    let relatedRef = database.ref(related.hrefNavn);
    let relatedData = (await relatedRef.once("value")).val();
    return (
      !relatedData ||
      (relatedData.rapportGenerert &&
        relatedData.rapportGenerert !== related.rapportGenerert)
    );
  });
  await storeRelated(relatedResultsWithNewData, database);
}

async function storeRelated(related, database) {
  for (let rel of related) {
    let apiPath = `/api${rel.hrefNavn}`;
    let fetchedResults = await fetchResult(apiPath);

    let dbPath = `${apiPath.slice(0, 12)}${apiPath
      .slice(12)
      .replace(/\//g, "/underordnet/")}`;
    await _storeResults(fetchedResults, database, dbPath);
  }
}

module.exports = { topLevel: topLevelResults, store: storeResults };
