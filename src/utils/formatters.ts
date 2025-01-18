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

  formatHelpMessage(): string {
    return `
Notes Bot Commands:
• New Note - Create new note
• List Notes - View all notes
• Search Notes - Search your notes
• Settings - Bot configuration

Text Commands:
/new <title> | <content> - Create note
/list - View all notes
/delete <id> - Delete note
/pin <id> - Pin/unpin note
/search <tags> - Search by tags

Tips:
- Add tags using # (e.g., #work #urgent)
- Separate title and content with |
- Pin important notes for quick access
    `;
  },
};