const { Client, GatewayIntentBits, Events } = require("discord.js");
const express = require("express");
//const fetch = require("node-fetch"); // add this
const path = require("path"); // added for favicon

// Create tiny express app so Heroku keeps it alive
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

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ⚠️ Token from env (set this in Heroku dashboard → Settings → Config Vars)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Replace with your n8n webhook URL
const N8N_WEBHOOK_URL =
  "https://aiorchestrator.vcollabetiq.com/webhook-test/discord";

client.once("ready", (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

// 1️⃣ Normal message listener → send to n8n
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // ignore bot messages

  console.log(`📩 Message from ${message.author.username}: ${message.content}`);

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: message.author.username,
        userId: message.author.id,
        channelId: message.channel.id,
        content: message.content,
      }),
    });

    console.log("➡️ Sent to n8n, status:", res.status);
  } catch (err) {
    console.error("❌ Failed to send to n8n:", err);
  }
});

// 2️⃣ Slash command listener
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  if (command === "createcase") {
    await interaction.reply("✅ Case creation request received. Processing...");
    // optional: forward to n8n like in messageCreate
  }

  if (command === "status") {
    await interaction.reply("ℹ️ Checking status...");
  }

  if (command === "help") {
    await interaction.reply("🤖 Available commands: /createcase, /status, /help");
  }
});

// Login bot
if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN not set in environment variables");
  process.exit(1);
}

client.login(DISCORD_TOKEN);
