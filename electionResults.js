let fetch = require("node-fetch");

async function storeNewResults(electionPath, database) {
  let fetched = await fetchResult(electionPath);
  await storeResults(fetched, database);
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

async function storeResults(fetched, database) {
  if (
    await newResult(fetched.id.nr, fetched.tidspunkt.rapportGenerert, database)
  ) {
    console.log(`NEW RESULTS: ${fetched.id.navn}`);
    await storeResult(fetched, database);
  } else {
    console.log(`NO CHANGE: ${fetched.id.navn}`);
  }
  for (let relatedResult of fetched["_links"].related) {
    let relatedPath = electionPathOfRelated(relatedResult);
    if (
      await newResult(relatedResult.nr, relatedResult.rapportGenerert, database)
    ) {
      await storeNewResults(relatedPath, database);
    }
  }
}

function dbPathOfFetched(nr, rapportGenerert) {
  const DB_ROOT = "/results";
  return `${DB_ROOT}/${nr}/${rapportGenerert}`;
}

async function newResult(nr, rapportGenerert, database) {
  let dbRef = database.ref(dbPathOfFetched(nr, rapportGenerert));
  let stored = (await dbRef.once("value")).val();
  return !stored;
}

async function storeResult(fetched, database) {
  let dbRef = database.ref(
    dbPathOfFetched(fetched.id.nr, fetched.tidspunkt.rapportGenerert)
  );
  await dbRef.set(fetched);
}

function electionPathOfRelated(related) {
  return related.href;
}

module.exports = { storeNewResults };
