// ============================================================================
// BENI BOT v6.0 - 3000 ZEILEN VERSION
// TEIL 1 / 3 - CORE + PREFIX + TICKET + MODERATION
// Made by Elyias - Besser als Sapphire
// ============================================================================
// ZEILEN: Teil 1 = ~1100 Zeilen
//         Teil 2 = ~1000 Zeilen
//         Teil 3 = ~1000 Zeilen
//         GESAMT = ~3100 Zeilen
// ============================================================================
// INHALT TEIL 1:
//  - Imports & Setup
//  - Alle Schemas (Level, Prefix, Ticket, Warn, AFK, etc.)
//  - Alle Helper (Embed, Reaction, Prefix, Level-Up, Ticket-Helper)
//  - Interaction Handler (Buttons + Selects)
//  - Join / Voice / Logger
//  - Report System
//  - Main Handler mit Prefix-System
//  - Prefix Commands
//  - Ticket Commands FULL
//  - Mod Commands FULL
// ============================================================================

const mongoose = require('mongoose');
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const http = require('http');

console.log('========================================');
console.log('BENI BOT v6.0 - 3000 ZEILEN VERSION');
console.log('TEIL 1 WIRD GELADEN...');
console.log('========================================');

// ============================================================================
// MONGO VERBINDUNG
// ============================================================================
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Mongo verbunden! ✅');
    console.log('Datenbank: Beni Bot v6.0');
  })
  .catch(err => {
    console.log('Mongo Fehler:', err);
    console.log('Bitte MONGO_URL in Render prüfen!');
  });

// ============================================================================
// SCHEMA 1 - LEVEL
// ============================================================================
// Speichert:
//  - XP, Level, Total XP
//  - Messages (wie viele Nachrichten)
//  - VoiceTime (wie lange im Voice)
//  - LastDaily (für !daily)
// ============================================================================
const levelSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  messages: {
    type: Number,
    default: 0
  },
  voiceTime: {
    type: Number,
    default: 0
  },
  totalXp: {
    type: Number,
    default: 0
  },
  lastDaily: {
    type: Date,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  }
});
const Level = mongoose.model('Level', levelSchema);

// ============================================================================
// SCHEMA 2 - GUILD CONFIG
// ============================================================================
// Speichert Level-Up Channel pro Server
// ============================================================================
const configSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  levelupChannelId: {
    type: String,
    default: null
  }
});
const GuildConfig = mongoose.model('GuildConfig', configSchema);

// ============================================================================
// SCHEMA 3 - LEVEL ROLLEN
// ============================================================================
const levelRoleSchema = new mongoose.Schema({
  guildId: String,
  level: Number,
  roleId: String
});
const LevelRole = mongoose.model('LevelRole', levelRoleSchema);

// ============================================================================
// SCHEMA 4 - WELCOME
// ============================================================================
const welcomeSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  text: {
    type: String,
    default: 'Willkommen {user} auf **{server}**! 🎉 Du bist Member #{member}'
  }
});
const WelcomeConfig = mongoose.model('WelcomeConfig', welcomeSchema);

// ============================================================================
// SCHEMA 5 - MESSAGE LOG
// ============================================================================
const logSchema = new mongoose.Schema({
  guildId: String,
  channelId: String
});
const LogConfig = mongoose.model('LogConfig', logSchema);

// ============================================================================
// SCHEMA 6 - REPORT CHANNELS
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
// SCHEMA 7 - BLACKLIST ROLLE
// ============================================================================
const blacklistRoleSchema = new mongoose.Schema({
  guildId: String,
  roleId: String
});
const BlacklistRoleConfig = mongoose.model('BlacklistRoleConfig', blacklistRoleSchema);

// ============================================================================
// SCHEMA 8 - BLACKLIST DATEN
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
// SCHEMA 9 - MULTIPLIER
// ============================================================================
const MultiplierSchema = new mongoose.Schema({
  guildId: String,
  roleId: String,
  multiplier: Number
});
const Multiplier = mongoose.model('Multiplier', MultiplierSchema);

// ============================================================================
// SCHEMA 10 - JOIN ROLLE
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
// SCHEMA 11 - APPLICATION TEXT / BEWERBUNGSTEXT
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
// SCHEMA 12 - COMMAND LOG / SAVED IDS
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
// SCHEMA 13 - WARNS
// ============================================================================
const warnSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  userTag: String,
  reason: String,
  warnedBy: String,
  warnedByTag: String,
  duration: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Warn = mongoose.model('Warn', warnSchema);

// ============================================================================
// SCHEMA 14 - AFK
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
// SCHEMA 15 - GIVEAWAY
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
  },
  participants: {
    type: [String],
    default: []
  }
});
const Giveaway = mongoose.model('Giveaway', giveawaySchema);

// ============================================================================
// SCHEMA 16 - PREFIX - NEU!
// ============================================================================
// Jeder Server hat seinen eigenen Prefix
// Standard: !
// Beispiel: ? oder . oder +
// ============================================================================
const prefixSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  prefix: {
    type: String,
    default: '!'
  }
});
const Prefix = mongoose.model('Prefix', prefixSchema);

// ============================================================================
// SCHEMA 17 - TICKET SETUP
// ============================================================================
// Speichert wo das Ticket-Panel ist
// Welche Support-Rolle, welcher Log-Channel
// ============================================================================
const ticketSetupSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  categoryId: {
    type: String,
    default: null
  },
  logChannelId: {
    type: String,
    default: null
  },
  supportRoleId: {
    type: String,
    default: null
  },
  panelMessageId: {
    type: String,
    default: null
  }
});
const TicketSetup = mongoose.model('TicketSetup', ticketSetupSchema);

// ============================================================================
// SCHEMA 18 - TICKET
// ============================================================================
const ticketSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  userTag: String,
  channelId: String,
  reason: {
    type: String,
    default: 'Kein Grund'
  },
  claimedBy: {
    type: String,
    default: null
  },
  claimedByTag: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  }
});
const Ticket = mongoose.model('Ticket', ticketSchema);

// ============================================================================
// SCHEMA 19 - TRANSCRIPT
// ============================================================================
const transcriptSchema = new mongoose.Schema({
  guildId: String,
  ticketUserId: String,
  ticketUserTag: String,
  channelName: String,
  transcript: String,
  closedBy: String,
  closedByTag: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Transcript = mongoose.model('Transcript', transcriptSchema);

// ============================================================================
// SCHEMA 20 - ECONOMY / COINS (für Teil 2)
// ============================================================================
const economySchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  coins: {
    type: Number,
    default: 0
  },
  bank: {
    type: Number,
    default: 0
  },
  lastDailyCoins: {
    type: Date,
    default: null
  }
});
const Economy = mongoose.model('Economy', economySchema);

// ============================================================================
// XP FORMELN
// ============================================================================
function getNeededXp(l) {
  return 5 * (l ** 2) + 50 * l + 100;
}

function formatVoice(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function formatDuration(ms) {
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
  return `${Math.floor(ms / 86400000)}d`;
}

function formatNumber(n) {
  return n.toLocaleString('de-DE');
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
  res.end('Beni Bot v6.0 laeuft! 3000 Zeilen Version');
}).listen(process.env.PORT || 10000, () => {
  console.log('Webserver läuft auf Port 10000');
});

// ============================================================================
// READY
// ============================================================================
client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag} 🎉`);
  console.log(`Server: ${client.guilds.cache.size}`);
  console.log(`User: ${client.users.cache.size}`);
  client.user.setActivity('Online ✅ | !help', { type: 4 }).catch(() => {});
});

// ============================================================================
// HELPERS - PREFIX
// ============================================================================
async function getPrefix(guildId) {
  if (!guildId) return '!';
  const d = await Prefix.findOne({ guildId }).catch(() => null);
  return d?.prefix || '!';
}

// ============================================================================
// HELPERS - WELCOME / LOG / REPORT
// ============================================================================
async function getWelcome(g) {
  const c = await WelcomeConfig.findOne({ guildId: g });
  return c || null;
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

// ============================================================================
// HELPERS - LÖSCHEN / DAUER
// ============================================================================
function deleteAfter(m, ms = 3000) {
  if (!m) return;
  setTimeout(() => {
    m.delete().catch(() => {});
  }, ms);
}

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

// ============================================================================
// HELPERS - REACTIONS ⏳ -> ✅
// ============================================================================
async function reactStart(msg) {
  await msg.react('⏳').catch(() => {});
}

async function reactDone(msg) {
  await msg.reactions.removeAll().catch(() => {});
  await msg.react('✅').catch(() => {});
  setTimeout(() => {
    msg.reactions.removeAll().catch(() => {});
  }, 3000);
}

// ============================================================================
// HELPERS - EMBED SYSTEM
// ALLE Antworten NUR als Embed!
// ============================================================================
async function embedReply(message, title, desc, color = 0x5865F2, del = false, extra = {}) {
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

async function success(message, text, del = false) {
  await reactDone(message);
  return embedReply(message, '✅ Erfolgreich!', text, 0x00FF00, del);
}

async function fail(message, text, del = false) {
  await reactDone(message);
  return embedReply(message, '❌ Fehlgeschlagen!', text, 0xFF0000, del);
}

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
      targetUserId: extra.targetUserId || message.mentions.users.first()?.id || null,
      targetRoleId: extra.targetRoleId || message.mentions.roles.first()?.id || null,
      targetChannelId: extra.targetChannelId || message.mentions.channels.first()?.id || null
    });
  } catch {}
}

function randomColor() {
  const colors = [0x5865F2, 0x00FF00, 0xFFAA00, 0xFF00AA, 0x00AAFF, 0xFFD700];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function getOrCreateLevel(userId, guildId) {
  let u = await Level.findOne({ userId, guildId });
  if (!u) {
    u = new Level({ userId, guildId });
    await u.save();
  }
  return u;
}

async function handleLevelUp(member, user, channel) {
  const cfg = await GuildConfig.findOne({ guildId: member.guild.id });
  const tc = cfg?.levelupChannelId
    ? await member.guild.channels.fetch(cfg.levelupChannelId).catch(() => null)
    : channel;
  let rt = '';
  const lr = await LevelRole.findOne({ guildId: member.guild.id, level: user.level });
  if (lr) {
    const role = member.guild.roles.cache.get(lr.roleId);
    if (role) {
      await member.roles.add(role).catch(() => {});
      rt = `\n🎭 Du hast die Rolle ${role} erhalten!`;
    }
  }
  if (tc) {
    tc.send({
      embeds: [new EmbedBuilder()
        .setColor('#00FF88')
        .setTitle('🎉 LEVEL UP!')
        .setDescription(`GG ${member}! Du bist jetzt **Level ${user.level}**!${rt}`)
        .setThumbnail(member.displayAvatarURL())
        .setTimestamp()
      ]
    }).catch(() => {});
  }
}

// ============================================================================
// TICKET HELPERS - FULL AUSGEBAUT
// ============================================================================
async function createTicketChannel(guild, user, reason) {
  const setup = await TicketSetup.findOne({ guildId: guild.id });
  let parent = setup?.categoryId || null;
  if (!parent) {
    const cat = await guild.channels.create({
      name: '🎫 TICKETS',
      type: ChannelType.GuildCategory
    }).catch(() => null);
    if (cat) parent = cat.id;
  }
  const overwrites = [
    {
      id: guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels
      ]
    }
  ];
  if (setup?.supportRoleId) {
    overwrites.push({
      id: setup.supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    });
  }
  const ch = await guild.channels.create({
    name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`,
    type: ChannelType.GuildText,
    parent,
    permissionOverwrites: overwrites,
    topic: `Ticket von ${user.tag} | Grund: ${reason}`
  }).catch(() => null);
  return ch;
}

async function closeTicket(channel, closedBy, guild) {
  const t = await Ticket.findOne({ channelId: channel.id, status: 'open' });
  if (!t) return null;
  let txt = `=== BENI BOT TICKET TRANSCRIPT ===\n`;
  txt += `Server: ${guild.name}\n`;
  txt += `Ticket von: ${t.userTag} (${t.userId})\n`;
  txt += `Grund: ${t.reason}\n`;
  txt += `Erstellt: ${t.createdAt}\n`;
  txt += `Geschlossen von: ${closedBy.tag} (${closedBy.id})\n`;
  txt += `Geschlossen am: ${new Date().toISOString()}\n`;
  txt += `Claimed von: ${t.claimedByTag || 'Niemand'}\n`;
  txt += `================================\n\n`;
  try {
    const msgs = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (msgs) {
      const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      for (const m of sorted) {
        txt += `[${new Date(m.createdTimestamp).toLocaleString('de-DE')}] ${m.author.tag}: ${m.content || '[Embed/Bild/Datei]'}\n`;
        if (m.attachments.size > 0) {
          txt += `  -> Anhang: ${[...m.attachments.values()].map(a => a.url).join(', ')}\n`;
        }
      }
    }
  } catch {}
  await Transcript.create({
    guildId: guild.id,
    ticketUserId: t.userId,
    ticketUserTag: t.userTag,
    channelName: channel.name,
    transcript: txt,
    closedBy: closedBy.id,
    closedByTag: closedBy.tag
  });
  t.status = 'closed';
  t.closedAt = new Date();
  await t.save();
  const setup = await TicketSetup.findOne({ guildId: guild.id });
  if (setup?.logChannelId) {
    const logCh = guild.channels.cache.get(setup.logChannelId)
      || await guild.channels.fetch(setup.logChannelId).catch(() => null);
    if (logCh) {
      await logCh.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔒 Ticket geschlossen')
          .setDescription(`**Ticket:** ${channel.name}\n**Von:** <@${t.userId}> - \`${t.userTag}\`\n**Grund:** ${t.reason}\n**Geschlossen von:** ${closedBy} - \`${closedBy.tag}\`\n**Claimed von:** ${t.claimedByTag || 'Niemand'}`)
          .setColor(0xFF0000)
          .setTimestamp()
        ],
        files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${channel.name}.txt` }]
      }).catch(() => {});
    }
  }
  try {
    const u = await guild.members.fetch(t.userId).catch(() => null);
    if (u) {
      await u.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔒 Dein Ticket wurde geschlossen')
          .setDescription(`Dein Ticket **${channel.name}** auf **${guild.name}** wurde geschlossen.\n**Von:** ${closedBy.tag}\n**Grund:** ${t.reason}`)
          .setColor(0xFF0000)
          .setTimestamp()
        ]
      }).catch(() => {});
    }
  } catch {}
  return t;
}

// ============================================================================
// INTERACTION HANDLER - BUTTONS + SELECTS
// ============================================================================
client.on('interactionCreate', async (i) => {
  try {
    if (i.isButton()) {
      // ID KOPIEREN
      if (i.customId.startsWith('copy_id_')) {
        const id = i.customId.replace('copy_id_', '');
        return i.reply({
          content: `Hier zum Kopieren:\n\`\`\`${id}\`\`\``,
          ephemeral: true
        }).catch(() => {});
      }
      // GIVEAWAY
      if (i.customId.startsWith('giveaway_')) {
        const gwId = i.customId.replace('giveaway_', '');
        const gw = await Giveaway.findById(gwId).catch(() => null);
        if (!gw || gw.ended) {
          return i.reply({ content: 'Dieses Giveaway ist schon vorbei!', ephemeral: true }).catch(() => {});
        }
        if (gw.participants.includes(i.user.id)) {
          return i.reply({ content: 'Du nimmst schon teil!', ephemeral: true }).catch(() => {});
        }
        gw.participants.push(i.user.id);
        await gw.save();
        return i.reply({
          embeds: [new EmbedBuilder()
            .setTitle('🎉 Du nimmst teil!')
            .setDescription(`Du nimmst am Giveaway **${gw.prize}** teil! Viel Glück!`)
            .setColor(0x00FF00)
            .setTimestamp()
          ],
          ephemeral: true
        }).catch(() => {});
      }
      // TICKET ERSTELLEN VIA PANEL
      if (i.customId === 'ticket_create') {
        await i.deferReply({ ephemeral: true }).catch(() => {});
        const ex = await Ticket.findOne({ guildId: i.guild.id, userId: i.user.id, status: 'open' });
        if (ex) {
          return i.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('❌ Schon ein Ticket')
              .setDescription(`Du hast schon ein Ticket: <#${ex.channelId}>`)
              .setColor(0xFF0000)
              .setTimestamp()
            ]
          }).catch(() => {});
        }
        const ch = await createTicketChannel(i.guild, i.user, 'Über Panel erstellt');
        if (!ch) {
          return i.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('❌ Fehler')
              .setDescription('Konnte Ticket nicht erstellen!')
              .setColor(0xFF0000)
            ]
          }).catch(() => {});
        }
        await Ticket.create({
          guildId: i.guild.id,
          userId: i.user.id,
          userTag: i.user.tag,
          channelId: ch.id,
          reason: 'Über Panel erstellt'
        });
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Schließen').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('🙋 Claimen').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary)
        );
        await ch.send({
          content: `<@${i.user.id}>`,
          embeds: [new EmbedBuilder()
            .setTitle('🎫 Neues Ticket!')
            .setDescription(`Hey ${i.user}, willkommen in deinem Ticket!\n\n**Bitte beschreibe dein Anliegen so genau wie möglich.**\nEin Team-Mitglied meldet sich gleich bei dir.`)
            .setColor(0x5865F2)
            .addFields(
              { name: '👤 Erstellt von', value: `${i.user} - \`${i.user.tag}\``, inline: true },
              { name: '📅 Erstellt am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setTimestamp()
          ],
          components: [row]
        }).catch(() => {});
        return i.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('✅ Ticket erstellt!')
            .setDescription(`Dein Ticket: ${ch}`)
            .setColor(0x00FF00)
            .setTimestamp()
          ]
        }).catch(() => {});
      }
      // TICKET SCHLIESSEN
      if (i.customId === 'ticket_close') {
        await i.reply({
          embeds: [new EmbedBuilder()
            .setTitle('🔒 Ticket wird geschlossen...')
            .setDescription(`Geschlossen von ${i.user} - Channel wird in 5 Sekunden gelöscht. Transcript wird gespeichert.`)
            .setColor(0xFF0000)
            .setTimestamp()
          ]
        }).catch(() => {});
        const t = await closeTicket(i.channel, i.user, i.guild);
        if (!t) {
          return i.followUp({
            embeds: [new EmbedBuilder()
              .setTitle('❌ Kein Ticket')
              .setDescription('Dieser Channel ist kein offenes Ticket.')
              .setColor(0xFF0000)
            ],
            ephemeral: true
          }).catch(() => {});
        }
        setTimeout(() => i.channel.delete().catch(() => {}), 5000);
        return;
      }
      // TICKET CLAIMEN
      if (i.customId === 'ticket_claim') {
        const t = await Ticket.findOne({ channelId: i.channel.id, status: 'open' });
        if (!t) {
          return i.reply({
            embeds: [new EmbedBuilder()
              .setTitle('❌ Kein Ticket')
              .setDescription('Kein offenes Ticket.')
              .setColor(0xFF0000)
            ],
            ephemeral: true
          }).catch(() => {});
        }
        if (t.claimedBy) {
          return i.reply({
            embeds: [new EmbedBuilder()
              .setTitle('⚠️ Schon geclaimt')
              .setDescription(`Schon geclaimt von ${t.claimedByTag}`)
              .setColor(0xFFAA00)
            ],
            ephemeral: true
          }).catch(() => {});
        }
        t.claimedBy = i.user.id;
        t.claimedByTag = i.user.tag;
        await t.save();
        return i.reply({
          embeds: [new EmbedBuilder()
            .setTitle('🙋 Ticket geclaimt!')
            .setDescription(`${i.user} kümmert sich jetzt um dieses Ticket!`)
            .setColor(0x00FF00)
            .setTimestamp()
          ]
        }).catch(() => {});
      }
      // TICKET TRANSCRIPT
      if (i.customId === 'ticket_transcript') {
        const t = await Ticket.findOne({ channelId: i.channel.id });
        if (!t) return i.reply({ content: 'Kein Ticket gefunden.', ephemeral: true }).catch(() => {});
        let txt = `Transcript für ${i.channel.name} - ${new Date().toISOString()}\n\n`;
        try {
          const msgs = await i.channel.messages.fetch({ limit: 100 });
          const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          for (const m of sorted) {
            txt += `[${new Date(m.createdTimestamp).toLocaleString('de-DE')}] ${m.author.tag}: ${m.content || '[Embed/Bild]'}\n`;
          }
        } catch {}
        return i.reply({
          embeds: [new EmbedBuilder()
            .setTitle('📄 Transcript')
            .setDescription('Hier ist das Transcript bis jetzt:')
            .setColor(0x00AAFF)
            .setTimestamp()
          ],
          files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${i.channel.name}.txt` }],
          ephemeral: true
        }).catch(() => {});
      }
    }
    // SELECT MENU - TICKET GRUND
    if (i.isStringSelectMenu() && i.customId === 'ticket_reason') {
      const reasonMap = {
        support: 'Support / Hilfe',
        report: 'User melden',
        bug: 'Bug / Fehler melden',
        bewerbung: 'Bewerbung',
        sonstiges: 'Sonstiges'
      };
      const reason = reasonMap[i.values[0]] || 'Sonstiges';
      await i.deferReply({ ephemeral: true }).catch(() => {});
      const ex = await Ticket.findOne({ guildId: i.guild.id, userId: i.user.id, status: 'open' });
      if (ex) {
        return i.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('❌ Schon ein Ticket')
            .setDescription(`Du hast schon ein Ticket: <#${ex.channelId}>`)
            .setColor(0xFF0000)
          ]
        }).catch(() => {});
      }
      const ch = await createTicketChannel(i.guild, i.user, reason);
      if (!ch) {
        return i.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('❌ Fehler')
            .setDescription('Konnte Ticket nicht erstellen!')
            .setColor(0xFF0000)
          ]
        }).catch(() => {});
      }
      await Ticket.create({
        guildId: i.guild.id,
        userId: i.user.id,
        userTag: i.user.tag,
        channelId: ch.id,
        reason
      });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Schließen').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('🙋 Claimen').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary)
      );
      await ch.send({
        content: `<@${i.user.id}>`,
        embeds: [new EmbedBuilder()
          .setTitle('🎫 Neues Ticket!')
          .setDescription(`Hey ${i.user}!\n\n**Kategorie:** ${reason}\nBitte beschreibe dein Anliegen genau.`)
          .setColor(0x5865F2)
          .setTimestamp()
        ],
        components: [row]
      }).catch(() => {});
      return i.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('✅ Ticket erstellt!')
          .setDescription(`Dein Ticket: ${ch}\n**Grund:** ${reason}`)
          .setColor(0x00FF00)
        ]
      }).catch(() => {});
    }
  } catch (e) {
    console.log('Interaction Fehler:', e.message);
  }
});

// ============================================================================
// JOIN / VOICE / LOGGER
// ============================================================================
client.on('guildMemberAdd', async (member) => {
  try {
    const w = await getWelcome(member.guild.id);
    if (w) {
      const ch = member.guild.channels.cache.get(w.channelId)
        || await member.guild.channels.fetch(w.channelId).catch(() => null);
      if (ch) {
        const txt = w.text
          .replaceAll('{user}', `${member}`)
          .replaceAll('{server}', member.guild.name)
          .replaceAll('{member}', `${member.guild.memberCount}`);
        ch.send({
          embeds: [new EmbedBuilder()
            .setTitle('👋 Willkommen!')
            .setDescription(txt)
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

const voiceJoin = new Map();
client.on('voiceStateUpdate', async (oldS, newS) => {
  try {
    const userId = newS.id || oldS.id;
    const guildId = newS.guild?.id || oldS.guild?.id;
    if (!guildId) return;
    if (!oldS.channelId && newS.channelId) {
      voiceJoin.set(`${guildId}-${userId}`, Date.now());
    }
    if (oldS.channelId && !newS.channelId) {
      const key = `${guildId}-${userId}`;
      const joined = voiceJoin.get(key);
      if (joined) {
        const dur = Date.now() - joined;
        voiceJoin.delete(key);
        let u = await getOrCreateLevel(userId, guildId);
        u.voiceTime += dur;
        const voiceXp = Math.floor(dur / 60000) * 2;
        if (voiceXp > 0) {
          u.xp += voiceXp;
          u.totalXp += voiceXp;
          while (u.xp >= getNeededXp(u.level)) {
            u.xp -= getNeededXp(u.level);
            u.level += 1;
          }
        }
        await u.save();
      }
    }
  } catch {}
});

// ============================================================================
// BENI BOT v6.0 - TEIL 2 / 3
// LEVEL + FUN + GIVEAWAY + ECONOMY + MODERATION
// Fortsetzung von TEIL 1 - Einfach unter TEIL 1 einfügen!
// ============================================================================
// INHALT TEIL 2:
//  - Report System (Wörter, Highlight, Embed)
//  - Main Handler mit Prefix-System
//  - XP System + Messages + Voice XP
//  - AFK System
//  - Prefix Commands (!setprefix / !prefix)
//  - Ticket Commands (!ticketsetup / !ticket / !close / !claim / !add / !remove / !transcript / !tickets)
//  - Mod Commands (!ban / !tempban / !unban / !kick / !mute / !unmute / !warn / !warnings / !unwarn / !clear / !slowmode / !nick)
//  - Level Commands (!rank / !leaderboard / !leveldashboard / !levelups / !setlevelrole / !multiplier / !givexp / !resetxp / !topvoice / !topchat / !daily)
//  - Fun Commands (!coinflip / !8ball / !meme / !poll / !giveaway / !suggest)
// ============================================================================

// ============================================================================
// REPORT SYSTEM - WÖRTER LISTE
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
  "dumm",
  "opfer",
  "hurenkind",
  "fotzenkind",
  "scheisse",
  "scheiße",
  "kacke"
];

// ============================================================================
// REPORT - WÖRTER FINDEN
// ============================================================================
function findReportWords(t) {
  if (!t) return [];
  const l = t.toLowerCase();
  return REPORT_WORDS.filter(w => l.includes(w));
}

// ============================================================================
// REPORT - WÖRTER HIGHLIGHTEN
// ============================================================================
function highlightReportWords(t) {
  let r = t;
  for (const w of REPORT_WORDS) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    r = r.replace(re, `**||${w.toUpperCase()}||**`);
  }
  return r;
}

// ============================================================================
// REPORT - EMBED SENDEN
// ============================================================================
async function sendReportEmbed(guild, reportedUser, reporter, reasonText, channelObj, messageUrl, type) {
  const ids = await getReportChannels(guild.id);
  if (!ids.length) return false;
  const found = findReportWords(reasonText);
  const embed = new EmbedBuilder()
    .setTitle(
      type === 'auto'
        ? '⚠️ BELEIDIGUNG ERKANNT - AUTO REPORT'
        : '🚨 NEUER REPORT'
    )
    .setColor(
      type === 'auto'
        ? 0xFFAA00
        : 0xFF0000
    )
    .addFields(
      {
        name: '👤 Gemeldeter User',
        value: `${reportedUser} - \`${reportedUser.tag || reportedUser.id}\``,
        inline: true
      },
      {
        name: '👮 Gemeldet von',
        value: reporter
          ? `${reporter} - \`${reporter.tag}\``
          : 'Auto-Mod',
        inline: true
      },
      {
        name: '📍 Channel',
        value: `${channelObj}`,
        inline: true
      },
      {
        name: '💬 Nachricht / Grund',
        value: highlightReportWords(reasonText).slice(0, 1000),
        inline: false
      },
      {
        name: '🚫 Markierte Wörter',
        value: found.length
          ? found.map(w => `\`${w}\``).join(', ')
          : 'Kein Wort aus Liste, aber manuell reported',
        inline: false
      },
      {
        name: '🔗 Link',
        value: messageUrl
          ? `[Zur Nachricht springen](${messageUrl})`
          : 'Kein Link',
        inline: false
      }
    )
    .setThumbnail(
      reportedUser.displayAvatarURL
        ? reportedUser.displayAvatarURL()
        : null
    )
    .setFooter({
      text: `User ID: ${reportedUser.id} | Beni Bot Report System`
    })
    .setTimestamp();

  for (const cid of ids) {
    const ch = guild.channels.cache.get(cid)
      || await guild.channels.fetch(cid).catch(() => null);
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
// LOGGER - NACHRICHT BEARBEITET
// ============================================================================
client.on('messageUpdate', async (o, n) => {
  try {
    if (!o.guild || o.author?.bot) return;
    if (o.content === n.content) return;
    const logId = await getLogChannel(o.guild.id);
    if (!logId) return;
    const ch = o.guild.channels.cache.get(logId)
      || await o.guild.channels.fetch(logId).catch(() => null);
    if (!ch) return;
    ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('✏️ Nachricht bearbeitet')
        .addFields(
          {
            name: '👤 User',
            value: `${o.author} - \`${o.author.tag}\``,
            inline: true
          },
          {
            name: '📍 Channel',
            value: `${o.channel}`,
            inline: true
          },
          {
            name: '🔴 VORHER',
            value: o.content?.slice(0, 1000) || '*Leer*',
            inline: false
          },
          {
            name: '🟢 NACHHER',
            value: n.content?.slice(0, 1000) || '*Leer*',
            inline: false
          }
        )
        .setColor(0xFFAA00)
        .setThumbnail(o.author.displayAvatarURL())
        .setFooter({
          text: `User ID: ${o.author.id} | Message ID: ${o.id}`
        })
        .setTimestamp()
      ]
    });
  } catch {}
});

// ============================================================================
// LOGGER - NACHRICHT GELÖSCHT
// ============================================================================
client.on('messageDelete', async (m) => {
  try {
    if (!m.guild || m.author?.bot) return;
    const logId = await getLogChannel(m.guild.id);
    if (!logId) return;
    const ch = m.guild.channels.cache.get(logId)
      || await m.guild.channels.fetch(logId).catch(() => null);
    if (!ch) return;
    ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('🗑️ Nachricht gelöscht')
        .addFields(
          {
            name: '👤 User',
            value: m.author
              ? `${m.author} - \`${m.author.tag}\``
              : 'Unbekannt',
            inline: true
          },
          {
            name: '📍 Channel',
            value: `${m.channel}`,
            inline: true
          },
          {
            name: '💬 Inhalt',
            value: m.content?.slice(0, 1000) || '*Keine Text-Nachricht*',
            inline: false
          }
        )
        .setColor(0xFF0000)
        .setThumbnail(m.author?.displayAvatarURL())
        .setFooter({
          text: `User ID: ${m.author?.id} | Message ID: ${m.id}`
        })
        .setTimestamp()
      ]
    });
  } catch {}
});

// ============================================================================
// MAIN HANDLER - XP COOLDOWN
// ============================================================================
const xpCooldown = new Map();

// ============================================================================
// MAIN HANDLER - MESSAGE CREATE
// ============================================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // ------------------------------------------------------------
  // PREFIX HOLEN
  // ------------------------------------------------------------
  const prefix = await getPrefix(message.guild.id);
  const raw = message.content.trim();
  const isCommand = raw.startsWith(prefix);

  let args = [];
  let command = '';

  if (isCommand) {
    const without = raw.slice(prefix.length).trim();
    args = without.split(/ +/);
    const name = args.shift().toLowerCase();
    command = '!' + name;
  } else {
    args = raw.split(/ +/);
  }

  // ------------------------------------------------------------
  // LOGGER - GESENDETE NACHRICHTEN
  // ------------------------------------------------------------
  try {
    const isLogCommand = isCommand && [
      '!messagelog',
      '!dashboard',
      '!dash',
      '!website',
      '!web'
    ].includes(command);

    if (!isLogCommand) {
      const logId = await getLogChannel(message.guild.id);
      if (logId && message.channel.id !== logId) {
        const logCh = message.guild.channels.cache.get(logId)
          || await message.guild.channels.fetch(logId).catch(() => null);
        if (logCh) {
          logCh.send({
            embeds: [new EmbedBuilder()
              .setTitle('📤 Nachricht gesendet')
              .addFields(
                {
                  name: '👤 User',
                  value: `${message.author} - \`${message.author.tag}\``,
                  inline: true
                },
                {
                  name: '📍 Channel',
                  value: `${message.channel}`,
                  inline: true
                },
                {
                  name: '💬 Inhalt',
                  value: message.content?.slice(0, 1000) || '*Keine Text-Nachricht*',
                  inline: false
                },
                {
                  name: '🔗 Link',
                  value: `[Zur Nachricht springen](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
                  inline: false
                }
              )
              .setColor(0x00AAFF)
              .setThumbnail(message.author.displayAvatarURL())
              .setFooter({
                text: `User ID: ${message.author.id} | Message ID: ${message.id}`
              })
              .setTimestamp()
            ]
          }).catch(() => {});
        }
      }
    }
  } catch {}

  // ------------------------------------------------------------
  // KEIN COMMAND -> AFK + REPORT + XP
  // ------------------------------------------------------------
  if (!isCommand) {
    // AFK - User ist zurück
    const afk = await AFK.findOne({
      guildId: message.guild.id,
      userId: message.author.id
    });
    if (afk) {
      await AFK.findOneAndDelete({
        guildId: message.guild.id,
        userId: message.author.id
      });
      message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('👋 Willkommen zurück!')
          .setDescription(`${message.author} ist wieder da!\nWar AFK wegen: **${afk.reason}**`)
          .setColor(0x00FF00)
          .setTimestamp()
        ]
      }).catch(() => {});
    }

    // AFK - Jemand pingt AFK User
    if (message.mentions.users.size > 0) {
      for (const [, u] of message.mentions.users) {
        const tAfk = await AFK.findOne({
          guildId: message.guild.id,
          userId: u.id
        });
        if (tAfk) {
          message.channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('💤 User ist AFK')
              .setDescription(`${u} ist gerade AFK.\n**Grund:** ${tAfk.reason}`)
              .setColor(0xFFAA00)
              .setTimestamp()
            ]
          }).catch(() => {});
        }
      }
    }

    // AUTO REPORT
    const found = findReportWords(message.content);
    if (found.length) {
      const ids = await getReportChannels(message.guild.id);
      if (!ids.includes(message.channel.id)) {
        await sendReportEmbed(
          message.guild,
          message.author,
          null,
          message.content,
          message.channel,
          message.url,
          'auto'
        );
      }
    }

    // XP SYSTEM
    const key = `${message.guild.id}-${message.author.id}`;
    if (!xpCooldown.has(key) || Date.now() - xpCooldown.get(key) > 60000) {
      xpCooldown.set(key, Date.now());
      try {
        let user = await getOrCreateLevel(message.author.id, message.guild.id);
        user.messages += 1;
        user.lastMessageAt = new Date();

        let mult = 1;
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) {
          const mults = await Multiplier.find({ guildId: message.guild.id });
          for (const m of mults) {
            if (member.roles.cache.has(m.roleId)) {
              mult = Math.max(mult, m.multiplier);
            }
          }
        }

        const gained = Math.floor((Math.floor(Math.random() * 11) + 5) * mult);
        user.xp += gained;
        user.totalXp += gained;

        if (user.xp >= getNeededXp(user.level)) {
          user.xp -= getNeededXp(user.level);
          user.level += 1;
          await user.save();
          if (member) await handleLevelUp(member, user, message.channel);
        } else {
          await user.save();
        }

        // ECONOMY - Coins pro Nachricht
        try {
          await Economy.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { $inc: { coins: 2 } },
            { upsert: true, new: true }
          );
        } catch {}
      } catch (e) {
        console.log('Level Fehler:', e.message);
      }
    } else {
      try {
        await Level.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $inc: { messages: 1 } },
          { upsert: true }
        );
      } catch {}
    }
    return;
  }

  // ------------------------------------------------------------
  // COMMAND -> REACTION + SPEICHERN
  // ------------------------------------------------------------
  await reactStart(message);
  await saveCommand(message, command);

  const getMember = async (idOrMention) => {
    const id = idOrMention?.replace(/[<@!>]/g, '');
    if (!id) return null;
    return message.guild.members.cache.get(id)
      || await message.guild.members.fetch(id).catch(() => null);
  };

  const getUserById = async (id) => {
    const clean = id?.replace(/[<@!>]/g, '');
    if (!clean) return null;
    return client.users.cache.get(clean)
      || await client.users.fetch(clean).catch(() => null);
  };

  // ==========================================================================
  // !setprefix
  // ==========================================================================
  if (command === '!setprefix') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins können den Prefix ändern!');
    }
    const newPrefix = args[0];
    if (!newPrefix) {
      const cur = await getPrefix(message.guild.id);
      return embedReply(
        message,
        '🔤 Aktueller Prefix',
        `Aktueller Prefix ist: \`${cur}\`\n\n**Benutzung:** \`${cur}setprefix ?\`\nDanach heißen alle Commands z.B. \`?ban\`, \`?mute\`, \`?rank\`, \`?ticket\`\n\n**Erlaubt:** \`!\` \`?\` \`.\` \`+\` \`$\` \`>\` \`<\` \`/\` \`*\` \`#\` \`&\` \`=\` \`-\` \`_\``,
        0x5865F2,
        false
      );
    }
    if (newPrefix.length > 3) {
      return fail(message, 'Der Prefix darf maximal 3 Zeichen lang sein! Beispiel: `!setprefix ?`');
    }
    if (newPrefix.includes(' ')) {
      return fail(message, 'Der Prefix darf kein Leerzeichen enthalten!');
    }
    await Prefix.findOneAndUpdate(
      { guildId: message.guild.id },
      { prefix: newPrefix },
      { upsert: true, new: true }
    );
    return success(
      message,
      `Prefix geändert!\n\n**Neuer Prefix:** \`${newPrefix}\`\n\nAb jetzt: \`${newPrefix}help\`, \`${newPrefix}ban\`, \`${newPrefix}rank\`, \`${newPrefix}ticket\` usw.`
    );
  }

  // ==========================================================================
  // !prefix
  // ==========================================================================
  if (command === '!prefix') {
    const cur = await getPrefix(message.guild.id);
    await reactDone(message);
    return embedReply(
      message,
      '🔤 Prefix',
      `Aktueller Prefix auf diesem Server ist: \`${cur}\`\n\nBeispiel: \`${cur}help\` - \`${cur}rank\` - \`${cur}ticket\`\n\nÄndern mit: \`${cur}setprefix ?\``,
      0x00AAFF,
      false
    );
  }

  // ==========================================================================
  // !ticketsetup
  // ==========================================================================
  if (command === '!ticketsetup') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const ch = message.mentions.channels.first() || message.channel;
    const supportRole = message.mentions.roles.first();
    const logCh = message.mentions.channels.at(1);

    await TicketSetup.findOneAndUpdate(
      { guildId: message.guild.id },
      {
        channelId: ch.id,
        supportRoleId: supportRole?.id || null,
        logChannelId: logCh?.id || null
      },
      { upsert: true, new: true }
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('🎫 Ticket erstellen')
        .setStyle(ButtonStyle.Primary)
    );

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_reason')
        .setPlaceholder('📂 Wähle einen Grund aus...')
        .addOptions([
          { label: 'Support / Hilfe', value: 'support', emoji: '🆘' },
          { label: 'User melden', value: 'report', emoji: '🚨' },
          { label: 'Bug / Fehler melden', value: 'bug', emoji: '🐛' },
          { label: 'Bewerbung', value: 'bewerbung', emoji: '📝' },
          { label: 'Sonstiges', value: 'sonstiges', emoji: '💬' }
        ])
    );

    const panel = await ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('🎫 TICKET SYSTEM')
        .setDescription(`Hey! Brauchst du Hilfe?\n\n**Klicke auf den Button** oder wähle unten einen Grund aus, um ein Ticket zu erstellen.\n\nEin Team-Mitglied meldet sich dann so schnell wie möglich bei dir!\n\n> Bitte erstelle kein Ticket aus Spaß!`)
        .setColor(0x5865F2)
        .addFields(
          {
            name: '📂 Kategorien',
            value: '🆘 Support / Hilfe\n🚨 User melden\n🐛 Bug melden\n📝 Bewerbung\n💬 Sonstiges',
            inline: false
          },
          {
            name: '⏰ Antwortzeit',
            value: 'Meist innerhalb von 24h',
            inline: true
          }
        )
        .setThumbnail(message.guild.iconURL())
        .setTimestamp()
      ],
      components: [row, menu]
    });

    await TicketSetup.findOneAndUpdate(
      { guildId: message.guild.id },
      { panelMessageId: panel.id }
    );

    return success(
      message,
      `Ticket-Panel wurde in ${ch} erstellt!${supportRole ? `\nSupport-Rolle: ${supportRole}` : ''}${logCh ? `\nLog-Channel: ${logCh}` : ''}`
    );
  }

  // ==========================================================================
  // !ticket
  // ==========================================================================
  if (command === '!ticket') {
    const ex = await Ticket.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
      status: 'open'
    });
    if (ex) {
      return fail(message, `Du hast schon ein Ticket: <#${ex.channelId}>`);
    }
    const reason = args.join(' ') || 'Über Command erstellt';
    const ch = await createTicketChannel(message.guild, message.author, reason);
    if (!ch) {
      return fail(message, 'Konnte Ticket nicht erstellen!');
    }
    await Ticket.create({
      guildId: message.guild.id,
      userId: message.author.id,
      userTag: message.author.tag,
      channelId: ch.id,
      reason
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Schließen').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('🙋 Claimen').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary)
    );
    await ch.send({
      content: `<@${message.author.id}>`,
      embeds: [new EmbedBuilder()
        .setTitle('🎫 Neues Ticket!')
        .setDescription(`Hey ${message.author}!\n\n**Grund:** ${reason}\nBitte beschreibe dein Anliegen genau.`)
        .setColor(0x5865F2)
        .setTimestamp()
      ],
      components: [row]
    });
    return success(message, `Dein Ticket wurde erstellt: ${ch}\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !close
  // ==========================================================================
  if (command === '!close') {
    const t = await Ticket.findOne({
      channelId: message.channel.id,
      status: 'open'
    });
    if (!t) {
      return fail(message, 'Dieser Channel ist kein offenes Ticket!');
    }
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('🔒 Ticket wird geschlossen...')
        .setDescription(`Geschlossen von ${message.author} - Channel wird in 5 Sekunden gelöscht. Transcript wird gespeichert.`)
        .setColor(0xFF0000)
        .setTimestamp()
      ]
    });
    await closeTicket(message.channel, message.author, message.guild);
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
    return;
  }

  // ==========================================================================
  // !claim
  // ==========================================================================
  if (command === '!claim') {
    const t = await Ticket.findOne({
      channelId: message.channel.id,
      status: 'open'
    });
    if (!t) {
      return fail(message, 'Kein offenes Ticket in diesem Channel!');
    }
    if (t.claimedBy) {
      return fail(message, `Schon geclaimt von ${t.claimedByTag}`);
    }
    t.claimedBy = message.author.id;
    t.claimedByTag = message.author.tag;
    await t.save();
    return success(message, `🙋 ${message.author} kümmert sich jetzt um dieses Ticket!`);
  }

  // ==========================================================================
  // !add / !ticketadd
  // ==========================================================================
  if (command === '!add' || command === '!ticketadd') {
    const t = await Ticket.findOne({
      channelId: message.channel.id,
      status: 'open'
    });
    if (!t) return fail(message, 'Nur in Tickets!');
    const u = message.mentions.members.first()
      || (args[0] ? await getMember(args[0]) : null);
    if (!u) return fail(message, `Benutzung: \`${prefix}add @User\``);
    await message.channel.permissionOverwrites.edit(u, {
      ViewChannel: true,
      SendMessages: true
    });
    return success(message, `${u} wurde zum Ticket hinzugefügt!`);
  }

  // ==========================================================================
  // !remove / !ticketremove
  // ==========================================================================
  if (command === '!remove' || command === '!ticketremove') {
    const t = await Ticket.findOne({
      channelId: message.channel.id,
      status: 'open'
    });
    if (!t) return fail(message, 'Nur in Tickets!');
    const u = message.mentions.members.first()
      || (args[0] ? await getMember(args[0]) : null);
    if (!u) return fail(message, `Benutzung: \`${prefix}remove @User\``);
    await message.channel.permissionOverwrites.edit(u, {
      ViewChannel: false,
      SendMessages: false
    });
    return success(message, `${u} wurde aus dem Ticket entfernt!`);
  }

  // ==========================================================================
  // !transcript
  // ==========================================================================
  if (command === '!transcript') {
    const t = await Ticket.findOne({ channelId: message.channel.id });
    if (!t) return fail(message, 'Kein Ticket in diesem Channel!');
    let txt = `Transcript ${message.channel.name}\n`;
    try {
      const msgs = await message.channel.messages.fetch({ limit: 100 });
      const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      for (const m of sorted) {
        txt += `[${new Date(m.createdTimestamp).toLocaleString('de-DE')}] ${m.author.tag}: ${m.content || '[Embed/Bild]'}\n`;
      }
    } catch {}
    await reactDone(message);
    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle('📄 Transcript')
        .setDescription('Hier ist das Transcript:')
        .setColor(0x00AAFF)
        .setTimestamp()
      ],
      files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${message.channel.name}.txt` }]
    });
  }

  // ==========================================================================
  // !tickets
  // ==========================================================================
  if (command === '!tickets') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Nur Team!');
    }
    const open = await Ticket.find({
      guildId: message.guild.id,
      status: 'open'
    });
    if (!open.length) {
      return embedReply(message, '🎫 Offene Tickets', 'Es gibt gerade **keine** offenen Tickets. 🎉', 0x00FF00, false);
    }
    const list = open.map(t =>
      `<#${t.channelId}> - <@${t.userId}> - **${t.reason}** - Geclaimt: ${t.claimedByTag || 'Niemand'}`
    ).join('\n');
    await reactDone(message);
    return embedReply(message, `🎫 Offene Tickets - ${open.length}`, list, 0x5865F2, false);
  }

  // ==========================================================================
  // !savedids
  // ==========================================================================
  if (command === '!savedids') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const logs = await CommandLog.find({ guildId: message.guild.id })
      .sort({ createdAt: -1 })
      .limit(10);
    if (!logs.length) {
      return embedReply(message, '💾 Gespeicherte IDs', 'Noch keine Commands gespeichert.', 0x00AAFF, false);
    }
    const desc = logs.map(l =>
      `\`${l.command}\` von <@${l.userId}> in <#${l.channelId}>\nUser: \`${l.targetUserId || '-'}\` | Role: \`${l.targetRoleId || '-'}\` | Channel: \`${l.targetChannelId || '-'}\``
    ).join('\n\n');
    await reactDone(message);
    return embedReply(message, '💾 Gespeicherte IDs - Letzte 10', desc, 0x00AAFF, false);
  }

  // ==========================================================================
  // !id - UNSICHTBAR
  // ==========================================================================
if (command === '!id') {
  // Deine !id Nachricht sofort löschen, damit keiner sieht dass du !id benutzt hast
  await message.delete().catch(() => {});

  const target = message.mentions.users.first() || message.author;

  // ID nur per DM - im Channel steht GAR NIX mehr
  try {
    await message.author.send(`Hier zum Kopieren:\n\`${target.id}\``);
  } catch {
    const m = await message.channel.send(`${message.author}, mach deine DMs an, dann schick ich dir die ID privat!`);
    setTimeout(() => m.delete().catch(() => {}), 5000);
  }
  return;
}
  // ==========================================================================
  // !ban
  // ==========================================================================
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Nö, du darfst niemanden bannen!');
    }
    let u = message.mentions.members.first();
    if (!u && args[0]) u = await getMember(args[0]);
    if (!u) {
      return fail(message, `Wen soll ich bannen? Beispiel: \`${prefix}ban @Max nervt\``);
    }
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.bannable) {
      return fail(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    }
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
    return success(message, `${u} wurde von **${message.guild.name}** gebannt.\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !tempban - NEU
  // ==========================================================================
  if (command === '!tempban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Keine Rechte!');
    }
    let u = message.mentions.members.first();
    if (!u && args[0]) u = await getMember(args[0]);
    if (!u) {
      return fail(message, `Benutzung: \`${prefix}tempban @User 1d Grund\``);
    }
    const ms = parseDuration(args[1]);
    if (!ms) {
      return fail(message, `Benutzung: \`${prefix}tempban @User 1d Grund\``);
    }
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    await u.ban({ reason: `Tempban ${formatDuration(ms)} - ${reason}` }).catch(() => {});
    setTimeout(async () => {
      try { await message.guild.bans.remove(u.id); } catch {}
    }, ms);
    return success(message, `${u} wurde von **${message.guild.name}** für **${formatDuration(ms)}** gebannt.\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !unban
  // ==========================================================================
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return fail(message, 'Keine Rechte!');
    }
    const uid = args[0]?.replace(/[<@!>]/g, '');
    if (!uid) {
      return fail(message, `Benutzung: \`${prefix}unban <User-ID>\``);
    }
    try {
      await message.guild.bans.remove(uid);
      const u = await getUserById(uid);
      return success(message, `${u ? `${u}` : `\`${uid}\``} wurde von **${message.guild.name}** entbannt!`);
    } catch {
      return fail(message, 'User nicht gefunden oder nicht gebannt!');
    }
  }

  // ==========================================================================
  // !kick
  // ==========================================================================
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return fail(message, 'Du darfst niemanden kicken!');
    }
    let u = message.mentions.members.first();
    if (!u && args[0]) u = await getMember(args[0]);
    if (!u) {
      return fail(message, `Wen soll ich kicken? \`${prefix}kick @Max nervt\``);
    }
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.kickable) {
      return fail(message, 'Den kann ich nicht kicken!');
    }
    await u.kick(reason);
    return success(message, `**${u.user.tag}** wurde gekickt!\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !clear / !purge
  // ==========================================================================
  if (command === '!clear' || command === '!purge') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten löschen!');
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) {
      return fail(message, `Benutzung: \`${prefix}clear 10\` oder \`${prefix}clear 10 @Max\``);
    }
    const target = message.mentions.members.first()
      || (args[1] ? await getMember(args[1]) : null);
    await message.delete().catch(() => {});
    if (target) {
      const fetched = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (!fetched) return fail(message, 'Konnte Nachrichten nicht laden!');
      const toDel = fetched.filter(m => m.author.id === target.id).first(amount);
      await message.channel.bulkDelete(toDel, true).catch(() => {});
      const r = await message.channel.send({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Erfolgreich!')
          .setDescription(`Sauber! **${toDel.size}** Nachrichten von ${target} weggeputzt!`)
          .setTimestamp()
        ]
      });
      deleteAfter(r, 5000);
      return;
    }
    await message.channel.bulkDelete(amount, true).catch(() => {});
    const r = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Erfolgreich!')
        .setDescription(`Sauber! **${amount}** Nachrichten weggeputzt!`)
        .setTimestamp()
      ]
    });
    deleteAfter(r, 5000);
    return;
  }

  // ==========================================================================
  // !mute / !timeout
  // ==========================================================================
  if (command === '!mute' || command === '!timeout') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du darfst niemanden muten!');
    }
    let u = message.mentions.members.first();
    if (!u && args[0]) u = await getMember(args[0]);
    if (!u) {
      return fail(message, `Wen soll ich muten? \`${prefix}mute @Max 10m spammt\``);
    }
    const ms = parseDuration(args[1]);
    if (!ms) {
      return fail(message, `Wie lange? \`${prefix}mute @Max 10m spammt\``);
    }
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
    return success(message, `${u} wurde für **${formatDuration(ms)}** gemutet.\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !unmute
  // ==========================================================================
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Keine Rechte!');
    }
    let t = message.mentions.members.first();
    if (!t && args[0]) t = await getMember(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}unmute @User\``);
    }
    try {
      await t.timeout(null);
      try {
        await t.send({
          embeds: [new EmbedBuilder()
            .setTitle('🔊 Du wurdest entmutet!')
            .setDescription('Du darfst wieder schreiben.')
            .setColor(0x00FF00)
            .setTimestamp()
          ]
        });
      } catch {}
      return success(message, `${t} wurde entmutet!`);
    } catch {
      return fail(message, 'Konnte User nicht entmuten!');
    }
  }

  // ==========================================================================
  // !warn
  // ==========================================================================
  if (command === '!warn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    let t = message.mentions.members.first();
    if (!t && args[0]) t = await getMember(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}warn @User 10m Grund\` oder \`${prefix}warn @User Grund\``);
    }
    let durStr = null;
    let reason = '';
    const maybeDur = parseDuration(args[1]);
    if (maybeDur) {
      durStr = args[1];
      reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    } else {
      reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    }
    await Warn.create({
      guildId: message.guild.id,
      userId: t.id,
      userTag: t.user.tag,
      reason,
      warnedBy: message.author.id,
      warnedByTag: message.author.tag,
      duration: durStr
    });
    const count = await Warn.countDocuments({
      guildId: message.guild.id,
      userId: t.id
    });
    try {
      await t.send({
        embeds: [new EmbedBuilder()
          .setTitle('⚠️ Du wurdest verwarnt!')
          .setDescription(`Server: **${message.guild.name}**\n**Grund:** ${reason}${durStr ? `\n**Dauer:** ${formatDuration(parseDuration(durStr))}` : ''}\n**Warns insgesamt:** ${count}`)
          .setColor(0xFFAA00)
          .setTimestamp()
        ]
      });
    } catch {}
    return success(
      message,
      `${t} wurde${durStr ? ` für **${formatDuration(parseDuration(durStr))}` : ''} gewarnt.\n**Grund:** ${reason}\n**Warns insgesamt:** ${count}`
    );
  }

  // ==========================================================================
  // !warnings
  // ==========================================================================
  if (command === '!warnings') {
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null)
      || message.author;
    const warns = await Warn.find({
      guildId: message.guild.id,
      userId: t.id
    }).sort({ createdAt: -1 }).limit(10);
    if (!warns.length) {
      await reactDone(message);
      return embedReply(
        message,
        `⚠️ Warns - ${t.username}`,
        `${t} hat **0 Warns**. Sauber! ✅`,
        0x00FF00,
        false
      );
    }
    const list = warns.map((w, i) =>
      `**${i + 1}.** ${w.reason}${w.duration ? ` (Dauer: ${w.duration})` : ''}\nVon: ${w.warnedByTag} • <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:D>`
    ).join('\n\n');
    await reactDone(message);
    return embedReply(
      message,
      `⚠️ Warns - ${t.username}`,
      `${t} hat **${warns.length} Warns**:`,
      0xFFAA00,
      false,
      {
        fields: [{ name: '📋 Liste', value: list.slice(0, 1000), inline: false }]
      }
    );
  }

  // ==========================================================================
  // !unwarn
  // ==========================================================================
  if (command === '!unwarn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    let t = message.mentions.users.first();
    if (!t && args[0]) t = await getUserById(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}unwarn @User\``);
    }
    const last = await Warn.findOne({
      guildId: message.guild.id,
      userId: t.id
    }).sort({ createdAt: -1 });
    if (!last) {
      return fail(message, `${t} hat keine Warns!`);
    }
    await Warn.findByIdAndDelete(last._id);
    return success(message, `Ein Warn von ${t} wurde entfernt!\n**Entfernter Grund war:** ${last.reason}`);
  }

  // ==========================================================================
  // !slowmode
  // ==========================================================================
  if (command === '!slowmode') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst Kanäle verwalten!');
    }
    const sec = parseInt(args[0]);
    if (isNaN(sec) || sec < 0 || sec > 21600) {
      return fail(message, `Benutzung: \`${prefix}slowmode 5\` (0-21600 Sekunden, 0 = aus)`);
    }
    await message.channel.setRateLimitPerUser(sec);
    if (sec === 0) {
      return success(message, 'Slowmode ist jetzt **AUS** in diesem Channel!');
    }
    return success(message, `Slowmode ist jetzt **${sec} Sekunden** in diesem Channel!`);
  }

  // ==========================================================================
  // !nick
  // ==========================================================================
  if (command === '!nick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
      return fail(message, 'Du brauchst Nicknames verwalten!');
    }
    let t = message.mentions.members.first();
    if (!t && args[0]) t = await getMember(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}nick @User NeuerName\``);
    }
    const newNick = args.slice(1).join(' ');
    if (!newNick) {
      return fail(message, `Benutzung: \`${prefix}nick @User NeuerName\``);
    }
    try {
      await t.setNickname(newNick);
      return success(message, `Nickname von ${t} ist jetzt **${newNick}**!`);
    } catch {
      return fail(message, 'Konnte Nickname nicht ändern! Meine Rolle ist zu niedrig.');
    }
  }

  // ==========================================================================
  // LEVEL - !rank
  // ==========================================================================
if (message.content.toLowerCase().startsWith('!rank')) {
  try {
    await message.react('✅').catch(() => {});

    const myData = await Level.findOne({ guildId: message.guild.id, userId: message.author.id });
    if (!myData) {
      const noXpEmbed = new EmbedBuilder()
        .setTitle('🔵 BENI BOT - RANK')
        .setDescription('Du hast noch keine XP!\nSchreib erstmal was im Chat.')
        .setColor('#1a4dff')
        .setThumbnail(message.author.displayAvatarURL());
      return message.channel.send({ embeds: [noXpEmbed] });
    }

    const myXp = myData.xp;
    const myLevel = myData.level;
    const betterCount = await Level.countDocuments({ guildId: message.guild.id, xp: { $gt: myXp } });
    const myRank = betterCount + 1;

    // Messages + Voice Time aus deiner DB - wenn das Feld bei dir anders heißt, hier anpassen
    const messages = myData.messages || myData.messageCount || myData.totalMessages || 0;
    const voiceSeconds = myData.voiceTime || myData.voiceSeconds || myData.totalVoiceTime || 0;
    const voiceHours = Math.floor(voiceSeconds / 3600);
    const voiceMins = Math.floor((voiceSeconds % 3600) / 60);
    const voiceText = voiceHours > 0 ? `${voiceHours}h ${voiceMins}m` : `${voiceMins}m`;

    const xpForNextLevel = 5 * myLevel * myLevel + 50 * myLevel + 100;
    const xpForCurrentLevel = 5 * (myLevel - 1) * (myLevel - 1) + 50 * (myLevel - 1) + 100;
    const progressXp = myXp - xpForCurrentLevel;
    const neededXp = xpForNextLevel - xpForCurrentLevel;
    const percent = Math.max(0, Math.min(100, Math.floor((progressXp / neededXp) * 100)));
    const left = neededXp - progressXp;

    const filled = Math.floor(percent / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

    const embed = new EmbedBuilder()
      .setTitle('🔵 BENI BOT - RANK')
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setThumbnail(message.author.displayAvatarURL())
      .setColor('#1a4dff')
      .addFields(
        { name: '🏆 Rang', value: `#${myRank}`, inline: true },
        { name: '⭐ Level', value: `${myLevel}`, inline: true },
        { name: '✨ XP Gesamt', value: `${myXp} XP`, inline: true },
        { name: '💬 Messages', value: `${messages.toLocaleString('de-DE')}`, inline: true },
        { name: '🎙️ Voice Time', value: `${voiceText}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: `📈 Fortschritt zu Level ${myLevel + 1}`, value: `${bar}\n\`${progressXp} / ${neededXp} XP\` • **${percent}%**\nNoch **${left} XP** bis Level ${myLevel + 1}`, inline: false }
      )
      .setFooter({ text: 'Beni Bot • Schreibe weiter um aufzusteigen!' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

  } catch (err) {
    console.log('RANK FEHLER:', err);
    await message.channel.send('Rank-Fehler, check Render Logs!');
  }
  return;
}
  // ==========================================================================
  // LEVEL - !leaderboard / !lb
  // ==========================================================================
  if (command === '!leaderboard' || command === '!lb') {
    const top = await Level.find({ guildId: message.guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(10);
    if (!top.length) {
      return fail(message, 'Noch keiner auf dem Leaderboard!');
    }
    let desc = '';
    const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < top.length; i++) {
      const u = top[i];
      const m = await message.guild.members.fetch(u.userId).catch(() => null);
      const n = m ? m.user.username : 'Unbekannt';
      desc += `${medals[i] || `**${i + 1}.**`} **${n}** - Level ${u.level} | ${u.xp} XP | 💬 ${u.messages} | 🎙️ ${formatVoice(u.voiceTime)}\n`;
    }
    await reactDone(message);
    return embedReply(
      message,
      `🏆 Leaderboard - ${message.guild.name}`,
      desc,
      0xFFD700,
      false,
      { thumb: message.guild.iconURL() }
    );
  }

  // ==========================================================================
  // LEVEL - !leveldashboard
  // ==========================================================================
  if (command === '!leveldashboard') {
    const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
    const tu = await Level.countDocuments({ guildId: message.guild.id });
    const topU = await Level.findOne({ guildId: message.guild.id }).sort({ level: -1, xp: -1 });
    const tot = await Level.aggregate([
      { $match: { guildId: message.guild.id } },
      { $group: { _id: null, total: { $sum: '$totalXp' }, msgs: { $sum: '$messages' }, voice: { $sum: '$voiceTime' } } }
    ]);
    const lrs = await LevelRole.find({ guildId: message.guild.id }).sort({ level: 1 });
    let topN = 'Niemand';
    if (topU) {
      const m = await message.guild.members.fetch(topU.userId).catch(() => null);
      topN = m ? `${m.user.username} (Level ${topU.level})` : `Level ${topU.level}`;
    }
    const ct = cfg?.levelupChannelId ? `<#${cfg.levelupChannelId}>` : 'Nicht gesetzt';
    const rt = lrs.length
      ? lrs.map(r => `Level ${r.level} -> <@&${r.roleId}>`).join('\n')
      : 'Keine Level-Rollen gesetzt';
    await reactDone(message);
    return embedReply(
      message,
      `📊 Level Dashboard - ${message.guild.name}`,
      'Übersicht über das Level-System',
      0x00AAFF,
      false,
      {
        thumb: message.guild.iconURL(),
        fields: [
          { name: '👥 User mit XP', value: `${tu}`, inline: true },
          { name: '✨ Gesamt XP', value: `${tot[0]?.total || 0}`, inline: true },
          { name: '🏆 Top User', value: topN, inline: true },
          { name: '💬 Gesamt Messages', value: `${tot[0]?.msgs || 0}`, inline: true },
          { name: '🎙️ Gesamt Voice-Time', value: formatVoice(tot[0]?.voice || 0), inline: true },
          { name: '📢 Level-Up Channel', value: ct, inline: false },
          { name: '🎭 Level-Rollen', value: rt, inline: false }
        ]
      }
    );
  }

  // ==========================================================================
  // LEVEL - !levelups / !levelupchannel
  // ==========================================================================
  if (command === '!levelups' || command === '!levelupchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) {
      return fail(message, `Benutzung: \`${prefix}levelups #channel\``);
    }
    await GuildConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { levelupChannelId: ch.id },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetChannelId: ch.id });
    return success(message, `Level-Ups werden jetzt in ${ch} gesendet.`);
  }

  // ==========================================================================
  // LEVEL - !removelevelup
  // ==========================================================================
  if (command === '!removelevelup' || command === '!removelevelupchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    await GuildConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { levelupChannelId: null }
    );
    return success(message, 'Level-Up Channel entfernt. Level-Ups kommen wieder im aktuellen Channel.');
  }

  // ==========================================================================
  // LEVEL - !setlevelrole
  // ==========================================================================
  if (command === '!setlevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const lvl = parseInt(args[0]);
    const role = message.mentions.roles.first();
    if (!lvl || !role) {
      return fail(message, `Benutzung: \`${prefix}setlevelrole 5 @Role\``);
    }
    await LevelRole.findOneAndUpdate(
      { guildId: message.guild.id, level: lvl },
      { roleId: role.id },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Ab **Level ${lvl}** bekommt man jetzt ${role}.`);
  }

  // ==========================================================================
  // LEVEL - !removelevelrole
  // ==========================================================================
  if (command === '!removelevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const lvl = parseInt(args[0]);
    if (!lvl) {
      return fail(message, `Benutzung: \`${prefix}removelevelrole 5\``);
    }
    await LevelRole.findOneAndDelete({ guildId: message.guild.id, level: lvl });
    return success(message, `Für **Level ${lvl}** gibt es jetzt keine Rolle mehr.`);
  }

  // ==========================================================================
  // LEVEL - !multiplier
  // ==========================================================================
  if (command === '!multiplier') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    if (args[0]?.toLowerCase() === 'list') {
      const all = await Multiplier.find({ guildId: message.guild.id });
      if (!all.length) {
        return fail(message, 'Keine Multiplier gesetzt.');
      }
      return embedReply(
        message,
        '✨ XP-Multiplier',
        all.map(m => `<@&${m.roleId}> → **${m.multiplier}x XP**`).join('\n'),
        0xFFAA00,
        false
      );
    }
    const role = message.mentions.roles.first();
    const amt = parseFloat(args[1]);
    if (!role || isNaN(amt)) {
      return fail(message, `Benutzung: \`${prefix}multiplier @Role 2\`\n\`${prefix}multiplier list\``);
    }
    if (amt <= 1) {
      await Multiplier.findOneAndDelete({ guildId: message.guild.id, roleId: role.id });
      return success(message, `Für ${role} gibt es jetzt keinen Multiplier mehr (1x).`);
    }
    await Multiplier.findOneAndUpdate(
      { guildId: message.guild.id, roleId: role.id },
      { multiplier: amt },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `${role} bekommt jetzt **${amt}x XP** bei jeder Nachricht.`);
  }

  // ==========================================================================
  // LEVEL - !resetxp
  // ==========================================================================
  if (command === '!resetxp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}resetxp @User\``);
    }
    await Level.findOneAndUpdate(
      { userId: t.id, guildId: message.guild.id },
      { xp: 0, level: 1, messages: 0, voiceTime: 0, totalXp: 0 },
      { upsert: true, new: true }
    );
    return success(message, `${t} wurde auf **Level 1 | 0 XP** zurückgesetzt.`);
  }

  // ==========================================================================
  // LEVEL - !givexp
  // ==========================================================================
  if (command === '!givexp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins!');
    }
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null);
    const amt = parseInt(args[1]);
    if (!t || isNaN(amt)) {
      return fail(message, `Benutzung: \`${prefix}givexp @User 500\``);
    }
    if (amt <= 0) {
      return fail(message, 'Muss über 0 sein.');
    }
    let u = await getOrCreateLevel(t.id, message.guild.id);
    const old = u.level;
    u.xp += amt;
    u.totalXp += amt;
    let up = false;
    while (u.xp >= getNeededXp(u.level)) {
      u.xp -= getNeededXp(u.level);
      u.level += 1;
      up = true;
    }
    await u.save();
    if (up) {
      const m = await message.guild.members.fetch(t.id).catch(() => null);
      if (m) await handleLevelUp(m, u, message.channel);
    }
    return success(
      message,
      `${t} hat **${amt} XP** erhalten.\nJetzt: **Level ${u.level} | ${u.xp} / ${getNeededXp(u.level)} XP**${u.level > old ? `\n🎉 Level-Up ${old} → ${u.level}!` : ''}`
    );
  }

  // ==========================================================================
  // LEVEL - !topvoice
  // ==========================================================================
  if (command === '!topvoice') {
    const top = await Level.find({ guildId: message.guild.id })
      .sort({ voiceTime: -1 })
      .limit(10);
    if (!top.length) {
      return fail(message, 'Noch keine Voice-Time!');
    }
    let d = '';
    for (let i = 0; i < top.length; i++) {
      const m = await message.guild.members.fetch(top[i].userId).catch(() => null);
      d += `**${i + 1}.** ${m ? m.user.username : 'Unbekannt'} - 🎙️ ${formatVoice(top[i].voiceTime)}\n`;
    }
    await reactDone(message);
    return embedReply(message, `🎙️ Top Voice - ${message.guild.name}`, d, 0x00AAFF, false);
  }

  // ==========================================================================
  // LEVEL - !topchat
  // ==========================================================================
  if (command === '!topchat') {
    const top = await Level.find({ guildId: message.guild.id })
      .sort({ messages: -1 })
      .limit(10);
    if (!top.length) {
      return fail(message, 'Noch keine Messages!');
    }
    let d = '';
    for (let i = 0; i < top.length; i++) {
      const m = await message.guild.members.fetch(top[i].userId).catch(() => null);
      d += `**${i + 1}.** ${m ? m.user.username : 'Unbekannt'} - 💬 ${top[i].messages} Messages\n`;
    }
    await reactDone(message);
    return embedReply(message, `💬 Top Chat - ${message.guild.name}`, d, 0x00FF00, false);
  }

  // ==========================================================================
  // LEVEL - !daily
  // ==========================================================================
  if (command === '!daily') {
    let u = await getOrCreateLevel(message.author.id, message.guild.id);
    const now = new Date();
    if (u.lastDaily && (now - u.lastDaily) < 24 * 60 * 60 * 1000) {
      const left = 24 * 60 * 60 * 1000 - (now - u.lastDaily);
      return fail(message, `Du hast dein Daily schon geholt! In **${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m** wieder.`);
    }
    const reward = 100 + Math.floor(Math.random() * 100);
    u.xp += reward;
    u.totalXp += reward;
    u.lastDaily = now;
    while (u.xp >= getNeededXp(u.level)) {
      u.xp -= getNeededXp(u.level);
      u.level += 1;
    }
    await u.save();
    // Coins dazu
    try {
      await Economy.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { coins: 50 } },
        { upsert: true }
      );
    } catch {}
    return success(
      message,
      `🎁 Daily Belohnung!\nDu hast **${reward} XP** + **50 Coins** erhalten!\nJetzt: **Level ${u.level} | ${u.xp} / ${getNeededXp(u.level)} XP**`
    );
  }

  // ==========================================================================
  // FUN - !coinflip
  // ==========================================================================
  if (command === '!coinflip' || command === '!münze') {
    await reactDone(message);
    const result = Math.random() < 0.5 ? 'Kopf' : 'Zahl';
    return embedReply(
      message,
      `🪙 Coinflip`,
      `Die Münze ist gefallen...\n\n**Ergebnis: ${result}!**`,
      randomColor(),
      false
    );
  }

  // ==========================================================================
  // FUN - !8ball
  // ==========================================================================
  if (command === '!8ball') {
    const frage = args.join(' ');
    if (!frage) {
      return fail(message, `Benutzung: \`${prefix}8ball Werde ich reich?\``);
    }
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
    return embedReply(
      message,
      '🎱 Magic 8Ball',
      '',
      0x5865F2,
      false,
      {
        fields: [
          { name: '❓ Frage', value: frage, inline: false },
          { name: '🎱 Antwort', value: antwort, inline: false }
        ]
      }
    );
  }

  // ==========================================================================
  // FUN - !meme / !witz
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
      'Was ist grün und klopft an die Tür? Ein Klopfsalat! 🥗',
      'Warum können Geister so schlecht lügen? Weil man durch sie hindurchsieht! 👻',
      'Was sagt ein Keks zum anderen? Du bist aber krümelig heute! 🍪'
    ];
    const w = witze[Math.floor(Math.random() * witze.length)];
    await reactDone(message);
    return embedReply(message, '😂 Witz des Tages', w, randomColor(), false);
  }

  // ==========================================================================
  // FUN - !poll / !umfrage
  // ==========================================================================
  if (command === '!poll' || command === '!umfrage') {
    const text = args.join(' ');
    if (!text) {
      return fail(message, `Benutzung: \`${prefix}poll Soll Beni Bot bleiben?\``);
    }
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
    return r;
  }

  // ==========================================================================
  // FUN - !suggest / !vorschlag
  // ==========================================================================
  if (command === '!suggest' || command === '!vorschlag') {
    const text = args.join(' ');
    if (!text) {
      return fail(message, `Benutzung: \`${prefix}suggest Dein Vorschlag\``);
    }
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
    return r;
  }

  // ==========================================================================
  // GIVEAWAY - !giveaway
  // ==========================================================================
  if (command === '!giveaway') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du brauchst Nachrichten verwalten!');
    }
    const timeArg = args[0];
    const prize = args.slice(1).join(' ');
    if (!timeArg || !prize) {
      return fail(message, `Benutzung: \`${prefix}giveaway 10m Nitro\``);
    }
    const ms = parseDuration(timeArg);
    if (!ms) {
      return fail(message, 'Benutze: 10s 10m 1h 1d');
    }
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
      new ButtonBuilder()
        .setCustomId(`giveaway_${gw._id}`)
        .setLabel('🎉 Teilnehmen')
        .setStyle(ButtonStyle.Success)
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
      const fresh = await Giveaway.findById(gw._id);
      await Giveaway.findByIdAndUpdate(gw._id, { ended: true });
      let win = 'Niemand hat teilgenommen 😢';
      if (fresh?.participants?.length) {
        const wid = fresh.participants[Math.floor(Math.random() * fresh.participants.length)];
        win = `<@${wid}> hat **${prize}** gewonnen! 🎉`;
      }
      message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🎉 GIVEAWAY VORBEI!')
          .setDescription(`Das Giveaway **${prize}** ist vorbei!\n\n**Gewinner:** ${win}`)
          .setColor(0xFFD700)
          .setTimestamp()
        ]
      }).catch(() => {});
    }, ms);
    return msg;
  }

  // ==========================================================================
  // ECONOMY - !balance / !coins / !geld
  // ==========================================================================
  if (command === '!balance' || command === '!coins' || command === '!geld' || command === '!money') {
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null)
      || message.author;
    const eco = await Economy.findOne({ userId: t.id, guildId: message.guild.id });
    const coins = eco?.coins || 0;
    const bank = eco?.bank || 0;
    await reactDone(message);
    return embedReply(
      message,
      `💰 Balance - ${t.username}`,
      '',
      0xFFD700,
      false,
      {
        thumb: t.displayAvatarURL(),
        fields: [
          { name: '💰 Coins', value: `${formatNumber(coins)}`, inline: true },
          { name: '🏦 Bank', value: `${formatNumber(bank)}`, inline: true },
          { name: '💎 Gesamt', value: `${formatNumber(coins + bank)}`, inline: true }
        ]
      }
    );
  }

  // ==========================================================================
  // ECONOMY - !pay
  // ==========================================================================
  if (command === '!pay') {
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null);
    const amt = parseInt(args[1]);
    if (!t || isNaN(amt) || amt <= 0) {
      return fail(message, `Benutzung: \`${prefix}pay @User 100\``);
    }
    if (t.id === message.author.id) {
      return fail(message, 'Du kannst dir selbst kein Geld schicken!');
    }
    const sender = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!sender || sender.coins < amt) {
      return fail(message, `Du hast nicht genug Coins! Du hast nur **${sender?.coins || 0}** Coins.`);
    }
    await Economy.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { coins: -amt } },
      { upsert: true }
    );
    await Economy.findOneAndUpdate(
      { userId: t.id, guildId: message.guild.id },
      { $inc: { coins: amt } },
      { upsert: true }
    );
    return success(message, `Du hast **${amt} Coins** an ${t} geschickt! 💸`);
  }

  // ==========================================================================
  // ECONOMY - !work
  // ==========================================================================
  if (command === '!work' || command === '!arbeiten') {
    const jobs = [
      'Du hast als Programmierer gearbeitet und 150 Coins verdient! 💻',
      'Du hast im Supermarkt gearbeitet und 80 Coins verdient! 🛒',
      'Du hast als Lehrer gearbeitet und 120 Coins verdient! 👨‍🏫',
      'Du hast als Streamer gearbeitet und 200 Coins verdient! 🎮',
      'Du hast als Koch gearbeitet und 90 Coins verdient! 👨‍🍳'
    ];
    const reward = 50 + Math.floor(Math.random() * 150);
    const jobText = jobs[Math.floor(Math.random() * jobs.length)];
    await Economy.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { coins: reward } },
      { upsert: true }
    );
    await reactDone(message);
    return embedReply(
      message,
      '💼 Arbeiten',
      `${jobText}\n\n**Belohnung:** ${reward} Coins`,
      0x00FF00,
      false
    );
  }

  // ==========================================================================
  // ECONOMY - !deposit / !withdraw
  // ==========================================================================
  if (command === '!deposit' || command === '!dep') {
    const amt = parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) {
      return fail(message, `Benutzung: \`${prefix}deposit 100\``);
    }
    const eco = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!eco || eco.coins < amt) {
      return fail(message, `Du hast nicht genug Coins! Du hast nur **${eco?.coins || 0}**.`);
    }
    await Economy.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { coins: -amt, bank: amt } }
    );
    return success(message, `**${amt} Coins** in die Bank eingezahlt! 🏦`);
  }

  if (command === '!withdraw' || command === '!with') {
    const amt = parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) {
      return fail(message, `Benutzung: \`${prefix}withdraw 100\``);
    }
    const eco = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!eco || eco.bank < amt) {
      return fail(message, `Du hast nicht genug in der Bank! Du hast nur **${eco?.bank || 0}**.`);
    }
    await Economy.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { coins: amt, bank: -amt } }
    );
    return success(message, `**${amt} Coins** aus der Bank abgehoben! 💰`);
  }



          // ============================================================================
// BENI BOT v6.0 - TEIL 3 / 3 - FINAL
// STATS + WELCOME + REPORT + BEWERBUNG + HELP + LOGIN
// Fortsetzung von TEIL 2 - Einfach unter TEIL 2 einfügen!
// ============================================================================
// INHALT TEIL 3:
//  - User Commands (!sendmessage / !dm anonym / !sag / !lock / !unlock / !lockall / !unlockall / !avatar / !banner / !history / !userinfo / !afk)
//  - Bewerbung (!Bewerbungstext / !application / !mod)
//  - Stats (!stats / !as / !dashboard / !messagelog / !partnership / !editwm / !enablewm / !disablewm / !savedids / !serverinfo / !uptime / !invite)
//  - Blacklist (!addblrole / !removeblrole / !blacklist / !free)
//  - Reminder (!remember / !remind / !reminder)
//  - Report Commands (!addchannelreport / !removechannelreport / !reportchannelstatus / !report)
//  - JoinRole (!joinrole / !removejoinrole)
//  - Fun Rest (!ping / !hallo / !owner / !distanze / !rules)
//  - Help (!help)
//  - Login + Self-Healing + Watchdog
//  - ENDE - 3100+ Zeilen komplett!
// ============================================================================

  // ==========================================================================
  // USER - !sendmessage
  // ==========================================================================
  if (command === '!sendmessage') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine Nachrichten in andere Channels schicken!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) {
      return fail(message, `In welchen Channel denn? Beispiel: \`${prefix}sendmessage #allgemein Hallo Leute!\``);
    }
    const text = args.slice(1).join(' ');
    if (!text) {
      return fail(message, 'Und was soll ich schreiben? Der Text fehlt!');
    }
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
  // USER - !dm - ANONYM!
  // ==========================================================================
  if (command === '!dm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return fail(message, 'Du darfst keine DMs schicken!');
    }
    let u = message.mentions.members.first();
    if (!u && args[0]) u = await getMember(args[0]);
    if (!u) {
      return fail(message, `Wem soll ich schreiben? Beispiel: \`${prefix}dm @Max Hey!\``);
    }
    const text = args.slice(1).join(' ');
    if (!text) {
      return fail(message, 'Was soll ich dem denn schreiben?');
    }
    try {
      await u.send({
        embeds: [new EmbedBuilder()
          .setTitle('📩 Neue Nachricht')
          .setDescription(text)
          .setColor(0x5865F2)
          .addFields(
            {
              name: '🏠 Server',
              value: message.guild.name,
              inline: true
            }
          )
          .setTimestamp()
        ]
      });
      return success(message, `Anonyme DM ist raus an **${u.user.tag}**!`);
    } catch {
      return fail(message, `Uff, ich konnte **${u.user.tag}** keine DM schicken. DMs sind zu!`);
    }
  }

  // ==========================================================================
  // USER - !sag
  // ==========================================================================
  if (command === '!sag') {
    const text = args.join(' ');
    if (!text) {
      return fail(message, `Schreib so: \`${prefix}sag Hallo Leute\``);
    }
    await reactDone(message);
    await message.delete().catch(() => {});
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setDescription(text)
        .setColor(0x5865F2)
        .setTimestamp()
      ]
    });
    return;
  }

  // ==========================================================================
  // CHANNEL - !lock
  // ==========================================================================
  if (command === '!lock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht sperren!');
    }
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: false }
    );
    return success(message, 'Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben.');
  }

  // ==========================================================================
  // CHANNEL - !unlock
  // ==========================================================================
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du darfst den Channel nicht entsperren!');
    }
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { SendMessages: true }
    );
    return success(message, 'Wieder offen! Ihr dürft hier wieder schreiben!');
  }

  // ==========================================================================
  // CHANNEL - !lockall / !unlockall
  // ==========================================================================
  if (command === '!lockall' || command === '!unlockall') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst Kanäle verwalten!');
    }
    const val = command === '!lockall' ? false : true;
    let count = 0;
    const textChannels = message.guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText
    );
    for (const [, ch] of textChannels) {
      try {
        await ch.permissionOverwrites.edit(
          message.guild.roles.everyone,
          { SendMessages: val }
        );
        count++;
      } catch {}
    }
    if (val) {
      return success(message, `Alle **${count}** Channels wieder entsperrt! 🔓`);
    } else {
      return success(message, `Alle **${count}** Channels gesperrt! 🔒`);
    }
  }

  // ==========================================================================
  // USER - !avatar
  // ==========================================================================
  if (command === '!avatar') {
    const t = message.mentions.users.first() || message.author;
    const url = t.displayAvatarURL({
      size: 1024,
      extension: 'png',
      forceStatic: false
    });
    await reactDone(message);
    return embedReply(
      message,
      `🖼️ Avatar von ${t.username}`,
      '',
      0x5865F2,
      false,
      {
        image: url,
        fields: [
          {
            name: '👤 User',
            value: `${t} - \`${t.tag}\``,
            inline: true
          },
          {
            name: '🆔 ID',
            value: `\`${t.id}\``,
            inline: true
          },
          {
            name: '🔗 Link',
            value: `[Avatar öffnen](${url})`,
            inline: false
          }
        ]
      }
    );
  }

  // ==========================================================================
  // USER - !banner
  // ==========================================================================
  if (command === '!banner') {
    const t = message.mentions.users.first() || message.author;
    const f = await client.users.fetch(t.id, { force: true }).catch(() => t);
    const url = f.bannerURL({ size: 1024, extension: 'png' });
    if (!url) {
      return fail(message, `${t.username} hat **kein Banner** gesetzt!`);
    }
    await reactDone(message);
    return embedReply(
      message,
      `🖼️ Banner von ${t.username}`,
      '',
      0x5865F2,
      false,
      {
        image: url,
        fields: [
          {
            name: '👤 User',
            value: `${t} - \`${t.tag}\``,
            inline: true
          },
          {
            name: '🆔 ID',
            value: `\`${t.id}\``,
            inline: true
          }
        ]
      }
    );
  }

  // ==========================================================================
  // USER - !history - Letzte 20 Nachrichten
  // ==========================================================================
  if (command === '!history') {
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null)
      || message.author;
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
      const tcs = message.guild.channels.cache.filter(
        c => c.isTextBased() && c.viewable
      );
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
      const list = last20.map((m, i) =>
        `**${i + 1}.** ${m.channel} • <t:${Math.floor(m.createdTimestamp / 1000)}:R>\n> ${(m.content || '*Bild / Datei*').slice(0, 80).replace(/\n/g, ' ')}\n> [Zur Nachricht](${m.url})`
      ).join('\n\n');
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
  // USER - !userinfo / !user
  // ==========================================================================
  if (command === '!userinfo' || command === '!user') {
    const t = message.mentions.users.first()
      || (args[0] ? await getUserById(args[0]) : null)
      || message.author;
    const m = message.guild.members.cache.get(t.id)
      || await message.guild.members.fetch(t.id).catch(() => null);
    const lvl = await Level.findOne({ userId: t.id, guildId: message.guild.id });
    const eco = await Economy.findOne({ userId: t.id, guildId: message.guild.id });
    await reactDone(message);
    return embedReply(
      message,
      `👤 Userinfo - ${t.username}`,
      `Alle Infos zu ${t}`,
      0x5865F2,
      false,
      {
        thumb: t.displayAvatarURL(),
        fields: [
          {
            name: '🆔 ID',
            value: `\`${t.id}\``,
            inline: true
          },
          {
            name: '📅 Account erstellt',
            value: `<t:${Math.floor(t.createdTimestamp / 1000)}:D>`,
            inline: true
          },
          {
            name: '📅 Server beigetreten',
            value: m?.joinedTimestamp
              ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>`
              : 'Unbekannt',
            inline: true
          },
          {
            name: '🎭 Rollen',
            value: m
              ? m.roles.cache.filter(r => r.id !== message.guild.id).map(r => `${r}`).join(' ') || 'Keine'
              : 'Unbekannt',
            inline: false
          },
          {
            name: '🤖 Bot?',
            value: t.bot ? 'Ja' : 'Nein',
            inline: true
          },
          {
            name: '🏆 Level',
            value: lvl ? `Level ${lvl.level} | ${lvl.xp} XP` : 'Noch kein Level',
            inline: true
          },
          {
            name: '💬 Messages',
            value: `${lvl?.messages || 0}`,
            inline: true
          },
          {
            name: '🎙️ Voice-Time',
            value: formatVoice(lvl?.voiceTime || 0),
            inline: true
          },
          {
            name: '💰 Coins',
            value: `${formatNumber(eco?.coins || 0)}`,
            inline: true
          }
        ]
      }
    );
  }

  // ==========================================================================
  // USER - !afk
  // ==========================================================================
  if (command === '!afk') {
    const reason = args.join(' ') || 'Bin kurz weg';
    await AFK.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      { reason },
      { upsert: true, new: true }
    );
    return success(
      message,
      `Du bist jetzt **AFK**!\n**Grund:** ${reason}\nWenn dich jemand pingt, sage ich Bescheid.`,
      false
    );
  }

  // ==========================================================================
  // BEWERBUNG - !Bewerbungstext / !addapplicationtext
  // ==========================================================================
  if (command === '!bewerbungstext' || command === '!addapplicationtext') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Nur Admins können den Bewerbungstext setzen!');
    }
    const text = args.join(' ');
    if (!text) {
      return fail(message, `Benutzung: \`${prefix}Bewerbungstext Dein Bewerbungstext hier...\``);
    }
    if (text.toLowerCase() === 'delete' || text.toLowerCase() === 'löschen') {
      await AppText.findOneAndDelete({ guildId: message.guild.id });
      return success(message, 'Bewerbungstext wurde gelöscht!', false);
    }
    await AppText.findOneAndUpdate(
      { guildId: message.guild.id },
      { text, createdBy: message.author.tag },
      { upsert: true, new: true }
    );
    await reactDone(message);
    return embedReply(
      message,
      '✅ Bewerbungstext gespeichert!',
      text,
      0x00FF00,
      false,
      {
        fields: [
          {
            name: '👀 Ansehen mit',
            value: `\`${prefix}Mod\` oder \`${prefix}application\``,
            inline: true
          },
          {
            name: '🗑️ Löschen mit',
            value: `\`${prefix}Bewerbungstext delete\``,
            inline: true
          }
        ]
      }
    );
  }

  // ==========================================================================
  // BEWERBUNG - !application
  // ==========================================================================
  if (command === '!application') {
    const data = await AppText.findOne({ guildId: message.guild.id });
    if (!data) {
      return fail(message, `Es ist noch kein Bewerbungstext gesetzt!\nAdmin: \`${prefix}Bewerbungstext Dein Text\``);
    }
    await reactDone(message);
    return embedReply(
      message,
      `📝 Bewerbung - ${message.guild.name}`,
      data.text,
      0x5865F2,
      false,
      {
        fields: [
          {
            name: '👤 Erstellt von',
            value: data.createdBy || 'Unbekannt',
            inline: true
          },
          {
            name: '📅 Erstellt am',
            value: `<t:${Math.floor(new Date(data.createdAt).getTime() / 1000)}:D>`,
            inline: true
          }
        ]
      }
    );
  }

  // ==========================================================================
  // BEWERBUNG + MOD - !mod
  // Ohne Argument = Bewerbungstext zeigen
  // Mit @User + Text = Mod schreibt User an
  // ==========================================================================
  if (command === '!mod') {
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
      return embedReply(
        message,
        '👮 Mod-Nachricht gesendet',
        `Deine Nachricht wurde an ${target} gesendet:\n\n> ${text}`,
        0x00FF00,
        false
      );
    }
    const data = await AppText.findOne({ guildId: message.guild.id });
    if (data) {
      await reactDone(message);
      return embedReply(
        message,
        `📝 Bewerbungstext - ${message.guild.name}`,
        data.text,
        0x5865F2,
        false,
        {
          fields: [
            {
              name: '👤 Erstellt von',
              value: data.createdBy || 'Unbekannt',
              inline: true
            }
          ]
        }
      );
    }
    const mods = message.guild.members.cache.filter(m =>
      !m.user.bot &&
      (
        m.permissions.has(PermissionsBitField.Flags.ModerateMembers) ||
        m.permissions.has(PermissionsBitField.Flags.Administrator) ||
        m.permissions.has(PermissionsBitField.Flags.BanMembers) ||
        m.permissions.has(PermissionsBitField.Flags.KickMembers)
      )
    );
    const list = mods.size
      ? [...mods.values()].slice(0, 20).map(m => `${m} - \`${m.user.tag}\``).join('\n')
      : 'Keine Mods gefunden.';
    return embedReply(
      message,
      `👮 Mod-Team - ${message.guild.name}`,
      list,
      0x5865F2,
      false,
      {
        fields: [
          { name: '📊 Anzahl', value: `${mods.size} Mods`, inline: true },
          {
            name: '💡 Benutzung',
            value: `\`${prefix}mod @User Deine Nachricht\` = Mod schreibt User an\n\`${prefix}mod\` = Bewerbungstext ansehen`,
            inline: false
          }
        ]
      }
    );
  }

  // ==========================================================================
  // STATS - !serverinfo / !server
  // ==========================================================================
  if (command === '!serverinfo' || command === '!server') {
    const g = message.guild;
    await reactDone(message);
    return embedReply(
      message,
      `🏠 Serverinfo - ${g.name}`,
      'Alle Infos zu diesem Server',
      0x00AAFF,
      false,
      {
        thumb: g.iconURL(),
        fields: [
          { name: '🆔 ID', value: `\`${g.id}\``, inline: true },
          { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
          { name: '👥 Member', value: `${g.memberCount}`, inline: true },
          { name: '📅 Erstellt', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
          { name: '🎭 Rollen', value: `${g.roles.cache.size}`, inline: true },
          { name: '🔤 Prefix', value: `\`${prefix}\``, inline: true }
        ]
      }
    );
  }

  // ==========================================================================
  // STATS - !ping
  // ==========================================================================
  if (command === '!ping') {
    await reactDone(message);
    return embedReply(
      message,
      '🏓 Pong!',
      `Ping: **${client.ws.ping}ms**\nBenutze \`${prefix}help\` für mehr Infos`,
      0x00FF00,
      false
    );
  }

  // ==========================================================================
  // FUN - !hallo
  // ==========================================================================
  if (command === '!hallo') {
    await reactDone(message);
    return embedReply(message, '👋 Hallo!', 'Wie gehts! 👋', 0x00FF00, false);
  }

  // ==========================================================================
  // INFO - !owner
  // ==========================================================================
  if (command === '!owner') {
    await reactDone(message);
    return embedReply(
      message,
      '👑 DER ERSTELLER VON BENI BOT',
      '**Elyias**',
      0xFFD700,
      false,
      {
        fields: [
          { name: '👤 Name', value: 'Elyias', inline: true },
          { name: '🤖 Was kann er?', value: 'Er kann Bots erstellen!', inline: true },
          { name: '🛡️ Moderator', value: 'Er ist ein guter Moderator!', inline: false },
          { name: '💡 Fun Fact', value: 'Ohne Elyias gäbe es Beni Bot nicht!', inline: false }
        ]
      }
    );
  }

  // ==========================================================================
  // INFO - !distanze / !distanz
  // ==========================================================================
  if (command === '!distanze' || command === '!distanz') {
    await reactDone(message);
    return embedReply(
      message,
      'DISTANZE!',
      `Wir **${message.guild.name}** distanzieren uns von der gesagten Aussage und unterstützen sie nicht!`,
      0xFF0000,
      false,
      { thumb: message.guild.iconURL() }
    );
  }

  // ==========================================================================
  // INFO - !rules / !regeln
  // ==========================================================================
  if (command === '!rules' || command === '!regeln') {
    await reactDone(message);
    return embedReply(
      message,
      `📜 Regeln - ${message.guild.name}`,
      'Bitte halte dich an diese Regeln:',
      0xFF0000,
      false,
      {
        fields: [
          { name: '1️⃣ Respekt', value: 'Beleidige niemanden, bleib freundlich.', inline: false },
          { name: '2️⃣ Kein Spam', value: 'Kein Spam, keine Werbung ohne Erlaubnis.', inline: false },
          { name: '3️⃣ Kein NSFW', value: 'Keine NSFW-Inhalte.', inline: false },
          { name: '4️⃣ Mods haben das letzte Wort', value: 'Anweisungen vom Mod-Team befolgen.', inline: false }
        ]
      }
    );
  }

  // ==========================================================================
  // INFO - !uptime
  // ==========================================================================
  if (command === '!uptime') {
    const up = process.uptime();
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    const s = Math.floor(up % 60);
    await reactDone(message);
    return embedReply(
      message,
      '⏱️ Uptime',
      `Beni Bot läuft schon seit:\n\n**${h}h ${m}m ${s}s**\n\nOhne Absturz! 💪`,
      0x00FF00,
      false
    );
  }

  // ==========================================================================
  // INFO - !invite
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
      new ButtonBuilder()
        .setLabel('➕ Bot einladen')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
      new ButtonBuilder()
        .setLabel('💬 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/7gqzytC3SH')
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ==========================================================================
  // WELCOME - !enablewm / !disablewm
  // ==========================================================================
  if (command === '!enablewm' || command === '!disablewm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst **Kanäle verwalten**!');
    }
    if (command === '!enablewm') {
      const ch = message.mentions.channels.first()
        || message.guild.channels.cache.get(args[0]);
      if (!ch) {
        return fail(message, `Benutze: \`${prefix}enablewm #channel\``);
      }
      await WelcomeConfig.findOneAndUpdate(
        { guildId: message.guild.id },
        { channelId: ch.id },
        { upsert: true, new: true }
      );
      await saveCommand(message, command, { targetChannelId: ch.id });
      return success(message, `Welcome Message AN! Neue Mitglieder werden jetzt in ${ch} begrüßt!`);
    } else {
      const ex = await WelcomeConfig.findOne({ guildId: message.guild.id });
      if (!ex) {
        return fail(message, 'Welcome Message war schon aus.');
      }
      await WelcomeConfig.findOneAndDelete({ guildId: message.guild.id });
      return success(message, 'Welcome Message AUS! Neue Mitglieder werden nicht mehr begrüßt.');
    }
  }

  // ==========================================================================
  // WELCOME - !editwm
  // ==========================================================================
  if (command === '!editwm') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return fail(message, 'Du brauchst **Kanäle verwalten**!');
    }
    const txt = args.join(' ');
    if (!txt) {
      return fail(message, `Benutzung: \`${prefix}editwm Willkommen {user} auf {server}!\` - Platzhalter: {user} {server} {member}`);
    }
    await WelcomeConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { text: txt },
      { upsert: true, new: true }
    );
    return success(message, `Welcome-Text gesetzt:\n\n> ${txt}`);
  }

  // ==========================================================================
  // DASHBOARD - !dashboard / !dash / !website / !web
  // ==========================================================================
  if (command === '!dashboard' || command === '!dash' || command === '!website' || command === '!web') {
    await reactDone(message);
    const embed = new EmbedBuilder()
      .setTitle('🌐 BENI BOT - OFFICIAL DASHBOARD')
      .setDescription('Willkommen im offiziellen Dashboard von **Beni Bot**!\n\nHier kannst du alles rund um Beni Bot sehen, testen und verwalten.\nDas Dashboard ist **100% kostenlos**.\n\n👇 **Klick unten auf den Link!**')
      .addFields(
        {
          name: '🔗 DASHBOARD LINK',
          value: '[**➡️ KLICKE HIER - BENI BOT DASHBOARD ÖFFNEN ⬅️**](https://beni-bot-dashboard.netlify.app/)\n\n`https://beni-bot-dashboard.netlify.app/`',
          inline: false
        },
        {
          name: '📜 WAS KANNST DU MACHEN?',
          value: '🔒 **Mit Discord einloggen**\n📜 **Alle Commands sehen**\n🎮 **Live Chat Simulator**\n🕹️ **Mini-Game spielen**\n⭐ **Bot bewerten**',
          inline: false
        },
        {
          name: '📊 STATS',
          value: '• **Uptime:** 99.9%\n• **Ping:** Schnell & Stabil\n• **Version:** v6.0\n• **Status:** Online',
          inline: true
        },
        {
          name: '👑 MADE BY',
          value: '**Elyias**\nFounder & Developer',
          inline: true
        }
      )
      .setColor(0x00AAFF)
      .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
      .setFooter({ text: 'BENI BOT • Dashboard • Made by Elyias', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Dashboard öffnen')
        .setStyle(ButtonStyle.Link)
        .setURL('https://beni-bot-dashboard.netlify.app/'),
      new ButtonBuilder()
        .setLabel('➕ Bot hinzufügen')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/oauth2/authorize?client_id=1568252045574668298&permissions=8&scope=bot%20applications.commands'),
      new ButtonBuilder()
        .setLabel('💬 Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/7gqzytC3SH')
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ==========================================================================
  // LOG - !messagelog
  // ==========================================================================
  if (command === '!messagelog') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    if (args[0]?.toLowerCase() === 'off') {
      const ex = await LogConfig.findOne({ guildId: message.guild.id });
      if (!ex) {
        return embedReply(
          message,
          '⚠️ MESSAGE LOG - NICHT AKTIV',
          `Message Log war gar nicht aktiviert.\nAktiviere es mit: \`${prefix}messagelog #channel\``,
          0xFFAA00,
          false
        );
      }
      await LogConfig.findOneAndDelete({ guildId: message.guild.id });
      return embedReply(
        message,
        '❌ MESSAGE LOG DEAKTIVIERT',
        'Es werden ab jetzt **keine** Nachrichten mehr geloggt.',
        0xFF0000,
        false
      );
    }
    if (args[0]?.toLowerCase() === 'status') {
      const cur = await getLogChannel(message.guild.id);
      if (!cur) {
        return embedReply(
          message,
          '⚠️ MESSAGE LOG',
          `Message Log ist **nicht** aktiviert.\nAktiviere mit: \`${prefix}messagelog #channel\``,
          0xFFAA00,
          false
        );
      }
      return embedReply(
        message,
        '✅ MESSAGE LOG AKTIV',
        `Message Log ist aktiv in: <#${cur}>`,
        0x00FF00,
        false
      );
    }
    const tc = message.mentions.channels.first();
    if (!tc) {
      return fail(message, `Benutzung: \`${prefix}messagelog #logs\``);
    }
    if (!tc.permissionsFor(message.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
      return fail(message, `Ich kann in ${tc} keine Nachrichten senden!`);
    }
    await LogConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { channelId: tc.id },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetChannelId: tc.id });
    return embedReply(
      message,
      '✅ MESSAGE LOG AKTIVIERT',
      `Alle Nachrichten werden jetzt in ${tc} geloggt.\n\n**Wird geloggt:** Gesendet, Bearbeitet, Gelöscht`,
      0x00FF88,
      false
    );
  }

  // ==========================================================================
  // PARTNERSHIP - !partnership
  // ==========================================================================
  if (command === '!partnership') {
    let link = args[0];
    if (!link) {
      return fail(message, `Benutzung: \`${prefix}partnership https://discord.gg/deinserver\``);
    }
    let code = link
      .replace('https://discord.gg/', '')
      .replace('http://discord.gg/', '')
      .replace('discord.gg/', '')
      .replace('https://discord.com/invite/', '')
      .split('/')[0]
      .split('?')[0];
    let inv = null;
    try { inv = await client.fetchInvite(code); } catch {}
    const gn = inv?.guild?.name || message.guild.name;
    const mc = inv?.approximate_member_count || message.guild.memberCount;
    const oc = inv?.approximate_presence_count || '???';
    const gi = inv?.guild?.iconURL({ size: 512 })
      || message.guild.iconURL({ size: 512 })
      || client.user.displayAvatarURL();
    const gd = inv?.guild?.description || 'Ein cooler Discord Server - Join uns!';
    const texts = [
      `🔥 **NEUE PARTNERSCHAFT!** 🔥\n\n**🌟 ${gn}**\n> ${gd}\n\n👥 **${mc}** Member | 🟢 **${oc}** online\n\n**👉 JOINE JETZT:**\n${link}`,
      `✨ **PARTNERSCHAFT** ✨\n\n**💎 ${gn}**\n> *${gd}*\n\n**🔗 Server:**\n${link}`,
      `🤝 **OFFIZIELLE PARTNERSCHAFT** 🤝\n\n**🏆 ${gn}**\n\n${gd}\n\n👥 **${mc}** | 🟢 **${oc}**\n\n**🔗 Einladung:**\n${link}`
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
      new ButtonBuilder()
        .setLabel(`🚀 ${gn} joinen`)
        .setStyle(ButtonStyle.Link)
        .setURL(link.startsWith('http') ? link : `https://${link}`),
      new ButtonBuilder()
        .setLabel('💬 Support')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/7gqzytC3SH')
    );
    await reactDone(message);
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('🎉 Neue Partnerschaft!')
        .setDescription('Siehe unten!')
        .setColor(0xFF00AA)
        .setTimestamp()
      ]
    });
    await message.channel.send({ embeds: [embed], components: [row] });
    return message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle('📋 KOPIER-TEXT')
        .setDescription(`\`\`\`\n${rt.replace(/\*\*/g, '')}\n\`\`\``)
        .setColor(0x00AAFF)
        .setTimestamp()
      ]
    });
  }

  // ==========================================================================
  // STATS - !stats / !as
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
      const top = [...client.guilds.cache.values()]
        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        .slice(0, 5)
        .map((g, i) => `**${i + 1}.** ${g.name} - ${g.memberCount} User`)
        .join('\n') || 'Keine Server';
      e.addFields({ name: '🏆 Top 5 Server', value: top, inline: false });
    }
    return message.reply({ embeds: [e] });
  }

  // ==========================================================================
  // BLACKLIST - !addblrole
  // ==========================================================================
  if (command === '!addblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return fail(message, 'Du brauchst Manage Roles!');
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return fail(message, `Benutzung: \`${prefix}addblrole @role\``);
    }
    await BlacklistRoleConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { roleId: role.id },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Blacklist Role ist jetzt: ${role}`);
  }

  // ==========================================================================
  // BLACKLIST - !removeblrole
  // ==========================================================================
  if (command === '!removeblrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return fail(message, 'Du brauchst Manage Roles!');
    }
    await BlacklistRoleConfig.findOneAndDelete({ guildId: message.guild.id });
    return success(message, 'Blacklist Role entfernt!');
  }

  // ==========================================================================
  // BLACKLIST - !blacklist
  // ==========================================================================
  if (command === '!blacklist') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    let t = message.mentions.members.first();
    if (!t && args[0]) t = await getMember(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}blacklist @member Grund\``);
    }
    if (t.id === message.author.id) {
      return fail(message, 'Du kannst dich nicht selbst blacklisten!');
    }
    let blId = await getBlacklistRoleId(message.guild.id);
    let bl = blId
      ? message.guild.roles.cache.get(blId)
      : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    if (!bl) {
      try {
        bl = await message.guild.roles.create({
          name: 'Blacklist',
          color: 0x000000,
          reason: 'Auto created Blacklist Role'
        });
      } catch {
        return fail(message, 'Konnte Blacklist Role nicht erstellen!');
      }
    }
    const old = t.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.id);
    await BlacklistData.findOneAndUpdate(
      { guildId: message.guild.id, userId: t.id },
      { oldRoles: old },
      { upsert: true, new: true }
    );
    try {
      await t.roles.remove(old).catch(() => {});
      await t.roles.add(bl).catch(() => {});
      await t.timeout(28 * 24 * 60 * 60 * 1000, 'Blacklisted').catch(() => {});
    } catch {
      return fail(message, 'Fehler!');
    }
    const reason = args.slice(1).join(' ') || 'No reason';
    await reactDone(message);
    return embedReply(
      message,
      '⛔ User Blacklisted',
      `${t} wurde geblacklistet.\n\n**Grund:** ${reason}\n**Alle Rollen entfernt**\n**Timeout:** 28 Tage\n**Rolle:** ${bl}`,
      0x000000,
      false
    );
  }

  // ==========================================================================
  // BLACKLIST - !free
  // ==========================================================================
  if (command === '!free') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return fail(message, 'Du brauchst Moderate Members!');
    }
    let t = message.mentions.members.first();
    if (!t && args[0]) t = await getMember(args[0]);
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}free @member\``);
    }
    let blId = await getBlacklistRoleId(message.guild.id);
    let bl = blId
      ? message.guild.roles.cache.get(blId)
      : message.guild.roles.cache.find(r => r.name.toLowerCase() === 'blacklist');
    const saved = await BlacklistData.findOne({
      guildId: message.guild.id,
      userId: t.id
    });
    const old = saved?.oldRoles || [];
    try {
      if (bl) await t.roles.remove(bl).catch(() => {});
      await t.timeout(null).catch(() => {});
      if (old.length) await t.roles.add(old).catch(() => {});
      await BlacklistData.findOneAndDelete({
        guildId: message.guild.id,
        userId: t.id
      });
    } catch {
      return fail(message, 'Fehler beim Freilassen!');
    }
    return success(message, `${t} wurde befreit. Alte Rollen zurückgegeben.`);
  }

  // ==========================================================================
  // REMINDER - !remember / !remind / !reminder
  // ==========================================================================
  if (command === '!remember' || command === '!remind' || command === '!reminder') {
    const ta = args[0];
    const txt = args.slice(1).join(' ');
    if (!ta || !txt) {
      return fail(message, `Benutzung: \`${prefix}remember 10m Hausaufgaben\``);
    }
    const ms = parseDuration(ta);
    if (!ms) {
      return fail(message, 'Benutze: 10s 10m 1h 1d');
    }
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
    return;
  }

  // ==========================================================================
  // REPORT - !addchannelreport
  // ==========================================================================
  if (command === '!addchannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) {
      return fail(message, `Benutzung: \`${prefix}addchannelreport #channel\``);
    }
    const ids = await getReportChannels(message.guild.id);
    if (ids.includes(ch.id)) {
      return fail(message, `${ch} ist schon ein Report-Channel!`);
    }
    await ReportConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { $push: { channelIds: ch.id } },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetChannelId: ch.id });
    return success(message, `${ch} wurde als **Report-Channel** hinzugefügt!`);
  }

  // ==========================================================================
  // REPORT - !removechannelreport
  // ==========================================================================
  if (command === '!removechannelreport') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ch = message.mentions.channels.first();
    if (!ch) {
      return fail(message, `Benutzung: \`${prefix}removechannelreport #channel\``);
    }
    await ReportConfig.findOneAndUpdate(
      { guildId: message.guild.id },
      { $pull: { channelIds: ch.id } }
    );
    return success(message, `${ch} wurde entfernt!`);
  }

  // ==========================================================================
  // REPORT - !reportchannelstatus
  // ==========================================================================
  if (command === '!reportchannelstatus') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst **Administrator** Rechte!');
    }
    const ids = await getReportChannels(message.guild.id);
    if (!ids.length) {
      return fail(message, `Kein Report-Channel gesetzt! \`${prefix}addchannelreport #channel\``);
    }
    const list = ids.map(id => {
      const ch = message.guild.channels.cache.get(id);
      return ch ? `${ch} - \`${id}\`` : `Unbekannt - \`${id}\``;
    }).join('\n');
    await reactDone(message);
    return embedReply(message, '📝 • REPORT-CHANNEL STATUS', list, 0x00AAFF, false);
  }

  // ==========================================================================
  // REPORT - !report
  // ==========================================================================
  if (command === '!report') {
    const t = message.mentions.members.first() || message.mentions.users.first();
    if (!t) {
      return fail(message, `Benutzung: \`${prefix}report @User Grund\``);
    }
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    const sent = await sendReportEmbed(
      message.guild,
      t.user || t,
      message.author,
      reason,
      message.channel,
      message.url,
      'manual'
    );
    if (!sent) {
      return fail(message, `Kein Report-Channel gesetzt! Admin muss \`${prefix}addchannelreport #channel\` machen.`);
    }
    return success(message, `Report gegen ${t} wurde gesendet!`);
  }

  // ==========================================================================
  // JOINROLE - !joinrole
  // ==========================================================================
  if (command === '!joinrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return fail(message, 'Du brauchst Admin-Rechte.');
    }
    if (args[0] === 'status') {
      const d = await JoinRole.findOne({ guildId: message.guild.id });
      if (!d) {
        return fail(message, 'Es ist keine Join-Role gesetzt.');
      }
      const role = message.guild.roles.cache.get(d.roleId);
      return success(message, `Join-Role ist: ${role ? `<@&${role.id}>` : d.roleId}`, false);
    }
    const role = message.mentions.roles.first();
    if (!role) {
      return fail(message, `Benutzung: \`${prefix}joinrole @Role\``);
    }
    await JoinRole.findOneAndUpdate(
      { guildId: message.guild.id },
      { guildId: message.guild.id, roleId: role.id },
      { upsert: true, new: true }
    );
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Join-Role gesetzt auf: <@&${role.id}>`);
  }

  // ==========================================================================
  // JOINROLE - !removejoinrole
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
    if (d && d.roleId === role.id) {
      await JoinRole.deleteOne({ guildId: message.guild.id });
    }
    return success(message, `Join-Role <@&${role.id}> wurde entfernt.`);
  }

  // ==========================================================================
  // HELP - !help - ALLE COMMANDS
  // ==========================================================================
  if (command === '!help') {
    await reactDone(message);
    const embed = new EmbedBuilder()
      .setTitle('📢 BENI BOT - ALLE COMMANDS')
      .setColor(0x00FF00)
      .setDescription(`Hier sind alle Befehle - alles als Embed - Prefix ist gerade: \`${prefix}\``)
      .addFields(
        {
          name: '👮 MODERATION',
          value: `\`${prefix}ban\` \`${prefix}tempban\` \`${prefix}unban\` \`${prefix}kick\` \`${prefix}mute\` \`${prefix}timeout\` \`${prefix}unmute\` \`${prefix}clear\` \`${prefix}purge\` \`${prefix}blacklist\` \`${prefix}free\` \`${prefix}addblrole\` \`${prefix}removeblrole\` \`${prefix}mod\` \`${prefix}warn\` \`${prefix}warnings\` \`${prefix}unwarn\` \`${prefix}slowmode\` \`${prefix}nick\``,
          inline: false
        },
        {
          name: '💬 NACHRICHTEN',
          value: `\`${prefix}sendmessage\` \`${prefix}dm\` (anonym) \`${prefix}sag\``,
          inline: false
        },
        {
          name: '🔒 CHANNEL',
          value: `\`${prefix}lock\` \`${prefix}unlock\` \`${prefix}lockall\` \`${prefix}unlockall\``,
          inline: false
        },
        {
          name: '🆔 USER',
          value: `\`${prefix}id\` \`${prefix}avatar\` \`${prefix}banner\` \`${prefix}history\` \`${prefix}userinfo\` \`${prefix}user\` \`${prefix}afk\``,
          inline: false
        },
        {
          name: '🏆 LEVEL',
          value: `\`${prefix}rank\` \`${prefix}leaderboard\` \`${prefix}lb\` \`${prefix}leveldashboard\` \`${prefix}levelups\` \`${prefix}levelupchannel\` \`${prefix}removelevelup\` \`${prefix}setlevelrole\` \`${prefix}removelevelrole\` \`${prefix}multiplier\` \`${prefix}givexp\` \`${prefix}resetxp\` \`${prefix}topvoice\` \`${prefix}topchat\` \`${prefix}daily\``,
          inline: false
        },
        {
          name: '💰 ECONOMY',
          value: `\`${prefix}balance\` \`${prefix}coins\` \`${prefix}pay\` \`${prefix}work\` \`${prefix}deposit\` \`${prefix}withdraw\``,
          inline: false
        },
        {
          name: '📊 STATS',
          value: `\`${prefix}stats\` \`${prefix}as\` \`${prefix}dashboard\` \`${prefix}dash\` \`${prefix}website\` \`${prefix}web\` \`${prefix}messagelog\` \`${prefix}partnership\` \`${prefix}editwm\` \`${prefix}enablewm\` \`${prefix}disablewm\` \`${prefix}savedids\` \`${prefix}serverinfo\` \`${prefix}server\` \`${prefix}uptime\` \`${prefix}invite\``,
          inline: false
        },
        {
          name: '🚨 REPORT',
          value: `\`${prefix}report\` \`${prefix}addchannelreport\` \`${prefix}removechannelreport\` \`${prefix}reportchannelstatus\``,
          inline: false
        },
        {
          name: '👋 JOIN',
          value: `\`${prefix}joinrole\` \`${prefix}removejoinrole\``,
          inline: false
        },
        {
          name: '📝 BEWERBUNG',
          value: `\`${prefix}Bewerbungstext\` \`${prefix}application\` \`${prefix}mod\``,
          inline: false
        },
        {
          name: '🎉 FUN & GIVEAWAY',
          value: `\`${prefix}poll\` \`${prefix}umfrage\` \`${prefix}giveaway\` \`${prefix}coinflip\` \`${prefix}münze\` \`${prefix}8ball\` \`${prefix}meme\` \`${prefix}witz\` \`${prefix}suggest\` \`${prefix}vorschlag\``,
          inline: false
        },
        {
          name: '🎫 TICKET',
          value: `\`${prefix}ticketsetup\` \`${prefix}ticket\` \`${prefix}close\` \`${prefix}claim\` \`${prefix}add\` \`${prefix}remove\` \`${prefix}transcript\` \`${prefix}tickets\``,
          inline: false
        },
        {
          name: '🔤 PREFIX',
          value: `\`${prefix}setprefix\` \`${prefix}prefix\``,
          inline: false
        },
        {
          name: '✅ SONSTIGES',
          value: `\`${prefix}ping\` \`${prefix}hallo\` \`${prefix}owner\` \`${prefix}help\` \`${prefix}remember\` \`${prefix}remind\` \`${prefix}reminder\` \`${prefix}distanze\` \`${prefix}distanz\` \`${prefix}rules\` \`${prefix}regeln\``,
          inline: false
        },
        {
          name: '⏰ ZEITEN',
          value: '`10s` `10m` `1h` `1d`',
          inline: false
        }
      )
      .setFooter({ text: 'Beni Bot • Made by Elyias' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Join unseren Discord!')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/7gqzytC3SH')
    );
    return message.channel.send({ embeds: [embed], components: [row] });
  }

});

// ============================================================================
// LOGIN + SELF-HEALING
// ============================================================================
const MYTOKEN = (process.env.DISCORD_TOKEN || process.env.TOKEN || '').trim();
if (!MYTOKEN) {
  console.log('❌ Token NOT found!');
  console.log('Bitte DISCORD_TOKEN in Render setzen!');
} else {
  console.log('✅ Token gefunden, Länge:', MYTOKEN.length);
}

client.login(MYTOKEN)
  .then(() => console.log('Login-Anfrage geschickt...'))
  .catch(e => console.log('LOGIN FEHLER:', e.message));

// ============================================================================
// AUTO RECONNECT
// ============================================================================
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

// ============================================================================
// WATCHDOG - Prüft alle 30 Sekunden ob Bot noch lebt
// ============================================================================
setInterval(() => {
  if (client.ws.status !== 0 || !client.user) {
    console.log(`💔 Watchdog: Bot hängt! Status: ${client.ws.status}`);
    autoReconnect('watchdog');
  }
}, 30 * 1000);

// ============================================================================
// ACTIVITY - Alle 10 Minuten Status updaten
// ============================================================================
setInterval(() => {
  if (client.user) {
    client.user.setActivity('Online ✅ | !help', { type: 4 }).catch(() => {});
  }
}, 10 * 60 * 1000);

// ============================================================================
// ENDE - BENI BOT v6.0
// ============================================================================
console.log('✅ Self-Healing aktiviert');
console.log('✅ BENI BOT v6.0 - 3100+ Zeilen - ALLE COMMANDS GELADEN');
console.log('✅ Teil 1 + Teil 2 + Teil 3 = KOMPLETT');
console.log('✅ Ticket-System FULL');
console.log('✅ Prefix-System');
console.log('✅ Level mit Voice-Time + Messages');
console.log('✅ Economy System');
console.log('✅ Alle Commands als Embed');
console.log('✅ Reaction ⏳ -> ✅');
