const { Client, GatewayIntentBits, Events } = require("discord.js");
const express = require("express");
const path = require("path");

// -----------------------------
// Express server (Heroku keep alive)
// -----------------------------
const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("🚀 Discord bot is running!");
});

// Handle favicon.ico (serve actual file to avoid H27 logs)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "favicon.ico"));
});

app.listen(PORT, () => console.log(`🌐 Server listening on port ${PORT}`));

// -----------------------------
// Discord client setup
// -----------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ⚠️ Token from env
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// Replace with your n8n webhook URL
const N8N_WEBHOOK_URL =
  "https://aiorchestrator.vcollabetiq.com/webhook/discord";

// 🔥 in-memory map to track thread → command
const threadCommandMap = new Map();

if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN not set in environment variables");
  process.exit(1);
}

client.once("ready", async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);

  // 🔥 Restore any active threads to the map on startup
  const guilds = await client.guilds.fetch();
  for (const [, guildData] of guilds) {
    const guild = await guildData.fetch();
    const channels = await guild.channels.fetchActiveThreads();
    channels.threads.forEach((thread) => {
      if (!threadCommandMap.has(thread.id)) {
        threadCommandMap.set(thread.id, { command: null, userId: null });
      }
    });
  }
});

// -----------------------------
// Normal messages -> n8n
// -----------------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log(`📩 Message from ${message.author.username}: ${message.content}`);

  try {
    const threadInfo = message.channel.isThread()
      ? threadCommandMap.get(message.channel.id)
      : null;

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: message.author.username,
        userId: message.author.id,
        channelId: message.channel.id,
        content: message.content,
        threadId: message.channel.isThread() ? message.channel.id : null,
        command: threadInfo ? threadInfo.command : null,
        commandUserId: threadInfo ? threadInfo.userId : null,
      }),
    });

    console.log("➡️ Sent to n8n, status:", res.status);
  } catch (err) {
    console.error("❌ Failed to send to n8n:", err);
  }
});

// -----------------------------
// Slash commands -> n8n
// -----------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {

    if (
      interaction.commandName === "opportunityowner" ||
      interaction.commandName === "opportunityname" ||
      interaction.commandName === "accountname"
    ) {
      const value =
        interaction.commandName === "opportunityowner"
          ? interaction.options.getString("owner")
          : interaction.commandName === "opportunityname"
          ? interaction.options.getString("name")
          : interaction.options.getString("account");

      const replyMsg = await interaction.reply({
        content: `🔎 Searching Salesforce for ${interaction.commandName} = **${value}** ...`,
        fetchReply: true,
      });

      const thread = await replyMsg.startThread({
        name: `${interaction.commandName}-${interaction.user.username}`,
        autoArchiveDuration: 60,
      });

      console.log(`🧵 Thread created for ${interaction.commandName}: ${value}`);

      threadCommandMap.set(thread.id, {
        command: interaction.commandName,
        userId: interaction.user.id,
        value,
      });

      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: interaction.commandName,
          content: value,
          userId: interaction.user.id,
          username: interaction.user.username,
          channelId: interaction.channel.id,
          messageId: replyMsg.id,
          threadId: thread.id,
        }),
      });

      return;
    }
  
      if (interaction.commandName === "status") {

      const caseNumber = interaction.options.getString("casenumber");



      const replyMsg = await interaction.reply({

        content: `✅ Checking status for case **${caseNumber}**...`,

        fetchReply: true,

      });



      const thread = await replyMsg.startThread({

        name: `case-${caseNumber}`,

        autoArchiveDuration: 60,

      });



      console.log(`🧵 Thread created for case: ${caseNumber}`);



      threadCommandMap.set(thread.id, {

        command: interaction.commandName,

        userId: interaction.user.id,

        caseNumber,

      });



      await fetch(N8N_WEBHOOK_URL, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          command: interaction.commandName,

          content: "CaseNumber - " + caseNumber,

          userId: interaction.user.id,

          username: interaction.user.username,

          channelId: interaction.channel.id,

          messageId: replyMsg.id,

          threadId: thread.id,

        }),

      });



      return;

    }



    // ✅ Handle /help separately

    if (interaction.commandName === "help") {

      const query = interaction.options.getString("query");



      const replyMsg = await interaction.reply({

        content: `✅ Help request received: **${query}**`,

        fetchReply: true,

      });



      const thread = await replyMsg.startThread({

        name: `help-${interaction.user.username}`,

        autoArchiveDuration: 60,

      });



      console.log(`🧵 Thread created for help query: ${query}`);



      threadCommandMap.set(thread.id, {

        command: interaction.commandName,

        userId: interaction.user.id,

        query,

      });



      //await thread.send(`📩 User query: **${query}**`);



      await fetch(N8N_WEBHOOK_URL, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          command: interaction.commandName,

          content: query,

          userId: interaction.user.id,

          username: interaction.user.username,

          channelId: interaction.channel.id,

          messageId: replyMsg.id,

          threadId: thread.id,

        }),

      });



      return;

    }
    const replyMsg = await interaction.reply({
      content: "✅ Command received! Response will appear in the thread.",
      fetchReply: true,
    });

    const thread = await replyMsg.startThread({
      name: `${interaction.commandName}-${interaction.user.username}`,
      autoArchiveDuration: 60,
    });

    console.log(`🧵 Thread created: ${thread.name}`);

    // 🔥 Save mapping of thread → command
    threadCommandMap.set(thread.id, {
      command: interaction.commandName,
      userId: interaction.user.id,
    });

    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: interaction.commandName,
        content: interaction.commandName,
        userId: interaction.user.id,
        username: interaction.user.username,
        channelId: interaction.channel.id,
        messageId: replyMsg.id,
        threadId: thread.id,
      }),
    });
  } catch (err) {
    console.error("❌ Error handling slash command:", err);
  }
});

// -----------------------------
// Login bot
// -----------------------------
client.login(DISCORD_TOKEN);
