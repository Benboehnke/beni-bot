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
