const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const http = require('http');

console.log('Bot startet...');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// DEBUG - zeigt ob Discord überhaupt antwortet
client.on('debug', (info) => console.log('DEBUG:', info));
client.on('warn', (info) => console.log('WARN:', info));
client.on('shardError', (e) => console.log('SHARD FEHLER:', e.message));

// Wenn nach 15 Sekunden immer noch kein Login, sag Bescheid
setTimeout(() => {
  if (!client.user) console.log('LOGIN HÄNGT! Nach 15 Sekunden immer noch nicht eingeloggt!');
}, 15000);

// Fehler abfangen, damit der Bot nicht lautlos abstürzt
client.on('error', (e) => console.log('DISCORD CLIENT FEHLER:', e.message));
client.on('shardDisconnect', () => console.log('Shard disconnected!'));
process.on('unhandledRejection', (e) => console.log('UNHANDLED FEHLER:', e?.message || e));
process.on('uncaughtException', (e) => console.log('UNCAUGHT FEHLER:', e?.message || e));

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

async function deleteAfter(msg) {
  setTimeout(() => { msg.delete().catch(() => {}); }, 3000);
}

// ===== EMBED + REACTION SYSTEM =====
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

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !id - ID anzeigen + Copy Button - NUR der Command-User sieht die ID beim Button-Klick
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
      new ButtonBuilder()
        .setCustomId(`copy_id_${target.id}`)
        .setLabel('📋 ID Kopieren')
        .setStyle(ButtonStyle.Primary)
    );

    await message.react('✅').catch(() => {});
    const reply = await message.reply({ embeds: [embed], components: [row] });
    // Command-Nachricht + Embed nach 15 Sek löschen, damit die ID nicht rumliegt
    setTimeout(() => { reply.delete().catch(() => {}); }, 15000);
    deleteAfter(message);
    return;
  }

  // !ban
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Nö, du darfst niemanden bannen. Dafür fehlen dir die Rechte!');
    }
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Ey, wen soll ich denn bannen? Markier mal jemanden! Beispiel: `!ban @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.bannable) return fail(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    try {
      await user.send(`Du wurdest vom Server **${message.guild.name}** gebannt!\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}`);
    } catch {}
    await user.ban({ reason });
    return success(message, `BAM! **${user.user.tag}** wurde gebannt!\n**Grund:** ${reason}`);
  }

  // !unban
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Du hast keine Rechte dazu!');
    }
    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) return fail(message, 'Benutzung: `!unban <User-ID>`');
    try {
      await message.guild.bans.remove(userId);
      return success(message, 'User wurde entbannt!');
    } catch {
      return fail(message, 'User nicht gefunden oder nicht gebannt!');
    }
  }

  // !kick
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return fail(message, 'Du darfst niemanden kicken, sorry!');
    }
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Wen soll ich kicken? Markier den mal! Beispiel: `!kick @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.kickable) return fail(message, 'Den kann ich nicht kicken, der ist zu mächtig für mich!');
    await user.kick(reason);
    return success(message, `Raus mit dir! **${user.user.tag}** wurde gekickt!\n**Grund:** ${reason}`);
  }

  // !clear
  if (command === '!clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten löschen!');
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return fail(message, 'Sag mir mal eine Zahl von 1 bis 100! Beispiel: `!clear 10`');
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    await message.react('✅').catch(() => {});
    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Erfolgreich!').setDescription(`Sauber! Ich habe **${amount}** Nachrichten weggeputzt! Der Chat glänzt wieder!`).setTimestamp();
    const reply = await message.channel.send({ embeds: [embed] });
    deleteAfter(reply);
    return;
  }

  // !mute
  if (command === '!mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du darfst niemanden muten!');
    }
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
    try {
      await user.send(`Du wurdest auf dem Server **${message.guild.name}** gemutet!\n\n**Dauer:** ${durationStr}\n**Grund:** ${reason}\n**Gemutet von:** ${message.author.tag}`);
    } catch {}
    await user.timeout(ms, reason);
    return success(message, `Pssst! **${user.user.tag}** muss jetzt für **${durationStr}** leise sein!\n**Grund:** ${reason}`);
  }

  // !unmute
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du hast keine Rechte dazu!');
    }
    const target = message.mentions.members.first();
    if (!target) return fail(message, 'Benutzung: `!unmute @User`');
    try {
      await target.timeout(null);
      await target.send('Du wurdest entmutet!').catch(() => {});
      return success(message, `${target} wurde entmutet!`);
    } catch {
      return fail(message, 'Konnte den User nicht entmuten!');
    }
  }

  // !sendmessage
  if (command === '!sendmessage') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten in andere Channels schicken!');
    }
    const channel = message.mentions.channels.first();
    if (!channel) return fail(message, 'In welchen Channel denn? Beispiel: `!sendmessage #allgemein Hallo Leute!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Und was soll ich schreiben? Der Text fehlt!');
    await channel.send(text);
    return success(message, `Erledigt! Deine Nachricht ist jetzt in ${channel}!`);
  }

  // !dm
  if (command === '!dm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine DMs schicken!');
    }
    const user = message.mentions.members.first();
    if (!user) return fail(message, 'Wem soll ich schreiben? Beispiel: `!dm @Max Hey, komm mal online!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Was soll ich dem denn schreiben?');
    try {
      await user.send(`Hey! Nachricht von ${message.author.tag} aus dem Server **${message.guild.name}**:\n\n${text}`);
      return success(message, `DM ist raus an **${user.user.tag}**! Der hat Post von dir!`);
    } catch {
      return fail(message, `Uff, ich konnte **${user.user.tag}** keine DM schicken. Der hat wohl seine DMs zu!`);
    }
  }

  // !lock
  if (command === '!lock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht sperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return success(message, 'Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben.');
  }

  // !unlock
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht entsperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return success(message, 'Wieder offen! Ihr dürft hier wieder schreiben, tobt euch aus!');
  }

  // !help
  if (command === '!help') {
    await message.react('✅').catch(() => {});
    deleteAfter(message);
    const embed = new EmbedBuilder()
      .setTitle('📢 BENI BOT - ALLE COMMANDS')
      .setColor(0x00FF00)
      .setDescription('Hier sind alle Befehle, die du benutzen kannst:')
      .addFields(
        { name: '👮 MODERATION', value: '`!ban @User Grund`\n`!unban User-ID`\n`!kick @User Grund`\n`!mute @User Zeit Grund`\n`!unmute @User`\n`!clear Zahl`', inline: false },
        { name: '💬 NACHRICHTEN', value: '`!sendmessage #Channel Text`\n`!dm @User Text`\n`!sag Text`', inline: false },
        { name: '🔒 CHANNEL', value: '`!lock`\n`!unlock`', inline: false },
        { name: '🆔 USER', value: '`!id @User`', inline: false },
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
    await message.react('✅').catch(() => {});
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription('Benutze `!help` für mehr Informationen')
      .setColor(0x00FF00)
      .setFooter({ text: 'Beni Bot • Online!' });
    const r = await message.reply({ embeds: [embed] });
    deleteAfter(r); deleteAfter(message);
    return;
  }

  // !hallo
  if (command === '!hallo') {
    await message.react('👋').catch(() => {});
    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('👋 Hallo!').setDescription('Wie gehts! 👋').setTimestamp();
    const r = await message.reply({ embeds: [embed] });
    deleteAfter(r); deleteAfter(message);
    return;
  }

  // !sag
  if (command === '!sag') {
    const text = args.join(' ');
    if (!text) return fail(message, 'Schreib so: `!sag Hallo Leute`');
    await message.react('✅').catch(() => {});
    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  // !owner
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
});

// ===== BUTTON HANDLER FÜR !id COPY BUTTON =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('copy_id_')) return;

  const idToCopy = interaction.customId.replace('copy_id_', '');
  // ephemeral: true = NUR der, der den Button klickt, sieht die ID - im selben Chat!
  await interaction.reply({ content: `Hier zum Kopieren:\n\`\`\`${idToCopy}\`\`\``, ephemeral: true }).catch(() => {});
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
    await message.react('❌').catch(() => {});
    const noPerm = new EmbedBuilder().setColor(0xFF0000).setTitle('❌ Keine Berechtigung').setDescription('Du brauchst **Kanäle verwalten**!').setTimestamp();
    message.channel.send({ embeds: [noPerm] });
    return;
  }

  const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

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
});

client.on('guildMemberAdd', async (member) => {
  const channelId = welcomeChannels.get(member.guild.id);
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  channel.send(`Willkommen ${member} zu **${member.guild.name}**!`);
});

// ===== LOGIN - GANZ UNTEN =====
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


// ============================================================
// BENI BOT - UNTEN DRAN MACHEN - BEIDE COMMANDS
// !dashboard + !messagelog
// Ablauf: ✅ Haken -> dann erst Embed
// ============================================================
const fs = require('fs');

// ---------- MESSAGELOG SPEICHER ----------
let logChannels = {};
if (fs.existsSync('./logchannels.json')) {
  try { logChannels = JSON.parse(fs.readFileSync('./logchannels.json', 'utf8')); } catch (e) { logChannels = {}; }
}
function saveLogChannels() {
  fs.writeFileSync('./logchannels.json', JSON.stringify(logChannels, null, 2));
}

// ============================================================
// 1. !dashboard
// ============================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() !== '!dashboard' && message.content.toLowerCase() !== '!dash' && message.content.toLowerCase() !== '!website' && message.content.toLowerCase() !== '!web') return;

  try {
    // SCHRITT 1: HAKEN
    await message.react('✅').catch(() => {});

    // SCHRITT 2: WARTEN
    await new Promise(r => setTimeout(r, 500));

    // SCHRITT 3: EMBED
    const dashboardEmbed = new EmbedBuilder()
      .setTitle('🌐 BENI BOT - OFFICIAL DASHBOARD')
      .setDescription(
        'Willkommen im offiziellen Dashboard von **Beni Bot**!\n\n' +
        'Hier kannst du alles rund um Beni Bot sehen, testen und verwalten.\n' +
        'Das Dashboard ist **100% kostenlos** und für jeden zugänglich.\n\n' +
        '👇 **Klick unten auf den Link, um das Dashboard zu öffnen!**'
      )
      .addFields(
        {
          name: '🔗 DASHBOARD LINK',
          value: '[**➡️ KLICKE HIER - BENI BOT DASHBOARD ÖFFNEN ⬅️**](https://beni-bot-dashboard.netlify.app/)\n\n`https://beni-bot-dashboard.netlify.app/`',
          inline: false
        },
        {
          name: '📜 WAS KANNST DU AUF DEM DASHBOARD MACHEN?',
          value:
            '🔒 **Mit Discord einloggen** - Sicher mit deinem Discord Account\n' +
            '📜 **Alle Commands sehen** - Alle Befehle auf einen Blick\n' +
            '🎮 **Live Chat Simulator** - Teste Beni Bot direkt auf der Website\n' +
            '🕹️ **Mini-Game spielen** - Klick den Beni und knack den Highscore\n' +
            '⭐ **Bot bewerten** - Gib Beni Bot Sterne und Feedback\n' +
            '🏆 **Top Server sehen** - Welche Server nutzen Beni Bot?\n' +
            '📢 **Neuigkeiten & Updates** - Immer auf dem neuesten Stand bleiben',
          inline: false
        },
        {
          name: '📊 BENI BOT STATS',
          value: '• **Uptime:** 99.9%\n• **Ping:** Schnell & Stabil\n• **Version:** v2.0 - Dashboard Update\n• **Status:** Online',
          inline: true
        },
        {
          name: '👑 MADE BY',
          value: '**Elyias**\nFounder & Developer\nvon Beni Bot',
          inline: true
        },
        {
          name: '💡 TIPP',
          value: 'Wenn du Beni Bot noch nicht auf deinem Server hast, kannst du ihn direkt über das Dashboard zu deinem Server hinzufügen!',
          inline: false
        }
      )
      .setColor(0x00AAFF)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setFooter({ text: 'BENI BOT • Dashboard • Made by Elyias', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const dashboardButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setLabel('🌐 Dashboard öffnen').setStyle(ButtonStyle.Link).setURL('https://beni-bot-dashboard.netlify.app/'),
        new ButtonBuilder().setLabel('➕ Bot hinzufügen').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
        new ButtonBuilder().setLabel('💬 Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
      );

    // SCHRITT 4: SENDEN - BLEIBT STEHEN!
    await message.channel.send({ embeds: [dashboardEmbed], components: [dashboardButtons] });

  } catch (e) { console.log('Fehler bei !dashboard:', e); }
});

// ============================================================
// 2. !messagelog #channel
// ============================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('!messagelog')) return;

  // ----- !messagelog off -----
  if (message.content.toLowerCase() === '!messagelog off') {
    await message.react('✅').catch(() => {});
    await new Promise(r => setTimeout(r, 400));
    if (!logChannels[message.guild.id]) {
      return message.channel.send({ embeds: [new EmbedBuilder().setTitle('⚠️ MESSAGE LOG - NICHT AKTIV').setDescription('Message Log war gar nicht aktiviert.\nAktiviere es mit: `!messagelog #channel`').setColor(0xFFAA00).setTimestamp()] });
    }
    delete logChannels[message.guild.id];
    saveLogChannels();
    return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ MESSAGE LOG DEAKTIVIERT').setDescription('Es werden ab jetzt **keine** Nachrichten mehr geloggt.').addFields({ name: '👤 Deaktiviert von', value: `${message.author}`, inline: true }, { name: '🔁 Wieder aktivieren', value: '`!messagelog #channel`', inline: true }).setColor(0xFF0000).setFooter({ text: 'BENI BOT • Message Log System' }).setTimestamp()] });
  }

  // ----- !messagelog status -----
  if (message.content.toLowerCase() === '!messagelog status') {
    await message.react('✅').catch(() => {});
    await new Promise(r => setTimeout(r, 400));
    const currentId = logChannels[message.guild.id];
    if (!currentId) return message.channel.send('⚠️ Message Log ist **nicht** aktiviert.\nAktiviere mit: `!messagelog #channel`');
    const ch = message.guild.channels.cache.get(currentId);
    return message.channel.send(`✅ Message Log ist aktiv in: ${ch ? ch : 'Unbekannter Channel'}`);
  }

  // ----- !messagelog #channel -----
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

    // SCHRITT 1: HAKEN
    await message.react('✅').catch(() => {});

    // SCHRITT 2: WARTEN
    await new Promise(r => setTimeout(r, 600));

    // SCHRITT 3: SPEICHERN
    logChannels[message.guild.id] = targetChannel.id;
    saveLogChannels();

    // SCHRITT 4: EMBED
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
});

// ============================================================
// 3. LOGGER - Loggt gesendet / bearbeitet / gelöscht
// ============================================================
client.on('messageCreate', async (msg) => {
  try {
    if (msg.author.bot) return;
    if (!msg.guild) return;
    if (msg.content.toLowerCase().startsWith('!messagelog') || msg.content.toLowerCase().startsWith('!dashboard')) return;
    const logId = logChannels[msg.guild.id];
    if (!logId) return;
    if (msg.channel.id === logId) return;
    const logCh = msg.guild.channels.cache.get(logId);
    if (!logCh) return;
    const embed = new EmbedBuilder()
      .setTitle('📤 Nachricht gesendet')
      .addFields(
        { name: '👤 User', value: `${msg.author} - \`${msg.author.tag}\``, inline: true },
        { name: '📍 Channel', value: `${msg.channel}`, inline: true },
        { name: '💬 Inhalt', value: msg.content ? msg.content.slice(0, 1000) : '*Keine Text-Nachricht (Bild / Datei)*', inline: false },
        { name: '🔗 Link', value: `[Zur Nachricht springen](https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})`, inline: false }
      )
      .setColor(0x00AAFF)
      .setThumbnail(msg.author.displayAvatarURL())
      .setFooter({ text: `User ID: ${msg.author.id} | Message ID: ${msg.id}` })
      .setTimestamp();
    await logCh.send({ embeds: [embed] });
  } catch (e) {}
});

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

// ============================================================
// BENI BOT - !partnership - PARTNERSCHAFTS SYSTEM
// !partnership <discord.gg-Link>
// ============================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.toLowerCase().startsWith('!partnership')) return;

  const args = message.content.split(' ');
  let inviteLink = args[1];

  // Wenn kein Link angegeben -> Eigener Server
  if (!inviteLink) {
    await message.react('❌').catch(()=>{});
    return message.channel.send({ embeds: [new EmbedBuilder().setTitle('❌ KEIN LINK!').setDescription('Du musst einen Discord-Link angeben!\n\n**So geht\'s:**\n`!partnership https://discord.gg/deinserver`\n`!partnership discord.gg/deinserver`').setColor(0xFF0000).setTimestamp()] });
  }

  try {
    await message.react('✅').catch(()=>{});
    await new Promise(r => setTimeout(r, 500));

    // Invite Code aus Link holen
    let code = inviteLink.replace('https://discord.gg/', '').replace('http://discord.gg/', '').replace('discord.gg/', '').replace('https://discord.com/invite/', '').split('/')[0].split('?')[0];

    let invite = null;
    try { invite = await client.fetchInvite(code); } catch(e) { invite = null; }

    // FALLBACK: Wenn Link nicht abrufbar -> Nimm aktuellen Server
    const guildName = invite?.guild?.name || message.guild.name;
    const memberCount = invite?.approximate_member_count || message.guild.memberCount;
    const onlineCount = invite?.approximate_presence_count || '???';
    const guildIcon = invite?.guild?.iconURL({ dynamic: true, size: 512 }) || message.guild.iconURL({ dynamic: true, size: 512 }) || client.user.displayAvatarURL();
    const guildDesc = invite?.guild?.description || 'Ein cooler Discord Server - Join uns!';
    const inviter = message.author;

    // ----- 4 VERSCHIEDENE PARTNERSCHAFTS-TEXTE - ZUFÄLLIG -----
    const partnershipTexts = [
      // TEXT 1 - Hype Style
      `🔥 **NEUE PARTNERSCHAFT!** 🔥\n\n` +
      `Wir freuen uns riesig, euch unseren neuen Partner-Server vorzustellen!\n\n` +
      `**🌟 ${guildName}**\n` +
      `> ${guildDesc}\n\n` +
      `**📊 Was dich erwartet:**\n` +
      `👥 **${memberCount}** Member & wachsend!\n` +
      `🟢 **${onlineCount}** gerade online\n` +
      `🎮 Aktive Community, Events & Giveaways\n` +
      `💬 Nette Leute & aktive Chats\n` +
      `🤝 Respektvoller Umgang\n\n` +
      `**👉 JOINE JETZT:**\n${inviteLink}\n\n` +
      `*Partnerschaft mit ${message.guild.name} • Angefragt von ${inviter}*`,

      // TEXT 2 - Chill Style
      `✨ **PARTNERSCHAFT** ✨\n\n` +
      `Hey Leute, wir haben einen neuen Partner! 🫶\n\n` +
      `**💎 ${guildName}**\n` +
      `> *${guildDesc}*\n\n` +
      `Warum solltest du joinen?\n` +
      `✅ Coole Community mit **${memberCount}** Membern\n` +
      `✅ Täglich aktive Chats\n` +
      `✅ Events, Giveaways & viel mehr\n` +
      `✅ Super nette Mods & Owner\n\n` +
      `**🔗 Hier geht's zum Server:**\n${inviteLink}\n\n` +
      `Schaut gerne mal vorbei und sagt, dass ihr von **${message.guild.name}** kommt! 💙`,

      // TEXT 3 - Professionell
      `🤝 **OFFIZIELLE PARTNERSCHAFT** 🤝\n\n` +
      `Wir begrüßen offiziell unseren neuen Partner-Server:\n\n` +
      `**🏆 ${guildName}**\n\n` +
      `**📝 Über den Server:**\n${guildDesc}\n\n` +
      `**📈 Statistiken:**\n` +
      `• 👥 Mitglieder: **${memberCount}**\n` +
      `• 🟢 Online: **${onlineCount}**\n` +
      `• 📅 Partnerschaft seit: <t:${Math.floor(Date.now()/1000)}:D>\n\n` +
      `**🔗 Einladung:**\n${inviteLink}\n\n` +
      `*Wir freuen uns auf eine lange und erfolgreiche Partnerschaft!*\n*— Team ${message.guild.name}*`,

      // TEXT 4 - Kurz & Knackig
      `🚀 **PARTNER ALERT!** 🚀\n\n` +
      `**${guildName}** ist jetzt offizieller Partner von **${message.guild.name}**!\n\n` +
      `👥 ${memberCount} Member | 🟢 ${onlineCount} Online\n` +
      `💬 ${guildDesc}\n\n` +
      `**JOIN:** ${inviteLink}\n\n` +
      `Lasst Liebe da! ❤️🔥`
    ];

    // Zufälligen Text wählen
    const randomText = partnershipTexts[Math.floor(Math.random() * partnershipTexts.length)];

    // ----- EMBED -----
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

    const partnerButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setLabel(`🚀 ${guildName} joinen`).setStyle(ButtonStyle.Link).setURL(inviteLink.startsWith('http') ? inviteLink : `https://${inviteLink}`),
        new ButtonBuilder().setLabel('💬 Support').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
      );

    // ----- SENDEN -----
    await message.channel.send({ content: `||@everyone||\n**Neue Partnerschaft!** 🎉`, embeds: [partnerEmbed], components: [partnerButtons] });

    // Extra: Reiner Text zum Kopieren für Partner-Channel
    await message.channel.send({ content: `**📋 KOPIER-TEXT FÜR DEINEN PARTNER-CHANNEL:**\n\`\`\`\n${randomText.replace(/\*\*/g, '').replace(/__/g, '')}\n\`\`\`` }).catch(()=>{});

  } catch (e) {
    console.log('Fehler bei !partnership:', e);
    await message.channel.send('❌ Der Link konnte nicht gelesen werden! Check ob der Link gültig ist.');
  }
});
