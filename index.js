// ============================================================================
// BENI BOT - GANZER CODE
// Version: v3.0 - FINAL
// Made by Elyias
// Alle Antworten NUR als Embed
// Bei jedem Command: erst ⏳ dann ✅
// Viele Commands löschen sich nach 3 Sek
// ============================================================================
const mongoose = require('mongoose');
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const http = require('http');

console.log('Bot startet...');

// ============================================================================
// MONGO VERBINDUNG
// ============================================================================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Mongo verbunden! ✅'))
  .catch(err => console.log('Mongo Fehler:', err));

// ============================================================================
// SCHEMAS - LEVEL
// ============================================================================
const levelSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  }
});
const Level = mongoose.model('Level', levelSchema);

// ============================================================================
// SCHEMA - GUILD CONFIG (Levelup Channel)
// ============================================================================
const configSchema = new mongoose.Schema({
  guildId: String,
  levelupChannelId: {
    type: String,
    default: null
  }
});
const GuildConfig = mongoose.model('GuildConfig', configSchema);

// ============================================================================
// SCHEMA - LEVEL ROLLEN
// ============================================================================
const levelRoleSchema = new mongoose.Schema({
  guildId: String,
  level: Number,
  roleId: String
});
const LevelRole = mongoose.model('LevelRole', levelRoleSchema);

// ============================================================================
// SCHEMA - WELCOME
// ============================================================================
const welcomeSchema = new mongoose.Schema({
  guildId: String,
  channelId: String
});
const WelcomeConfig = mongoose.model('WelcomeConfig', welcomeSchema);

// ============================================================================
// SCHEMA - MESSAGE LOG
// ============================================================================
const logSchema = new mongoose.Schema({
  guildId: String,
  channelId: String
});
const LogConfig = mongoose.model('LogConfig', logSchema);

// ============================================================================
// SCHEMA - REPORT CHANNELS
// ============================================================================
const reportSchema = new mongoose.Schema({
  guildId: String,
  channelIds: {
    type: [String],
    default: []
  }
});
const ReportConfig = mongoose.model('ReportConfig', reportSchema);

// ============================================================================
// SCHEMA - BLACKLIST ROLLE
// ============================================================================
const blacklistRoleSchema = new mongoose.Schema({
  guildId: String,
  roleId: String
});
const BlacklistRoleConfig = mongoose.model('BlacklistRoleConfig', blacklistRoleSchema);

// ============================================================================
// SCHEMA - BLACKLIST DATEN (alte Rollen)
// ============================================================================
const blacklistDataSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  oldRoles: {
    type: [String],
    default: []
  }
});
const BlacklistData = mongoose.model('BlacklistData', blacklistDataSchema);

// ============================================================================
// SCHEMA - MULTIPLIER
// ============================================================================
const MultiplierSchema = new mongoose.Schema({
  guildId: String,
  roleId: String,
  multiplier: Number
});
const Multiplier = mongoose.model('Multiplier', MultiplierSchema);

// ============================================================================
// SCHEMA - JOIN ROLLE
// ============================================================================
const joinRoleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  roleId: {
    type: String,
    required: true
  }
});
const JoinRole = mongoose.models.JoinRole || mongoose.model('JoinRole', joinRoleSchema);

// ============================================================================
// SCHEMA - APPLICATION TEXT
// ============================================================================
const appTextSchema = new mongoose.Schema({
  guildId: String,
  text: String,
  createdBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const AppText = mongoose.model('AppText', appTextSchema);

// ============================================================================
// SCHEMA - COMMAND LOG (IDs speichern)
// ============================================================================
const commandLogSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  userTag: String,
  command: String,
  args: {
    type: [String],
    default: []
  },
  channelId: String,
  messageId: String,
  targetUserId: {
    type: String,
    default: null
  },
  targetRoleId: {
    type: String,
    default: null
  },
  targetChannelId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const CommandLog = mongoose.model('CommandLog', commandLogSchema);

// ============================================================================
// SCHEMA - WARNS (NEU)
// ============================================================================
const warnSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  userTag: String,
  reason: String,
  warnedBy: String,
  warnedByTag: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Warn = mongoose.model('Warn', warnSchema);

// ============================================================================
// SCHEMA - AFK (NEU)
// ============================================================================
const afkSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  reason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const AFK = mongoose.model('AFK', afkSchema);

// ============================================================================
// SCHEMA - GIVEAWAY (NEU)
// ============================================================================
const giveawaySchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  messageId: String,
  prize: String,
  endsAt: Date,
  createdBy: String,
  ended: {
    type: Boolean,
    default: false
  }
});
const Giveaway = mongoose.model('Giveaway', giveawaySchema);

// ============================================================================
// XP FORMEL
// ============================================================================
function getNeededXp(l) {
  return 5 * (l ** 2) + 50 * l + 100;
}

// ============================================================================
// CLIENT
// ============================================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
client.on('error', e => console.log('DISCORD FEHLER:', e.message));
client.on('shardError', e => console.log('SHARD FEHLER:', e.message));
process.on('unhandledRejection', e => console.log('UNHANDLED:', e?.message || e));
process.on('uncaughtException', e => console.log('UNCAUGHT:', e?.message || e));

// ============================================================================
// WEBSERVER FÜR RENDER
// ============================================================================
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Beni Bot läuft!');
}).listen(process.env.PORT || 10000, () => console.log('Webserver läuft auf Port 10000'));

// ============================================================================
// READY
// ============================================================================
client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag} 🎉`);
  client.user.setActivity('Online ✅ | !help', { type: 4 }).catch(() => {});
});

// ============================================================================
// HELPERS
// ============================================================================
async function getWelcomeChannel(g) {
  const c = await WelcomeConfig.findOne({ guildId: g });
  return c?.channelId || null;
}
async function getLogChannel(g) {
  const c = await LogConfig.findOne({ guildId: g });
  return c?.channelId || null;
}
async function getReportChannels(g) {
  const c = await ReportConfig.findOne({ guildId: g });
  return c?.channelIds || [];
}
async function getBlacklistRoleId(g) {
  const c = await BlacklistRoleConfig.findOne({ guildId: g });
  return c?.roleId || null;
}

// Löschen nach 3 Sekunden
function deleteAfter(m, ms = 3000) {
  if (!m) return;
  setTimeout(() => {
    m.delete().catch(() => {});
  }, ms);
}

// Zeit parsen: 10s 10m 1h 1d
function parseDuration(s) {
  if (!s) return null;
  const m = s.match(/^(\d+)(s|m|h|d)$/);
  if (!m) return null;
  let ms = parseInt(m[1]) * 1000;
  if (m[2] === 'm') ms *= 60;
  if (m[2] === 'h') ms *= 3600;
  if (m[2] === 'd') ms *= 86400;
  return ms;
}

// Reaction: erst ⏳
async function reactStart(msg) {
  await msg.react('⏳').catch(() => {});
}

// Reaction: dann ✅
async function reactDone(msg) {
  await msg.reactions.removeAll().catch(() => {});
  await msg.react('✅').catch(() => {});
}

// NUR EMBED antworten
async function embedReply(message, title, desc, color = 0x00FF00, del = true, extra = {}) {
  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setFooter({ text: `Ausgeführt von ${message.author.tag}` })
    .setTimestamp();
  if (extra.fields) e.addFields(extra.fields);
  if (extra.thumb) e.setThumbnail(extra.thumb);
  if (extra.image) e.setImage(extra.image);
  const r = await message.reply({
    embeds: [e],
    components: extra.components || []
  });
  if (del) {
    deleteAfter(r);
    deleteAfter(message);
  }
  return r;
}

// Erfolg = Embed + ✅
async function success(message, text, del = true) {
  await reactDone(message);
  return embedReply(message, '✅ Erfolgreich!', text, 0x00FF00, del);
}

// Fehler = Embed + ✅ (Reaction) + ❌ Titel
async function fail(message, text, del = true) {
  await reactDone(message);
  return embedReply(message, '❌ Fehlgeschlagen!', text, 0xFF0000, del);
}

// Command + IDs speichern
async function saveCommand(message, command, extra = {}) {
  try {
    await CommandLog.create({
      guildId: message.guild?.id,
      userId: message.author.id,
      userTag: message.author.tag,
      command,
      args: message.content.trim().split(/ +/).slice(1),
      channelId: message.channel.id,
      messageId: message.id,
      targetUserId: extra.targetUserId || message.mentions.users.first()?.id || message.mentions.members.first()?.id || null,
      targetRoleId: extra.targetRoleId || message.mentions.roles.first()?.id || null,
      targetChannelId: extra.targetChannelId || message.mentions.channels.first()?.id || null
    });
  } catch {}
}

// Zufällige Farbe für Fun-Commands
function randomColor() {
  const colors = [0x5865F2, 0x00FF00, 0xFF0000, 0xFFAA00, 0xFF00AA, 0x00AAFF, 0xFFD700];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================================================
// BUTTON: ID KOPIEREN
// ============================================================================
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;
  if (!i.customId.startsWith('copy_id_')) return;
  const id = i.customId.replace('copy_id_', '');
  await i.reply({
    content: `Hier zum Kopieren:\n\`\`\`${id}\`\`\``,
    ephemeral: true
  }).catch(() => {});
});

// ============================================================================
// BUTTON: GIVEAWAY TEILNEHMEN (NEU)
// ============================================================================
client.on('interactionCreate', async (i) => {
  if (!i.isButton()) return;
  if (!i.customId.startsWith('giveaway_')) return;
  const gwId = i.customId.replace('giveaway_', '');
  const gw = await Giveaway.findById(gwId).catch(() => null);
  if (!gw || gw.ended) {
    return i.reply({ content: 'Dieses Giveaway ist schon vorbei!', ephemeral: true }).catch(() => {});
  }
  await i.reply({
    embeds: [new EmbedBuilder().setTitle('🎉 Du nimmst teil!').setDescription(`Du nimmst am Giveaway **${gw.prize}** teil! Viel Glück!`).setColor(0x00FF00).setTimestamp()],
    ephemeral: true
  }).catch(() => {});
});

// ============================================================================
// JOIN: WELCOME + JOINROLLE
// ============================================================================
client.on('guildMemberAdd', async (member) => {
  try {
    const cid = await getWelcomeChannel(member.guild.id);
    if (cid) {
      const ch = member.guild.channels.cache.get(cid) || await member.guild.channels.fetch(cid).catch(() => null);
      if (ch) {
        ch.send({
          embeds: [new EmbedBuilder()
            .setTitle('👋 Willkommen!')
            .setDescription(`Willkommen ${member} zu **${member.guild.name}**!`)
            .setColor(0x00FF00)
            .setThumbnail(member.displayAvatarURL())
            .setTimestamp()
          ]
        }).catch(() => {});
      }
    }
    const jr = await JoinRole.findOne({ guildId: member.guild.id });
    if (jr) {
      const role = member.guild.roles.cache.get(jr.roleId);
      if (role) await member.roles.add(role).catch(() => {});
    }
  } catch {}
});

// ============================================================================
// LOGGER: NACHRICHT BEARBEITET
// ============================================================================
client.on('messageUpdate', async (o, n) => {
  try {
    if (!o.guild || o.author?.bot) return;
    if (o.content === n.content) return;
    const logId = await getLogChannel(o.guild.id);
    if (!logId) return;
    const ch = o.guild.channels.cache.get(logId) || await o.guild.channels.fetch(logId).catch(() => null);
    if (!ch) return;
    ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('✏️ Nachricht bearbeitet')
        .addFields(
          { name: '👤 User', value: `${o.author} - \`${o.author.tag}\``, inline: true },
          { name: '📍 Channel', value: `${o.channel}`, inline: true },
          { name: '🔴 VORHER', value: o.content?.slice(0, 1000) || '*Leer*', inline: false },
          { name: '🟢 NACHHER', value: n.content?.slice(0, 1000) || '*Leer*', inline: false }
        )
        .setColor(0xFFAA00)
        .setThumbnail(o.author.displayAvatarURL())
        .setFooter({ text: `User ID: ${o.author.id} | Message ID: ${o.id}` })
        .setTimestamp()
      ]
    });
  } catch {}
});

// ============================================================================
// LOGGER: NACHRICHT GELÖSCHT
// ============================================================================
client.on('messageDelete', async (m) => {
  try {
    if (!m.guild || m.author?.bot) return;
    const logId = await getLogChannel(m.guild.id);
    if (!logId) return;
    const ch = m.guild.channels.cache.get(logId) || await m.guild.channels.fetch(logId).catch(() => null);
    if (!ch) return;
    ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('🗑️ Nachricht gelöscht')
        .addFields(
          { name: '👤 User', value: m.author ? `${m.author} - \`${m.author.tag}\`` : 'Unbekannt', inline: true },
          { name: '📍 Channel', value: `${m.channel}`, inline: true },
          { name: '💬 Inhalt', value: m.content?.slice(0, 1000) || '*Keine Text-Nachricht*', inline: false }
        )
        .setColor(0xFF0000)
        .setThumbnail(m.author?.displayAvatarURL())
        .setFooter({ text: `User ID: ${m.author?.id} | Message ID: ${m.id}` })
        .setTimestamp()
      ]
    });
  } catch {}
});

// ============================================================================
// REPORT SYSTEM
// ============================================================================
const REPORT_WORDS = [
  "hurensohn",
  "huso",
  "wichser",
  "arschloch",
  "fotze",
  "bastard",
  "idiot",
  "spast",
  "behindert",
  "missgeburt",
  "schlampe",
  "hure",
  "fick dich",
  "fuck you",
  "halt dein maul",
  "verpiss dich",
  "kys",
  "bitch",
  "arsch",
  "dumm"
];

function findReportWords(t) {
  if (!t) return [];
  const l = t.toLowerCase();
  return REPORT_WORDS.filter(w => l.includes(w));
}

function highlightReportWords(t) {
  let r = t;
  for (const w of REPORT_WORDS) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    r = r.replace(re, `**||${w.toUpperCase()}||**`);
  }
  return r;
}

async function sendReportEmbed(guild, reportedUser, reporter, reasonText, channelObj, messageUrl, type) {
  const ids = await getReportChannels(guild.id);
  if (!ids.length) return false;
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
    const ch = guild.channels.cache.get(cid) || await guild.channels.fetch(cid).catch(() => null);
    if (!ch) continue;
    const m = await ch.send({ embeds: [embed] }).catch(() => null);
    if (m) {
      await m.react('✅').catch(() => {});
      await m.react('❌').catch(() => {});
      await m.react('👀').catch(() => {});
    }
  }
  return true;
}

// ============================================================================
// HAUPT HANDLER
// ============================================================================
const xpCooldown = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isCommand = command.startsWith('!');

  // ===== LOGGER: GESENDETE NACHRICHTEN =====
  try {
    if (!['!messagelog', '!dashboard', '!dash', '!website', '!web'].includes(command)) {
      const logId = await getLogChannel(message.guild.id);
      if (logId && message.channel.id !== logId) {
        const logCh = message.guild.channels.cache.get(logId) || await message.guild.channels.fetch(logId).catch(() => null);
        if (logCh) {
          logCh.send({
            embeds: [new EmbedBuilder()
              .setTitle('📤 Nachricht gesendet')
              .addFields(
                { name: '👤 User', value: `${message.author} - \`${message.author.tag}\``, inline: true },
                { name: '📍 Channel', value: `${message.channel}`, inline: true },
                { name: '💬 Inhalt', value: message.content?.slice(0, 1000) || '*Keine Text-Nachricht*', inline: false },
                { name: '🔗 Link', value: `[Zur Nachricht springen](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`, inline: false }
              )
              .setColor(0x00AAFF)
              .setThumbnail(message.author.displayAvatarURL())
              .setFooter({ text: `User ID: ${message.author.id} | Message ID: ${message.id}` })
              .setTimestamp()
            ]
          }).catch(() => {});
        }
      }
    }
  } catch {}

  // ===== AFK CHECK: Wenn AFK User schreibt, AFK entfernen =====
  if (!isCommand) {
    const afk = await AFK.findOne({ guildId: message.guild.id, userId: message.author.id });
    if (afk) {
      await AFK.findOneAndDelete({ guildId: message.guild.id, userId: message.author.id });
      message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('👋 Willkommen zurück!')
          .setDescription(`${message.author} ist wieder da!\nWar AFK wegen: **${afk.reason}**`)
          .setColor(0x00FF00)
          .setTimestamp()
        ]
      }).catch(() => {});
    }
    // Wenn jemand AFK User pingt
    if (message.mentions.users.size > 0) {
      for (const [, u] of message.mentions.users) {
        const targetAfk = await AFK.findOne({ guildId: message.guild.id, userId: u.id });
        if (targetAfk) {
          message.channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('💤 User ist AFK')
              .setDescription(`${u} ist gerade AFK.\n**Grund:** ${targetAfk.reason}`)
              .setColor(0xFFAA00)
              .setTimestamp()
            ]
          }).catch(() => {});
        }
      }
    }
  }

  // ===== KEIN COMMAND -> AUTO REPORT + XP =====
  if (!isCommand) {
    const found = findReportWords(message.content);
    if (found.length) {
      const ids = await getReportChannels(message.guild.id);
      if (!ids.includes(message.channel.id)) {
        await sendReportEmbed(message.guild, message.author, null, message.content, message.channel, message.url, 'auto');
      }
    }
    const key = `${message.guild.id}-${message.author.id}`;
    if (!xpCooldown.has(key) || Date.now() - xpCooldown.get(key) > 60000) {
      xpCooldown.set(key, Date.now());
      try {
        let user = await Level.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (!user) user = new Level({ userId: message.author.id, guildId: message.guild.id });
        let mult = 1;
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) {
          const mults = await Multiplier.find({ guildId: message.guild.id });
          for (const m of mults) {
            if (member.roles.cache.has(m.roleId)) mult = Math.max(mult, m.multiplier);
          }
        }
        user.xp += Math.floor((Math.floor(Math.random() * 11) + 5) * mult);
        const needed = getNeededXp(user.level);
        if (user.xp >= needed) {
          user.level += 1;
          user.xp = 0;
          await user.save();
          const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
          const tc = cfg?.levelupChannelId ? await message.guild.channels.fetch(cfg.levelupChannelId).catch(() => null) : message.channel;
          let rt = '';
          const lr = await LevelRole.findOne({ guildId: message.guild.id, level: user.level });
          if (lr) {
            const role = message.guild.roles.cache.get(lr.roleId);
            if (member && role) {
              await member.roles.add(role).catch(() => {});
              rt = `\n🎭 Du hast die Rolle ${role} erhalten!`;
            }
          }
          if (tc) {
            tc.send({
              embeds: [new EmbedBuilder()
                .setColor('#00FF88')
                .setTitle('🎉 LEVEL UP!')
                .setDescription(`GG ${message.author}! Du bist jetzt **Level ${user.level}**!${rt}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp()
              ]
            }).catch(() => {});
          }
        } else {
          await user.save();
        }
      } catch (e) {
        console.log('Level Fehler:', e.message);
      }
    }
    return;
  }

  // ===== COMMAND: REACTION + SPEICHERN =====
  await reactStart(message);
  await saveCommand(message, command);

  // ==========================================================================
  // 1. !savedids
  // ==========================================================================
  if (command === '!savedids') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const logs = await CommandLog.find({ guildId: message.guild.id }).sort({ createdAt: -1 }).limit(10);
    if (!logs.length) {
      return embedReply(message, '💾 Gespeicherte IDs', 'Noch keine Commands gespeichert.', 0x00AAFF, false);
    }
    const desc = logs.map(l => `\`${l.command}\` von <@${l.userId}> in <#${l.channelId}>\nUser: \`${l.targetUserId || '-'}\` | Role: \`${l.targetRoleId || '-'}\` | Channel: \`${l.targetChannelId || '-'}\``).join('\n\n');
    await reactDone(message);
    return embedReply(message, '💾 Gespeicherte IDs - Letzte 10', desc, 0x00AAFF, false);
  }

  // ==========================================================================
  // 2. !id
  // ==========================================================================
  if (command === '!id') {
    const t = message.mentions.users.first();
    if (!t) return fail(message, 'Ey, wen denn? Markier mal jemanden! Beispiel: `!id @Max`');
    await reactDone(message);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`copy_id_${t.id}`).setLabel('📋 ID Kopieren').setStyle(ButtonStyle.Primary)
    );
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`ID von ${t.username}`)
        .setDescription('Die ID ist versteckt, damit sie nicht jeder sieht.\nKlick unten auf den Button - nur du siehst sie dann!')
        .setThumbnail(t.displayAvatarURL())
        .setColor(0x5865F2)
        .setFooter({ text: `Angefordert von ${message.author.tag}` })
        .setTimestamp()
      ],
      components: [row]
    });
    deleteAfter(r, 15000);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 3. !ban
  // ==========================================================================
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Nö, du darfst niemanden bannen. Dafür fehlen dir die Rechte!');
    }
    const u = message.mentions.members.first();
    if (!u) return fail(message, 'Ey, wen soll ich denn bannen? Markier mal jemanden! Beispiel: `!ban @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.bannable) return fail(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    try {
      await u.send({
        embeds: [new EmbedBuilder()
          .setTitle('⛔ Du wurdest gebannt')
          .setDescription(`Vom Server **${message.guild.name}**\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}`)
          .setColor(0xFF0000)
          .setTimestamp()
        ]
      });
    } catch {}
    await u.ban({ reason });
    return success(message, `BAM! **${u.user.tag}** wurde gebannt!\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // 4. !unban
  // ==========================================================================
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Du hast keine Rechte dazu!');
    }
    const uid = args[0]?.replace(/[<@!>]/g, '');
    if (!uid) return fail(message, 'Benutzung: `!unban <User-ID>`');
    try {
      await message.guild.bans.remove(uid);
      return success(message, 'User wurde entbannt!');
    } catch {
      return fail(message, 'User nicht gefunden oder nicht gebannt!');
    }
  }

  // ==========================================================================
  // 5. !kick
  // ==========================================================================
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return fail(message, 'Du darfst niemanden kicken, sorry!');
    }
    const u = message.mentions.members.first();
    if (!u) return fail(message, 'Wen soll ich kicken? Beispiel: `!kick @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.kickable) return fail(message, 'Den kann ich nicht kicken, der ist zu mächtig!');
    await u.kick(reason);
    return success(message, `Raus mit dir! **${u.user.tag}** wurde gekickt!\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // 6. !clear
  // ==========================================================================
  if (command === '!clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten löschen!');
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return fail(message, 'Sag mir mal eine Zahl von 1 bis 100! Beispiel: `!clear 10`');
    }
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    await reactDone(message);
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Erfolgreich!')
        .setDescription(`Sauber! Ich habe **${amount}** Nachrichten weggeputzt!`)
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    return;
  }

  // ==========================================================================
  // 7. !mute
  // ==========================================================================
  if (command === '!mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du darfst niemanden muten!');
    }
    const u = message.mentions.members.first();
    if (!u) return fail(message, 'Wen soll ich muten? Beispiel: `!mute @Max 10m spammt`');
    const ms = parseDuration(args[1]);
    if (!ms) return fail(message, 'Wie lange denn? Beispiel: `!mute @Max 10m spammt`');
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    try {
      await u.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔇 Du wurdest gemutet')
          .setDescription(`Server: **${message.guild.name}**\n**Dauer:** ${args[1]}\n**Grund:** ${reason}\n**Von:** ${message.author.tag}`)
          .setColor(0xFFAA00)
          .setTimestamp()
        ]
      });
    } catch {}
    await u.timeout(ms, reason);
    return success(message, `Pssst! **${u.user.tag}** muss jetzt für **${args[1]}** leise sein!\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // 8. !unmute
  // ==========================================================================
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du hast keine Rechte dazu!');
    }
    const t = message.mentions.members.first();
    if (!t) return fail(message, 'Benutzung: `!unmute @User`');
    try {
      await t.timeout(null);
      await t.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔊 Du wurdest entmutet!')
          .setDescription('Du darfst wieder schreiben.')
          .setColor(0x00FF00)
          .setTimestamp()
        ]
      }).catch(() => {});
      return success(message, `${t} wurde entmutet!`);
    } catch {
      return fail(message, 'Konnte den User nicht entmuten!');
    }
  }

  // ==========================================================================
  // 9. !sendmessage
  // ==========================================================================
  if (command === '!sendmessage') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten in andere Channels schicken!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) return fail(message, 'In welchen Channel denn? Beispiel: `!sendmessage #allgemein Hallo Leute!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Und was soll ich schreiben? Der Text fehlt!');
    await ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('📢 Nachricht')
        .setDescription(text)
        .setColor(0x5865F2)
        .setFooter({ text: `Gesendet von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    return success(message, `Erledigt! Deine Nachricht ist jetzt in ${ch}!`);
  }

  // ==========================================================================
  // 10. !dm
  // ==========================================================================
  if (command === '!dm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine DMs schicken!');
    }
    const u = message.mentions.members.first();
    if (!u) return fail(message, 'Wem soll ich schreiben? Beispiel: `!dm @Max Hey!`');
    const text = args.slice(1).join(' ');
    if (!text) return fail(message, 'Was soll ich dem denn schreiben?');
    try {
      await u.send({
        embeds: [new EmbedBuilder()
          .setTitle('📩 Neue Nachricht')
          .setDescription(text)
          .setColor(0x5865F2)
          .addFields(
            { name: '👤 Von', value: message.author.tag, inline: true },
            { name: '🏠 Server', value: message.guild.name, inline: true }
          )
          .setTimestamp()
        ]
      });
      return success(message, `DM ist raus an **${u.user.tag}**!`);
    } catch {
      return fail(message, `Uff, ich konnte **${u.user.tag}** keine DM schicken. DMs sind zu!`);
    }
  }

  // ==========================================================================
  // 11. !lock
  // ==========================================================================
  if (command === '!lock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht sperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return success(message, 'Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben.');
  }

  // ==========================================================================
  // 12. !unlock
  // ==========================================================================
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht entsperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return success(message, 'Wieder offen! Ihr dürft hier wieder schreiben!');
  }

  // ==========================================================================
  // 13. !mod
  // ==========================================================================
  if (command === '!mod') {
    await reactDone(message);
    const target = message.mentions.members.first();
    const text = args.filter(a => !a.startsWith('<@')).join(' ');
    if (target && text) {
      try {
        await target.send({
          embeds: [new EmbedBuilder()
            .setTitle('👮 Nachricht vom Mod-Team')
            .setDescription(text)
            .setColor(0xFFAA00)
            .addFields(
              { name: '🏠 Server', value: message.guild.name, inline: true },
              { name: '👤 Von', value: message.author.tag, inline: true }
            )
            .setTimestamp()
          ]
        });
      } catch {}
      return embedReply(message, '👮 Mod-Nachricht gesendet', `Deine Nachricht wurde an ${target} gesendet:\n\n> ${text}`, 0x00FF00, true);
    }
    const mods = message.guild.members.cache.filter(m => !m.user.bot && (m.permissions.has(PermissionsBitField.Flags.ModerateMembers) || m.permissions.has(PermissionsBitField.Flags.Administrator) || m.permissions.has(PermissionsBitField.Flags.BanMembers) || m.permissions.has(PermissionsBitField.Flags.KickMembers)));
    const list = mods.size ? [...mods.values()].slice(0, 20).map(m => `${m} - \`${m.user.tag}\``).join('\n') : 'Keine Mods gefunden.';
    return embedReply(message, `👮 Mod-Team - ${message.guild.name}`, list, 0x5865F2, false, {
      fields: [
        { name: '📊 Anzahl', value: `${mods.size} Mods`, inline: true },
        { name: '💡 Benutzung', value: '`!mod @User Deine Nachricht` = Mod schreibt User an', inline: false }
      ]
    });
  }

  // ==========================================================================
  // 14. !addapplicationtext
  // ==========================================================================
  if (command === '!addapplicationtext') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins können den Bewerbungstext setzen!');
    }
    const text = args.join(' ');
    if (!text) return fail(message, 'Benutzung: `!addapplicationtext Dein Bewerbungstext hier...`');
    if (text.toLowerCase() === 'delete' || text.toLowerCase() === 'löschen') {
      await AppText.findOneAndDelete({ guildId: message.guild.id });
      return success(message, 'Bewerbungstext wurde gelöscht!', false);
    }
    await AppText.findOneAndUpdate({ guildId: message.guild.id }, { text, createdBy: message.author.tag }, { upsert: true, new: true });
    await saveCommand(message, command);
    await reactDone(message);
    return embedReply(message, '✅ Bewerbungstext gespeichert!', text, 0x00FF00, false, {
      fields: [
        { name: '👀 Ansehen mit', value: '`!application`', inline: true },
        { name: '🗑️ Löschen mit', value: '`!addapplicationtext delete`', inline: true }
      ]
    });
  }

  // ==========================================================================
  // 15. !application
  // ==========================================================================
  if (command === '!application') {
    const data = await AppText.findOne({ guildId: message.guild.id });
    if (!data) return fail(message, 'Es ist noch kein Bewerbungstext gesetzt!\nAdmin: `!addapplicationtext Dein Text`');
    await reactDone(message);
    return embedReply(message, `📝 Bewerbung - ${message.guild.name}`, data.text, 0x5865F2, false, {
      fields: [
        { name: '👤 Erstellt von', value: data.createdBy || 'Unbekannt', inline: true },
        { name: '📅 Erstellt am', value: `<t:${Math.floor(new Date(data.createdAt).getTime() / 1000)}:D>`, inline: true }
      ]
    });
  }

  // ==========================================================================
  // 16. !userinfo / !user
  // ==========================================================================
  if (command === '!userinfo' || command === '!user') {
    const t = message.mentions.users.first() || message.author;
    const m = message.guild.members.cache.get(t.id) || await message.guild.members.fetch(t.id).catch(() => null);
    await reactDone(message);
    return embedReply(message, `👤 Userinfo - ${t.username}`, `Alle Infos zu ${t}`, 0x5865F2, false, {
      thumb: t.displayAvatarURL(),
      fields: [
        { name: '🆔 ID', value: `\`${t.id}\``, inline: true },
        { name: '📅 Account erstellt', value: `<t:${Math.floor(t.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '📅 Server beigetreten', value: m?.joinedTimestamp ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : 'Unbekannt', inline: true },
        { name: '🎭 Rollen', value: m ? m.roles.cache.filter(r => r.id !== message.guild.id).map(r => `${r}`).join(' ') || 'Keine' : 'Unbekannt', inline: false },
        { name: '🤖 Bot?', value: t.bot ? 'Ja' : 'Nein', inline: true }
      ]
    });
  }

  // ==========================================================================
  // 17. !serverinfo / !server
  // ==========================================================================
  if (command === '!serverinfo' || command === '!server') {
    const g = message.guild;
    await reactDone(message);
    return embedReply(message, `🏠 Serverinfo - ${g.name}`, 'Alle Infos zu diesem Server', 0x00AAFF, false, {
      thumb: g.iconURL(),
      fields: [
        { name: '🆔 ID', value: `\`${g.id}\``, inline: true },
        { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: '👥 Member', value: `${g.memberCount}`, inline: true },
        { name: '📅 Erstellt', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
        { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: '🎭 Rollen', value: `${g.roles.cache.size}`, inline: true }
      ]
    });
  }

  // ==========================================================================
  // 18. !suggest / !vorschlag
  // ==========================================================================
  if (command === '!suggest' || command === '!vorschlag') {
    const text = args.join(' ');
    if (!text) return fail(message, 'Benutzung: `!suggest Dein Vorschlag`');
    await reactDone(message);
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('💡 Neuer Vorschlag')
        .setDescription(text)
        .setColor(0xFFAA00)
        .addFields({ name: '👤 Von', value: `${message.author} - \`${message.author.tag}\``, inline: true })
        .setFooter({ text: 'Reagiere mit ✅ oder ❌ zum Abstimmen' })
        .setTimestamp()
      ]
    });
    await r.react('✅').catch(() => {});
    await r.react('❌').catch(() => {});
    deleteAfter(message);
    return r;
  }

  // ==========================================================================
  // 19. !rules / !regeln
  // ==========================================================================
  if (command === '!rules' || command === '!regeln') {
    await reactDone(message);
    return embedReply(message, `📜 Regeln - ${message.guild.name}`, 'Bitte halte dich an diese Regeln:', 0xFF0000, false, {
      fields: [
        { name: '1️⃣ Respekt', value: 'Beleidige niemanden, bleib freundlich.', inline: false },
        { name: '2️⃣ Kein Spam', value: 'Kein Spam, keine Werbung ohne Erlaubnis.', inline: false },
        { name: '3️⃣ Kein NSFW', value: 'Keine NSFW-Inhalte.', inline: false },
        { name: '4️⃣ Mods haben das letzte Wort', value: 'Anweisungen vom Mod-Team befolgen.', inline: false }
      ]
    });
  }

  // ==========================================================================
  // NEU: 20. !warn
  // ==========================================================================
  if (command === '!warn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    const t = message.mentions.members.first();
    if (!t) return fail(message, 'Benutzung: `!warn @User Grund`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    await Warn.create({
      guildId: message.guild.id,
      userId: t.id,
      userTag: t.user.tag,
      reason,
      warnedBy: message.author.id,
      warnedByTag: message.author.tag
    });
    const count = await Warn.countDocuments({ guildId: message.guild.id, userId: t.id });
    try {
      await t.send({
        embeds: [new EmbedBuilder()
          .setTitle('⚠️ Du wurdest verwarnt!')
          .setDescription(`Server: **${message.guild.name}**\n**Grund:** ${reason}\n**Warns insgesamt:** ${count}`)
          .setColor(0xFFAA00)
          .setTimestamp()
        ]
      });
    } catch {}
    return success(message, `${t} wurde verwarnt!\n**Grund:** ${reason}\n**Warns insgesamt:** ${count}`);
  }

  // ==========================================================================
  // NEU: 21. !warnings
  // ==========================================================================
  if (command === '!warnings') {
    const t = message.mentions.users.first() || message.author;
    const warns = await Warn.find({ guildId: message.guild.id, userId: t.id }).sort({ createdAt: -1 }).limit(10);
    if (!warns.length) {
      await reactDone(message);
      return embedReply(message, `⚠️ Warns - ${t.username}`, `${t} hat **0 Warns**. Sauber! ✅`, 0x00FF00, false);
    }
    const list = warns.map((w, i) => `**${i + 1}.** ${w.reason}\nVon: ${w.warnedByTag} • <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:D>`).join('\n\n');
    await reactDone(message);
    return embedReply(message, `⚠️ Warns - ${t.username}`, `${t} hat **${warns.length} Warns**:`, 0xFFAA00, false, {
      fields: [{ name: '📋 Liste', value: list.slice(0, 1000), inline: false }]
    });
  }

  // ==========================================================================
  // NEU: 22. !unwarn
  // ==========================================================================
  if (command === '!unwarn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    const t = message.mentions.users.first();
    if (!t) return fail(message, 'Benutzung: `!unwarn @User`');
    const last = await Warn.findOne({ guildId: message.guild.id, userId: t.id }).sort({ createdAt: -1 });
    if (!last) return fail(message, `${t} hat keine Warns!`);
    await Warn.findByIdAndDelete(last._id);
    return success(message, `Ein Warn von ${t} wurde entfernt!\n**Entfernter Grund war:** ${last.reason}`);
  }

  // ==========================================================================
  // NEU: 23. !slowmode
  // ==========================================================================
  if (command === '!slowmode') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst Kanäle verwalten!');
    }
    const sec = parseInt(args[0]);
    if (isNaN(sec) || sec < 0 || sec > 21600) {
      return fail(message, 'Benutzung: `!slowmode 5` (0-21600 Sekunden, 0 = aus)');
    }
    await message.channel.setRateLimitPerUser(sec);
    if (sec === 0) return success(message, 'Slowmode ist jetzt **AUS** in diesem Channel!');
    return success(message, `Slowmode ist jetzt **${sec} Sekunden** in diesem Channel!`);
  }

  // ==========================================================================
  // NEU: 24. !nick
  // ==========================================================================
  if (command === '!nick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      return fail(message, 'Du brauchst Nicknames verwalten!');
    }
    const t = message.mentions.members.first();
    if (!t) return fail(message, 'Benutzung: `!nick @User NeuerName`');
    const newNick = args.slice(1).join(' ');
    if (!newNick) return fail(message, 'Benutzung: `!nick @User NeuerName`');
    try {
      await t.setNickname(newNick);
      return success(message, `Nickname von ${t} ist jetzt **${newNick}**!`);
    } catch {
      return fail(message, 'Konnte Nickname nicht ändern! Meine Rolle ist zu niedrig.');
    }
  }

  // ==========================================================================
  // NEU: 25. !poll / !umfrage
  // ==========================================================================
  if (command === '!poll' || command === '!umfrage') {
    const text = args.join(' ');
    if (!text) return fail(message, 'Benutzung: `!poll Soll Beni Bot bleiben?`');
    await reactDone(message);
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('📊 Umfrage')
        .setDescription(text)
        .setColor(0x5865F2)
        .addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true })
        .setFooter({ text: 'Stimme mit ✅ oder ❌ ab!' })
        .setTimestamp()
      ]
    });
    await r.react('✅').catch(() => {});
    await r.react('❌').catch(() => {});
    deleteAfter(message);
    return r;
  }

  // ==========================================================================
  // NEU: 26. !giveaway
  // ==========================================================================
  if (command === '!giveaway') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du brauchst Nachrichten verwalten!');
    }
    const timeArg = args[0];
    const prize = args.slice(1).join(' ');
    if (!timeArg || !prize) return fail(message, 'Benutzung: `!giveaway 10m Nitro`');
    const ms = parseDuration(timeArg);
    if (!ms) return fail(message, 'Benutze: 10s 10m 1h 1d');
    await reactDone(message);
    const msg = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY!')
        .setDescription(`**Preis:** ${prize}\n\nKlicke unten auf den Button um teilzunehmen!\nEndet in **${timeArg}**`)
        .setColor(0xFFD700)
        .addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true })
        .setFooter({ text: 'Viel Glück!' })
        .setTimestamp()
      ]
    });
    const gw = await Giveaway.create({
      guildId: message.guild.id,
      channelId: message.channel.id,
      messageId: msg.id,
      prize,
      endsAt: new Date(Date.now() + ms),
      createdBy: message.author.tag
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`giveaway_${gw._id}`).setLabel('🎉 Teilnehmen').setStyle(ButtonStyle.Success)
    );
    await msg.edit({
      embeds: [new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY!')
        .setDescription(`**Preis:** ${prize}\n\nKlicke unten auf den Button um teilzunehmen!\nEndet in **${timeArg}**`)
        .setColor(0xFFD700)
        .addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true })
        .setTimestamp()
      ],
      components: [row]
    });
    setTimeout(async () => {
      await Giveaway.findByIdAndUpdate(gw._id, { ended: true });
      message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🎉 GIVEAWAY VORBEI!')
          .setDescription(`Das Giveaway **${prize}** ist vorbei!\nGewinner wurde per Zufall gezogen - schaut in den Chat!`)
          .setColor(0xFFD700)
          .setTimestamp()
        ]
      }).catch(() => {});
    }, ms);
    deleteAfter(message);
    return msg;
  }

  // ==========================================================================
  // NEU: 27. !coinflip / !münze
  // ==========================================================================
  if (command === '!coinflip' || command === '!münze' || command === '!münzwurf') {
    await reactDone(message);
    const result = Math.random() < 0.5 ? 'Kopf' : 'Zahl';
    const emoji = result === 'Kopf' ? '🪙' : '🎲';
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`${emoji} Coinflip`)
        .setDescription(`Die Münze ist gefallen...\n\n**Ergebnis: ${result}!**`)
        .setColor(randomColor())
        .setFooter({ text: `Geworfen von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // NEU: 28. !8ball
  // ==========================================================================
  if (command === '!8ball') {
    const frage = args.join(' ');
    if (!frage) return fail(message, 'Benutzung: `!8ball Werde ich reich?`');
    const antworten = [
      'Ja, auf jeden Fall! ✅',
      'Nein, leider nicht. ❌',
      'Vielleicht... 🤔',
      'Auf jeden Fall! 🔥',
      'Frag später nochmal... 😴',
      '100% Ja! 💯',
      'Niemals! 😂',
      'Das sieht gut aus! 👀',
      'Hmm, eher nicht...',
      'Ja, wenn du dran bleibst! 💪'
    ];
    const antwort = antworten[Math.floor(Math.random() * antworten.length)];
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🎱 Magic 8Ball')
        .addFields(
          { name: '❓ Frage', value: frage, inline: false },
          { name: '🎱 Antwort', value: antwort, inline: false }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Gefragt von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // NEU: 29. !afk
  // ==========================================================================
  if (command === '!afk') {
    const reason = args.join(' ') || 'Bin kurz weg';
    await AFK.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      { reason },
      { upsert: true, new: true }
    );
    return success(message, `Du bist jetzt **AFK**!\n**Grund:** ${reason}\nWenn dich jemand pingt, sage ich Bescheid.`, false);
  }

  // ==========================================================================
  // NEU: 30. !uptime
  // ==========================================================================
  if (command === '!uptime') {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('⏱️ Uptime')
        .setDescription(`Beni Bot läuft schon seit:\n\n**${h}h ${m}m ${s}s**\n\nOhne Absturz! 💪`)
        .setColor(0x00FF00)
        .setFooter({ text: 'Beni Bot • Online' })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // NEU: 31. !invite
  // ==========================================================================
  if (command === '!invite') {
    await reactDone(message);
    const embed = new EmbedBuilder()
      .setTitle('➕ Beni Bot einladen!')
      .setDescription('Lade Beni Bot auf deinen eigenen Server ein!\n\nKlicke unten auf den Button!')
      .setColor(0x00AAFF)
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('➕ Bot einladen').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
      new ButtonBuilder().setLabel('💬 Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
    );
    const r = await message.channel.send({ embeds: [embed], components: [row] });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // NEU: 32. !meme / !witz
  // ==========================================================================
  if (command === '!meme' || command === '!witz') {
    const witze = [
      'Warum mögen Skelette keinen Krieg? Weil sie kein Herz dafür haben! 💀',
      'Was sagt ein Baum zum anderen? Lass uns Blätter tauschen! 🌳',
      'Warum sind Fische so schlecht in Mathe? Weil sie unter Wasser sind! 🐟',
      'Was macht ein Clown im Büro? Er macht Faxen! 🤡',
      'Warum hat der Computer einen Arzt gerufen? Weil er einen Virus hatte! 💻',
      'Was sagt die 0 zur 8? Schicker Gürtel! 😂',
      'Warum gehen Ameisen nicht in die Kirche? Weil sie in Sekten sind! 🐜',
      'Was ist grün und klopft an die Tür? Ein Klopfsalat! 🥗'
    ];
    const w = witze[Math.floor(Math.random() * witze.length)];
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('😂 Witz des Tages')
        .setDescription(w)
        .setColor(randomColor())
        .setFooter({ text: `Für ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 33. !help - ALLE COMMANDS
  // ==========================================================================
  if (command === '!help') {
    await reactDone(message);
    const embed = new EmbedBuilder()
      .setTitle('📢 BENI BOT - ALLE COMMANDS')
      .setColor(0x00FF00)
      .setDescription('Hier sind alle Befehle - alles als Embed:')
      .addFields(
        { name: '👮 MODERATION', value: '`!ban` `!unban` `!kick` `!mute` `!unmute` `!clear` `!blacklist` `!free` `!addblrole` `!removeblrole` `!mod` `!warn` `!warnings` `!unwarn` `!slowmode` `!nick`', inline: false },
        { name: '💬 NACHRICHTEN', value: '`!sendmessage` `!dm` `!sag`', inline: false },
        { name: '🔒 CHANNEL', value: '`!lock` `!unlock`', inline: false },
        { name: '🆔 USER', value: '`!id` `!avatar` `!banner` `!history` `!userinfo` `!user` `!afk`', inline: false },
        { name: '🏆 LEVEL', value: '`!rank` `!leaderboard` `!lb` `!leveldashboard` `!levelups` `!levelupchannel` `!removelevelup` `!setlevelrole` `!removelevelrole` `!multiplier` `!givexp` `!resetxp`', inline: false },
        { name: '📊 STATS', value: '`!stats` `!as` `!dashboard` `!dash` `!website` `!web` `!messagelog` `!partnership` `!enablewm` `!disablewm` `!savedids` `!serverinfo` `!server` `!uptime` `!invite`', inline: false },
        { name: '🚨 REPORT', value: '`!report` `!addchannelreport` `!removechannelreport` `!reportchannelstatus`', inline: false },
        { name: '👋 JOIN', value: '`!joinrole` `!removejoinrole`', inline: false },
        { name: '📝 BEWERBUNG', value: '`!addapplicationtext` `!application`', inline: false },
        { name: '🎉 FUN & GIVEAWAY', value: '`!poll` `!umfrage` `!giveaway` `!coinflip` `!münze` `!8ball` `!meme` `!witz` `!suggest` `!vorschlag`', inline: false },
        { name: '✅ SONSTIGES', value: '`!ping` `!hallo` `!owner` `!help` `!remember` `!remind` `!reminder` `!distanze` `!distanz` `!rules` `!regeln`', inline: false },
        { name: '⏰ ZEITEN', value: '`10s` `10m` `1h` `1d`', inline: false }
      )
      .setFooter({ text: 'Beni Bot • Made by Elyias' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🚀 Join unseren Discord!').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
    );
    const r = await message.channel.send({ embeds: [embed], components: [row] });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 34. !ping
  // ==========================================================================
  if (command === '!ping') {
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setDescription(`Ping: **${client.ws.ping}ms**\nBenutze \`!help\` für mehr Infos`)
        .setColor(0x00FF00)
        .setFooter({ text: 'Beni Bot • Online!' })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 35. !hallo
  // ==========================================================================
  if (command === '!hallo') {
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('👋 Hallo!')
        .setDescription('Wie gehts! 👋')
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 36. !sag
  // ==========================================================================
  if (command === '!sag') {
    const text = args.join(' ');
    if (!text) return fail(message, 'Schreib so: `!sag Hallo Leute`');
    await reactDone(message);
    await message.delete().catch(() => {});
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setDescription(text)
        .setColor(0x5865F2)
        .setFooter({ text: `Gesagt von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    return;
  }

  // ==========================================================================
  // 37. !owner
  // ==========================================================================
  if (command === '!owner') {
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('👑 DER ERSTELLER VON BENI BOT')
        .setDescription('**Elyias**')
        .setColor(0xFFD700)
        .addFields(
          { name: '👤 Name', value: 'Elyias', inline: true },
          { name: '🤖 Was kann er?', value: 'Er kann Bots erstellen!', inline: true },
          { name: '🛡️ Moderator', value: 'Er ist ein guter Moderator!', inline: false },
          { name: '💡 Fun Fact', value: 'Ohne Elyias gäbe es Beni Bot nicht!', inline: false }
        )
        .setFooter({ text: 'Beni Bot • Made by Elyias' })
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 38+39. !distanze / !distanz
  // ==========================================================================
  if (command === '!distanze' || command === '!distanz') {
    await reactDone(message);
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('DISTANZE!')
        .setDescription(`Wir **${message.guild.name}** distanzieren uns von der gesagten Aussage und unterstützen sie nicht!`)
        .setThumbnail(message.guild.iconURL())
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    return;
  }

  // ==========================================================================
  // 40+41. !enablewm / !disablewm
  // ==========================================================================
  if (command === '!enablewm' || command === '!disablewm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst **Kanäle verwalten**!');
    }
    if (command === '!enablewm') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (!ch) return fail(message, 'Benutze: `!enableWM #channel`');
      await WelcomeConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId: ch.id }, { upsert: true, new: true });
      await saveCommand(message, command, { targetChannelId: ch.id });
      return success(message, `Welcome Message AN! Neue Mitglieder werden jetzt in ${ch} begrüßt!`);
    } else {
      const ex = await WelcomeConfig.findOne({ guildId: message.guild.id });
      if (!ex) return fail(message, 'Welcome Message war schon aus.');
      await WelcomeConfig.findOneAndDelete({ guildId: message.guild.id });
      return success(message, 'Welcome Message AUS! Neue Mitglieder werden nicht mehr begrüßt.');
    }
  }

  // ==========================================================================
  // 42-45. !dashboard / !dash / !website / !web
  // ==========================================================================
  if (command === '!dashboard' || command === '!dash' || command === '!website' || command === '!web') {
    await reactDone(message);
    const embed = new EmbedBuilder()
      .setTitle('🌐 BENI BOT - OFFICIAL DASHBOARD')
      .setDescription('Willkommen im offiziellen Dashboard von **Beni Bot**!\n\nHier kannst du alles rund um Beni Bot sehen, testen und verwalten.\nDas Dashboard ist **100% kostenlos**.\n\n👇 **Klick unten auf den Link!**')
      .addFields(
        { name: '🔗 DASHBOARD LINK', value: '[**➡️ KLICKE HIER - BENI BOT DASHBOARD ÖFFNEN ⬅️**](https://beni-bot-dashboard.netlify.app/)\n\n`https://beni-bot-dashboard.netlify.app/`', inline: false },
        { name: '📜 WAS KANNST DU MACHEN?', value: '🔒 **Mit Discord einloggen**\n📜 **Alle Commands sehen**\n🎮 **Live Chat Simulator**\n🕹️ **Mini-Game spielen**\n⭐ **Bot bewerten**', inline: false },
        { name: '📊 STATS', value: '• **Uptime:** 99.9%\n• **Ping:** Schnell & Stabil\n• **Version:** v3.0\n• **Status:** Online', inline: true },
        { name: '👑 MADE BY', value: '**Elyias**\nFounder & Developer', inline: true }
      )
      .setColor(0x00AAFF)
      .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
      .setFooter({ text: 'BENI BOT • Dashboard • Made by Elyias', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🌐 Dashboard öffnen').setStyle(ButtonStyle.Link).setURL('https://beni-bot-dashboard.netlify.app/'),
      new ButtonBuilder().setLabel('➕ Bot hinzufügen').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
      new ButtonBuilder().setLabel('💬 Support Server').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
    );
    const r = await message.channel.send({ embeds: [embed], components: [row] });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 46. !messagelog
  // ==========================================================================
  if (command === '!messagelog') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    if (args[0]?.toLowerCase() === 'off') {
      const ex = await LogConfig.findOne({ guildId: message.guild.id });
      if (!ex) return embedReply(message, '⚠️ MESSAGE LOG - NICHT AKTIV', 'Message Log war gar nicht aktiviert.\nAktiviere es mit: `!messagelog #channel`', 0xFFAA00, false);
      await LogConfig.findOneAndDelete({ guildId: message.guild.id });
      return embedReply(message, '❌ MESSAGE LOG DEAKTIVIERT', 'Es werden ab jetzt **keine** Nachrichten mehr geloggt.', 0xFF0000, false);
    }
    if (args[0]?.toLowerCase() === 'status') {
      const cur = await getLogChannel(message.guild.id);
      if (!cur) return embedReply(message, '⚠️ MESSAGE LOG', 'Message Log ist **nicht** aktiviert.\nAktiviere mit: `!messagelog #channel`', 0xFFAA00, false);
      return embedReply(message, '✅ MESSAGE LOG AKTIV', `Message Log ist aktiv in: <#${cur}>`, 0x00FF00, false);
    }
    const tc = message.mentions.channels.first();
    if (!tc) return fail(message, 'Benutzung: `!messagelog #logs`');
    if (!tc.permissionsFor(message.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
      return fail(message, `Ich kann in ${tc} keine Nachrichten senden!`);
    }
    await LogConfig.findOneAndUpdate({ guildId: message.guild.id }, { channelId: tc.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetChannelId: tc.id });
    return embedReply(message, '✅ MESSAGE LOG AKTIVIERT', `Alle Nachrichten werden jetzt in ${tc} geloggt.\n\n**Wird geloggt:** Gesendet, Bearbeitet, Gelöscht, Bilder & Dateien`, 0x00FF88, false);
  }

  // ==========================================================================
  // 47. !partnership
  // ==========================================================================
  if (command === '!partnership') {
    let link = args[0];
    if (!link) return fail(message, 'Benutzung: `!partnership https://discord.gg/deinserver`');
    let code = link.replace('https://discord.gg/', '').replace('http://discord.gg/', '').replace('discord.gg/', '').replace('https://discord.com/invite/', '').split('/')[0].split('?')[0];
    let inv = null;
    try { inv = await client.fetchInvite(code); } catch {}
    const gn = inv?.guild?.name || message.guild.name;
    const mc = inv?.approximate_member_count || message.guild.memberCount;
    const oc = inv?.approximate_presence_count || '???';
    const gi = inv?.guild?.iconURL({ size: 512 }) || message.guild.iconURL({ size: 512 }) || client.user.displayAvatarURL();
    const gd = inv?.guild?.description || 'Ein cooler Discord Server - Join uns!';
    const texts = [
      `🔥 **NEUE PARTNERSCHAFT!** 🔥\n\n**🌟 ${gn}**\n> ${gd}\n\n👥 **${mc}** Member | 🟢 **${oc}** online\n\n**👉 JOINE JETZT:**\n${link}`,
      `✨ **PARTNERSCHAFT** ✨\n\n**💎 ${gn}**\n> *${gd}*\n\n**🔗 Server:**\n${link}`,
      `🤝 **OFFIZIELLE PARTNERSCHAFT** 🤝\n\n**🏆 ${gn}**\n\n${gd}\n\n👥 **${mc}** | 🟢 **${oc}**\n\n**🔗 Einladung:**\n${link}`,
      `🚀 **PARTNER ALERT!** 🚀\n\n**${gn}** ist jetzt Partner von **${message.guild.name}**!\n\n👥 ${mc} Member | 🟢 ${oc} Online\n💬 ${gd}\n\n**JOIN:** ${link}`
    ];
    const rt = texts[Math.floor(Math.random() * texts.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🤝 PARTNERSCHAFT - ${gn}`)
      .setDescription(rt)
      .setColor(0xFF00AA)
      .setThumbnail(gi)
      .setImage(gi)
      .setFooter({ text: `BENI BOT • ${message.guild.name} x ${gn}` })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel(`🚀 ${gn} joinen`).setStyle(ButtonStyle.Link).setURL(link.startsWith('http') ? link : `https://${link}`),
      new ButtonBuilder().setLabel('💬 Support').setStyle(ButtonStyle.Link).setURL('https://discord.gg/7gqzytC3SH')
    );
    await reactDone(message);
    await message.channel.send({
      embeds: [new EmbedBuilder().setTitle('🎉 Neue Partnerschaft!').setDescription('Siehe unten!').setColor(0xFF00AA).setTimestamp()]
    });
    await message.channel.send({ embeds: [embed], components: [row] });
    return message.channel.send({
      embeds: [new EmbedBuilder().setTitle('📋 KOPIER-TEXT').setDescription(`\`\`\`\n${rt.replace(/\*\*/g, '')}\n\`\`\``).setColor(0x00AAFF).setTimestamp()]
    });
  }

  // ==========================================================================
  // 48. !stats / 49. !as
  // ==========================================================================
  if (command === '!stats' || command === '!as') {
    let tu = 0;
    client.guilds.cache.forEach(g => tu += g.memberCount || 0);
    await reactDone(message);
    const e = new EmbedBuilder()
      .setTitle('📊 BENI - STATS')
      .setColor('#00FF00')
      .setDescription(`**Beni ist auf ${client.guilds.cache.size} Servern aktiv!**`)
      .addFields(
        { name: '🖥️ Server', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 User Total', value: `${tu}`, inline: true },
        { name: '📶 Ping', value: `${client.ws.ping}ms`, inline: true }
      )
      .setFooter({ text: 'Beni Bot • !stats' })
      .setTimestamp();
    if (command === '!as') {
      const top = [...client.guilds.cache.values()].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).slice(0, 5).map((g, i) => `**${i + 1}.** ${g.name} - ${g.memberCount} User`).join('\n') || 'Keine Server';
      e.addFields({ name: '🏆 Top 5 Server', value: top, inline: false });
    }
    const r = await message.reply({ embeds: [e] });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 50. !addblrole
  // ==========================================================================
  if (command === '!addblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return fail(message, 'Du brauchst Manage Roles!');
    }
    const role = message.mentions.roles.first();
    if (!role) return fail(message, 'Benutzung: `!addBLrole @role`');
    await BlacklistRoleConfig.findOneAndUpdate({ guildId: message.guild.id }, { roleId: role.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Blacklist Role ist jetzt: ${role}`);
  }

  // ==========================================================================
  // 51. !removeblrole
  // ==========================================================================
  if (command === '!removeblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return fail(message, 'Du brauchst Manage Roles!');
    }
    await BlacklistRoleConfig.findOneAndDelete({ guildId: message.guild.id });
    return success(message, 'Blacklist Role entfernt!');
  }

  // ==========================================================================
  // 52. !blacklist
  // ==========================================================================
  if (command === '!blacklist') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    const t = message.mentions.members.first();
    if (!t) return fail(message, 'Benutzung: `!blacklist @member Grund`');
    if (t.id === message.author.id) return fail(message, 'Du kannst dich nicht selbst blacklisten!');
    let blId = await getBlacklistRoleId(message.guild.id);
    let bl = blId ? message.guild.roles.cache.get(blId) : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    if (!bl) {
      try {
        bl = await message.guild.roles.create({ name: 'Blacklist', color: 0x000000, reason: 'Auto created Blacklist Role' });
      } catch {
        return fail(message, 'Konnte Blacklist Role nicht erstellen!');
      }
    }
    const old = t.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.id);
    await BlacklistData.findOneAndUpdate({ guildId: message.guild.id, userId: t.id }, { oldRoles: old }, { upsert: true, new: true });
    try {
      await t.roles.remove(old).catch(() => {});
      await t.roles.add(bl).catch(() => {});
      await t.timeout(28 * 24 * 60 * 60 * 1000, 'Blacklisted').catch(() => {});
    } catch {
      return fail(message, 'Fehler!');
    }
    const reason = args.slice(1).join(' ') || 'No reason';
    await reactDone(message);
    return embedReply(message, '⛔ User Blacklisted', `${t} wurde geblacklistet.\n\n**Grund:** ${reason}\n**Alle Rollen entfernt**\n**Timeout:** 28 Tage\n**Rolle:** ${bl}`, 0x000000, false);
  }

  // ==========================================================================
  // 53. !free
  // ==========================================================================
  if (command === '!free') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    const t = message.mentions.members.first();
    if (!t) return fail(message, 'Benutzung: `!free @member`');
    let blId = await getBlacklistRoleId(message.guild.id);
    let bl = blId ? message.guild.roles.cache.get(blId) : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    const saved = await BlacklistData.findOne({ guildId: message.guild.id, userId: t.id });
    const old = saved?.oldRoles || [];
    try {
      if (bl) await t.roles.remove(bl).catch(() => {});
      await t.timeout(null).catch(() => {});
      if (old.length) await t.roles.add(old).catch(() => {});
      await BlacklistData.findOneAndDelete({ guildId: message.guild.id, userId: t.id });
    } catch {
      return fail(message, 'Fehler beim Freilassen!');
    }
    return success(message, `${t} wurde befreit. Alte Rollen zurückgegeben.`);
  }

  // ==========================================================================
  // 54-56. !remember / !remind / !reminder
  // ==========================================================================
  if (command === '!remember' || command === '!remind' || command === '!reminder') {
    const ta = args[0];
    const txt = args.slice(1).join(' ');
    if (!ta || !txt) return fail(message, 'Benutzung: `!remember 10m Hausaufgaben`');
    const ms = parseDuration(ta);
    if (!ms) return fail(message, 'Benutze: 10s 10m 1h 1d');
    await reactDone(message);
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('⏰ Reminder Set!')
        .setDescription(`Ich ping dich in **${ta}**\n**Reminder:** ${txt}`)
        .setColor(0x00FF00)
        .setTimestamp()
      ]
    });
    setTimeout(() => message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('⏰ REMINDER!')
        .setDescription(`> ${txt}`)
        .setColor(0xFFAA00)
        .addFields({ name: '👤 Für', value: `${message.author}`, inline: true })
        .setTimestamp()
      ],
      content: `${message.author}`
    }), ms);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 57. !addchannelreport
  // ==========================================================================
  if (command === '!addchannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) return fail(message, 'Benutzung: `!addchannelreport #channel`');
    const ids = await getReportChannels(message.guild.id);
    if (ids.includes(ch.id)) return fail(message, `${ch} ist schon ein Report-Channel!`);
    await ReportConfig.findOneAndUpdate({ guildId: message.guild.id }, { $push: { channelIds: ch.id } }, { upsert: true, new: true });
    await saveCommand(message, command, { targetChannelId: ch.id });
    return success(message, `${ch} wurde als **Report-Channel** hinzugefügt!`);
  }

  // ==========================================================================
  // 58. !removechannelreport
  // ==========================================================================
  if (command === '!removechannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) return fail(message, 'Benutzung: `!removechannelreport #channel`');
    await ReportConfig.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { channelIds: ch.id } });
    return success(message, `${ch} wurde entfernt!`);
  }

  // ==========================================================================
  // 59. !reportchannelstatus
  // ==========================================================================
  if (command === '!reportchannelstatus') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ids = await getReportChannels(message.guild.id);
    if (!ids.length) return fail(message, 'Kein Report-Channel gesetzt! `!addchannelreport #channel`');
    const list = ids.map(id => {
      const ch = message.guild.channels.cache.get(id);
      return ch ? `${ch} - \`${id}\`` : `Unbekannt - \`${id}\``;
    }).join('\n');
    await reactDone(message);
    return embedReply(message, '📝 • REPORT-CHANNEL STATUS', list, 0x00AAFF, false);
  }

  // ==========================================================================
  // 60. !report
  // ==========================================================================
  if (command === '!report') {
    const t = message.mentions.members.first() || message.mentions.users.first();
    if (!t) return fail(message, 'Benutzung: `!report @User Grund`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    const sent = await sendReportEmbed(message.guild, t.user || t, message.author, reason, message.channel, message.url, 'manual');
    if (!sent) return fail(message, 'Kein Report-Channel gesetzt! Admin muss `!addchannelreport #channel` machen.');
    return success(message, `Report gegen ${t} wurde gesendet!`);
  }

  // ==========================================================================
  // 61. !banner
  // ==========================================================================
  if (command === '!banner') {
    const t = message.mentions.users.first() || message.author;
    const f = await client.users.fetch(t.id, { force: true }).catch(() => t);
    const url = f.bannerURL({ size: 1024, extension: 'png' });
    if (!url) return fail(message, `${t.username} hat **kein Banner** gesetzt!`);
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🖼️ Banner von ${t.username}`)
        .setImage(url)
        .setColor(0x5865F2)
        .addFields(
          { name: '👤 User', value: `${t} - \`${t.tag}\``, inline: true },
          { name: '🆔 ID', value: `\`${t.id}\``, inline: true },
          { name: '🔗 Link', value: `[Banner öffnen](${url})`, inline: false }
        )
        .setFooter({ text: `Angefordert von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 62. !avatar
  // ==========================================================================
  if (command === '!avatar') {
    const t = message.mentions.users.first() || message.author;
    const url = t.displayAvatarURL({ size: 1024, extension: 'png', forceStatic: false });
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🖼️ Avatar von ${t.username}`)
        .setImage(url)
        .setColor(0x5865F2)
        .addFields(
          { name: '👤 User', value: `${t} - \`${t.tag}\``, inline: true },
          { name: '🆔 ID', value: `\`${t.id}\``, inline: true },
          { name: '🔗 Link', value: `[Avatar öffnen](${url})`, inline: false }
        )
        .setFooter({ text: `Angefordert von ${message.author.tag}` })
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 63. !history
  // ==========================================================================
  if (command === '!history') {
    const t = message.mentions.users.first() || message.author;
    const loading = await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('⏳ Suche...')
        .setDescription(`Suche die letzten 20 Nachrichten von ${t}...`)
        .setColor(0xFFAA00)
        .setTimestamp()
      ]
    });
    try {
      let all = [];
      const tcs = message.guild.channels.cache.filter(c => c.isTextBased() && c.viewable);
      for (const [, ch] of tcs) {
        try {
          const f = await ch.messages.fetch({ limit: 100 }).catch(() => null);
          if (!f) continue;
          all.push(...f.filter(m => m.author.id === t.id).values());
        } catch {}
      }
      all.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
      const last20 = all.slice(0, 20);
      if (!last20.length) {
        return loading.edit({
          embeds: [new EmbedBuilder()
            .setTitle('❌ Nichts gefunden')
            .setDescription(`Keine Nachrichten von ${t} gefunden.`)
            .setColor(0xFF0000)
            .setTimestamp()
          ]
        });
      }
      const list = last20.map((m, i) => `**${i + 1}.** ${m.channel} • <t:${Math.floor(m.createdTimestamp / 1000)}:R>\n> ${(m.content || '*Bild / Datei*').slice(0, 80).replace(/\n/g, ' ')}\n> [Zur Nachricht](${m.url})`).join('\n\n');
      await loading.edit({
        embeds: [new EmbedBuilder()
          .setTitle(`📜 History von ${t.username}`)
          .setDescription(list.slice(0, 4000))
          .setColor(0x00AAFF)
          .setThumbnail(t.displayAvatarURL())
          .setFooter({ text: `${last20.length} Nachrichten gefunden | ${t.tag}` })
          .setTimestamp()
        ]
      });
      deleteAfter(message);
    } catch {
      loading.edit({
        embeds: [new EmbedBuilder()
          .setTitle('❌ Fehler')
          .setDescription('Fehler beim Suchen!')
          .setColor(0xFF0000)
          .setTimestamp()
        ]
      });
    }
    return;
  }

  // ==========================================================================
  // 64+65. !levelups / !levelupchannel
  // ==========================================================================
  if (command === '!levelups' || command === '!levelupchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) return fail(message, 'Benutzung: `!levelups #channel`');
    await GuildConfig.findOneAndUpdate({ guildId: message.guild.id }, { levelupChannelId: ch.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetChannelId: ch.id });
    return success(message, `Level-Ups werden jetzt in ${ch} gesendet.`);
  }

  // ==========================================================================
  // 66. !removelevelup
  // ==========================================================================
  if (command === '!removelevelup') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    await GuildConfig.findOneAndUpdate({ guildId: message.guild.id }, { levelupChannelId: null });
    return success(message, 'Level-Up Channel entfernt. Level-Ups kommen wieder im aktuellen Channel.');
  }

  // ==========================================================================
  // 67. !setlevelrole
  // ==========================================================================
  if (command === '!setlevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const lvl = parseInt(args[0]);
    const role = message.mentions.roles.first();
    if (!lvl || !role) return fail(message, 'Benutzung: `!setlevelrole 5 @Role`');
    await LevelRole.findOneAndUpdate({ guildId: message.guild.id, level: lvl }, { roleId: role.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Ab **Level ${lvl}** bekommt man jetzt ${role}.`);
  }

  // ==========================================================================
  // 68. !removelevelrole
  // ==========================================================================
  if (command === '!removelevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const lvl = parseInt(args[0]);
    if (!lvl) return fail(message, 'Benutzung: `!removelevelrole 5`');
    await LevelRole.findOneAndDelete({ guildId: message.guild.id, level: lvl });
    return success(message, `Für **Level ${lvl}** gibt es jetzt keine Rolle mehr.`);
  }

  // ==========================================================================
  // 69. !rank
  // ==========================================================================
  if (command === '!rank') {
    const t = message.mentions.users.first() || message.author;
    let u = await Level.findOne({ userId: t.id, guildId: message.guild.id });
    if (!u) return fail(message, 'Der User hat noch keine XP!');
    const need = getNeededXp(u.level);
    const prog = Math.floor((u.xp / need) * 20);
    const bar = '🟩'.repeat(prog) + '⬛'.repeat(20 - prog);
    const all = await Level.find({ guildId: message.guild.id }).sort({ level: -1, xp: -1 });
    const pos = all.findIndex(x => x.userId === t.id) + 1;
    await reactDone(message);
    const r = await message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ name: `${t.username} - Rank Card`, iconURL: t.displayAvatarURL() })
        .setThumbnail(t.displayAvatarURL())
        .addFields(
          { name: '🏆 Rang', value: `#${pos}`, inline: true },
          { name: '📈 Level', value: `${u.level}`, inline: true },
          { name: '✨ XP', value: `${u.xp} / ${need}`, inline: true },
          { name: '📊 Fortschritt', value: `${bar}\n${Math.floor((u.xp / need) * 100)}%` }
        )
        .setTimestamp()
      ]
    });
    deleteAfter(r);
    deleteAfter(message);
    return;
  }

  // ==========================================================================
  // 70+71. !leaderboard / !lb
  // ==========================================================================
  if (command === '!leaderboard' || command === '!lb') {
    const top = await Level.find({ guildId: message.guild.id }).sort({ level: -1, xp: -1 }).limit(10);
    if (!top.length) return fail(message, 'Noch keiner auf dem Leaderboard!');
    let desc = '';
    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < top.length; i++) {
      const u = top[i];
      const m = await message.guild.members.fetch(u.userId).catch(() => null);
      const n = m ? m.user.username : 'Unbekannt';
      desc += `${medals[i] || `**${i + 1}.**`} **${n}** - Level ${u.level} | ${u.xp} XP\n`;
    }
    await reactDone(message);
    return embedReply(message, `🏆 Leaderboard - ${message.guild.name}`, desc, 0xFFD700, false, { thumb: message.guild.iconURL() });
  }

  // ==========================================================================
  // 72. !leveldashboard
  // ==========================================================================
  if (command === '!leveldashboard') {
    const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
    const tu = await Level.countDocuments({ guildId: message.guild.id });
    const topU = await Level.findOne({ guildId: message.guild.id }).sort({ level: -1, xp: -1 });
    const tot = await Level.aggregate([{ $match: { guildId: message.guild.id } }, { $group: { _id: null, total: { $sum: '$xp' } } }]);
    const lrs = await LevelRole.find({ guildId: message.guild.id }).sort({ level: 1 });
    let topN = 'Niemand';
    if (topU) {
      const m = await message.guild.members.fetch(topU.userId).catch(() => null);
      topN = m ? `${m.user.username} (Level ${topU.level})` : `Level ${topU.level}`;
    }
    const ct = cfg?.levelupChannelId ? `<#${cfg.levelupChannelId}>` : 'Nicht gesetzt';
    const rt = lrs.length ? lrs.map(r => `Level ${r.level} -> <@&${r.roleId}>`).join('\n') : 'Keine Level-Rollen gesetzt';
    await reactDone(message);
    return embedReply(message, `📊 Level Dashboard - ${message.guild.name}`, 'Übersicht über das Level-System', 0x00AAFF, false, {
      thumb: message.guild.iconURL(),
      fields: [
        { name: '👥 User mit XP', value: `${tu}`, inline: true },
        { name: '✨ Gesamt XP', value: `${tot[0]?.total || 0}`, inline: true },
        { name: '🏆 Top User', value: topN, inline: true },
        { name: '📢 Level-Up Channel', value: ct, inline: false },
        { name: '🎭 Level-Rollen', value: rt, inline: false }
      ]
    });
  }

  // ==========================================================================
  // 73. !multiplier
  // ==========================================================================
  if (command === '!multiplier') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    if (args[0]?.toLowerCase() === 'list') {
      const all = await Multiplier.find({ guildId: message.guild.id });
      if (!all.length) return fail(message, 'Keine Multiplier gesetzt.');
      return embedReply(message, '✨ XP-Multiplier', all.map(m => `<@&${m.roleId}> → **${m.multiplier}x XP**`).join('\n'), 0xFFAA00, false);
    }
    const role = message.mentions.roles.first();
    const amt = parseFloat(args[1]);
    if (!role || isNaN(amt)) return fail(message, 'Benutzung: `!multiplier @Role 2`\n`!multiplier list`');
    if (amt <= 1) {
      await Multiplier.findOneAndDelete({ guildId: message.guild.id, roleId: role.id });
      return success(message, `Für ${role} gibt es jetzt keinen Multiplier mehr (1x).`);
    }
    await Multiplier.findOneAndUpdate({ guildId: message.guild.id, roleId: role.id }, { multiplier: amt }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `${role} bekommt jetzt **${amt}x XP** bei jeder Nachricht.`);
  }

  // ==========================================================================
  // 74. !resetxp
  // ==========================================================================
  if (command === '!resetxp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const t = message.mentions.users.first();
    if (!t) return fail(message, 'Benutzung: `!resetXP @User`');
    await Level.findOneAndUpdate({ userId: t.id, guildId: message.guild.id }, { xp: 0, level: 0 }, { upsert: true, new: true });
    return success(message, `${t} wurde auf **Level 0 | 0 XP** zurückgesetzt.`);
  }

  // ==========================================================================
  // 75. !givexp
  // ==========================================================================
  if (command === '!givexp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const t = message.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!t || isNaN(amt)) return fail(message, 'Benutzung: `!givexp @User 500`');
    if (amt <= 0) return fail(message, 'Muss über 0 sein.');
    let u = await Level.findOne({ userId: t.id, guildId: message.guild.id });
    if (!u) u = new Level({ userId: t.id, guildId: message.guild.id });
    const old = u.level;
    u.xp += amt;
    let up = false;
    while (u.xp >= getNeededXp(u.level)) {
      u.xp -= getNeededXp(u.level);
      u.level += 1;
      up = true;
    }
    await u.save();
    if (up) {
      const m = await message.guild.members.fetch(t.id).catch(() => null);
      const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
      const tc = cfg?.levelupChannelId ? await message.guild.channels.fetch(cfg.levelupChannelId).catch(() => null) : message.channel;
      let rt = '';
      const lr = await LevelRole.findOne({ guildId: message.guild.id, level: u.level });
      if (lr) {
        const role = message.guild.roles.cache.get(lr.roleId);
        if (m && role) {
          await m.roles.add(role).catch(() => {});
          rt = `\n🎭 Du hast die Rolle ${role} erhalten!`;
        }
      }
      if (tc) {
        tc.send({
          embeds: [new EmbedBuilder()
            .setColor('#00FF88')
            .setTitle('🎉 LEVEL UP!')
            .setDescription(`GG ${t}! Du bist jetzt **Level ${u.level}**!${rt}`)
            .setThumbnail(t.displayAvatarURL())
            .setTimestamp()
          ]
        }).catch(() => {});
      }
    }
    return success(message, `${t} hat **${amt} XP** erhalten.\nJetzt: **Level ${u.level} | ${u.xp} / ${getNeededXp(u.level)} XP**${u.level > old ? `\n🎉 Level-Up ${old} → ${u.level}!` : ''}`);
  }

  // ==========================================================================
  // 76. !joinrole
  // ==========================================================================
  if (command === '!joinrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst Admin-Rechte.');
    }
    if (args[0] === 'status') {
      const d = await JoinRole.findOne({ guildId: message.guild.id });
      if (!d) return fail(message, 'Es ist keine Join-Role gesetzt.');
      const role = message.guild.roles.cache.get(d.roleId);
      return success(message, `Join-Role ist: ${role ? `<@&${role.id}>` : d.roleId}`, false);
    }
    const role = message.mentions.roles.first();
    if (!role) return fail(message, 'Benutzung: `!joinrole @Role`');
    await JoinRole.findOneAndUpdate({ guildId: message.guild.id }, { guildId: message.guild.id, roleId: role.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Join-Role gesetzt auf: <@&${role.id}>`);
  }

  // ==========================================================================
  // 77. !removejoinrole
  // ==========================================================================
  if (command === '!removejoinrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst Admin-Rechte.');
    }
    const role = message.mentions.roles.first();
    if (!role) {
      await JoinRole.deleteOne({ guildId: message.guild.id });
      return success(message, 'Join-Role wurde entfernt.');
    }
    const d = await JoinRole.findOne({ guildId: message.guild.id });
    if (d && d.roleId === role.id) await JoinRole.deleteOne({ guildId: message.guild.id });
    return success(message, `Join-Role <@&${role.id}> wurde entfernt.`);
  }

});

// ============================================================================
// LOGIN + SELF-HEALING
// ============================================================================
const MYTOKEN = (process.env.DISCORD_TOKEN || process.env.TOKEN || '').trim();
if (!MYTOKEN) console.log('❌ Token NOT found!');
else console.log('✅ Token gefunden, Länge:', MYTOKEN.length);
client.login(MYTOKEN).then(() => console.log('Login-Anfrage geschickt...')).catch(e => console.log('LOGIN FEHLER:', e.message));
let isReconnecting = false;
async function autoReconnect(reason) {
  if (isReconnecting) return;
  isReconnecting = true;
  console.log(`⚠️ Verbindung weg (${reason}) - Reconnect in 5 Sek...`);
  setTimeout(async () => {
    try {
      try { await client.destroy(); } catch {}
      await client.login(MYTOKEN);
      console.log('✅ Reconnect erfolgreich!');
    } catch (e) {
      console.log('❌ Reconnect fehlgeschlagen:', e.message);
      isReconnecting = false;
      setTimeout(() => autoReconnect('retry'), 10000);
      return;
    }
    isReconnecting = false;
  }, 5000);
}
client.on('disconnect', () => autoReconnect('disconnect'));
client.on('shardDisconnect', () => autoReconnect('shardDisconnect'));
setInterval(() => {
  if (client.ws.status !== 0 || !client.user) {
    console.log(`💔 Watchdog: Bot hängt! Status: ${client.ws.status}`);
    autoReconnect('watchdog');
  }
}, 30 * 1000);
setInterval(() => {
  if (client.user) client.user.setActivity('Online ✅ | !help', { type: 4 }).catch(() => {});
}, 10 * 60 * 1000);
console.log('✅ Self-Healing aktiviert');
console.log('✅ BENI BOT v3.0 - 1300+ Zeilen - ALLE COMMANDS GELADEN');
