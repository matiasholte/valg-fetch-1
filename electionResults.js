// @flow

let fetch = require("node-fetch").default;

async function storeNewResults(
  electionPath: string,
  database: Database,
  baseElectionPath: ?string = undefined
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
    await newResult({
      nr: fetched.id.nr,
      nivaa: fetched.id.nivaa,
      rapportGenerert: fetched.tidspunkt.rapportGenerert,
      database,
      baseElectionPath,
      overordnetNr: fetched._links.up.nr
    })
  ) {
    console.log(`NEW RESULTS: ${fetched.id.navn}`);
    await storeInDatabase(fetched, database, baseElectionPath);
  } else {
    console.log(`NO CHANGE: ${fetched.id.navn}`);
  }
  for (let relatedResult of fetched["_links"].related) {
    let relatedPath = electionPathOfRelated(relatedResult);
    if (
      await newResult({
        nr: relatedResult.nr,
        nivaa: LEVELS[LEVELS.indexOf(fetched.id.nivaa) + 1],
        rapportGenerert: relatedResult.rapportGenerert,
        database,
        baseElectionPath,
        overordnetNr: fetched.id.nr
      })
    ) {
      await storeNewResults(relatedPath, database, baseElectionPath);
    }
  }
}

const LEVELS = ["land", "fylke", "kommune", "bydel", "stemmekrets"];

function dbPathOfFetched({
  nr,
  nivaa,
  rapportGenerert,
  baseElectionPath,
  overordnetNr
}) {
  let uniktNr = nivaa == LEVELS[4] ? `${overordnetNr}-${nr}` : nr;
  return `${baseElectionPath}/${nivaa}-${uniktNr}/${rapportGenerert}`;
}

async function newResult({
  nr,
  nivaa,
  rapportGenerert,
  database,
  baseElectionPath,
  overordnetNr
}) {
  let dbRef = database.ref(
    dbPathOfFetched({
      nr,
      nivaa,
      rapportGenerert,
      baseElectionPath,
      overordnetNr
    })
  );
  let stored = (await dbRef.once("value")).val();
  return !stored;
}

async function storeInDatabase(fetched, database, baseElectionPath) {
  let dbRef = database.ref(
    dbPathOfFetched({
      nr: fetched.id.nr,
      nivaa: fetched.id.nivaa,
      rapportGenerert: fetched.tidspunkt.rapportGenerert,
      baseElectionPath: baseElectionPath,
      overordnetNr: fetched._links.up.nr
    })
  );
  await dbRef.set(fetched);
}

function electionPathOfRelated(related) {
  return related.href;
}

module.exports = { storeNewResults };
