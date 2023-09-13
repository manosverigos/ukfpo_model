const { MongoClient } = require("mongodb");
const fs = require("fs");

const uri = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.pbkow.mongodb.net/${process.env.MONGO_DB_DATABASE}?retryWrites=true&w=majority`;

exports.postSubmission = async (req, res) => {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const data = req.body;

  const currentNumber = parseInt(fs.readFileSync("currentNumber.txt"));

  data.applicantNumber = currentNumber;

  const newCurrentNumber = currentNumber + 1;
  fs.writeFileSync("currentNumber.txt", newCurrentNumber.toString());

  try {
    await client.connect();
    const database = client.db("ukfpo_model");
    const collection = database.collection("applicants");

    const result = await collection.insertOne(data);

    res.json({ message: "success", applicantNumber: currentNumber });
  } catch {
    res.json({ message: "oops" });
  } finally {
    await client.close();
  }
};
