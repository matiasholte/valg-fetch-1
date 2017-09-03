let fetch = require("node-fetch");

const API_ROOT = "api/2015/ko";

async function topLevelResults() {
  let result = await fetch(`http://valgresultat.no/${API_ROOT}`);
  if (result.status !== 200) {
    throw new Error(`Unexpected status code: ${result.status}`);
  }
  let body = await result.json();
  return body;
}

async function storeResults(results, database) {
  let topLevelRef = database.ref(API_ROOT);
  let topLevelData = (await topLevelRef.once("value")).val();
  if (
    !topLevelData ||
    (topLevelData.rapportGenerert &&
      topLevelData.rapportGenerert !== results.rapportGenerert)
  ) {
    console.log("* landsresultat");
    await topLevelRef.set(results);
  }
}

module.exports = { topLevel: topLevelResults, store: storeResults };
