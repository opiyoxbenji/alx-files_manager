// RedisClient class in utils
import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isClientConnected = true;
    this.client.on('error', (error) => {
      console.error(`Redis client not connected to the server: ${error}`);
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
      this.isClientConnected = true;
    });
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.isClientConnected;
  };
  async get(key) {
    return await this.getAsync(key);
  }
  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }
  async del(key) {
    await this.delAsync(key);
  }
}
const redisClient = new RedisClient();
export default redisClient;
