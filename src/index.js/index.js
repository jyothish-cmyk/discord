const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Replace with your bot token from Discord Developer Portal
const DISCORD_TOKEN = "MTQxMjQyODEyNzM1NDg4MDE5Mw.GB8Pt4.V40TbSDAC4SwGn7_TaIvzNCuUdcbodkEzHuvqQ";

// Replace with your n8n webhook URL (must be public or tunneled)
const N8N_WEBHOOK_URL = "https://aiorchestrator.vcollabetiq.com/webhook-test/discord";

client.once("ready", (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // ignore bot messages

  console.log(`📩 Message received from ${message.author.username}: ${message.content}`);

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
