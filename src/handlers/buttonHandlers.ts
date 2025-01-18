import { Context } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';
import { config } from '../config/config.js';

export const buttonHandlers = {
  async handleNewNote(ctx: Context) {
    await ctx.reply(
      'Please enter your note in this format:\nTitle | Content #tags\n\nOr use the /new command.',
      keyboards.backOnly()
    );
  },

  async handleListNotes(ctx: Context) {
    try {
      const page = ctx.session.currentPage || 1;
      const { notes, total } = await noteService.getNotes(
        ctx.from!.id,
        page,
        config.defaultSettings.notesPerPage
      );
      
      if (notes.length === 0) {
        return ctx.reply(
          'You don\'t have any notes yet. Create one using "New Note"!',
          keyboards.main()
        );
      }

      const totalPages = Math.ceil(total / config.defaultSettings.notesPerPage);
      ctx.session.currentPage = page;

      await ctx.reply(
        formatters.formatNoteList(notes),
        {
          parse_mode: 'Markdown',
          // disable_web_page_preview: true,
          ...keyboards.listNavigation(page, totalPages)
        }
      );
    } catch (error) {
      console.error('Error fetching notes:', error);
      await ctx.reply('Sorry, there was an error fetching your notes. Please try again.');
    }
  },
};