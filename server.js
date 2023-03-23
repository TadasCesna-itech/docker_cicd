const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
// const { createClient } = require('redis');
const bodyParser = require('body-parser');

const app = express();

// const redisHost = process.env.IS_PROD === 'true' ? 'redisdb' : 'localhost';
// const client = createClient({
//   url: `redis://${redisHost}:6379`,
// });

// client.on('error', (err) => {
//   // eslint-disable-next-line
//   console.log('Redis Client Error', err)
// });
// (async () => { await client.connect(); })();

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/profile-picture', (req, res) => {
  const img = fs.readFileSync(path.join(__dirname, 'images/profile-1.jpg'));
  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});
console.log('kaka');

// use when starting application locally
const mongoUrl = process.env.IS_PROD === 'true' ? 'mongodb://admin:password@mongodb' : 'mongodb://admin:password@localhost:27017';

// pass these options to mongo client connect request to avoid DeprecationWarning
// for current Server Discovery and Monitoring engine
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// "user-account" in demo with docker. "my-db" in demo with docker-compose
const databaseName = 'my-db';

app.post('/update-profile', async (req, res) => {
  const userObj = req.body;
  // await client.set('key', 'babushka');
  // const aa = await client.get('key');
  // console.log(aa);

  MongoClient.connect(mongoUrl, mongoClientOptions, (err, mongoClient) => {
    if (err) throw err;
    console.log('as ciaa');

    const db = mongoClient.db(databaseName);
    userObj.userid = 1;

    const myquery = { userid: 1 };
    const newvalues = { $set: userObj };

    db.collection('users').updateOne(
      myquery,
      newvalues,
      { upsert: true },
      (error) => {
        if (error) throw error;
        mongoClient.close();
      },
    );
  });
  // Send response
  res.send(userObj);
});

app.get('/get-profile', (req, res) => {
  let response = {};
  // Connect to the db
  MongoClient.connect(mongoUrl, mongoClientOptions, (err, mongoClient) => {
    if (err) throw err;

    const db = mongoClient.db(databaseName);

    const myquery = { userid: 1 };

    db.collection('users').findOne(myquery, (error, result) => {
      if (error) throw error;
      response = result;
      mongoClient.close();

      // Send response
      res.send(response || {});
    });
  });
});

app.listen(3000, () => {
  // eslint-disable-next-line
  console.log('app listening on port 3000!');
});
