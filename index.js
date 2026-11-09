const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Webserver damit Render nicht schläft
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Beni Bot läuft!');
}).listen(process.env.PORT || 10000, () => {
  console.log('Webserver läuft auf Port 10000');
});

client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag}`);
});

// Hilfs-Funktion: Nachricht nach 3s löschen
async function deleteAfter(msg) {
  setTimeout(() => {
    msg.delete().catch(() => {});
  }, 3000);
}

// Hilfs-Funktion: Antwort senden und nach 3s löschen
async function replyAndDelete(message, text) {
  const reply = await message.reply(text);
  deleteAfter(reply);
  deleteAfter(message);
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !ban
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return replyAndDelete(message, 'Nö, du darfst niemanden bannen. Dafür fehlen dir die Rechte!');
    }
    const user = message.mentions.members.first();
    if (!user) return replyAndDelete(message, 'Ey, wen soll ich denn bannen? Markier mal jemanden! Beispiel: `!ban @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.bannable) return replyAndDelete(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    try {
      await user.send(`Du wurdest vom Server **${message.guild.name}** gebannt!\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}\n\nTja, das war's leider. Wenn du denkst, das war ein Fehler, melde dich beim Team!`);
    } catch {}
    await user.ban({ reason });
    return replyAndDelete(message, `BAM! ${user.user.tag} wurde gebannt! Grund: ${reason} - Der kommt so schnell nicht wieder!`);
  }

  // !unban
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return replyAndDelete(message, 'Du hast keine Rechte dazu!');
    }
    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) return replyAndDelete(message, 'Benutzung: `!unban <User-ID>`');
    try {
      await message.guild.bans.remove(userId);
      return replyAndDelete(message, 'User wurde entbannt!');
    } catch {
      return replyAndDelete(message, 'User nicht gefunden oder nicht gebannt!');
    }
  }

  // !kick
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return replyAndDelete(message, 'Du darfst niemanden kicken, sorry!');
    }
    const user = message.mentions.members.first();
    if (!user) return replyAndDelete(message, 'Wen soll ich kicken? Markier den mal! Beispiel: `!kick @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.kickable) return replyAndDelete(message, 'Den kann ich nicht kicken, der ist zu mächtig für mich!');
    await user.kick(reason);
    return replyAndDelete(message, `Raus mit dir! ${user.user.tag} wurde gekickt! Grund: ${reason} - Tschüss!`);
  }

  // !clear
  if (command === '!clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return replyAndDelete(message, 'Du darfst keine Nachrichten löschen!');
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return replyAndDelete(message, 'Sag mir mal eine Zahl von 1 bis 100! Beispiel: `!clear 10`');
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    const reply = await message.channel.send(`Sauber! Ich habe ${amount} Nachrichten weggeputzt! Der Chat glänzt wieder!`);
    deleteAfter(reply);
    return;
  }

  // !mute
  if (command === '!mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return replyAndDelete(message, 'Du darfst niemanden muten!');
    }
    const user = message.mentions.members.first();
    if (!user) return replyAndDelete(message, 'Wen soll ich muten? Beispiel: `!mute @Max 10m spammt`');
    const durationStr = args[1];
    if (!durationStr) return replyAndDelete(message, 'Wie lange denn? Beispiel: `!mute @Max 10m spammt` - m = Minuten, h = Stunden, d = Tage');
    let ms = 0;
    if (durationStr.endsWith('m')) ms = parseInt(durationStr) * 60 * 1000;
    else if (durationStr.endsWith('h')) ms = parseInt(durationStr) * 60 * 60 * 1000;
    else if (durationStr.endsWith('d')) ms = parseInt(durationStr) * 24 * 60 * 60 * 1000;
    else if (durationStr.endsWith('s')) ms = parseInt(durationStr) * 1000;
    else return replyAndDelete(message, 'Hä? So eine Zeit kenne ich nicht. Nimm z.B. `10m`, `1h` oder `1d`');
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    try {
      await user.send(`Du wurdest auf dem Server **${message.guild.name}** gemutet!\n\n**Dauer:** ${durationStr}\n**Grund:** ${reason}\n**Gemutet von:** ${message.author.tag}\n\nErstmal kurz durchatmen und chillen, danach darfst du wieder schreiben!`);
    } catch {}
    await user.timeout(ms, reason);
    return replyAndDelete(message, `Pssst! ${user.user.tag} muss jetzt für ${durationStr} leise sein! Grund: ${reason} - Mal gucken ob er sich benimmt!`);
  }

  // !unmute
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return replyAndDelete(message, 'Du hast keine Rechte dazu!');
    }
    const target = message.mentions.members.first();
    if (!target) return replyAndDelete(message, 'Benutzung: `!unmute @User`');
    try {
      await target.timeout(null);
      await target.send('Du wurdest entmutet!').catch(() => {});
      return replyAndDelete(message, `${target} wurde entmutet!`);
    } catch {
      return replyAndDelete(message, 'Konnte den User nicht entmuten!');
    }
  }

  // !sendmessage
  if (command === '!sendmessage') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return replyAndDelete(message, 'Du darfst keine Nachrichten in andere Channels schicken!');
    }
    const channel = message.mentions.channels.first();
    if (!channel) return replyAndDelete(message, 'In welchen Channel denn? Beispiel: `!sendmessage #allgemein Hallo Leute!`');
    const text = args.slice(1).join(' ');
    if (!text) return replyAndDelete(message, 'Und was soll ich schreiben? Der Text fehlt!');
    await channel.send(text);
    return replyAndDelete(message, `Erledigt! Deine Nachricht ist jetzt in ${channel} - Sieht gut aus!`);
  }

  // !dm
  if (command === '!dm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return replyAndDelete(message, 'Du darfst keine DMs schicken!');
    }
    const user = message.mentions.members.first();
    if (!user) return replyAndDelete(message, 'Wem soll ich schreiben? Beispiel: `!dm @Max Hey, komm mal online!`');
    const text = args.slice(1).join(' ');
    if (!text) return replyAndDelete(message, 'Was soll ich dem denn schreiben?');
    try {
      await user.send(`Hey! Nachricht von ${message.author.tag} aus dem Server **${message.guild.name}**:\n\n${text}`);
      return replyAndDelete(message, `DM ist raus an ${user.user.tag}! Der hat Post von dir!`);
    } catch {
      return replyAndDelete(message, `Uff, ich konnte ${user.user.tag} keine DM schicken. Der hat wohl seine DMs zu!`);
    }
  }

  // !lock
  if (command === '!lock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return replyAndDelete(message, 'Du darfst den Channel nicht sperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return replyAndDelete(message, 'Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben. Nur noch lesen und staunen!');
  }

  // !unlock
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return replyAndDelete(message, 'Du darfst den Channel nicht entsperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return replyAndDelete(message, 'Wieder offen! Ihr dürft hier wieder schreiben, tobt euch aus!');
  }

  // !help
  if (command === '!help') {
    deleteAfter(message);
    const embed = new EmbedBuilder()
      .setTitle('📢 BENI BOT - ALLE COMMANDS')
      .setColor(0x00FF00)
      .setDescription('Hier sind alle Befehle, die du benutzen kannst:')
      .addFields(
        { name: '👮 MODERATION', value: '`!ban @User Grund`\n`!unban User-ID`\n`!kick @User Grund`\n`!mute @User Zeit Grund`\n`!unmute @User`\n`!clear Zahl`', inline: false },
        { name: '💬 NACHRICHTEN', value: '`!sendmessage #Channel Text`\n`!dm @User Text`\n`!sag Text`', inline: false },
        { name: '🔒 CHANNEL', value: '`!lock`\n`!unlock`', inline: false },
        { name: '✅ SONSTIGES', value: '`!ping`\n`!hallo`\n`!owner`\n`!help`', inline: false },
        { name: '⏰ MUTE ZEITEN', value: '`10s` = Sekunden, `10m` = Minuten, `1h` = Stunden, `1d` = Tage', inline: false }
      )
      .setFooter({ text: 'Beni Bot • Alle Commands löschen sich nach 3 Sek' });
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('🚀 Join unseren Discord!')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/7gqzytC3SH')
      );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // !ping
  if (command === '!ping') {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription('Benutze `!help` für mehr Informationen')
      .setColor(0x00FF00)
      .setFooter({ text: 'Beni Bot • Online!' });
    return message.reply({ embeds: [embed] });
  }

  // !hallo
  if (command === '!hallo') {
    return message.reply('Wie gehts! 👋');
  }

  // !sag
  if (command === '!sag') {
    const text = args.join(' ');
    if (!text) return message.reply('Schreib so: `!sag Hallo Leute`');
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  // !owner
  if (command === '!owner') {
    const embed = new EmbedBuilder()
      .setTitle('👑 DER ERSTELLER VON BENI BOT')
      .setDescription('**Elyias**')
      .setColor(0xFFD700)
      .addFields(
        { name: '👤 Name', value: 'Elyias', inline: true },
        { name: '🤖 Was kann er?', value: 'Er kann Bots erstellen!', inline: true },
        { name: '🛡️ Moderator', value: 'Er ist ein guter Moderator!', inline: false },
        { name: '💡 Fun Fact', value: 'Ohne Elyias gäbe es Beni Bot nicht!', inline: false }
      )
      .setFooter({ text: 'Beni Bot • Made by Elyias' });
    return message.reply({ embeds: [embed] });
  }
});

// ===== WELCOME MESSAGE =====
const welcomeChannels = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  const args = message.content.split(' ');
  const command = args[0].toLowerCase();
  if (command !== '!enablewm' && command !== '!disablewm') return;

  setTimeout(() => { message.delete().catch(() => {}); }, 3000);

  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    const noPerm = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Keine Berechtigung')
      .setDescription('Du brauchst **Kanäle verwalten**!')
      .setTimestamp();
    message.channel.send({ embeds: [noPerm] });
    return;
  }

  const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

  if (command === '!enablewm') {
    if (!channel) {
      const err = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Kein Channel angegeben!')
        .setDescription('Benutze: `!enableWM #channel`')
        .setTimestamp();
      message.channel.send({ embeds: [err] });
      return;
    }
    welcomeChannels.set(message.guild.id, channel.id);
    const onEmbed = new EmbedBuilder()
      .setColor(0x00C853)
      .setTitle('✅ Welcome Message AN!')
      .setDescription(`Neue Mitglieder werden jetzt in ${channel} begrüßt!`)
      .addFields(
        { name: '📍 Channel', value: `${channel}`, inline: true },
        { name: '👋 Nachricht', value: 'Willkommen @user zu *Servername*!', inline: true }
      )
      .setFooter({ text: `Aktiviert von ${message.author.tag}` })
      .setTimestamp();
    message.channel.send({ embeds: [onEmbed] });
  }

  if (command === '!disablewm') {
    if (!welcomeChannels.has(message.guild.id)) {
      const err = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('⚠️ War schon aus!')
        .setDescription('Welcome Message war schon aus.')
        .setTimestamp();
      message.channel.send({ embeds: [err] });
      return;
    }
    welcomeChannels.delete(message.guild.id);
    const offEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Welcome Message AUS!')
      .setDescription('Neue Mitglieder werden nicht mehr begrüßt.')
      .setFooter({ text: `Deaktiviert von ${message.author.tag}` })
      .setTimestamp();
    message.channel.send({ embeds: [offEmbed] });
  }
});

client.on('guildMemberAdd', async (member) => {
  const channelId = welcomeChannels.get(member.guild.id);
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  channel.send(`Willkommen ${member} zu **${member.guild.name}**!`);
});
// ===== ENDE WELCOME MESSAGE =====

// ===== LOGIN - MUSS GANZ UNTEN STEHEN =====
const MYTOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN;
console.log('Token da?', !!MYTOKEN, 'Länge:', MYTOKEN?.length);
client.login(MYTOKEN).then(() => {
  console.log('LOGIN VERSUCH GESTARTET');
}).catch(e => {
  console.log('LOGIN FEHLER:', e.message);
});
