let fetch = require("node-fetch");

async function storeNewResults(
  electionPath,
  database,
  baseElectionPath = undefined
) {
  let fetched = await fetchResult(electionPath);
  await storeResults(fetched, database, baseElectionPath || electionPath);
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

async function storeResults(fetched, database, baseElectionPath) {
  if (
    await newResult(
      fetched.id.nr,
      fetched.id.nivaa,
      fetched.tidspunkt.rapportGenerert,
      database
    )
  ) {
    console.log(`NEW RESULTS: ${fetched.id.navn}`);
    await storeResult(fetched, database, baseElectionPath);
  } else {
    console.log(`NO CHANGE: ${fetched.id.navn}`);
  }
  for (let relatedResult of fetched["_links"].related) {
    let relatedPath = electionPathOfRelated(relatedResult);
    if (
      await newResult(
        relatedResult.nr,
        LEVELS[LEVELS.indexOf(fetched.id.nivaa) + 1],
        relatedResult.rapportGenerert,
        database,
        baseElectionPath
      )
    ) {
      await storeNewResults(relatedPath, database, baseElectionPath);
    }
  }
}

const LEVELS = ["land", "fylke", "kommune", "bydel", "stemmekrets"];

function dbPathOfFetched(nr, nivaa, rapportGenerert, baseElectionPath) {
  return `${baseElectionPath}/${nivaa}-${nr}/${rapportGenerert}`;
}

async function newResult(
  nr,
  nivaa,
  rapportGenerert,
  database,
  baseElectionPath
) {
  let dbRef = database.ref(
    dbPathOfFetched(nr, nivaa, rapportGenerert, baseElectionPath)
  );
  let stored = (await dbRef.once("value")).val();
  return !stored;
}

async function storeResult(fetched, database, baseElectionPath) {
  let dbRef = database.ref(
    dbPathOfFetched(
      fetched.id.nr,
      fetched.id.nivaa,
      fetched.tidspunkt.rapportGenerert,
      baseElectionPath
    )
  );
  await dbRef.set(fetched);
}

function electionPathOfRelated(related) {
  return related.href;
}

module.exports = { storeNewResults };
