// import MongoClient from the mongodb package
const { MongoClient } = require('mongodb');

//const host = process.env.DB_HOST || 'localhost';
//const port = process.env.DB_PORT || 27017;
//const database = process.env.DB_DATABASE || 'files_manager';
//const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    // variables for server connection
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;
    // connect to the MongoDB server
    this.client.connect();
  }

  // check if the database connection is alive
  isAlive() {
    return this.client.isConnected();
  }

  // count the number of docs in the 'users' collection
  async nbUsers() {
    const db = this.client.db(this.dbName);
    const usersCollection = db.collection('users');
    return usersCollection.countDocuments();
  }

  // count the number of docs in the 'files' collection
  async nbFiles() {
    const db = this.client.db(this.dbName);
    const filesCollection = db.collection('files');
    return filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
