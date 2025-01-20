import { Markup } from 'telegraf';

export const keyboards = {
  main: () => 
    Markup.keyboard([
      ['📝 New Note', '📋 List Notes'],
      ['🔍 Search Notes', '❔ Help'],
      // ['⚙️ Settings']
    ]).resize(),

  search: () => 
    Markup.keyboard([
      ['🏷️ Search by Tags', '📝 Search by Content'],
      ['⬅️ Back to Main Menu']
    ]).resize(),

  listNavigation: (currentPage: number, totalPages: number) => 
    Markup.keyboard([
      ['⬅️ Previous', `📄 ${currentPage}/${totalPages}`, '➡️ Next'],
      ['⬅️ Back to Main Menu']
    ]).resize(),

  // settings: () => 
  //   Markup.keyboard([
  //     ['📊 Notes per page', '🕒 Time format', '🌐 Language'],
  //     ['⬅️ Back to Main Menu']
  //   ]).resize(),

  backOnly: () => 
    Markup.keyboard([
      ['⬅️ Back to Main Menu']
    ]).resize(),

  remove: () => Markup.removeKeyboard(),
} as const;