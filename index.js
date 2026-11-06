const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong!');
  }

  if (message.content === '!hallo') {
    message.reply('Hey! Ich bin Beni-Bot, was geht?');
  }

  if (message.content === '!beni') {
    message.reply('Ja? Beni ist der Beste!');
  }
});

client.login(process.env.DISCORD_TOKEN);
