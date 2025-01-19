import { Markup } from 'telegraf';

export const keyboards = {
  main: () => 
    Markup.keyboard([
      ['📝 New Note', '📋 List Notes'],
      ['🔍 Search Notes', '❔ Help'],
      ['⚙️ Settings']
    ]).resize(),

  search: () => 
    Markup.keyboard([
      ['🏷️ Search by Tags', '📝 Search by Content'],
      ['🔄 Refine Search'],
      ['⬅️ Back to Main Menu']
    ]).resize(),

  searchResults: () => 
    Markup.keyboard([
      ['📅 Sort by Date', '📊 Sort by Relevance'],
      ['🔄 Refine Search'],
      ['🔍 New Search', '⬅️ Back to Main Menu']
    ]).resize(),

  listNavigation: (currentPage: number, totalPages: number) => 
    Markup.keyboard([
      ['⬅️ Previous', `📄 ${currentPage}/${totalPages}`, '➡️ Next'],
      ['⬅️ Back to Main Menu']
    ]).resize(),

  settings: () => 
    Markup.keyboard([
      ['📊 Notes per page', '🕒 Time format'],
      ['⬅️ Back to Main Menu']
    ]).resize(),

  backOnly: () => 
    Markup.keyboard([
      ['⬅️ Back to Main Menu']
    ]).resize(),

  noteActions: (noteId: number) => 
    Markup.inlineKeyboard([
      [
        Markup.button.callback('📌 Pin/Unpin', `pin_${noteId}`),
        Markup.button.callback('🗑️ Delete', `delete_${noteId}`)
      ],
      [
        Markup.button.callback('✏️ Edit', `edit_${noteId}`),
        Markup.button.callback('❌ Close', `close`)
      ]
    ]),

  remove: () => Markup.removeKeyboard(),
} as const;