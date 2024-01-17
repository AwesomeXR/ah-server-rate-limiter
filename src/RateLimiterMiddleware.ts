import { IMiddleware } from 'ah-server';
import { IRateLimiterUserInitOpt } from './RateLimiterService';

export const createRateLimiterMiddleware = (opt?: IRateLimiterUserInitOpt) => {
  const middleware: IMiddleware = async (ctx, next) => {
    const uid = ctx.getUser()?.id + '' || ctx.ip;
    const limiterKey = `${ctx.method.toUpperCase()} ${ctx.path}`;

    await ctx.app.service.rateLimiter.consume({ uid }, limiterKey, opt);

    return next();
  };

  return middleware;
};
