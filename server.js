const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const bodyParser = require('body-parser');

const app = express();

const client = createClient({
  host: 'redisdb',
  port: 6379,
});

client.on('error', (err) => {
  // eslint-disable-next-line
  console.log('Redis Client Error', err)
});
(async () => { await client.connect(); })();

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

// use when starting application locally
const mongoUrlLocal = 'mongodb://admin:password@localhost:27017';

// use when starting application as docker container
// const mongoUrlDocker = 'mongodb://admin:password@mongodb';

// pass these options to mongo client connect request to avoid DeprecationWarning
// for current Server Discovery and Monitoring engine
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// "user-account" in demo with docker. "my-db" in demo with docker-compose
const databaseName = 'my-db';

app.post('/update-profile', async (req, res) => {
  const userObj = req.body;
  // await client.connect();
  await client.set('key', 'babushka');

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, mongoClient) => {
    if (err) throw err;

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
  MongoClient.connect(mongoUrlLocal, mongoClientOptions, (err, mongoClient) => {
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
