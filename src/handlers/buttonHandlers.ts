import { Context } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';
import { config } from '../config/config.js';
import { commandHandlers } from './commandHandlers.js';
import { logger } from '@/utils/logger.js';

export const buttonHandlers = {
  async handleNewNote(ctx: Context) {
    await ctx.reply(
      'Please enter your note in this format:\n/new [note-content] #[tags].',
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
        logger.warn(`user $ctx!.from!.id}: no notes available`)
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
      logger.error('Error fetching notes:', error);
      await ctx.reply('Sorry, there was an error fetching your notes. Please try again.');
    }
  },

  async handleSearchNotes(ctx: Context) {
    await ctx.reply('Choose your search method:', keyboards.search());
  },

  async handleSearchByTags(ctx: Context) {
    await ctx.reply(
      'Please enter tags to search for (separated by spaces):\nExample: #work #important',
      keyboards.backOnly()
    );
    ctx.session.searchType = 'tags';
    logger.info("search type is tags")
  },

  async handleSearchByContent(ctx: Context) {
    await ctx.reply(
      'Please enter text to search for in your notes:',
      keyboards.backOnly()
    );
    ctx.session.searchType = 'content';
    logger.info("search type is content")
  },

  async handlePreviousPage(ctx: Context) {
    if (ctx.session.currentPage && ctx.session.currentPage > 1) {
      ctx.session.currentPage--;
      await buttonHandlers.handleListNotes(ctx);
    } else {
      await ctx.reply('You are already on the first page.');
    }
  },

  async handleNextPage(ctx: Context) {
    const { total } = await noteService.getNotes(
      ctx.from!.id,
      1,
      config.defaultSettings.notesPerPage
    );
    const totalPages = Math.ceil(total / config.defaultSettings.notesPerPage);

    if (ctx.session.currentPage && ctx.session.currentPage < totalPages) {
      ctx.session.currentPage++;
      await buttonHandlers.handleListNotes(ctx);
    } else {
      await ctx.reply('You are already on the last page.');
    }
  },

  async handleBackToMain(ctx: Context) {
    ctx.session.currentPage = 1;
    ctx.session.searchType = undefined;
    await commandHandlers.start(ctx);
  },
};