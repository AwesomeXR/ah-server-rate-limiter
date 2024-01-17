import { IBaseExtension } from 'ah-server';
import { IRateLimiterExtensionConfig } from './IRateLimiterExtensionConfig';
import { RateLimiterService } from './RateLimiterService';

export * from './RateLimiterMiddleware';

declare module 'ah-server' {
  interface IService {
    rateLimiter: RateLimiterService;
  }
}

export class RateLimiterExtension implements IBaseExtension {
  constructor(readonly cfg: IRateLimiterExtensionConfig) {}

  service = { rateLimiter: RateLimiterService };

  lifeCycle: IBaseExtension['lifeCycle'] = {
    setup: async app => {
      await app.service.rateLimiter.init(this.cfg);
    },
  };
}
