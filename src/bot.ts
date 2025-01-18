import { Telegraf } from 'telegraf';
import { session } from 'telegraf/session';
import express from 'express';
import { config } from './config/config.js';
import { commandHandlers } from './handlers/commandHandlers.js';
import { buttonHandlers } from './handlers/buttonHandlers.js';
import { messageHandlers } from './handlers/messageHandlers.js';
import { Context, SessionData } from './types/index.js';

// Initialize bot with custom context type
const bot = new Telegraf<Context>(config.botToken);
const app = express();

// Middleware
app.use(express.json());
app.use(bot.webhookCallback('/webhook'));

// Session configuration
const defaultSession: SessionData = {
  currentPage: 1,
};

// Initialize session middleware
bot.use(
  session({ defaultSession: () => ({ ...defaultSession }) })
);

// Commands
bot.command('start', commandHandlers.start);
bot.command('help', commandHandlers.help);
bot.command('new', commandHandlers.newNote);

// Button handlers
bot.hears('📝 New Note', buttonHandlers.handleNewNote);
bot.hears('📋 List Notes', buttonHandlers.handleListNotes);

// Message handler
bot.on('text', messageHandlers.handleText);

// Start bot with webhook
async function startBot() {
  try {
    await bot.telegram.deleteWebhook();
    await bot.telegram.setWebhook(`${config.webhook.url}/webhook`);
    console.log('Webhook set successfully');
    
    app.listen(config.webhook.port, () => {
      console.log(`Server is running on port ${config.webhook.port}`);
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));