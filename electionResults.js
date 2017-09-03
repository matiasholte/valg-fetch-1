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
  await database.ref(API_ROOT).set(results);
}

module.exports = { topLevel: topLevelResults, store: storeResults };
