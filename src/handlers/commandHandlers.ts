import { Context } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';

export const commandHandlers = {
  async start(ctx: Context) {
    const welcomeMessage = `
Welcome to Notes Bot! 📝

Choose an option from the menu below:
• New Note - Create a new note
• List Notes - View all your notes
• Search Notes - Search through your notes
• Help - Show help message
• Settings - Configure bot settings
    `;
    await ctx.reply(welcomeMessage, keyboards.main());
  },

  async help(ctx: Context) {
    await ctx.reply(formatters.formatHelpMessage(), keyboards.main());
  },

  async newNote(ctx: Context) {
    if (!('text' in ctx.message!)) {
      return;
    }

    const input = ctx.message.text.slice(5).trim();
    if (!input) {
      return ctx.reply('Please provide content for your note.\nFormat: /new [title] | content #tags');
    }

    try {
      let title: string | null = null;
      let content = input;
      const tags: string[] = [];

      // Extract tags
      const words = input.split(' ');
      content = words.filter(word => {
        if (word.startsWith('#')) {
          tags.push(word.slice(1));
          return false;
        }
        return true;
      }).join(' ');

      // Split title and content if | is present
      if (content.includes('|')) {
        [title, content] = content.split('|').map(str => str.trim());
      }

      await noteService.saveNote(ctx.from!.id, content, title, tags);
      await ctx.reply('✅ Note saved successfully!', keyboards.main());
    } catch (error) {
      console.error('Error saving note:', error);
      await ctx.reply('Sorry, there was an error saving your note. Please try again.');
    }
  },
};