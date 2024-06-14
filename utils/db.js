// import MongoClient from the mongodb package
const { MongoClient } = require('mongodb');


class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    // variables for server connection
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null;
    this.isConnected = false;
    // connect to the MongoDB server
    this.connect();
  }
  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
    }  catch (error) {
      console.error(`Error connecting to MongoDb: ${error}`);
      this.isConnected = false;
    }
  }

  // check if the database connection is alive
  isAlive() {
    return this.isConnected;
  }

  // count the number of docs in the 'users' collection
  async nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch {
      return 0;
    }
  }

  // count the number of docs in the 'files' collection
  async nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch {
      return 0;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
