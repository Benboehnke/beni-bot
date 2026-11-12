
const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');

console.log('Bot startet...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ===== DEBUG / ERROR HANDLING =====
client.on('debug', (info) => console.log('DEBUG:', info));
client.on('warn', (info) => console.log('WARN:', info));
client.on('error', (e) => console.log('DISCORD CLIENT FEHLER:', e.message));
client.on('shardDisconnect', () => console.log('Shard disconnected!'));
process.on('unhandledRejection', (e) => console.log('UNHANDLED FEHLER:', e?.message || e));
process.on('uncaughtException', (e) => console.log('UNCAUGHT FEHLER:', e?.message || e));

setTimeout(() => {
  if (!client.user) console.log('LOGIN HÄNGT! Nach 15 Sekunden immer noch nicht eingeloggt!');
}, 15000);

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Beni Bot läuft!');
}).listen(process.env.PORT || 10000, () => {
  console.log('Webserver läuft auf Port 10000');
});

function onReady() {
  console.log(`Eingeloggt als ${client.user.tag}`);
  console.log('Bot logged in Successfully! 🎉');
}
client.once('ready', onReady);
client.once('clientReady', onReady);

// ===== STORAGE =====
const blacklistRoles = new Map();
const blacklistData = new Map();
const welcomeChannels = new Map();
let logChannels = {};
if (fs.existsSync('./logchannels.json')) {
  try { logChannels = JSON.parse(fs.readFileSync('./logchannels.json', 'utf8')); } catch (e) { logChannels = {}; }
}
function saveLogChannels() {
  fs.writeFileSync('./logchannels.json', JSON.stringify(logChannels, null, 2));
}

async function deleteAfter(msg) {
  setTimeout(() => { msg.delete().catch(() => {}); }, 3000);
}

async function success(message, text) {
  await message.react('✅').catch(() => {});
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Erfolgreich!')
    .setDescription(text)
    .setFooter({ text: `Ausgeführt von ${message.author.tag}` })
    .setTimestamp();
  const reply = await message.reply({ embeds: [embed] });
  deleteAfter(reply);
  deleteAfter(message);
}

async function fail(message, text) {
  await message.react('❌').catch(() => {});
  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Fehlgeschlagen!')
    .setDescription(text)
    .setFooter({ text: `Ausgeführt von ${message.author.tag}` })
    .setTimestamp();
  const reply = await message.reply({ embeds: [embed] });
  deleteAfter(reply);
  deleteAfter(message);
}

// ===== BUTTON HANDLER =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('copy_id_')) return;
  const idToCopy = interaction.customId.replace('copy_id_', '');
  await interaction.reply({ content: `Hier zum Kopieren:\n\`\`\`${idToCopy}\`\`\``, ephemeral: true }).catch(() => {});
});

// ===== WELCOME =====
client.on('guildMemberAdd', async (member) => {
  const channelId = welcomeChannels.get(member.guild.id);
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  channel.send(`Willkommen ${member} zu **${member.guild.name}**!`);
});

// ===== LOGGER: EDIT / DELETE =====
client.on('messageUpdate', async (oldMsg, newMsg) => {
  try {
    if (!oldMsg.guild) return;
    if (oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const logId = logChannels[oldMsg.guild.id];
    if (!logId) return;
    const logCh = oldMsg.guild.channels.cache.get(logId);
    if (!logCh) return;
    const embed = new EmbedBuilder()
      .setTitle('✏️ Nachricht bearbeitet')
      .addFields(
        { name: '👤 User', value: `${oldMsg.author} - \`${oldMsg.author.tag}\``, inline: true },
        { name: '📍 Channel', value: `${oldMsg.channel}`, inline: true },
        { name: '🔴 VORHER', value: oldMsg.content ? oldMsg.content.slice(0, 1000) : '*Leer*', inline: false },
        { name: '🟢 NACHHER', value: newMsg.content ? newMsg.content.slice(0, 1000) : '*Leer*', inline: false }
      )
      .setColor(0xFFAA00)
      .setThumbnail(oldMsg.author.displayAvatarURL())
      .setFooter({ text: `User ID: ${oldMsg.author.id} | Message ID: ${oldMsg.id}` })
      .setTimestamp();
    await logCh.send({ embeds: [embed] });
  } catch (e) {}
});

client.on('messageDelete', async (msg) => {
  try {
    if (!msg.guild) return;
    if (msg.author?.bot) return;
    const logId = logChannels[msg.guild.id];
    if (!logId) return;
    const logCh = msg.guild.channels.cache.get(logId);
    if (!logCh) return;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Nachricht gelöscht')
      .addFields(
        { name: '👤 User', value: msg.author ? `${msg.author} - \`${msg.author.tag}\`` : 'Unbekannt', inline: true },
        { name: '📍 Channel', value: `${msg.channel}`, inline: true },
        { name: '💬 Gelöschter Inhalt', value: msg.content ? msg.content.slice(0, 1000) : '*Keine Text-Nachricht*', inline: false }
      )
      .setColor(0xFF0000)
      .setThumbnail(msg.author?.displayAvatarURL())
      .setFooter({ text: `User ID: ${msg.author?.id} | Message ID: ${msg.id}` })
      .setTimestamp();
    await logCh.send({ embeds: [embed] });
  } catch (e) {}
});

// ===== HAUPT HANDLER - ALLE COMMANDS HIER DRIN =====
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ----- LOGGER: Gesendete Nachrichten -----
  try {
    if (!message.content.toLowerCase().startsWith('!messagelog') && !message.content.toLowerCase().startsWith('!dashboard')) {
      const logId = logChannels[message.guild.id];
      if (logId && message.channel.id !== logId) {
        const logCh = message.guild.channels.cache.get(logId);
        if (logCh) {
          const embed = new EmbedBuilder()
            .setTitle('📤 Nachricht gesendet')
            .addFields(
              { name: '👤 User', value: `${message.author} - \`${message.author.tag}\``, inline: true },
              { name: '📍 Channel', value: `${message.channel}`, inline: true },
              { name: '💬 Inhalt', value: message.content ? message.content.slice(0, 1000) : '*Keine Text-Nachricht (Bild / Datei)*', inline: false },
              { name: '🔗 Link', value: `[Zur Nachricht springen](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`, inline: false }
            )
            .setColor(0x00AAFF)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: `User ID: ${message.author.id} | Message ID: ${message.id}` })
            .setTimestamp();
          logCh.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  } catch {}

  // ----- !id -----
  if (command === '!id') {
    await message.react('⏳').catch(() => {});
    const target = message.mentions.users.first();
    if (!target) return fail(message, 'Ey, wen denn? Markier mal jemanden! Beispiel: `!id @Max`');
    const embed = new EmbedBuilder()
      .setTitle(`ID von ${target.username}`)
      .setDescription(`Die ID ist versteckt, damit sie nicht jeder sieht.\nKlick unten auf den Button - nur du siehst sie dann!`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(0x5865F2)
      .setFooter({ text: `Angefordert von ${message.author.tag}` })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`copy_id_${target.id}`).setLabel('📋 ID Kopieren').setStyle(ButtonStyle.Primary)
    );
    await message.react('✅').catch(() => {});
    const reply = await message.reply({ embeds: [embed], components: [row] });
    setTimeout(() => { reply.delete().catch(() => {}); }, 15000);
    deleteAfter(message);
    return;
  }

  // ----- !ban -----
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return fail(message, 'Nö, du darfst niemanden bannen. Dafür fehlen dir die Rechte!');
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Ey, wen soll ich denn bannen? Markier mal jemanden! Beispiel: `!ban @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.bannable) return fail(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    try { await user.send(`Du wurdest vom Server **${message.guild.name}** gebannt!\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}`); } catch {}
    await user.ban({ reason });
    return success(message, `BAM! **${user.user.tag}** wurde gebannt!\n**Grund:** ${reason}`);
  }

  // ----- !unban -----
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return fail(message, 'Du hast keine Rechte dazu!');
    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) return fail(message, 'Benutzung: `!unban <User-ID>`');
    try { await message.guild.bans.remove(userId); return success(message, 'User wurde entbannt!'); }
    catch { return fail(message, 'User nicht gefunden oder nicht gebannt!'); }
  }

  // ----- !kick -----
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return fail(message, 'Du darfst niemanden kicken, sorry!');
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Wen soll ich kicken? Markier den mal! Beispiel: `!kick @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.kickable) return fail(message, 'Den kann ich nicht kicken, der ist zu mächtig für mich!');
    await user.kick(reason);
    return success(message, `Raus mit dir! **${user.user.tag}** wurde gekickt!\n**Grund:** ${reason}`);
  }

  // ----- !clear -----
  if (command === '!clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return fail(message, 'Du darfst keine Nachrichten löschen!');
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return fail(message, 'Sag mir mal eine Zahl von 1 bis 100! Beispiel: `!clear 10`');
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    await message.react('✅').catch(() => {});
    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Erfolgreich!').setDescription(`Sauber! Ich habe **${amount}** Nachrichten weggeputzt! Der Chat glänzt wieder!`).setTimestamp();
    const reply = await message.channel.send({ embeds: [embed] });
    deleteAfter(reply);
    return;
  }

  // ----- !mute -----
  if (command === '!mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Du darfst niemanden muten!');
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Wen soll ich muten? Beispiel: `!mute @Max 10m spammt`');
    const durationStr = args[1];
    if (!durationStr) return fail(message, 'Wie lange denn? Beispiel: `!mute @Max 10m spammt` - m = Minuten, h = Stunden, d = Tage');
    let ms = 0;
    if (durationStr.endsWith('m')) ms = parseInt(durationStr) * 60 * 1000;
    else if (durationStr.endsWith('h')) ms = parseInt(durationStr) * 60 * 60 * 1000;
    else if (durationStr.endsWith('d')) ms = parseInt(durationStr) * 24 * 60 * 60 * 1000;
    else if (durationStr.endsWith('s')) ms = parseInt(durationStr) * 1000;
    else return fail(message, 'Hä? So eine Zeit kenne ich nicht. Nimm z.B. `10m`, `1h` oder `1d`');
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    try { await user.send(`Du wurdest auf dem Server **${message.guild.name}** gemutet!\n\n**Dauer:** ${durationStr}\n**Grund:** ${reason}\n**Gemutet von:** ${message.author.tag}`); } catch {}
    await user.timeout(ms, reason);
    return success(message, `Pssst! **${user.user.tag}** muss jetzt für **${durationStr}** leise sein!\n**Grund:** ${reason}`);
  }

  // ----- !unmute -----
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Du hast keine Rechte dazu!');
    const target = message.mentions.members.first();
    if (!target) return fail(message, 'Benutzung: `!unmute @User`');
    try { await target.timeout(null); await target.send('Du wurdest entmutet!').catch(() => {}); return success(message, `${target} wurde entmutet!`); }
    catch { return fail(message, 'Konnte den User nicht entmuten!'); }
  }

  // ----- !sendmessage -----
  if (command === '!sendmessage') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return fail(message, 'Du darfst keine Nachrichten in andere Channels schicken!');
    const channel = message.mentions.channels.first();
    if (!channel) return fail(message, 'In welchen Channel denn? Beispiel: `!sendmessage #allgemein Hallo Leute!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Und was soll ich schreiben? Der Text fehlt!');
    await channel.send(text);
    return success(message, `Erledigt! Deine Nachricht ist jetzt in ${channel}!`);
  }

  // ----- !dm -----
  if (command === '!dm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return fail(message, 'Du darfst keine DMs schicken!');
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Wem soll ich schreiben? Beispiel: `!dm @Max Hey, komm mal online!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Was soll ich dem denn schreiben?');
    try { await user.send(`Hey! Nachricht von ${message.author.tag} aus dem Server **${message.guild.name}**:\n\n${text}`); return success(message, `DM ist raus an **${user.user.tag}**! Der hat Post von dir!`); }
    catch { return fail(message, `Uff, ich konnte **${user.user.tag}** keine DM schicken. Der hat wohl seine DMs zu!`); }
  }

  // ----- !lock / !unlock -----
  if (command === '!lock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return fail(message, 'Du darfst den Channel nicht sperren!');
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return success(message, 'Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben.');
  }
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return fail(message, 'Du darfst den Channel nicht entsperren!');
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return success(message, 'Wieder offen! Ihr dürft hier wieder schreiben, tobt euch aus!');
  }

  // ----- !help -----
  if (command === '!help') {
    await message.react('✅').catch(() => {});
    deleteAfter(message);
    const embed = new EmbedBuilder()
      .setTitle('📢 BENI BOT - ALLE COMMANDS')
      .setColor(0x00FF00)
      .setDescription('Hier sind alle Befehle, die du benutzen kannst:')
      .addFields(
        { name: '👮 MODERATION', value: '`!ban @User Grund`\n`!unban User-ID`\n`!kick @User Grund`\n`!mute @User Zeit Grund`\n`!unmute @User`\n`!clear Zahl`\n`!blacklist @User Grund`\n`!free @User`', inline: false },
        { name: '💬 NACHRICHTEN', value: '`!sendmessage #Channel Text`\n`!dm @User Text`\n`!sag Text`', inline: false },
        { name: '🔒 CHANNEL', value: '`!lock`\n`!unlock`', inline: false },
        { name: '🆔 USER', value: '`!id @User`', inline: false },
        { name: '📊 STATS', value: '`!stats`\n`!as`\n`!dashboard`\n`!messagelog #channel`\n`!partnership Link`\n`!enablewm #channel`\n`!disablewm`', inline: false },
        { name: '✅ SONSTIGES', value: '`!ping`\n`!hallo`\n`!owner`\n`!help`\n`!remember Zeit Text`', inline: false },
        { name: '⏰ MUTE ZEITEN', value: '`10s` = Sekunden, `10m` = Minuten, `1h` = Stunden, `1d` = Tage', inline: false }
      )
      .setFooter({ text: 'Beni Bot • Alle Commands löschen sich nach 3 Sek' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🚀 Join unseren Discord!').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ----- !ping / !hallo / !sag / !owner -----
  if (command === '!ping') {
    await message.react('✅').catch(() => {});
    const embed = new EmbedBuilder().setTitle('🏓 Pong!').setDescription('Benutze `!help` für mehr Informationen').setColor(0x00FF00).setFooter({ text: 'Beni Bot • Online!' });
    const r = await message.reply({ embeds: [embed] });
    deleteAfter(r); deleteAfter(message);
    return;
  }
  if (command === '!hallo') {
    await message.react('👋').catch(() => {});
    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('👋 Hallo!').setDescription('Wie gehts! 👋').setTimestamp();
    const r = await message.reply({ embeds: [embed] });
    deleteAfter(r); deleteAfter(message);
    return;
  }
  if (command === '!sag') {
    const text = args.join(' ');
    if (!text) return fail(message, 'Schreib so: `!sag Hallo Leute`');
    await message.react('✅').catch(() => {});
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }
  if (command === '!owner') {
    await message.react('✅').catch(() => {});
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
    const r = await message.reply({ embeds: [embed] });
    deleteAfter(r); deleteAfter(message);
    return;
  }

  // ----- !enablewm / !disablewm -----
  if (command === '!enablewm' || command === '!disablewm') {
    setTimeout(() => { message.delete().catch(() => {}); }, 3000);
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await message.react('❌').catch(() => {});
      const noPerm = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Keine Berechtigung').setDescription('Du brauchst **Kanäle verwalten**!').setTimestamp();
      message.channel.send({ embeds: [noPerm] });
      return;
    }
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (command === '!enablewm') {
      if (!channel) {
        await message.react('❌').catch(() => {});
        const err = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Kein Channel angegeben!').setDescription('Benutze: `!enableWM #channel`').setTimestamp();
        message.channel.send({ embeds: [err] });
        return;
      }
      welcomeChannels.set(message.guild.id, channel.id);
      await message.react('✅').catch(() => {});
      const onEmbed = new EmbedBuilder().setColor(0x00C853).setTitle('✅ Welcome Message AN!').setDescription(`Neue Mitglieder werden jetzt in ${channel} begrüßt!`).setFooter({ text: `Aktiviert von ${message.author.tag}` }).setTimestamp();
      message.channel.send({ embeds: [onEmbed] });
    }
    if (command === '!disablewm') {
      if (!welcomeChannels.has(message.guild.id)) {
        await message.react('❌').catch(() => {});
        const err = new EmbedBuilder().setColor(0xFFAA00).setTitle('⚠️ War schon aus!').setDescription('Welcome Message war schon aus.').setTimestamp();
        message.channel.send({ embeds: [err] });
        return;
      }
      welcomeChannels.delete(message.guild.id);
      await message.react('✅').catch(() => {});
      const offEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Welcome Message AUS!').setDescription('Neue Mitglieder werden nicht mehr begrüßt.').setFooter({ text: `Deaktiviert von ${message.author.tag}` }).setTimestamp();
      message.channel.send({ embeds: [offEmbed] });
    }
    return;
  }

  // ----- !dashboard / !dash / !website / !web -----
  if (command === '!dashboard' || command === '!dash' || command === '!website' || command === '!web') {
    try {
      await message.react('✅').catch(() => {});
      await new Promise(r => setTimeout(r, 500));
      const dashboardEmbed = new EmbedBuilder()
        .setTitle('🌐 BENI BOT - OFFICIAL DASHBOARD')
        .setDescription('Willkommen im offiziellen Dashboard von **Beni Bot**!\n\nHier kannst du alles rund um Beni Bot sehen, testen und verwalten.\nDas Dashboard ist **100% kostenlos** und für jeden zugänglich.\n\n👇 **Klick unten auf den Link, um das Dashboard zu öffnen!**')
        .addFields(
          { name: '🔗 DASHBOARD LINK', value: '[**➡️ KLICKE HIER - BENI BOT DASHBOARD ÖFFNEN ⬅️**](https://beni-bot-dashboard.netlify.app/)\n\n`https://beni-bot-dashboard.netlify.app/`', inline: false },
          { name: '📜 WAS KANNST DU AUF DEM DASHBOARD MACHEN?', value: '🔒 **Mit Discord einloggen** - Sicher mit deinem Discord Account\n📜 **Alle Commands sehen** - Alle Befehle auf einen Blick\n🎮 **Live Chat Simulator** - Teste Beni Bot direkt auf der Website\n🕹️ **Mini-Game spielen** - Klick den Beni und knack den Highscore\n⭐ **Bot bewerten** - Gib Beni Bot Sterne und Feedback\n🏆 **Top Server sehen** - Welche Server nutzen Beni Bot?\n📢 **Neuigkeiten & Updates** - Immer auf dem neuesten Stand bleiben', inline: false },
          { name: '📊 BENI BOT STATS', value: '• **Uptime:** 99.9%\n• **Ping:** Schnell & Stabil\n• **Version:** v2.0 - Dashboard Update\n• **Status:** Online', inline: true },
          { name: '👑 MADE BY', value: '**Elyias**\nFounder & Developer\nvon Beni Bot', inline: true },
          { name: '💡 TIPP', value: 'Wenn du Beni Bot noch nicht auf deinem Server hast, kannst du ihn direkt über das Dashboard zu deinem Server hinzufügen!', inline: false }
        )
        .setColor(0x00AAFF)
        .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
        .setFooter({ text: 'BENI BOT • Dashboard • Made by Elyias', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      const dashboardButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🌐 Dashboard öffnen').setStyle(ButtonStyle.Link).setURL('https://beni-bot-dashboard.netlify.app/'),
        new ButtonBuilder().setLabel('➕ Bot hinzufügen').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
        new ButtonBuilder().setLabel('💬 Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
      );
      await message.channel.send({ embeds: [dashboardEmbed], components: [dashboardButtons] });
    } catch (e) { console.log('Fehler bei !dashboard:', e); }
    return;
  }

  // ----- !messagelog -----
  if (command === '!messagelog') {
    if (args[0]?.toLowerCase() === 'off') {
      await message.react('✅').catch(() => {});
      await new Promise(r => setTimeout(r, 400));
      if (!logChannels[message.guild.id]) return message.channel.send({ embeds: [new EmbedBuilder().setTitle('⚠️ MESSAGE LOG - NICHT AKTIV').setDescription('Message Log war gar nicht aktiviert.\nAktiviere es mit: `!messagelog #channel`').setColor(0xFFAA00).setTimestamp()] });
      delete logChannels[message.guild.id];
      saveLogChannels();
      return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ MESSAGE LOG DEAKTIVIERT').setDescription('Es werden ab jetzt **keine** Nachrichten mehr geloggt.').addFields({ name: '👤 Deaktiviert von', value: `${message.author}`, inline: true }, { name: '🔁 Wieder aktivieren', value: '`!messagelog #channel`', inline: true }).setColor(0xFF0000).setFooter({ text: 'BENI BOT • Message Log System' }).setTimestamp()] });
    }
    if (args[0]?.toLowerCase() === 'status') {
      await message.react('✅').catch(() => {});
      await new Promise(r => setTimeout(r, 400));
      const currentId = logChannels[message.guild.id];
      if (!currentId) return message.channel.send('⚠️ Message Log ist **nicht** aktiviert.\nAktiviere mit: `!messagelog #channel`');
      const ch = message.guild.channels.cache.get(currentId);
      return message.channel.send(`✅ Message Log ist aktiv in: ${ch ? ch : 'Unbekannter Channel'}`);
    }
    try {
      if (!message.member.permissions.has('Administrator')) {
        await message.react('❌').catch(() => {});
        return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ KEINE BERECHTIGUNG').setDescription('Du brauchst **Administrator** Rechte!').setColor(0xFF0000).setTimestamp()] });
      }
      const targetChannel = message.mentions.channels.first();
      if (!targetChannel) {
        await message.react('❌').catch(() => {});
        return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ FALSCHE BENUTZUNG').setDescription('Du musst einen Channel angeben!').addFields({ name: '✅ Richtig', value: '`!messagelog #logs`', inline: false }, { name: '⚙️ Weitere Befehle', value: '`!messagelog status`\n`!messagelog off`', inline: false }).setColor(0xFF0000).setTimestamp()] });
      }
      if (!targetChannel.permissionsFor(message.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
        await message.react('❌').catch(() => {});
        return message.channel.send(`❌ Ich kann in ${targetChannel} keine Nachrichten / Embeds senden!`);
      }
      await message.react('✅').catch(() => {});
      await new Promise(r => setTimeout(r, 600));
      logChannels[message.guild.id] = targetChannel.id;
      saveLogChannels();
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ MESSAGE LOG AKTIVIERT')
        .setDescription(`Das Message Log wurde erfolgreich eingerichtet!\n\nAlle Nachrichten werden jetzt in ${targetChannel} geloggt.`)
        .addFields(
          { name: '📤 WAS WIRD GELOGGT?', value: '• **Gesendete Nachrichten**\n• **Bearbeitete Nachrichten** - Vorher / Nachher\n• **Gelöschte Nachrichten**\n• **Bilder & Dateien**', inline: false },
          { name: '📍 LOG CHANNEL', value: `${targetChannel}`, inline: true },
          { name: '👤 EINGERICHTET VON', value: `${message.author}`, inline: true },
          { name: '⚙️ BEFEHLE', value: '`!messagelog status`\n`!messagelog off`', inline: false }
        )
        .setColor(0x00FF88)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: 'BENI BOT • Message Log System • Made by Elyias' })
        .setTimestamp();
      await message.channel.send({ embeds: [successEmbed] });
      await targetChannel.send({ embeds: [new EmbedBuilder().setTitle('🔔 MESSAGE LOG TEST').setDescription('Das Message Log ist jetzt aktiv!\n\nAb jetzt werden hier alle gesendeten, bearbeiteten und gelöschten Nachrichten angezeigt.').addFields({ name: '📍 Server', value: message.guild.name, inline: true }, { name: '👤 Eingerichtet von', value: message.author.tag, inline: true }).setColor(0x00AAFF).setTimestamp()] }).catch(() => {});
    } catch (e) { console.log('Fehler bei !messagelog:', e); }
    return;
  }

  // ----- !partnership -----
  if (command === '!partnership') {
    let inviteLink = args[0];
    if (!inviteLink) {
      await message.react('❌').catch(()=>{});
      return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ KEIN LINK!').setDescription('Du musst einen Discord-Link angeben!\n\n**So geht\'s:**\n`!partnership https://discord.gg/deinserver`\n`!partnership discord.gg/deinserver`').setColor(0xFF0000).setTimestamp()] });
    }
    try {
      await message.react('✅').catch(()=>{});
      await new Promise(r => setTimeout(r, 500));
      let code = inviteLink.replace('https://discord.gg/', '').replace('http://discord.gg/', '').replace('discord.gg/', '').replace('https://discord.com/invite/', '').split('/')[0].split('?')[0];
      let invite = null;
      try { invite = await client.fetchInvite(code); } catch(e) { invite = null; }
      const guildName = invite?.guild?.name || message.guild.name;
      const memberCount = invite?.approximate_member_count || message.guild.memberCount;
      const onlineCount = invite?.approximate_presence_count || '???';
      const guildIcon = invite?.guild?.iconURL({ size: 512 }) || message.guild.iconURL({ size: 512 }) || client.user.displayAvatarURL();
      const guildDesc = invite?.guild?.description || 'Ein cooler Discord Server - Join uns!';
      const inviter = message.author;
      const partnershipTexts = [
        `🔥 **NEUE PARTNERSCHAFT!** 🔥\n\nWir freuen uns riesig, euch unseren neuen Partner-Server vorzustellen!\n\n**🌟 ${guildName}**\n> ${guildDesc}\n\n**📊 Was dich erwartet:**\n👥 **${memberCount}** Member & wachsend!\n🟢 **${onlineCount}** gerade online\n🎮 Aktive Community, Events & Giveaways\n💬 Nette Leute & aktive Chats\n🤝 Respektvoller Umgang\n\n**👉 JOINE JETZT:**\n${inviteLink}\n\n*Partnerschaft mit ${message.guild.name} • Angefragt von ${inviter}*`,
        `✨ **PARTNERSCHAFT** ✨\n\nHey Leute, wir haben einen neuen Partner! 🫶\n\n**💎 ${guildName}**\n> *${guildDesc}*\n\nWarum solltest du joinen?\n✅ Coole Community mit **${memberCount}** Membern\n✅ Täglich aktive Chats\n✅ Events, Giveaways & viel mehr\n✅ Super nette Mods & Owner\n\n**🔗 Hier geht's zum Server:**\n${inviteLink}\n\nSchaut gerne mal vorbei und sagt, dass ihr von **${message.guild.name}** kommt! 💙`,
        `🤝 **OFFIZIELLE PARTNERSCHAFT** 🤝\n\nWir begrüßen offiziell unseren neuen Partner-Server:\n\n**🏆 ${guildName}**\n\n**📝 Über den Server:**\n${guildDesc}\n\n**📈 Statistiken:**\n• 👥 Mitglieder: **${memberCount}**\n• 🟢 Online: **${onlineCount}**\n• 📅 Partnerschaft seit: <t:${Math.floor(Date.now()/1000)}:D>\n\n**🔗 Einladung:**\n${inviteLink}\n\n*Wir freuen uns auf eine lange und erfolgreiche Partnerschaft!*\n*— Team ${message.guild.name}*`,
        `🚀 **PARTNER ALERT!** 🚀\n\n**${guildName}** ist jetzt offizieller Partner von **${message.guild.name}**!\n\n👥 ${memberCount} Member | 🟢 ${onlineCount} Online\n💬 ${guildDesc}\n\n**JOIN:** ${inviteLink}\n\nLasst Liebe da! ❤️🔥`
      ];
      const randomText = partnershipTexts[Math.floor(Math.random() * partnershipTexts.length)];
      const partnerEmbed = new EmbedBuilder()
        .setTitle(`🤝 PARTNERSCHAFT - ${guildName}`)
        .setDescription(randomText)
        .addFields(
          { name: '🏠 Partner Server', value: `**${guildName}**`, inline: true },
          { name: '👥 Member', value: `**${memberCount}**`, inline: true },
          { name: '🟢 Online', value: `**${onlineCount}**`, inline: true },
          { name: '👤 Partnerschaft von', value: `${inviter}`, inline: true },
          { name: '📅 Seit', value: `<t:${Math.floor(Date.now()/1000)}:D>`, inline: true },
          { name: '🔗 Link', value: `[Klicke hier zum Joinen](${inviteLink})`, inline: true }
        )
        .setColor(0xFF00AA)
        .setThumbnail(guildIcon)
        .setImage(guildIcon)
        .setFooter({ text: `BENI BOT • Partnership System • ${message.guild.name} x ${guildName}` })
        .setTimestamp();
      const partnerButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(`🚀 ${guildName} joinen`).setStyle(ButtonStyle.Link).setURL(inviteLink.startsWith('http') ? inviteLink : `https://${inviteLink}`),
        new ButtonBuilder().setLabel('💬 Support').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
      );
      await message.channel.send({ content: `||@everyone||\n**Neue Partnerschaft!** 🎉`, embeds: [partnerEmbed], components: [partnerButtons] });
      await message.channel.send({ content: `**📋 KOPIER-TEXT FÜR DEINEN PARTNER-CHANNEL:**\n\`\`\`\n${randomText.replace(/\*\*/g, '').replace(/__/g, '')}\n\`\`\`` }).catch(()=>{});
    } catch (e) { console.log('Fehler bei !partnership:', e); }
    return;
  }

  // ----- !stats -----
  if (command === '!stats') {
    try {
      const totalServers = client.guilds.cache.size;
      let totalUsers = 0;
      client.guilds.cache.forEach(g => { totalUsers += g.memberCount || 0; });
      const statsEmbed = new EmbedBuilder()
        .setTitle('📊 BENI - STATS')
        .setColor('#00FF00')
        .setDescription(`**Beni ist auf ${totalServers} Servern aktiv!**`)
        .addFields(
          { name: '🖥️ Server', value: `${totalServers}`, inline: true },
          { name: '👥 User Total', value: `${totalUsers}`, inline: true },
          { name: '📶 Ping', value: `${client.ws.ping}ms`, inline: true }
        )
        .setFooter({ text: 'Beni Bot • !stats' })
        .setTimestamp();
      await message.reply({ embeds: [statsEmbed] });
    } catch (e) { console.log('Fehler bei !stats:', e); }
    return;
  }

  // ----- !as -----
  if (command === '!as') {
    try { await message.react('✅'); } catch (e) { console.log('Konnte nicht reagieren:', e); }
    let totalUsers = 0;
    client.guilds.cache.forEach(g => { totalUsers += g.memberCount || 0; });
    const totalServers = client.guilds.cache.size;
    const topServers = [...client.guilds.cache.values()]
      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      .slice(0, 5)
      .map((g, i) => `**${i + 1}.** ${g.name} - ${g.memberCount} User`)
      .join('\n') || 'Keine Server';
    const asEmbed = new EmbedBuilder()
      .setTitle('📊 BENI - SERVER STATS')
      .setColor('#00FF00')
      .setDescription(`**Beni ist auf ${totalServers} Servern aktiv!**`)
      .addFields(
        { name: '🖥️ Server', value: `${totalServers}`, inline: true },
        { name: '👥 User Total', value: `${totalUsers}`, inline: true },
        { name: '📶 Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '🏆 Top 5 Server', value: topServers, inline: false }
      )
      .setFooter({ text: 'Beni Bot • !as' })
      .setTimestamp();
    await message.reply({ embeds: [asEmbed] });
    return;
  }

  // ----- BLACKLIST -----
  if (command === '!addblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('❌ You need Manage Roles!').then(m=>deleteAfter(m));
    deleteAfter(message);
    const role = message.mentions.roles.first(); if(!role) return message.reply('❌ Usage: `!addBLrole @role`').then(m=>deleteAfter(m));
    blacklistRoles.set(message.guild.id, role.id);
    const e = new EmbedBuilder().setTitle('✅ Blacklist Role Set').setDescription(`Blacklist Role is now: ${role}`).setColor(0x00FF00);
    return message.channel.send({ embeds: [e] });
  }
  if (command === '!removeblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('❌ You need Manage Roles!').then(m=>deleteAfter(m));
    deleteAfter(message);
    blacklistRoles.delete(message.guild.id);
    return message.channel.send('✅ Blacklist Role removed!');
  }
  if (command === '!blacklist') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('❌ You need Moderate Members!').then(m=>deleteAfter(m));
    deleteAfter(message);
    const target = message.mentions.members.first(); if(!target) return message.reply('❌ Usage: `!blacklist @member Reason`').then(m=>deleteAfter(m));
    if (target.id === message.author.id) return message.reply('❌ You cannot blacklist yourself!').then(m=>deleteAfter(m));
    let blRoleId = blacklistRoles.get(message.guild.id);
    let blRole = blRoleId ? message.guild.roles.cache.get(blRoleId) : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    if (!blRole) { try { blRole = await message.guild.roles.create({ name: 'Blacklist', color: 0x000000, reason: 'Auto created Blacklist Role' }); } catch { return message.reply('❌ Could not create Blacklist Role!').then(m=>deleteAfter(m)); } }
    const oldRoles = target.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.id);
    blacklistData.set(`${message.guild.id}-${target.id}`, oldRoles);
    try { await target.roles.remove(oldRoles).catch(()=>{}); await target.roles.add(blRole).catch(()=>{}); await target.timeout(28*24*60*60*1000, 'Blacklisted').catch(()=>{}); } catch { return message.reply('❌ Error!').then(m=>deleteAfter(m)); }
    const reason = args.slice(1).join(' ') || 'No reason';
    const e = new EmbedBuilder().setTitle('⛔ User Blacklisted').setDescription(`${target} has been blacklisted.\n\n**Reason:** ${reason}\n**All roles removed**\n**Timeout:** 28 Days (Infinite)\n**Role:** ${blRole}`).setColor(0x000000).setFooter({ text: `By ${message.author.tag}` });
    return message.channel.send({ embeds: [e] });
  }
  if (command === '!free') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('❌ You need Moderate Members!').then(m=>deleteAfter(m));
    deleteAfter(message);
    const target = message.mentions.members.first(); if(!target) return message.reply('❌ Usage: `!free @member`').then(m=>deleteAfter(m));
    let blRoleId = blacklistRoles.get(message.guild.id);
    let blRole = blRoleId ? message.guild.roles.cache.get(blRoleId) : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    const key = `${message.guild.id}-${target.id}`; const oldRoles = blacklistData.get(key) || [];
    try { if(blRole) await target.roles.remove(blRole).catch(()=>{}); await target.timeout(null).catch(()=>{}); if(oldRoles.length>0) await target.roles.add(oldRoles).catch(()=>{}); blacklistData.delete(key); } catch { return message.reply('❌ Error freeing!').then(m=>deleteAfter(m)); }
    const e = new EmbedBuilder().setTitle('✅ User Freed').setDescription(`${target} has been freed.\nOld roles restored.`).setColor(0x00FF00);
    return message.channel.send({ embeds: [e] });
  }

  // ----- !remember -----
  if (command === '!remember' || command === '!remind' || command === '!reminder') {
    deleteAfter(message);
    const timeArg = args[0]; const text = args.slice(1).join(' ');
    if(!timeArg || !text) return message.reply('❌ Usage: `!remember 10m Do homework`').then(m=>deleteAfter(m));
    const match = timeArg.match(/^(\d+)(s|m|h|d)$/); if(!match) return message.reply('❌ Use: 10s 10m 1h 1d').then(m=>deleteAfter(m));
    let ms = parseInt(match[1])*1000; if(match[2]==='m') ms*=60; if(match[2]==='h') ms*=3600; if(match[2]==='d') ms*=86400;
    const e = new EmbedBuilder().setTitle('⏰ Reminder Set!').setDescription(`I will ping you in **${timeArg}**\n**Reminder:** ${text}`).setColor(0x00FF00);
    message.channel.send({ embeds: [e] });
    setTimeout(() => { message.channel.send({ content: `${message.author} ⏰ **REMINDER!**\n> ${text}` }); }, ms);
    return;
  }

});

// ===== LOGIN =====
const MYTOKEN = (process.env.DISCORD_TOKEN || process.env.TOKEN || '').trim();
if (MYTOKEN) {
  console.log('Token found successfully');
  console.log('Token Länge:', MYTOKEN.length);
  console.log('Versuche jetzt Login...');
} else {
  console.log('Token NOT found!');
}
client.login(MYTOKEN)
  .then(() => console.log('Login-Anfrage an Discord geschickt...'))
  .catch(e => {
    console.log('LOGIN FEHLER:', e.message);
    console.log('GANZER FEHLER:', e);
  });

console.log('Teste Discord Verbindung per HTTPS...');
fetch('https://discord.com/api/v10/users/@me', {
  headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
}).then(async r => {
  console.log('HTTPS TEST Status:', r.status);
  console.log('HTTPS TEST Antwort:', (await r.text()).slice(0, 200));
}).catch(e => console.log('HTTPS TEST FEHLER:', e.message));

// ===== REPORT SYSTEM - EINFACH UNTEN DRAN =====
let reportChannels = {};
if (fs.existsSync('./reportchannels.json')) {
  try { reportChannels = JSON.parse(fs.readFileSync('./reportchannels.json', 'utf8')); } catch (e) { reportChannels = {}; }
}
function saveReportChannels() {
  fs.writeFileSync('./reportchannels.json', JSON.stringify(reportChannels, null, 2));
}

// Beleidigungen / unangemessenes Verhalten - hier kannst du Wörter hinzufügen
const REPORT_WORDS = [
  "hurensohn", "huso", "wichser", "arschloch", "fotze", "bastard",
  "idiot", "spast", "behindert", "missgeburt", "schlampe", "hure",
  "fick dich", "fuck you", "halt dein maul", "verpiss dich",
  "kys", "bitch", "arsch", "dumm"
];

function findReportWords(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return REPORT_WORDS.filter(w => lower.includes(w));
}

function highlightReportWords(text) {
  let result = text;
  for (const w of REPORT_WORDS) {
    const regex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, `**||${w.toUpperCase()}||**`);
  }
  return result;
}

async function sendReportEmbed(guild, reportedUser, reporter, reasonText, channelObj, messageUrl, type) {
  const ids = reportChannels[guild.id] || [];
  if (ids.length === 0) return false;

  const found = findReportWords(reasonText);
  const embed = new EmbedBuilder()
    .setTitle(type === 'auto' ? '⚠️ BELEIDIGUNG ERKANNT - AUTO REPORT' : '🚨 NEUER REPORT')
    .setColor(type === 'auto' ? 0xFFAA00 : 0xFF0000)
    .addFields(
      { name: '👤 Gemeldeter User', value: `${reportedUser} - \`${reportedUser.tag || reportedUser.id}\``, inline: true },
      { name: '👮 Gemeldet von', value: reporter ? `${reporter} - \`${reporter.tag}\`` : 'Auto-Mod', inline: true },
      { name: '📍 Channel', value: `${channelObj}`, inline: true },
      { name: '💬 Nachricht / Grund', value: highlightReportWords(reasonText).slice(0, 1000), inline: false },
      { name: '🚫 Markierte Wörter', value: found.length ? found.map(w => `\`${w}\``).join(', ') : 'Kein Wort aus Liste, aber manuell reported', inline: false },
      { name: '🔗 Link', value: messageUrl ? `[Zur Nachricht springen](${messageUrl})` : 'Kein Link', inline: false }
    )
    .setThumbnail(reportedUser.displayAvatarURL ? reportedUser.displayAvatarURL() : null)
    .setFooter({ text: `User ID: ${reportedUser.id} | Beni Bot Report System` })
    .setTimestamp();

  for (const cid of ids) {
    const ch = guild.channels.cache.get(cid);
    if (!ch) continue;
    const msg = await ch.send({ embeds: [embed] }).catch(() => null);
    if (msg) {
      await msg.react('✅').catch(() => {});
      await msg.react('❌').catch(() => {});
      await msg.react('👀').catch(() => {});
    }
  }
  return true;
}

// ===== REPORT HANDLER - 2. messageCreate, stört deinen alten nicht =====
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ----- !addchannelreport -----
  if (command === '!addchannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Du brauchst **Administrator** Rechte!');
    const channel = message.mentions.channels.first();
    if (!channel) return fail(message, 'Benutzung: `!addchannelreport #channel`');
    if (!reportChannels[message.guild.id]) reportChannels[message.guild.id] = [];
    if (reportChannels[message.guild.id].includes(channel.id)) return fail(message, `${channel} ist schon ein Report-Channel!`);
    reportChannels[message.guild.id].push(channel.id);
    saveReportChannels();
    return success(message, `${channel} wurde als **Report-Channel** hinzugefügt!\nAlle Reports / Beleidigungen landen jetzt da.`);
  }

  // ----- !removechannelreport -----
  if (command === '!removechannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Du brauchst **Administrator** Rechte!');
    const channel = message.mentions.channels.first();
    if (!channel) return fail(message, 'Benutzung: `!removechannelreport #channel`');
    if (!reportChannels[message.guild.id] || !reportChannels[message.guild.id].includes(channel.id)) return fail(message, `${channel} ist kein Report-Channel!`);
    reportChannels[message.guild.id] = reportChannels[message.guild.id].filter(id => id !== channel.id);
    saveReportChannels();
    return success(message, `${channel} wurde als **Report-Channel entfernt**!`);
  }

  // ----- !reportchannelstatus -----
  if (command === '!reportchannelstatus') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Du brauchst **Administrator** Rechte!');
    const ids = reportChannels[message.guild.id] || [];
    if (ids.length === 0) return fail(message, 'Es ist kein Report-Channel gesetzt!\nSetze einen mit: `!addchannelreport #channel`');
    const list = ids.map(id => {
      const ch = message.guild.channels.cache.get(id);
      return ch ? `${ch} - \`${id}\`` : `Unbekannt - \`${id}\``;
    }).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('📝 • REPORT-CHANNEL STATUS')
      .setDescription(list)
      .setColor(0x00AAFF)
      .setFooter({ text: `Server: ${message.guild.name}` })
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }

  // ----- !report @User Grund -----
  if (command === '!report') {
    const target = message.mentions.members.first() || message.mentions.users.first();
    if (!target) return fail(message, 'Benutzung: `!report @User Grund`\nBeispiel: `!report @Max beleidigt mich`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    const sent = await sendReportEmbed(message.guild, target.user || target, message.author, reason, message.channel, message.url, 'manual');
    if (!sent) return fail(message, 'Es ist kein Report-Channel gesetzt!\nAdmin muss erst `!addchannelreport #channel` machen.');
    return success(message, `Report gegen ${target} wurde gesendet!`);
  }

  // ----- AUTO-MOD: Normale Nachricht mit Beleidigung -----
  if (!command.startsWith('!')) {
    const found = findReportWords(message.content);
    if (found.length > 0) {
      // Nicht doppelt loggen wenn es schon im Report-Channel ist
      const ids = reportChannels[message.guild.id] || [];
      if (ids.includes(message.channel.id)) return;
      await sendReportEmbed(message.guild, message.author, null, message.content, message.channel, message.url, 'auto');
    }
  }
});

// ===== BANNER / AVATAR / HISTORY =====
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ----- !banner -----
  if (command === '!banner') {
    const target = message.mentions.users.first() || message.author;
    // Banner muss frisch geladen werden, sonst ist es null
    const fetched = await client.users.fetch(target.id, { force: true }).catch(() => target);
    const bannerUrl = fetched.bannerURL({ size: 1024, extension: 'png' });

    if (!bannerUrl) return fail(message, `${target.username} hat **kein Banner** gesetzt!`);

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Banner von ${target.username}`)
      .setImage(bannerUrl)
      .setColor(0x5865F2)
      .addFields(
        { name: '👤 User', value: `${target} - \`${target.tag}\``, inline: true },
        { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
        { name: '🔗 Link', value: `[Banner öffnen](${bannerUrl})`, inline: false }
      )
      .setFooter({ text: `Angefordert von ${message.author.tag}` })
      .setTimestamp();

    const reply = await message.reply({ embeds: [embed] });
    deleteAfter(reply);
    deleteAfter(message);
    return;
  }

  // ----- !avatar -----
  if (command === '!avatar') {
    const target = message.mentions.users.first() || message.author;
    const avatarUrl = target.displayAvatarURL({ size: 1024, extension: 'png', forceStatic: false });

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar von ${target.username}`)
      .setImage(avatarUrl)
      .setColor(0x5865F2)
      .addFields(
        { name: '👤 User', value: `${target} - \`${target.tag}\``, inline: true },
        { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
        { name: '🔗 Link', value: `[Avatar öffnen](${avatarUrl})`, inline: false }
      )
      .setFooter({ text: `Angefordert von ${message.author.tag}` })
      .setTimestamp();

    const reply = await message.reply({ embeds: [embed] });
    deleteAfter(reply);
    deleteAfter(message);
    return;
  }

  // ----- !history -----
  if (command === '!history') {
    const target = message.mentions.users.first() || message.author;

    const loading = await message.reply(`⏳ Suche die letzten 20 Nachrichten von ${target}...`);

    try {
      let allMessages = [];

      // Alle Text-Channels durchgehen
      const textChannels = message.guild.channels.cache.filter(c => c.isTextBased() && c.viewable);

      for (const [, ch] of textChannels) {
        try {
          const fetched = await ch.messages.fetch({ limit: 100 }).catch(() => null);
          if (!fetched) continue;
          const userMsgs = fetched.filter(m => m.author.id === target.id);
          allMessages.push(...userMsgs.values());
        } catch {}
      }

      // Nach Zeit sortieren, neuste zuerst, nur 20 nehmen
      allMessages.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
      const last20 = allMessages.slice(0, 20);

      if (last20.length === 0) {
        return loading.edit(`❌ Ich habe **keine Nachrichten** von ${target} in den letzten 100 Nachrichten pro Channel gefunden.`);
      }

      const list = last20.map((m, i) => {
        const time = `<t:${Math.floor(m.createdTimestamp / 1000)}:R>`;
        const content = m.content ? m.content.slice(0, 80).replace(/\n/g, ' ') : '*Bild / Datei / Embed*';
        return `**${i + 1}.** ${m.channel} • ${time}\n> ${content}\n> [Zur Nachricht](${m.url})`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setTitle(`📜 History von ${target.username}`)
        .setDescription(list.slice(0, 4000))
        .setColor(0x00AAFF)
        .setThumbnail(target.displayAvatarURL())
        .setFooter({ text: `${last20.length} Nachrichten gefunden | ${target.tag}` })
        .setTimestamp();

      await loading.edit({ content: '', embeds: [embed] });
      deleteAfter(message);
    } catch (e) {
      console.log('Fehler bei !history:', e);
      loading.edit('❌ Fehler beim Suchen der History!');
    }
    return;
  }
});

// ============================================================
// ⭐ BENI BOT - LEVEL SYSTEM v2.0 by Elyias - MIT MONGO
// Gleiche Funktionen, nur Speicherung in Mongo statt levels.json
// ============================================================

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Mongo verbunden! ✅'))
  .catch(err => console.log('Mongo Fehler:', err));

// ---- Mongo Modelle - statt levels.json ----
const UserLevel = mongoose.model('UserLevel', new mongoose.Schema({
  key: String,
  guildId: String,
  userId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  voiceMinutes: { type: Number, default: 0 },
  voiceXP: { type: Number, default: 0 },
  msgXP: { type: Number, default: 0 }
}));

const GuildConfig = mongoose.model('GuildConfig', new mongoose.Schema({
  guildId: String,
  levelRoles: { type: Object, default: {} },
  multipliers: { type: Object, default: {} },
  announceChannel: { type: String, default: null },
  levelUpMsg: { type: Boolean, default: true },
  voiceXP: { type: Boolean, default: true },
  msgXP: { type: Boolean, default: true }
}));

// ---- Daten laden / speichern - GLEICHE NAMEN WIE VORHER ----
async function getGuildConfig(guildId) {
  let cfg = await GuildConfig.findOne({ guildId });
  if (!cfg) cfg = await GuildConfig.create({ guildId });
  return cfg;
}
function getUserKey(guildId, userId) { return `${guildId}_${userId}`; }
async function getUser(guildId, userId) {
  const key = getUserKey(guildId, userId);
  let user = await UserLevel.findOne({ key });
  if (!user) user = await UserLevel.create({ key, guildId, userId });
  return user;
}
async function saveLevels() {
  // Nix mehr nötig, Mongo speichert automatisch
}

// ---- Level Berechnung - UNVERÄNDERT ----
function xpForLevel(level) {
  return 5 * (level * level) + 50 * level + 100;
}
function makeBar(current, needed) {
  const total = 12;
  const filled = Math.min(total, Math.floor((current / needed) * total));
  const empty = total - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}
function getMultiplier(member, cfg) {
  let mult = 1;
  if (!member) return mult;
  for (const [roleId, m] of Object.entries(cfg.multipliers)) {
    if (member.roles.cache.has(roleId)) mult = Math.max(mult, parseFloat(m));
  }
  return mult;
}

// ---- XP geben + Level Up Check - GLEICH WIE VORHER, NUR MIT await ----
async function addXP(messageOrMember, guild, member, baseXP, source) {
  const cfg = await getGuildConfig(guild.id);
  const user = await getUser(guild.id, member.id);
  const mult = getMultiplier(member, cfg);
  const finalXP = Math.floor(baseXP * mult);
  user.xp += finalXP;
  if (source === 'voice') { user.voiceXP += finalXP; }
  else { user.msgXP += finalXP; }

  let leveledUp = false;
  while (user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level++;
    leveledUp = true;
  }
  await user.save();

  if (leveledUp) {
    const roleId = cfg.levelRoles[String(user.level)];
    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      if (role && member.manageable) {
        await member.roles.add(role).catch(()=>{});
      }
    }
    if (cfg.levelUpMsg) {
      const embed = new EmbedBuilder()
        .setTitle('🎉 LEVEL UP!')
        .setDescription(`**${member.user}** ist jetzt **Level ${user.level}**!`)
        .addFields(
          { name: '🆙 Neues Level', value: `Level ${user.level}`, inline: true },
          { name: '⚡ XP', value: `${finalXP} XP bekommen (${source === 'voice' ? '🎙️ Voice' : '💬 Chat'})`, inline: true },
          { name: '📊 Nächstes Level', value: `${user.xp} / ${xpForLevel(user.level)} XP`, inline: false },
        )
        .setColor(0x00FF88)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Beni Bot • Level System • Made by Elyias' })
        .setTimestamp();
      if (cfg.announceChannel) {
        const ch = guild.channels.cache.get(cfg.announceChannel);
        if (ch) ch.send({ embeds: [embed] }).catch(()=>{});
      } else if (messageOrMember && messageOrMember.channel) {
        messageOrMember.channel.send({ embeds: [embed] }).catch(()=>{});
      }
    }
  }
  return { user, cfg, finalXP, leveledUp };
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.content.trim().toLowerCase() !== '!distanze') return;

  const embed = new EmbedBuilder()
    .setTitle('!DISTANZ!')
    .setDescription('Wir distanzieren uns von dieser Aussage und unterstützen sie absolut nicht!')
    .setColor(0xFF0000)
    .setFooter({ text: 'Beni Bot' })
    .setTimestamp();

  return message.channel.send({ embeds: [embed] });
});
