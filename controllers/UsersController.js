// users endpoint
import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { db } = dbClient;
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ id: user._id.toString(), email: user.email });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
}
module.exports = UsersController;
