import { Context } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';
import { validators } from '@/utils/validators.js';


export const commandHandlers = {
  async start(ctx: Context) {
    const message = `Welcome to Notes Bot! 📝\n\nI can help you create and manage your notes. Use the keyboard below to navigate or type /help for more information.`;
    
    await ctx.reply(message, keyboards.main());
  },

  async help(ctx: Context) {
    await ctx.reply(
      formatters.formatHelpMessage(),
      {
        parse_mode: 'Markdown',
        ...keyboards.main()
      }
    );
  },

  async newNote(ctx: Context) {
    const text = ctx.message?.text?.split(' ').slice(1).join(' ');
    
    if (!text) {
      await ctx.reply(
        'Please enter your note in this format:\nTitle | Content #tags\n\nExample:\nShopping List | Milk\nBread\nEggs #shopping #groceries',
        keyboards.backOnly()
      );
      return;
    }

    try {
      let title: string | null = null;
      let content: string = text;
      let tags: string[] = [];

      // Extract title if present
      const titleSplit = text.split('|');
      if (titleSplit.length > 1) {
        title = titleSplit[0].trim();
        content = titleSplit[1].trim();
      }

      // Extract tags
      const words = content.split(' ');
      const contentWords: string[] = [];
      
      words.forEach(word => {
        if (word.startsWith('#')) {
          tags.push(word.slice(1).toLowerCase());
        } else {
          contentWords.push(word);
        }
      });

      content = contentWords.join(' ').trim();

      validators.validateNote(title, content, tags);
      
      const note = await noteService.saveNote(
        ctx.from!.id,
        content,
        title,
        tags
      );

      await ctx.reply(
        `Note saved successfully!\n\n${formatters.formatNote(note)}`,
        {
          parse_mode: 'Markdown',
          ...keyboards.main()
        }
      );
    } catch (error) {
      await ctx.reply(
        formatters.formatError(error),
        keyboards.main()
      );
    }
  },

  async listNotes(ctx: Context) {
    try {
      const page = ctx.session.currentPage || 1;
      const { notes, total } = await noteService.getNotes(ctx.from!.id, page);
      
      if (notes.length === 0) {
        return ctx.reply(
          'You don\'t have any notes yet. Create one using /new or the "New Note" button!',
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

  async deleteNote(ctx: Context) {
    const noteId = ctx.message?.text?.split(' ')[1];
    
    if (!noteId) {
      return ctx.reply('Please provide a note ID to delete.');
    }

    try {
      const id = validators.validateId(noteId);
      await noteService.deleteNote(ctx.from!.id, id);
      
      await ctx.reply(
        'Note deleted successfully!',
        keyboards.main()
      );
    } catch (error) {
      await ctx.reply(
        formatters.formatError(error),
        keyboards.main()
      );
    }
  },

  async pinNote(ctx: Context) {
    const noteId = ctx.message?.text?.split(' ')[1];
    
    if (!noteId) {
      return ctx.reply('Please provide a note ID to pin/unpin.');
    }

    try {
      const id = validators.validateId(noteId);
      const note = await noteService.togglePin(ctx.from!.id, id);
      
      await ctx.reply(
        `Note ${note.is_pinned ? 'pinned' : 'unpinned'} successfully!\n\n${formatters.formatNote(note)}`,
        {
          parse_mode: 'Markdown',
          ...keyboards.main()
        }
      );
    } catch (error) {
      await ctx.reply(
        formatters.formatError(error),
        keyboards.main()
      );
    }
  }
};