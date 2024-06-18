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

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const fileId = req.params.id;
      if (!fileId) {
        return res.status(400).json({ error: 'Missing File id' });
      }
      const { db } = dbClient;
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      });
      // eslint-disable-next-line max-len
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      const mappedFile = {
        id: file._id.toString(),
        userId: userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === '0' ? '0' : file.parentId.toString(),
      };
      return res.status(200).json(mappedFile);
    } catch (error) {
      console.error('Error fetching file:', error);
      return res.status(500).json({ error: 'Error fetching file' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const parentId = req.query.parentId || '0';
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;
      const { db } = dbClient;
      const filesCollection = db.collection('files');
      const skip = page * pageSize;
      const query = {
        userId: ObjectId(userId),
        parentId: parentId === '0' ? '0' : ObjectId(parentId),
      };
      const files = await filesCollection.find(query).skip(skip).limit(pageSize).toArray();
      const mappedFiles = files.map((file) => ({
        id: file._id.toString(),
        userId: userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === '0' ? '0' : file.parentId.toString(),
      }));
      return res.status(200).json(mappedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      return res.status(500).json({ error: 'Error fetching files' });
    }
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const filesCollection = dbClient.db.collection('files');
      const file = await filesCollection.findOneAndUpdate(
        { _id: ObjectId(id), userId: ObjectId(userId) },
        { $set: { isPublic: true } },
        { returnDocument: 'after' },
      );
      if (!file.value) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({
        id: file.value._id.toString(),
        userId: userId.toString(),
        name: file.value.name,
        type: file.value.type,
        isPublic: file.value.isPublic,
        parentId: file.value.parentId === '0' ? '0' : file.value.parentId.toString(),
      });
    } catch (error) {
      console.error('Error publishing file:', error);
      return res.status(500).json({ error: 'Error publishing file' });
    }
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const filesCollection = dbClient.db.collection('files');
      const file = await filesCollection.findOneAndUpdate(
        { _id: ObjectId(id), userId: ObjectId(userId) },
        { $set: { isPublic: false } },
        { returnDocument: 'after' },
      );
      if (!file.value) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({
        id: file.value._id.toString(),
        userId: userId.toString(),
        name: file.value.name,
        type: file.value.type,
        isPublic: file.value.isPublic,
        parentId: file.value.parentId === '0' ? '0' : file.value.parentId.toString(),
      });
    } catch (error) {
      console.error('Error publishing file:', error);
      return res.status(500).json({ error: 'Error publishing file' });
    }
  }
}

module.exports = FilesController;
