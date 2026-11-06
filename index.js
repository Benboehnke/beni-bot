const http = require('http');
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot laeuft!');
}).listen(PORT, () => {
  console.log('Webserver laeuft auf Port ' + PORT);
});

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('Du hast keine Rechte zum Bannen!');
    const user = message.mentions.users.first();
    if (!user) return message.reply('Wen soll ich bannen? Mach: `!ban @User Grund`');
    const member = message.guild.members.cache.get(user.id);
    if (!member) return message.reply('User nicht gefunden!');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    await member.ban({ reason });
    return message.reply(`${user.tag} wurde gebannt. Grund: ${reason}`);
  }

  if (command === 'timeout') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('Du hast keine Rechte für Timeout!');
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mach: `!timeout @User Minuten`');
    const member = message.guild.members.cache.get(user.id);
    const minutes = parseInt(args[1]) || 10;
    await member.timeout(minutes * 60 * 1000, 'Timeout');
    return message.reply(`${user.tag} hat ${minutes} Minuten Timeout.`);
  }

  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('Du hast keine Rechte zum Löschen!');
    const amount = parseInt(args[0]) || 10;
    await message.channel.bulkDelete(amount, true);
    return message.reply(`${amount} Nachrichten gelöscht.`).then(m => setTimeout(() => m.delete(), 3000));
  }

  if (command === 'spezclear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('Keine Rechte!');
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mach: `!Spezclear @User 10`');
    const amount = parseInt(args[1]) || 20;
    const fetched = await message.channel.messages.fetch({ limit: amount });
    const toDelete = fetched.filter(m => m.author.id === user.id);
    await message.channel.bulkDelete(toDelete, true);
    return message.reply(`Nachrichten von ${user.tag} gelöscht.`);
  }

  if (command === 'dm') {
    const user = message.mentions.users.first();
    if (!user) return message.reply('Mach: `!dm @User Hallo`');
    const text = args.slice(1).join(' ');
    try {
      await user.send(text);
      return message.reply('DM wurde geschickt!');
    } catch {
      return message.reply('Konnte keine DM schicken, der User hat DMs aus!');
    }
  }

  if (command === 'message') {
    const text = args.join(' ');
    if (!text) return message.reply('Mach: `!message Hallo alle`');
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }
});

client.login(process.env.DISCORD_TOKEN);
