import "dotenv/config"
import { Telegraf, Markup } from "telegraf"
import { message } from "telegraf/filters"
import express from "express"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
)

// Initialize Telegram bot and Express
const bot = new Telegraf(process.env.BOT_TOKEN)
const app = express()
const port = 80

// Constants
const NOTES_PER_PAGE = 5

// Middleware
app.use(express.json())
app.use(bot.webhookCallback("/webhook"))

// Basic route
app.get("/", (req, res) => {
  res.send("Notes Bot server is running!")
})

// Keyboard helper functions
function getMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ["📝 New Note", "📋 List Notes"],
        ["🔍 Search Notes", "🏷️ View Tags"],
        ["❔ Help"],
      ],
      resize_keyboard: true,
    },
  }
}

function getNotesNavigationKeyboard(currentPage, totalPages, noteIds) {
  const buttons = []

  // Add note action buttons
  noteIds.forEach((id) => {
    buttons.push([
      { text: `📌 Pin ${id}`, callback_data: `pin_${id}` },
      { text: `🗑️ Delete ${id}`, callback_data: `delete_${id}` },
    ])
  })

  // Add navigation buttons
  const navRow = []
  if (currentPage > 1) {
    navRow.push({
      text: "⬅️ Previous",
      callback_data: `page_${currentPage - 1}`,
    })
  }
  navRow.push({
    text: `${currentPage}/${totalPages}`,
    callback_data: "current_page",
  })
  if (currentPage < totalPages) {
    navRow.push({ text: "Next ➡️", callback_data: `page_${currentPage + 1}` })
  }

  if (navRow.length > 0) {
    buttons.push(navRow)
  }

  return {
    reply_markup: {
      inline_keyboard: buttons,
    },
  }
}

function getSearchKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏷️ Select Tags", callback_data: "select_tags" }],
        [{ text: "🔍 Search by Text", callback_data: "search_text" }],
        [{ text: "🏠 Back to Main Menu", callback_data: "main_menu" }],
      ],
    },
  }
}

// Database helper functions
async function saveNote(userId, content, title = null, tags = []) {
  const { data, error } = await supabase.from("notes").insert([
    {
      user_id: userId.toString(),
      content: content,
      title: title,
      tags: tags,
      created_at: new Date(),
    },
  ])

  if (error) throw error
  return data
}

async function getNotes(userId, limit = 10) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId.toString())
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

async function deleteNote(userId, noteId) {
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId.toString())

  if (error) throw error
  return data
}

async function togglePinNote(userId, noteId) {
  const { data: note } = await supabase
    .from("notes")
    .select("is_pinned")
    .eq("id", noteId)
    .eq("user_id", userId.toString())
    .single()

  if (!note) throw new Error("Note not found")

  const { data, error } = await supabase
    .from("notes")
    .update({ is_pinned: !note.is_pinned })
    .eq("id", noteId)
    .eq("user_id", userId.toString())

  if (error) throw error
  return data
}

async function searchNotesByTags(userId, tags) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId.toString())
    .contains("tags", tags)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Bot command handlers
bot.command("start", async (ctx) => {
  const welcomeMessage = `Welcome to Notes Bot! 📝\n\nUse the keyboard below to navigate:`
  await ctx.reply(welcomeMessage, getMainKeyboard())
})


bot.command('start', async (ctx) => {
  try {
    const welcomeMessage = 'Welcome to Notes Bot! 📝\n\nUse the keyboard below to navigate:';
    await ctx.reply(welcomeMessage);
    await ctx.reply('Choose an option:', getMainKeyboard());
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Sorry, there was an error initializing the bot. Please try /start again.');
  }
});

bot.command("help", (ctx) => {
  const helpMessage = `
📝 Notes Bot Commands:

• Use the keyboard buttons below for easy navigation
• Or use these commands:

/new <title> | <content> - Create new note
/list - View all notes
/delete <note_id> - Delete note
/pin <note_id> - Pin/unpin note
/search <tags> - Search by tags
/help - Show this message

Tips:
- Add tags using # (e.g., #work #urgent)
- Separate title and content with |
- Pin important notes for quick access
  `
  ctx.reply(helpMessage, getMainKeyboard())
})

bot.command("new", async (ctx) => {
  try {
    const input = ctx.message.text.slice(5).trim()
    if (!input) {
      return ctx.reply(
        "Please provide content for your note.\nFormat: /new [title] | content #tags"
      )
    }

    let title = null
    let content = input
    const tags = []

    // Extract tags
    const words = input.split(" ")
    content = words
      .filter((word) => {
        if (word.startsWith("#")) {
          tags.push(word.slice(1))
          return false
        }
        return true
      })
      .join(" ")

    // Split title and content if | is present
    if (content.includes("|")) {
      ;[title, content] = content.split("|").map((str) => str.trim())
    }

    await saveNote(ctx.from.id, content, title, tags)
    ctx.reply("✅ Note saved successfully!", getMainKeyboard())
  } catch (error) {
    console.error("Error saving note:", error)
    ctx.reply("Sorry, there was an error saving your note. Please try again.")
  }
})

bot.command("list", async (ctx) => {
  try {
    const notes = await getNotes(ctx.from.id)

    if (notes.length === 0) {
      return ctx.reply(
        "You don't have any notes yet. Use 📝 New Note to create one!",
        getMainKeyboard()
      )
    }

    const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE)
    const currentPage = 1
    const startIndex = (currentPage - 1) * NOTES_PER_PAGE
    const pageNotes = notes.slice(startIndex, startIndex + NOTES_PER_PAGE)

    const notesList = pageNotes
      .map((note) => {
        const pinned = note.is_pinned ? "📌 " : ""
        const title = note.title ? `*${note.title}*\n` : ""
        const tags =
          note.tags?.length > 0
            ? `\nTags: ${note.tags.map((tag) => `#${tag}`).join(" ")}`
            : ""
        return `${pinned}ID: ${note.id}\n${title}${note.content}${tags}`
      })
      .join("\n\n")

    const noteIds = pageNotes.map((note) => note.id)
    await ctx.reply(
      `📋 Your Notes (Page ${currentPage}/${totalPages}):\n\n${notesList}`,
      getNotesNavigationKeyboard(currentPage, totalPages, noteIds)
    )
  } catch (error) {
    console.error("Error fetching notes:", error)
    ctx.reply(
      "Sorry, there was an error fetching your notes. Please try again."
    )
  }
})

// Action handlers for inline keyboards
bot.action(/^pin_(\d+)$/, async (ctx) => {
  try {
    const noteId = parseInt(ctx.match[1])
    await togglePinNote(ctx.from.id, noteId)
    await ctx.answerCbQuery("📌 Note pin status toggled!")
    // Refresh the notes list
    await ctx.deleteMessage()
    await ctx.reply("📋 Refreshing notes list...")
    await bot.command("list")(ctx)
  } catch (error) {
    console.error("Error toggling pin:", error)
    ctx.answerCbQuery("❌ Error updating note")
  }
})

bot.action(/^delete_(\d+)$/, async (ctx) => {
  try {
    const noteId = parseInt(ctx.match[1])
    await deleteNote(ctx.from.id, noteId)
    await ctx.answerCbQuery("🗑️ Note deleted!")
    // Refresh the notes list
    await ctx.deleteMessage()
    await ctx.reply("📋 Refreshing notes list...")
    await bot.command("list")(ctx)
  } catch (error) {
    console.error("Error deleting note:", error)
    ctx.answerCbQuery("❌ Error deleting note")
  }
})

bot.action(/^page_(\d+)$/, async (ctx) => {
  try {
    const page = parseInt(ctx.match[1])
    const notes = await getNotes(ctx.from.id)
    const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE)
    const startIndex = (page - 1) * NOTES_PER_PAGE
    const pageNotes = notes.slice(startIndex, startIndex + NOTES_PER_PAGE)

    const notesList = pageNotes
      .map((note) => {
        const pinned = note.is_pinned ? "📌 " : ""
        const title = note.title ? `*${title}*\n` : ""
        const tags =
          note.tags?.length > 0
            ? `\nTags: ${note.tags.map((tag) => `#${tag}`).join(" ")}`
            : ""
        return `${pinned}ID: ${note.id}\n${title}${note.content}${tags}`
      })
      .join("\n\n")

    const noteIds = pageNotes.map((note) => note.id)
    await ctx.editMessageText(
      `📋 Your Notes (Page ${page}/${totalPages}):\n\n${notesList}`,
      getNotesNavigationKeyboard(page, totalPages, noteIds)
    )
    await ctx.answerCbQuery()
  } catch (error) {
    console.error("Error changing page:", error)
    ctx.answerCbQuery("❌ Error changing page")
  }
})

// Handle main keyboard button presses
bot.hears("📝 New Note", (ctx) => {
  ctx.reply(
    "To create a new note, use the following format:\n/new [title] | content #tags"
  )
})

bot.hears("📋 List Notes", (ctx) => {
  bot.command("list")(ctx)
})

bot.hears("🔍 Search Notes", (ctx) => {
  ctx.reply("Search Options:", getSearchKeyboard())
})

bot.hears("🏷️ View Tags", async (ctx) => {
  try {
    const notes = await getNotes(ctx.from.id)
    const allTags = new Set()
    notes.forEach((note) => {
      if (note.tags) {
        note.tags.forEach((tag) => allTags.add(tag))
      }
    })

    if (allTags.size === 0) {
      return ctx.reply(
        "No tags found. Add tags to your notes using #tag format."
      )
    }

    const tagsList = Array.from(allTags)
      .map((tag) => `#${tag}`)
      .join(" ")
    ctx.reply(`🏷️ Your Tags:\n\n${tagsList}`)
  } catch (error) {
    console.error("Error fetching tags:", error)
    ctx.reply("Sorry, there was an error fetching your tags.")
  }
})

bot.hears("❔ Help", (ctx) => {
  bot.command("help")(ctx)
})

// Start bot with webhook
async function startBot() {
  try {
    await bot.telegram.deleteWebhook()
    await bot.telegram.setWebhook(`https://close-current-hookworm.ngrok-free.app/webhook`)
    console.log("Webhook set successfully")

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error("Error setting webhook:", error)
  }
}

startBot()

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
