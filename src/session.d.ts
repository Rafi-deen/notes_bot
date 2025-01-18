import { SessionData } from './types';

declare module 'telegraf/typings/context' {
  interface Context {
    session: SessionData;
  }
}