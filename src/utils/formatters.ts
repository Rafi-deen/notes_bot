import { Note } from '../types/index.js';
import { format } from 'date-fns';

export const formatters = {
  formatNoteList(notes: Note[]): string {
    return notes.map(note => {
      const pinned = note.is_pinned ? '📌 ' : '';
      const title = note.title ? `*${note.title}*\n` : '';
      const tags = note.tags?.length 
        ? `\nTags: ${note.tags.map(tag => `#${tag}`).join(' ')}` 
        : '';
      const date = format(new Date(note.created_at), 'dd/MM/yyyy HH:mm');
      
      return `${pinned}ID: ${note.id}\n${title}${note.content}${tags}\n📅 ${date}\n`;
    }).join('\n');
  },

  formatNote(note: Note): string {
    const pinned = note.is_pinned ? '📌 ' : '';
    const title = note.title ? `*${note.title}*\n` : '';
    const tags = note.tags?.length 
      ? `\nTags: ${note.tags.map(tag => `#${tag}`).join(' ')}` 
      : '';
    const date = format(new Date(note.created_at), 'dd/MM/yyyy HH:mm');
    
    return `${pinned}ID: ${note.id}\n${title}${note.content}${tags}\n📅 ${date}`;
  },

  formatHelpMessage(): string {
    return `
*Notes Bot Commands*:

📝 *Note Management*:
• /new <title> | <content> #tags - Create new note
• /list - View all notes
• /delete <id> - Delete note
• /pin <id> - Pin/unpin note

🔍 *Search*:
• /search <query> - Search notes
• /tags <tags> - Search by tags

⚙️ *Other Commands*:
• /start - Start bot
• /help - Show this message
• /settings - Bot settings

*Tips*:
- Add tags using # (e.g., #work #urgent)
- Separate title and content with |
- Pin important notes for quick access
- Use the menu buttons for easy navigation
    `;
  },

  formatError(error: unknown): string {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'An unexpected error occurred';
  }
};