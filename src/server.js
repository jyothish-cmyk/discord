const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

// Create tiny express app so Heroku keeps it alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("🚀 Discord bot is running!"));
app.listen(PORT, () => console.log(`🌐 Server listening on port ${PORT}`));

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ⚠️ DO NOT hardcode token in code (security risk)
const DISCORD_TOKEN = "MTQxMjQyODEyNzM1NDg4MDE5Mw.GRzk2O.O5CuvgJi8nyiNFcxqMFl3pRpuQaV47iBAL2Cd4";

// Replace with your n8n webhook URL
const N8N_WEBHOOK_URL = "https://aiorchestrator.vcollabetiq.com/webhook-test/discord";

client.once("ready", (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

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
        content: message.content
      })
    });

    console.log("➡️ Sent to n8n, status:", res.status);
  } catch (err) {
    console.error("❌ Failed to send to n8n:", err);
  }
});

client.login(DISCORD_TOKEN);
