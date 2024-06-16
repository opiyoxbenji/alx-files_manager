// users endpoint
// import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    try {
      const { db } = dbClient;
      const usersCollection = db.collection('users');
      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const hashedPassword = sha1(password);
      const newUser = {
        email,
        password: hashedPassword,
      };
      const result = await usersCollection.insertOne(newUser);
      return res.status(201).json({ id: result.insertedId.toString(), email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }
}
module.exports = UsersController;
