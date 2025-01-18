import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Keyboard layouts
const mainKeyboard = Markup.keyboard([
  ['📝 New Note', '📋 List Notes'],
  ['🔍 Search', '🏷️ Tags'],
  ['ℹ️ Help']
]).resize();

const createNoteKeyboard = Markup.keyboard([
  ['📌 Add Title', '🏷️ Add Tags'],
  ['💾 Save Note', '❌ Cancel']
]).resize();

const listNotesKeyboard = (page = 1) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⬅️ Previous', `page_${page-1}`),
      Markup.button.callback('➡️ Next', `page_${page+1}`)
    ],
    [Markup.button.callback('📌 Pin/Unpin', 'pin_note')],
    [Markup.button.callback('🗑️ Delete', 'delete_note')]
  ]);
};

// Session middleware to store user state
const userStates = new Map();

function getUserState(userId) {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      mode: 'main',
      draftNote: {
        content: '',
        title: '',
        tags: []
      }
    });
  }
  return userStates.get(userId);
}

// Command handlers
bot.command('start', (ctx) => {
  const userId = ctx.from.id;
  userStates.set(userId, { mode: 'main' });
  
  return ctx.reply(
    'Welcome to NotesKeeper Bot! 📝\n\n' +
    'Choose an option from the menu below:',
    mainKeyboard
  );
});

bot.hears('📝 New Note', (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  state.mode = 'creating';
  state.draftNote = { content: '', title: '', tags: [] };
  
  return ctx.reply(
    'Enter your note content:\n\n' +
    'You can:\n' +
    '- Add a title\n' +
    '- Add tags\n' +
    '- Save or cancel',
    createNoteKeyboard
  );
});

bot.hears('📌 Add Title', (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  
  if (state.mode !== 'creating') {
    return ctx.reply('First start creating a new note!');
  }
  
  state.mode = 'adding_title';
  return ctx.reply('Please enter the title for your note:');
});

bot.hears('🏷️ Add Tags', (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  
  if (state.mode !== 'creating') {
    return ctx.reply('First start creating a new note!');
  }
  
  state.mode = 'adding_tags';
  return ctx.reply(
    'Enter tags for your note (separate with spaces):\n' +
    'Example: #work #important #todo'
  );
});

bot.hears('💾 Save Note', async (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  
  if (state.mode !== 'creating' || !state.draftNote.content) {
    return ctx.reply('No note content to save!');
  }
  
  try {
    await saveNote(
      userId,
      state.draftNote.content,
      state.draftNote.title,
      state.draftNote.tags
    );
    
    state.mode = 'main';
    state.draftNote = { content: '', title: '', tags: [] };
    
    return ctx.reply(
      '✅ Note saved successfully!',
      mainKeyboard
    );
  } catch (error) {
    console.error('Error saving note:', error);
    return ctx.reply('❌ Failed to save note. Please try again.');
  }
});

bot.hears('📋 List Notes', async (ctx) => {
  const userId = ctx.from.id;
  try {
    const notes = await getNotes(userId, 5); // Get 5 notes per page
    
    if (notes.length === 0) {
      return ctx.reply('You don\'t have any notes yet!');
    }
    
    const notesList = notes.map((note, index) => {
      const title = note.title ? `*${note.title}*\n` : '';
      const tags = note.tags?.length ? `\nTags: ${note.tags.map(t => `#${t}`).join(' ')}` : '';
      return `${note.is_pinned ? '📌 ' : ''}${index + 1}. ${title}${note.content}${tags}`;
    }).join('\n\n');
    
    return ctx.reply(notesList, {
      parse_mode: 'Markdown',
      ...listNotesKeyboard(1)
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return ctx.reply('❌ Failed to fetch notes. Please try again.');
  }
});

// Handle regular text messages
bot.on(message('text'), async (ctx) => {
  const userId = ctx.from.id;
  const state = getUserState(userId);
  const text = ctx.message.text;
  
  if (state.mode === 'creating') {
    state.draftNote.content = text;
    return ctx.reply(
      'Content saved! You can now:\n' +
      '- Add a title\n' +
      '- Add tags\n' +
      '- Save the note',
      createNoteKeyboard
    );
  }
  
  if (state.mode === 'adding_title') {
    state.draftNote.title = text;
    state.mode = 'creating';
    return ctx.reply(
      '✅ Title added! You can now:\n' +
      '- Add tags\n' +
      '- Save the note',
      createNoteKeyboard
    );
  }
  
  if (state.mode === 'adding_tags') {
    state.draftNote.tags = text
      .split(' ')
      .filter(word => word.startsWith('#'))
      .map(tag => tag.slice(1));
    state.mode = 'creating';
    return ctx.reply(
      '✅ Tags added! You can now:\n' +
      '- Save the note',
      createNoteKeyboard
    );
  }
});

// Handle callback queries for inline keyboards
bot.action(/page_(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  const userId = ctx.from.id;
  
  try {
    const notes = await getNotes(userId, 5, (page - 1) * 5);
    if (notes.length === 0) {
      return ctx.answerCbQuery('No more notes!');
    }
    
    const notesList = notes.map((note, index) => {
      const title = note.title ? `*${note.title}*\n` : '';
      const tags = note.tags?.length ? `\nTags: ${note.tags.map(t => `#${t}`).join(' ')}` : '';
      return `${note.is_pinned ? '📌 ' : ''}${index + 1}. ${title}${note.content}${tags}`;
    }).join('\n\n');
    
    await ctx.editMessageText(notesList, {
      parse_mode: 'Markdown',
      ...listNotesKeyboard(page)
    });
    
    return ctx.answerCbQuery();
  } catch (error) {
    console.error('Error fetching notes:', error);
    return ctx.answerCbQuery('Failed to fetch notes');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Sorry, something went wrong. Please try again later.');
});

// Start bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));