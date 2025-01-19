import { Telegraf, session } from 'telegraf';
import express from 'express';
import { Context } from './types/index.js';
import { config } from './config/config.js';
import { commandHandlers } from './handlers/commandHandlers.js';
import { buttonHandlers } from './handlers/buttonHandlers.js';
import { searchHandlers } from './handlers/searchHandlers.js';

// Initialize bot
const bot = new Telegraf<Context>(config.botToken);

// Middleware
bot.use(session());

// Command handlers
bot.command('start', commandHandlers.start);
bot.command('help', commandHandlers.help);
bot.command('new', commandHandlers.newNote);
bot.command('list', commandHandlers.listNotes);
bot.command('delete', commandHandlers.deleteNote);
bot.command('pin', commandHandlers.pinNote);
bot.command('search', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (args) {
    ctx.session.searchType = 'tags';
    ctx.message.text = args;
    await searchHandlers.handleSearchQuery(ctx);
  } else {
    await searchHandlers.handleSearchMenu(ctx);
  }
});

// Button handlers
bot.hears('📝 New Note', buttonHandlers.handleNewNote);
bot.hears('📋 List Notes', buttonHandlers.handleListNotes);
bot.hears('⚙️ Settings', buttonHandlers.handleSettings);
bot.hears('❔ Help', commandHandlers.help);
bot.hears('⬅️ Back to Main Menu', buttonHandlers.handleBack);

// Search handlers
bot.hears('🔍 Search Notes', searchHandlers.handleSearchMenu);
bot.hears('🏷️ Search by Tags', searchHandlers.handleSearchByTags);
bot.hears('📝 Search by Content', searchHandlers.handleSearchByContent);
bot.hears('🔄 Refine Search', searchHandlers.handleRefineSearch);
bot.hears('📅 Sort by Date', ctx => searchHandlers.handleSortSearchResults(ctx, 'date'));
bot.hears('📊 Sort by Relevance', ctx => searchHandlers.handleSortSearchResults(ctx, 'relevance'));
bot.hears('🔍 New Search', searchHandlers.handleSearchMenu);

// Navigation handlers
bot.hears('⬅️ Previous', async (ctx) => {
  if (ctx.session.currentPage && ctx.session.currentPage > 1) {
    ctx.session.currentPage--;
    await buttonHandlers.handleListNotes(ctx);
  }
});

bot.hears('➡️ Next', async (ctx) => {
  if (ctx.session.currentPage) {
    ctx.session.currentPage++;
    await buttonHandlers.handleListNotes(ctx);
  }
});

// Handle search queries
bot.on('text', async (ctx, next) => {
  if (ctx.session.searchType) {
    await searchHandlers.handleSearchQuery(ctx);
  } else {
    await next();
  }
});

// Error handling
bot.catch((err: unknown) => {
  if (err instanceof Error) {
    console.error('Bot error:', err);
  } else {
    console.error('Bot error:', String(err));
  }
});

// Setup webhook
if (config.webhook.url) {
  const app = express();
  app.use(express.json());
  
  // Webhook handler
  app.post(`/webhook/${config.botToken}`, (req, res) => {
    bot.handleUpdate(req.body, res);
  });

  // Start Express server
  app.listen(config.webhook.port, () => {
    console.log(`Server running on port ${config.webhook.port}`);
  });

  // Set webhook
  bot.telegram.setWebhook(`${config.webhook.url}/webhook/${config.botToken}`);
} else {
  // Start polling if no webhook URL is provided
  bot.launch();
  console.log('Bot started in polling mode');
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));