// Files controller
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    try {
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }
      const token = req.headers['x-token'];
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { db } = dbClient;
      const filesCollection = db.collection('files');
      let parentFile = null;
      if (parentId !== 0) {
        parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      const newFile = {
        userId: ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? 0 : ObjectId(parentId),
      };
      if (type === 'file' || type === 'image') {
        const fileData = Buffer.from(data, 'base64');
        const fileId = new ObjectId();
        const localPath = path.join(FOLDER_PATH, fileId.toString());
        if (!fs.existsSync(FOLDER_PATH)) {
          fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }
        fs.writeFileSync(localPath, fileData);
        newFile.localPath = localPath;
      }
      const result = await filesCollection.insertOne(newFile);
      const insertedId = result.insertedId.toString();
      return res.status(201).json({
        id: insertedId.toString(),
        userId: userId.toString(),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? 0 : parentId.toString(),
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Error uploading file' });
    }
  }

  // Add GET /files/:id endpoint
  static async getFile(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { db } = dbClient;
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({ _id: ObjectId(id), userId: ObjectId(userId) });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(file);
    } catch (error) {
      console.error('Error retrieving file:', error);
      return res.status(500).json({ error: 'Error retrieving file' });
    }
  }

  // Add GET /files endpoint
  static async getFiles(req, res) {
    const { parentId = 0, page = 0 } = req.query;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { db } = dbClient;
      const filesCollection = db.collection('files');
      const query = { userId: ObjectId(userId), parentId: parentId === 0 ? 0 : ObjectId(parentId) };
      const files = await filesCollection.aggregate([
        { $match: query },
        { $skip: page * 20 },
        { $limit: 20 },
      ]).toArray();
      return res.status(200).json(files);
    } catch (error) {
      console.error('Error retrieving files:', error);
      return res.status(500).json({ error: 'Error retrieving files' });
    }
  }
}

module.exports = FilesController;
