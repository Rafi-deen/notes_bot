import { Context, Note } from '../types/index.js';
import { noteService } from '../services/noteService.js';
import { keyboards } from '../keyboards/keyboards.js';
import { formatters } from '../utils/formatters.js';
import { validators } from '../utils/validators.js';

export const searchHandlers = {
  async handleSearchMenu(ctx: Context) {
    ctx.session.searchType = undefined;
    ctx.session.searchQuery = undefined;
    await ctx.reply(
      'Choose search type:',
      keyboards.search()
    );
  },

  async handleSearchByTags(ctx: Context) {
    ctx.session.searchType = 'tags';
    await ctx.reply(
      'Enter tags to search for (e.g., work urgent)\nSeparate multiple tags with spaces.',
      keyboards.backOnly()
    );
  },

  async handleSearchByContent(ctx: Context) {
    ctx.session.searchType = 'content';
    await ctx.reply(
      'Enter text to search for in your notes.',
      keyboards.backOnly()
    );
  },

  async handleSearchQuery(ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) return;

    const searchQuery = ctx.message.text.trim();
    
    try {
      validators.validateSearchQuery(searchQuery);

      let searchResults;
      if (ctx.session.searchType === 'tags') {
        const tags = searchQuery
          .split(' ')
          .map(tag => tag.replace('#', '').trim())
          .filter(tag => tag.length > 0);

        if (tags.length === 0) {
          return ctx.reply('Please enter valid tags to search for.');
        }

        searchResults = await noteService.searchNotes(ctx.from!.id, 'tags', tags.join(' '));
      } else {
        searchResults = await noteService.searchNotes(ctx.from!.id, 'content', searchQuery);
      }

      ctx.session.searchResults = searchResults;
      ctx.session.lastSearchType = ctx.session.searchType;
      ctx.session.lastSearchQuery = searchQuery;

      if (searchResults.length === 0) {
        return ctx.reply(
          'No notes found matching your search.',
          keyboards.search()
        );
      }

      const searchTypeText = ctx.session.searchType === 'tags' ? 'tags' : 'content';
      const resultText = `Found ${searchResults.length} notes matching your ${searchTypeText} search:\n\n${formatters.formatNoteList(searchResults)}`;

      await ctx.reply(
        resultText,
        {
          parse_mode: 'Markdown',
        //   disable_web_preview: true,
          ...keyboards.searchResults()
        }
      );
    } catch (error) {
      await ctx.reply(
        formatters.formatError(error),
        keyboards.search()
      );
    }
  },

  async handleRefineSearch(ctx: Context) {
    if (!ctx.session.lastSearchType || !ctx.session.lastSearchQuery) {
      return ctx.reply(
        'No previous search found. Please start a new search.',
        keyboards.search()
      );
    }

    ctx.session.searchType = ctx.session.lastSearchType;
    await ctx.reply(
      'Enter new search terms to refine your previous search:',
      keyboards.backOnly()
    );
  },

  async handleSortSearchResults(ctx: Context, sortType: 'date' | 'relevance') {
    if (!ctx.session.searchResults || ctx.session.searchResults.length === 0) {
      return ctx.reply(
        'No search results to sort. Please perform a search first.',
        keyboards.search()
      );
    }

    const results = [...ctx.session.searchResults];
    
    if (sortType === 'date') {
      results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      const query = ctx.session.lastSearchQuery?.toLowerCase() || '';
      results.sort((a, b) => {
        const aRelevance = calculateRelevance(a, query);
        const bRelevance = calculateRelevance(b, query);
        return bRelevance - aRelevance;
      });
    }

    ctx.session.searchResults = results;
    
    await ctx.reply(
      `Search results sorted by ${sortType}:\n\n${formatters.formatNoteList(results)}`,
      {
        parse_mode: 'Markdown',
        disable_web_preview: true,
        ...keyboards.searchResults()
      }
    );
  }
};

function calculateRelevance(note: Note, query: string): number {
  let score = 0;
  
  if (note.title?.toLowerCase().includes(query)) {
    score += 3;
  }
  
  if (note.content.toLowerCase().includes(query)) {
    score += 1;
  }
  
  note.tags.forEach(tag => {
    if (tag.toLowerCase().includes(query)) {
      score += 2;
    }
  });
  
  return score;
}