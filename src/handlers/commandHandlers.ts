import { Context } from "../types/index.js"
import { noteService } from "../services/noteService.js"
import { keyboards } from "../keyboards/keyboards.js"
import { formatters } from "../utils/formatters.js"
import { logger } from "@/utils/logger.js"

export const commandHandlers = {
  async start(ctx: Context) {
    const welcomeMessage = `
Welcome to Notes Bot! 📝

Choose an option from the menu below:
• New Note - Create a new note
• List Notes - View all your notes
• Search Notes - Search through your notes
• Help - Show help message
• Settings - Configure bot settings
    `
    await ctx.reply(welcomeMessage, keyboards.main())
  },

  async help(ctx: Context) {
    // logger.info(`Help : ${ctx!.from!.id}`)
    await ctx.reply(formatters.formatHelpMessage(), keyboards.main())
  },

  async newNote(ctx: Context) {
    logger.info(`create a new note for id : ${ctx!.from!.id}`)

    if (!("text" in ctx.message!)) {
      logger.error("no note content")
      return
    }

    const input = ctx.message.text.slice(5).trim()
    if (!input) {
      return ctx.reply(
        "Please provide content for your note.\nFormat: /new [note-content] #[tags]"
      )
    }

    try {
      let title: string | null = null
      let content = input
      const tags: string[] = []

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

      // // Split title and content if | is present
      // if (content.includes("|")) {
      //   ;[title, content] = content.split("|").map((str) => str.trim())
      // }
      const data = await noteService.saveNote(
        ctx.from!.id,
        content,
        title,
        tags
      )
      logger.info(`note created successfully, ${data}`)
      await ctx.reply("✅ Note saved successfully!", keyboards.main())
    } catch (error) {
      console.error("Error saving note:", error)
      await ctx.reply(
        "Sorry, there was an error saving your note. Please try again."
      )
    }
  },

  async handleSearch(ctx: Context) {
    logger.info("searching notes")
    if (!ctx.session.searchType) {
    logger.error("need to select search type")
      return
    }

    if (!("text" in ctx.message!)) {
      logger.warn("invalid search text")
      return
    }

    const searchText = ctx.message.text.trim()

    try {
      let notes
      if (ctx.session.searchType === "tags") {
        const tags = searchText
          .split(" ")
          .filter((tag) => tag.startsWith("#"))
          .map((tag) => tag.slice(1))

        if (tags.length === 0) {
          logger.error(`no valid tags provided for search`);
          
          return ctx.reply(
            "Please provide at least one valid tag starting with #"
          )
        }

        notes = await noteService.searchByTags(ctx.from!.id, tags)
      } else if (ctx.session.searchType === "content") {
        notes = await noteService.searchByContent(ctx.from!.id, searchText)
      }

      if (!notes || notes.length === 0) {
        logger.info(`no notes found for search term: ${ctx!.message!.text}`)
        await ctx.reply(
          "No notes found matching your search.",
          keyboards.main()
        )
      } else {
        await ctx.reply(formatters.formatNoteList(notes), {
          parse_mode: "Markdown",
          ...keyboards.main(),
        })
        logger.info(`Notes found`)
      }

      ctx.session.searchType = undefined
    } catch (error) {
      logger.error("Error searching notes:", error)
      await ctx.reply(
        "Sorry, there was an error searching your notes. Please try again."
      )
    }
  },
}
