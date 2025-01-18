import { Context } from '../types/index.js';
import { keyboards } from '../keyboards/keyboards.js';

export const messageHandlers = {
  async handleText(ctx: Context) {
    if (!('text' in ctx.message!)) {
      return;
    }

    if (!ctx.message.text.startsWith('/') && !ctx.message.text.includes('|')) {
      await ctx.reply(
        'To create a note, use this format:\nTitle | Content #tags\n\nOr use the command: /new <title> | <content>',
        keyboards.main()
      );
    }
  },
};