import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

class AuthController {
	static async getConnect(req, res) {
		const authorization = req.header('Authorization') || null;
		if (!authorization) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		const base64Credentials = authorization.replace('Basic ', '');
		const decodedCredentials = Buffer.from(
			base64Credentials,
			'base64'
		).toString('utf-8');
		const [email, password] = decodedCredentials.split(':');

		if (!email || !password) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		const hashedPassword = sha1(password);
		const user = await DBClient.db
			.collection('users')
			.findOne({ email, password: hashedPassword });

		if (!user) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		const token = uuidv4();
		const key = `auth_${token}`;
		await RedisClient.set(key, user._id.toString(), 86400);

		return res.status(200).send({ token });
	}

	static async getDisconnect(req, res) {
		const token = req.header('X-Token') || null;
		if (!token) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		const redisToken = await RedisClient.get(`auth_${token}`);
		if (!redisToken) {
			return res.status(401).send({ error: 'Unauthorized' });
		}

		await RedisClient.del(`auth_${token}`);
		return res.status(204).send();
	}
}

module.exports = AuthController;
