require("dotenv").config();
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

const uri = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.pbkow.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`;
const deaneryPlaces = {
  t: { max: 375, filled: 0 },
  wmc: { max: 231, filled: 0 },
  se: { max: 367, filled: 0 },
  p: { max: 265, filled: 0 },
  nwoe: { max: 929, filled: 0 },
  wms: { max: 222, filled: 0 },
  n: { max: 403, filled: 0 },
  lnr: { max: 189, filled: 0 },
  eoe: { max: 676, filled: 0 },
  s: { max: 888, filled: 0 },
  wmn: { max: 349, filled: 0 },
  l: { max: 999, filled: 0 },
  w: { max: 364, filled: 0 },
  wa: { max: 432, filled: 0 },
  ni: { max: 279, filled: 0 },
  yh: { max: 626, filled: 0 },
  o: { max: 267, filled: 0 },
  kss: { max: 570, filled: 0 },
};
const allPlacesAvailable = 8431;

runAlgorithm = async () => {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("ukfpo_model");
    const collection = database.collection("applicants");

    const applicants = await collection.find().toArray();

    const numberOfApplicants = applicants.length;

    const scaledDeaneries = {};

    for (deanery in deaneryPlaces) {
      const newMax = Math.round(
        (deaneryPlaces[deanery].max * numberOfApplicants) / allPlacesAvailable
      );

      scaledDeaneries[deanery] = { newMax, filled: 0 };
    }

    const randomNumbers = Array.from(
      { length: numberOfApplicants },
      (_, i) => i + 1
    );

    shuffleArray(randomNumbers);

    for (i = 0; i < applicants.length; i++) {
      applicants[i].rank = randomNumbers[i];
    }
    // console.log(applicants[0]);
    // console.log(randomNumbers);
    // console.log(scaledDeaneries)

    const sortedApplicants = applicants.sort(
      ({ rank: a }, { rank: b }) => a - b
    );

    for (applicant of sortedApplicants) {
      const firstPreference = applicant.preferenceList[0];
      if (
        scaledDeaneries[firstPreference].filled !=
        scaledDeaneries[firstPreference].newMax
      ) {
        applicant.allocation = firstPreference;
        applicant.allocatedOnFirstPass = 1;
        applicant.allocatedOnSecondPass = 0;
        scaledDeaneries[firstPreference].filled += 1;
      } else {
        applicant.allocatedOnFirstPass = 0;
      }
    }

    // console.log(sortedApplicants.reduce(
    //   (accumulator, currentValue) => accumulator + currentValue.allocatedOnFirstPass,
    //   0,
    // ))
    //   let rest = 0
    // for(d in scaledDeaneries) {
    //   rest += scaledDeaneries[d].newMax - scaledDeaneries[d].filled
    // }
    // console.log(rest)

    for (applicant of sortedApplicants) {
      if (applicant.allocatedOnFirstPass == 1) continue;

      for (i = 1; i < applicant.preferenceList.length; i++) {
        if (
          scaledDeaneries[applicant.preferenceList[i]].filled <
          scaledDeaneries[applicant.preferenceList[i]].newMax
        ) {
          applicant.allocation = applicant.preferenceList[i];
          applicant.allocatedOnSecondPass = 1;

          scaledDeaneries[applicant.preferenceList[i]].filled += 1;
          break;
        }
      }
    }

    for (applicant of sortedApplicants) {
      if (
        applicant.allocatedOnFirstPass != 1 &&
        applicant.allocatedOnSecondPass != 1
      ) {
        applicant.allocation = "reserve";
        applicant.allocatedOnSecondPass = 0
      }
    }
    console.log(sortedApplicants);
    console.log(scaledDeaneries);

    // fs.writeFileSync("results.json", JSON.stringify(sortedApplicants));

    const insertedAllocations = await database
      .collection("allocations")
      .insertMany(sortedApplicants);

    const csvHeaders = [
      { id: "preferenceList", title: "preferenceList" },
      { id: "applicantNumber", title: "applicantNumber" },
      { id: "rank", title: "rank" },
      { id: "allocation", title: "allocation" },
      { id: "allocatedOnFirstPass", title: "allocatedOnFirstPass" },
      { id: "allocatedOnSecondPass", title: "allocatedOnSecondPass" },
    ];

    const csvWriter = createCsvWriter({
      path: "results.csv", // Path to the output CSV file
      header: csvHeaders,
      fieldDelimiter:";"
    });
    csvWriter
      .writeRecords(sortedApplicants)
      .then(() => console.log("CSV file has been written successfully."))
      .catch((error) => console.error("Error writing CSV file:", error));
  } catch (error) {
    console.log("oops");
    console.log(error);
  } finally {
    await client.close();
  }
};

runAlgorithm();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
