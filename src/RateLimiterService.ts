import { BaseService, createBaseBizError, ErrorTypeEnum } from 'ah-server';
import { RateLimiterRedis, RateLimiterAbstract, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import RedisStatic from 'ioredis';
import { IRateLimiterExtensionConfig } from './IRateLimiterExtensionConfig';

export type IRateLimiterUserInitOpt = {
  duration?: number;
  points?: number;
};

export class RateLimiterService extends BaseService {
  private redisClient!: Redis;
  private limiters = new Map<string, RateLimiterAbstract>();

  private getDefaultLimiterOpt(): IRateLimiterStoreOptions {
    return {
      points: 10,
      duration: 1,
      keyPrefix: 'limiter',
      storeClient: this.redisClient,
    };
  }

  async init(opt: IRateLimiterExtensionConfig) {
    this.redisClient = new RedisStatic(opt.redisUrl);
  }

  getLimiter(key: string, init: IRateLimiterUserInitOpt = {}) {
    if (!this.limiters.has(key)) {
      // 初始化 limiter
      const opt = { ...this.getDefaultLimiterOpt(), ...init };
      const nLimiter = new RateLimiterRedis(opt);
      this.limiters.set(key, nLimiter);
    }

    return this.limiters.get(key)!;
  }

  async consume(
    consume: { uid: string; points?: number; errMsg?: string; errStatus?: number },
    limiterKey: string,
    limiterInit: IRateLimiterUserInitOpt = {}
  ) {
    const limiter = this.getLimiter(limiterKey, limiterInit);

    try {
      // 一定要在这里 await 掉
      return await limiter.consume(consume.uid, consume.points);
    } catch (err) {
      // Some Redis error
      if (err instanceof Error) throw err;

      const errMsg = consume.errMsg || 'Too Many Requests';
      const errStatus = consume.errStatus || 429;
      throw createBaseBizError(errMsg, ErrorTypeEnum.custom, errStatus);
    }
  }
}
