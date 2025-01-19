import { Context } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';

export const buttonHandlers = {
  async handleNewNote(ctx: Context) {
    await ctx.reply(
      'Please enter your note in this format:\nTitle | Content #tags\n\nExample:\nShopping List | Milk\nBread\nEggs #shopping #groceries',
      keyboards.backOnly()
    );
  },

  async handleListNotes(ctx: Context) {
    try {
      const page = ctx.session.currentPage || 1;
      const { notes, total } = await noteService.getNotes(ctx.from!.id, page);
      
      if (notes.length === 0) {
        return ctx.reply(
          'You don\'t have any notes yet. Create one using "New Note"!',
          keyboards.main()
        );
      }

      const totalPages = Math.ceil(total / 5);
      ctx.session.currentPage = page;

      await ctx.reply(
        formatters.formatNoteList(notes),
        {
          parse_mode: 'Markdown',
          // disable_web_preview: true,
          ...keyboards.listNavigation(page, totalPages)
        }
      );
    } catch (error) {
      await ctx.reply(
        formatters.formatError(error),
        keyboards.main()
      );
    }
  },

  async handleBack(ctx: Context) {
    ctx.session.searchType = undefined;
    ctx.session.searchQuery = undefined;
    await ctx.reply('Main Menu:', keyboards.main());
  },

  async handleSettings(ctx: Context) {
    await ctx.reply('Settings:', keyboards.settings());
  }
};