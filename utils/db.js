// import MongoClient from the mongodb package
const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    // connect to the MongoDB server
    MongoClient.connect(url, (err, client) => {
      if (!err) {
	// If connection is successfull, set the database object
        this.db = client.db(database);
      } else {
	// If connection fails, set the database object to false
        this.db = false;
      }
    });
  }

  // check if the database connection is alive
  isAlive() {
    if (this.db) return true;
    return false;
  }

  // count the number of docs in the 'users' collection
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  // count the number of docs in the 'files' collection
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
