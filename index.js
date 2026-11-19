// ============================================================================
// BENI BOT v8.0 - 3000 ZEILEN VERSION
// TEIL 1 / 3 - CORE + EINSTELLBAR-SYSTEM + TICKET + MODERATION
// Made by Elyias - Besser als Sapphire - Übersichtlicher!
// ============================================================================
// ZEILEN: Teil 1 = ~1000 Zeilen
//         Teil 2 = ~1000 Zeilen
//         Teil 3 = ~1000 Zeilen
//         GESAMT = ~3000 Zeilen
// ============================================================================
// INHALT TEIL 1:
//  - Imports & Setup
//  - Alle Schemas (Level, Prefix, Ticket, Warn, AFK, Economy, Config, Toggle, etc.)
//  - Einstellbar-System: !toggle, !commands, !resetcommands, !commandinfo
//  - Alle Helper (Embed, Reaction, Prefix, Level-Up, Ticket-Helper, Config-Helper)
//  - Interaction Handler (Buttons + Selects)
//  - Join / Voice / Logger
//  - Report System (Wörter, Highlight, Embed)
//  - Main Handler mit Prefix + Toggle-Check + Unbekannter Command
//  - Prefix Commands (!setprefix / !prefix)
//  - Ticket Commands FULL (!ticketsetup / !ticketkategorie / !ticket / !close / !claim / !add / !remove / !transcript / !tickets)
//  - Mod Commands FULL (!ban / !tempban / !unban / !kick / !mute / !unmute / !warn / !warnings / !unwarn / !clear / !slowmode / !nick)
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
  StringSelectMenuBuilder
} = require('discord.js');
const http = require('http');

console.log('========================================');
console.log('BENI BOT v8.0 - 3000 ZEILEN VERSION');
console.log('TEIL 1 WIRD GELADEN...');
console.log('========================================');

// ============================================================================
// MONGO VERBINDUNG
// ============================================================================
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Mongo verbunden! ✅');
    console.log('Datenbank: Beni Bot v8.0');
  })
  .catch(err => {
    console.log('Mongo Fehler:', err);
    console.log('Bitte MONGO_URL in Render prüfen!');
  });

// ============================================================================
// SCHEMA 1 - LEVEL
// ============================================================================
const levelSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  messages: { type: Number, default: 0 },
  voiceTime: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastMessageAt: { type: Date, default: null }
});
const Level = mongoose.model('Level', levelSchema);

// ============================================================================
// SCHEMA 2 - GUILD CONFIG - ALLES EINSTELLBAR!
// ============================================================================
const configSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  levelupChannelId: { type: String, default: null },
  levelEnabled: { type: Boolean, default: true },
  economyEnabled: { type: Boolean, default: true },
  funEnabled: { type: Boolean, default: true },
  ticketEnabled: { type: Boolean, default: true },
  reportEnabled: { type: Boolean, default: true },
  welcomeEnabled: { type: Boolean, default: true },
  logEnabled: { type: Boolean, default: true },
  xpPerMessageMin: { type: Number, default: 5 },
  xpPerMessageMax: { type: Number, default: 15 },
  coinsPerMessage: { type: Number, default: 2 },
  voiceXpPerMin: { type: Number, default: 2 },
  dailyXpMin: { type: Number, default: 100 },
  dailyXpMax: { type: Number, default: 200 },
  dailyCoins: { type: Number, default: 50 }
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
  text: { type: String, default: 'Willkommen {user} auf **{server}**! 🎉 Du bist Member #{member}' },
  enabled: { type: Boolean, default: true }
});
const WelcomeConfig = mongoose.model('WelcomeConfig', welcomeSchema);

// ============================================================================
// SCHEMA 5 - MESSAGE LOG
// ============================================================================
const logSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  enabled: { type: Boolean, default: true }
});
const LogConfig = mongoose.model('LogConfig', logSchema);

// ============================================================================
// SCHEMA 6 - REPORT CHANNELS
// ============================================================================
const reportSchema = new mongoose.Schema({
  guildId: String,
  channelIds: { type: [String], default: [] }
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
  oldRoles: { type: [String], default: [] }
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
  guildId: { type: String, required: true, unique: true },
  roleId: { type: String, required: true },
  enabled: { type: Boolean, default: true }
});
const JoinRole = mongoose.models.JoinRole || mongoose.model('JoinRole', joinRoleSchema);

// ============================================================================
// SCHEMA 11 - APPLICATION TEXT / BEWERBUNGSTEXT
// ============================================================================
const appTextSchema = new mongoose.Schema({
  guildId: String,
  text: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
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
  args: { type: [String], default: [] },
  channelId: String,
  messageId: String,
  targetUserId: { type: String, default: null },
  targetRoleId: { type: String, default: null },
  targetChannelId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
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
  duration: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Warn = mongoose.model('Warn', warnSchema);

// ============================================================================
// SCHEMA 14 - AFK
// ============================================================================
const afkSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  reason: String,
  createdAt: { type: Date, default: Date.now }
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
  ended: { type: Boolean, default: false },
  participants: { type: [String], default: [] }
});
const Giveaway = mongoose.model('Giveaway', giveawaySchema);

// ============================================================================
// SCHEMA 16 - PREFIX
// ============================================================================
const prefixSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' }
});
const Prefix = mongoose.model('Prefix', prefixSchema);

// ============================================================================
// SCHEMA 17 - TICKET SETUP
// ============================================================================
const ticketSetupSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  categoryId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  supportRoleId: { type: String, default: null },
  panelMessageId: { type: String, default: null },
  enabled: { type: Boolean, default: true },
  maxTicketsPerUser: { type: Number, default: 1 },
  autoCloseHours: { type: Number, default: 0 }
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
  reason: { type: String, default: 'Kein Grund' },
  claimedBy: { type: String, default: null },
  claimedByTag: { type: String, default: null },
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null }
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
  createdAt: { type: Date, default: Date.now }
});
const Transcript = mongoose.model('Transcript', transcriptSchema);

// ============================================================================
// SCHEMA 20 - ECONOMY / COINS
// ============================================================================
const economySchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  coins: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  lastDailyCoins: { type: Date, default: null }
});
const Economy = mongoose.model('Economy', economySchema);

// ============================================================================
// SCHEMA 21 - COMMAND TOGGLE - NEU IN v8.0! JEDER COMMAND AN/AUS
// ============================================================================
// Beispiel: !toggle ban off -> !ban geht nicht mehr
//           !toggle rank on  -> !rank geht wieder
// ============================================================================
const toggleSchema = new mongoose.Schema({
  guildId: String,
  command: String,
  enabled: { type: Boolean, default: true }
});
const CommandToggle = mongoose.model('CommandToggle', toggleSchema);

// ============================================================================
// SCHEMA 22 - COMMAND PERMS - NEU! WELCHE ROLLE DARF WELCHEN COMMAND?
// ============================================================================
const commandPermSchema = new mongoose.Schema({
  guildId: String,
  command: String,
  roleId: String
});
const CommandPerm = mongoose.model('CommandPerm', commandPermSchema);

// ============================================================================
// ALLE COMMANDS DEFINITION - FÜR !help + !toggle + !commands
// ============================================================================
const COMMANDS_LIST = [
  // MODERATION
  { name: 'ban', category: 'Moderation', desc: 'User bannen', usage: '!ban @User Grund', perm: 'BanMembers', modDelete: true },
  { name: 'tempban', category: 'Moderation', desc: 'User zeitlich bannen', usage: '!tempban @User 1d Grund', perm: 'BanMembers', modDelete: true },
  { name: 'unban', category: 'Moderation', desc: 'User entbannen', usage: '!unban <ID>', perm: 'BanMembers', modDelete: true },
  { name: 'kick', category: 'Moderation', desc: 'User kicken', usage: '!kick @User Grund', perm: 'KickMembers', modDelete: true },
  { name: 'mute', category: 'Moderation', desc: 'User muten / Timeout', usage: '!mute @User 10m Grund', perm: 'ModerateMembers', modDelete: true },
  { name: 'timeout', category: 'Moderation', desc: 'Alias für mute', usage: '!timeout @User 10m Grund', perm: 'ModerateMembers', modDelete: true },
  { name: 'unmute', category: 'Moderation', desc: 'User entmuten', usage: '!unmute @User', perm: 'ModerateMembers', modDelete: true },
  { name: 'warn', category: 'Moderation', desc: 'User verwarnen', usage: '!warn @User Grund', perm: 'ModerateMembers', modDelete: true },
  { name: 'warnings', category: 'Moderation', desc: 'Warns anzeigen', usage: '!warnings @User', perm: 'ModerateMembers', modDelete: true },
  { name: 'unwarn', category: 'Moderation', desc: 'Letzten Warn entfernen', usage: '!unwarn @User', perm: 'ModerateMembers', modDelete: true },
  { name: 'clear', category: 'Moderation', desc: 'Nachrichten löschen', usage: '!clear 10', perm: 'ManageMessages', modDelete: true },
  { name: 'purge', category: 'Moderation', desc: 'Alias für clear', usage: '!purge 10', perm: 'ManageMessages', modDelete: true },
  { name: 'slowmode', category: 'Moderation', desc: 'Slowmode setzen', usage: '!slowmode 5', perm: 'ManageChannels', modDelete: true },
  { name: 'nick', category: 'Moderation', desc: 'Nickname ändern', usage: '!nick @User NeuerName', perm: 'ManageNicknames', modDelete: true },
  { name: 'blacklist', category: 'Moderation', desc: 'User blacklisten', usage: '!blacklist @User Grund', perm: 'ModerateMembers', modDelete: true },
  { name: 'free', category: 'Moderation', desc: 'User von Blacklist befreien', usage: '!free @User', perm: 'ModerateMembers', modDelete: true },
  { name: 'addblrole', category: 'Moderation', desc: 'Blacklist-Rolle setzen', usage: '!addblrole @Rolle', perm: 'ManageRoles', modDelete: true },
  { name: 'removeblrole', category: 'Moderation', desc: 'Blacklist-Rolle entfernen', usage: '!removeblrole', perm: 'ManageRoles', modDelete: true },
  // TICKET
  { name: 'ticketsetup', category: 'Ticket', desc: 'Ticket-Panel erstellen', usage: '!ticketsetup #channel @Support-Rolle #log', perm: 'Administrator', modDelete: true },
  { name: 'ticketkategorie', category: 'Ticket', desc: 'Ticket-Kategorie setzen (PFLICHT)', usage: '!ticketkategorie <Kategorie-ID>', perm: 'Administrator', modDelete: true },
  { name: 'ticket', category: 'Ticket', desc: 'Ticket erstellen', usage: '!ticket Grund', perm: 'Kein', modDelete: false },
  { name: 'close', category: 'Ticket', desc: 'Ticket schließen', usage: '!close', perm: 'Kein', modDelete: true },
  { name: 'claim', category: 'Ticket', desc: 'Ticket claimen', usage: '!claim', perm: 'Kein', modDelete: true },
  { name: 'add', category: 'Ticket', desc: 'User zu Ticket hinzufügen', usage: '!add @User', perm: 'Kein', modDelete: true },
  { name: 'remove', category: 'Ticket', desc: 'User aus Ticket entfernen', usage: '!remove @User', perm: 'Kein', modDelete: true },
  { name: 'transcript', category: 'Ticket', desc: 'Transcript als Datei', usage: '!transcript', perm: 'Kein', modDelete: true },
  { name: 'tickets', category: 'Ticket', desc: 'Alle offenen Tickets', usage: '!tickets', perm: 'ModerateMembers', modDelete: true },
  // LEVEL
  { name: 'rank', category: 'Level', desc: 'Dein Rank + XP', usage: '!rank', perm: 'Kein', modDelete: false },
  { name: 'leaderboard', category: 'Level', desc: 'Top 10 Level', usage: '!leaderboard', perm: 'Kein', modDelete: false },
  { name: 'lb', category: 'Level', desc: 'Alias für leaderboard', usage: '!lb', perm: 'Kein', modDelete: false },
  { name: 'leveldashboard', category: 'Level', desc: 'Level-Übersicht', usage: '!leveldashboard', perm: 'Kein', modDelete: false },
  { name: 'levelups', category: 'Level', desc: 'Level-Up Channel setzen', usage: '!levelups #channel', perm: 'Administrator', modDelete: true },
  { name: 'setlevelrole', category: 'Level', desc: 'Rolle ab Level setzen', usage: '!setlevelrole 5 @Rolle', perm: 'Administrator', modDelete: true },
  { name: 'removelevelrole', category: 'Level', desc: 'Level-Rolle entfernen', usage: '!removelevelrole 5', perm: 'Administrator', modDelete: true },
  { name: 'multiplier', category: 'Level', desc: 'XP-Multiplier für Rolle', usage: '!multiplier @Rolle 2', perm: 'Administrator', modDelete: true },
  { name: 'givexp', category: 'Level', desc: 'XP geben', usage: '!givexp @User 500', perm: 'Administrator', modDelete: true },
  { name: 'resetxp', category: 'Level', desc: 'XP zurücksetzen', usage: '!resetxp @User', perm: 'Administrator', modDelete: true },
  { name: 'topvoice', category: 'Level', desc: 'Top Voice-Time', usage: '!topvoice', perm: 'Kein', modDelete: false },
  { name: 'topchat', category: 'Level', desc: 'Top Chat', usage: '!topchat', perm: 'Kein', modDelete: false },
  { name: 'daily', category: 'Level', desc: 'Tägliche Belohnung', usage: '!daily', perm: 'Kein', modDelete: false },
  // ECONOMY
  { name: 'balance', category: 'Economy', desc: 'Coins anzeigen', usage: '!balance', perm: 'Kein', modDelete: false },
  { name: 'coins', category: 'Economy', desc: 'Alias für balance', usage: '!coins', perm: 'Kein', modDelete: false },
  { name: 'pay', category: 'Economy', desc: 'Coins an User schicken', usage: '!pay @User 100', perm: 'Kein', modDelete: false },
  { name: 'work', category: 'Economy', desc: 'Arbeiten für Coins', usage: '!work', perm: 'Kein', modDelete: false },
  { name: 'deposit', category: 'Economy', desc: 'Coins in Bank einzahlen', usage: '!deposit 100', perm: 'Kein', modDelete: false },
  { name: 'withdraw', category: 'Economy', desc: 'Coins aus Bank holen', usage: '!withdraw 100', perm: 'Kein', modDelete: false },
  // FUN
  { name: '8ball', category: 'Fun', desc: 'Magic 8Ball', usage: '!8ball Frage?', perm: 'Kein', modDelete: false },
  { name: 'meme', category: 'Fun', desc: 'Zufälliger Witz', usage: '!meme', perm: 'Kein', modDelete: false },
  { name: 'poll', category: 'Fun', desc: 'Umfrage erstellen', usage: '!poll Frage?', perm: 'Kein', modDelete: false },
  { name: 'giveaway', category: 'Fun', desc: 'Giveaway starten', usage: '!giveaway 10m Nitro', perm: 'ManageMessages', modDelete: true },
  { name: 'suggest', category: 'Fun', desc: 'Vorschlag senden', usage: '!suggest Text', perm: 'Kein', modDelete: false },
  // USER
  { name: 'avatar', category: 'User', desc: 'Avatar anzeigen', usage: '!avatar @User', perm: 'Kein', modDelete: false },
  { name: 'banner', category: 'User', desc: 'Banner anzeigen', usage: '!banner @User', perm: 'Kein', modDelete: false },
  { name: 'userinfo', category: 'User', desc: 'Infos über User', usage: '!userinfo @User', perm: 'Kein', modDelete: false },
  { name: 'history', category: 'User', desc: 'Letzte 20 Nachrichten von User', usage: '!history @User', perm: 'Kein', modDelete: false },
  { name: 'afk', category: 'User', desc: 'AFK setzen', usage: '!afk Grund', perm: 'Kein', modDelete: false },
  { name: 'id', category: 'User', desc: 'ID per DM schicken', usage: '!id @User', perm: 'Kein', modDelete: true },
  // CHANNEL
  { name: 'lock', category: 'Channel', desc: 'Channel sperren', usage: '!lock', perm: 'ManageChannels', modDelete: true },
  { name: 'unlock', category: 'Channel', desc: 'Channel entsperren', usage: '!unlock', perm: 'ManageChannels', modDelete: true },
  { name: 'lockall', category: 'Channel', desc: 'Alle Channels sperren', usage: '!lockall', perm: 'ManageChannels', modDelete: true },
  { name: 'unlockall', category: 'Channel', desc: 'Alle Channels entsperren', usage: '!unlockall', perm: 'ManageChannels', modDelete: true },
  { name: 'sendmessage', category: 'Channel', desc: 'Nachricht in anderen Channel', usage: '!sendmessage #channel Text', perm: 'ManageMessages', modDelete: true },
  { name: 'dm', category: 'Channel', desc: 'Anonyme DM schicken', usage: '!dm @User Text', perm: 'ManageMessages', modDelete: true },
  { name: 'sag', category: 'Channel', desc: 'Bot sagt etwas', usage: '!sag Text', perm: 'Kein', modDelete: true },
  // STATS / INFO
  { name: 'help', category: 'Info', desc: 'Alle Commands anzeigen', usage: '!help', perm: 'Kein', modDelete: false },
  { name: 'ping', category: 'Info', desc: 'Bot Ping', usage: '!ping', perm: 'Kein', modDelete: false },
  { name: 'serverinfo', category: 'Info', desc: 'Server Infos', usage: '!serverinfo', perm: 'Kein', modDelete: false },
  { name: 'stats', category: 'Info', desc: 'Bot Stats', usage: '!stats', perm: 'Kein', modDelete: false },
  { name: 'uptime', category: 'Info', desc: 'Wie lange läuft Bot?', usage: '!uptime', perm: 'Kein', modDelete: false },
  { name: 'invite', category: 'Info', desc: 'Bot einladen', usage: '!invite', perm: 'Kein', modDelete: false },
  { name: 'rules', category: 'Info', desc: 'Regeln anzeigen', usage: '!rules', perm: 'Kein', modDelete: false },
  { name: 'owner', category: 'Info', desc: 'Wer hat Bot gemacht?', usage: '!owner', perm: 'Kein', modDelete: false },
  { name: 'hallo', category: 'Info', desc: 'Hallo sagen', usage: '!hallo', perm: 'Kein', modDelete: false },
  { name: 'distanze', category: 'Info', desc: 'Distanzieren', usage: '!distanze', perm: 'Kein', modDelete: false },
  { name: 'dashboard', category: 'Info', desc: 'Dashboard Link', usage: '!dashboard', perm: 'Kein', modDelete: false },
  { name: 'messagelog', category: 'Info', desc: 'Message Log an/aus', usage: '!messagelog #channel', perm: 'Administrator', modDelete: true },
  { name: 'partnership', category: 'Info', desc: 'Partnerschafts-Text', usage: '!partnership <Link>', perm: 'Kein', modDelete: false },
  // REPORT
  { name: 'report', category: 'Report', desc: 'User melden', usage: '!report @User Grund', perm: 'Kein', modDelete: true },
  { name: 'addchannelreport', category: 'Report', desc: 'Report-Channel hinzufügen', usage: '!addchannelreport #channel', perm: 'Administrator', modDelete: true },
  { name: 'removechannelreport', category: 'Report', desc: 'Report-Channel entfernen', usage: '!removechannelreport #channel', perm: 'Administrator', modDelete: true },
  { name: 'reportchannelstatus', category: 'Report', desc: 'Report-Channels anzeigen', usage: '!reportchannelstatus', perm: 'Administrator', modDelete: true },
  // SETUP / EINSTELLBAR
  { name: 'toggle', category: 'Setup', desc: 'Command an/aus', usage: '!toggle ban off', perm: 'Administrator', modDelete: true },
  { name: 'commands', category: 'Setup', desc: 'Alle Commands + Status', usage: '!commands', perm: 'Administrator', modDelete: false },
  { name: 'commandinfo', category: 'Setup', desc: 'Info zu einem Command', usage: '!commandinfo ban', perm: 'Kein', modDelete: false },
  { name: 'setprefix', category: 'Setup', desc: 'Prefix ändern', usage: '!setprefix ?', perm: 'Administrator', modDelete: true },
  { name: 'prefix', category: 'Setup', desc: 'Aktuellen Prefix anzeigen', usage: '!prefix', perm: 'Kein', modDelete: false },
  { name: 'setup', category: 'Setup', desc: 'Komplettes Setup anzeigen', usage: '!setup', perm: 'Administrator', modDelete: false },
  { name: 'joinrole', category: 'Setup', desc: 'Join-Rolle setzen', usage: '!joinrole @Rolle', perm: 'Administrator', modDelete: true },
  { name: 'removejoinrole', category: 'Setup', desc: 'Join-Rolle entfernen', usage: '!removejoinrole', perm: 'Administrator', modDelete: true },
  { name: 'enablewm', category: 'Setup', desc: 'Welcome an', usage: '!enablewm #channel', perm: 'ManageChannels', modDelete: true },
  { name: 'disablewm', category: 'Setup', desc: 'Welcome aus', usage: '!disablewm', perm: 'ManageChannels', modDelete: true },
  { name: 'editwm', category: 'Setup', desc: 'Welcome-Text ändern', usage: '!editwm Text', perm: 'ManageChannels', modDelete: true },
  { name: 'levelups', category: 'Setup', desc: 'Level-Up Channel', usage: '!levelups #channel', perm: 'Administrator', modDelete: true },
  // BEWERBUNG
  { name: 'bewerbungstext', category: 'Bewerbung', desc: 'Bewerbungstext setzen', usage: '!bewerbungstext Text', perm: 'Administrator', modDelete: true },
  { name: 'application', category: 'Bewerbung', desc: 'Bewerbungstext ansehen', usage: '!application', perm: 'Kein', modDelete: false },
  { name: 'mod', category: 'Bewerbung', desc: 'Mod-Team / Bewerbung', usage: '!mod', perm: 'Kein', modDelete: true },
  // SONSTIGES
  { name: 'remember', category: 'Sonstiges', desc: 'Reminder setzen', usage: '!remember 10m Text', perm: 'Kein', modDelete: false },
  { name: 'savedids', category: 'Sonstiges', desc: 'Gespeicherte IDs', usage: '!savedids', perm: 'Administrator', modDelete: true },
];

const MOD_COMMANDS = COMMANDS_LIST.filter(c => c.modDelete).map(c => '!' + c.name);
const ALL_COMMANDS = COMMANDS_LIST.map(c => '!' + c.name);

function isModCommand(cmd) { return MOD_COMMANDS.includes(cmd); }

// ============================================================================
// XP FORMELN
// ============================================================================
function getNeededXp(l) { return 5 * (l ** 2) + 50 * l + 100; }
function formatVoice(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m`; return `${s}s`; }
function formatDuration(ms) { if (ms < 60000) return `${Math.floor(ms / 1000)}s`; if (ms < 3600000) return `${Math.floor(ms / 60000)}m`; if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`; return `${Math.floor(ms / 86400000)}d`; }
function formatNumber(n) { return n.toLocaleString('de-DE'); }

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

client.on('error', e => console.log('DISCORD FEHLER:', e.message));
client.on('shardError', e => console.log('SHARD FEHLER:', e.message));
process.on('unhandledRejection', e => console.log('UNHANDLED:', e?.message || e));
process.on('uncaughtException', e => console.log('UNCAUGHT:', e?.message || e));

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Beni Bot v8.0 laeuft! 3000 Zeilen Version');
}).listen(process.env.PORT || 10000, () => {
  console.log('Webserver läuft auf Port 10000');
});

client.once('ready', () => {
  console.log(`Eingeloggt als ${client.user.tag} 🎉`);
  console.log(`Server: ${client.guilds.cache.size}`);
  console.log(`User: ${client.users.cache.size}`);
  client.user.setActivity('Online ✅ | !help', { type: 4 }).catch(() => {});
});

// ============================================================================
// HELPERS - PREFIX + CONFIG
// ============================================================================
async function getPrefix(guildId) {
  if (!guildId) return '!';
  const d = await Prefix.findOne({ guildId }).catch(() => null);
  return d?.prefix || '!';
}

async function getGuildConfig(guildId) {
  let cfg = await GuildConfig.findOne({ guildId });
  if (!cfg) { cfg = new GuildConfig({ guildId }); await cfg.save(); }
  return cfg;
}

async function getWelcome(g) {
  const c = await WelcomeConfig.findOne({ guildId: g });
  return c || null;
}

async function getLogChannel(g) {
  const c = await LogConfig.findOne({ guildId: g });
  if (!c || !c.enabled) return null;
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
// HELPERS - COMMAND TOGGLE CHECK - IST COMMAND AN?
// ============================================================================
async function isCommandEnabled(guildId, commandName) {
  const clean = commandName.replace('!', '').toLowerCase();
  const t = await CommandToggle.findOne({ guildId, command: clean });
  if (!t) return true;
  return t.enabled;
}

async function getCommandToggleList(guildId) {
  const all = await CommandToggle.find({ guildId });
  const map = {};
  for (const t of all) map[t.command] = t.enabled;
  return map;
}

// ============================================================================
// HELPERS - LÖSCHEN / DAUER
// ============================================================================
function deleteAfter(m, ms = 3000) {
  if (!m) return;
  setTimeout(() => { m.delete().catch(() => {}); }, ms);
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
async function reactStart(msg) { await msg.react('⏳').catch(() => {}); }
async function reactDone(msg) {
  await msg.reactions.removeAll().catch(() => {});
  await msg.react('✅').catch(() => {});
  setTimeout(() => { msg.reactions.removeAll().catch(() => {}); }, 3000);
}

// ============================================================================
// HELPERS - EMBED SYSTEM - ALLE Antworten NUR als Embed!
// ============================================================================
async function embedReply(message, title, desc, color = 0x5865F2, extra = {}) {
  const e = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setFooter({ text: `Ausgeführt von ${message.author.tag}` })
    .setTimestamp();
  if (extra.fields) e.addFields(extra.fields);
  if (extra.thumb) e.setThumbnail(extra.thumb);
  if (extra.image) e.setImage(extra.image);
  const r = await message.reply({ embeds: [e], components: extra.components || [] });
  const rawCmd = message.content.trim().split(/ +/)[0].toLowerCase();
  const cmdName = '!' + rawCmd.slice(1);
  if (isModCommand(cmdName)) deleteAfter(r, 3000);
  return r;
}

async function success(message, text) {
  await reactDone(message);
  return embedReply(message, '✅ Erfolgreich!', text, 0x00FF00);
}

async function fail(message, text) {
  await reactDone(message);
  return embedReply(message, '❌ Fehlgeschlagen!', text, 0xFF0000);
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
  if (!u) { u = new Level({ userId, guildId }); await u.save(); }
  return u;
}

async function handleLevelUp(member, user, channel) {
  const cfg = await GuildConfig.findOne({ guildId: member.guild.id });
  const tc = cfg?.levelupChannelId ? await member.guild.channels.fetch(cfg.levelupChannelId).catch(() => null) : channel;
  let rt = '';
  const lr = await LevelRole.findOne({ guildId: member.guild.id, level: user.level });
  if (lr) {
    const role = member.guild.roles.cache.get(lr.roleId);
    if (role) { await member.roles.add(role).catch(() => {}); rt = `\n🎭 Du hast die Rolle ${role} erhalten!`; }
  }
  if (tc) {
    tc.send({ embeds: [new EmbedBuilder().setColor('#00FF88').setTitle('🎉 LEVEL UP!').setDescription(`GG ${member}! Du bist jetzt **Level ${user.level}**!${rt}`).setThumbnail(member.displayAvatarURL()).setTimestamp()] }).catch(() => {});
  }
}

// ============================================================================
// TICKET HELPERS - NUR MIT !ticketkategorie!
// ============================================================================
async function createTicketChannel(guild, user, reason) {
  const setup = await TicketSetup.findOne({ guildId: guild.id });
  let parent = setup?.categoryId || null;
  if (!parent) return null;
  const catCheck = await guild.channels.fetch(parent).catch(() => null);
  if (!catCheck || catCheck.type !== ChannelType.GuildCategory) return null;
  if (setup && setup.enabled === false) return null;
  const overwrites = [
    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
    { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
  ];
  if (setup?.supportRoleId) {
    overwrites.push({ id: setup.supportRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
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
        if (m.attachments.size > 0) txt += `  -> Anhang: ${[...m.attachments.values()].map(a => a.url).join(', ')}\n`;
      }
    }
  } catch {}
  await Transcript.create({ guildId: guild.id, ticketUserId: t.userId, ticketUserTag: t.userTag, channelName: channel.name, transcript: txt, closedBy: closedBy.id, closedByTag: closedBy.tag });
  t.status = 'closed'; t.closedAt = new Date(); await t.save();
  const setup = await TicketSetup.findOne({ guildId: guild.id });
  if (setup?.logChannelId) {
    const logCh = guild.channels.cache.get(setup.logChannelId) || await guild.channels.fetch(setup.logChannelId).catch(() => null);
    if (logCh) {
      await logCh.send({ embeds: [new EmbedBuilder().setTitle('🔒 Ticket geschlossen').setDescription(`**Ticket:** ${channel.name}\n**Von:** <@${t.userId}> - \`${t.userTag}\`\n**Grund:** ${t.reason}\n**Geschlossen von:** ${closedBy} - \`${closedBy.tag}\`\n**Claimed von:** ${t.claimedByTag || 'Niemand'}`).setColor(0xFF0000).setTimestamp()], files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${channel.name}.txt` }] }).catch(() => {});
    }
  }
  try {
    const u = await guild.members.fetch(t.userId).catch(() => null);
    if (u) await u.send({ embeds: [new EmbedBuilder().setTitle('🔒 Dein Ticket wurde geschlossen').setDescription(`Dein Ticket **${channel.name}** auf **${guild.name}** wurde geschlossen.\n**Von:** ${closedBy.tag}\n**Grund:** ${t.reason}`).setColor(0xFF0000).setTimestamp()] }).catch(() => {});
  } catch {}
  return t;
}

// ============================================================================
// INTERACTION HANDLER - BUTTONS + SELECTS
// ============================================================================
client.on('interactionCreate', async (i) => {
  try {
    if (i.isButton()) {
      if (i.customId.startsWith('giveaway_')) {
        const gwId = i.customId.replace('giveaway_', '');
        const gw = await Giveaway.findById(gwId).catch(() => null);
        if (!gw || gw.ended) return i.reply({ content: 'Dieses Giveaway ist schon vorbei!', ephemeral: true }).catch(() => {});
        if (gw.participants.includes(i.user.id)) return i.reply({ content: 'Du nimmst schon teil!', ephemeral: true }).catch(() => {});
        gw.participants.push(i.user.id); await gw.save();
        return i.reply({ embeds: [new EmbedBuilder().setTitle('🎉 Du nimmst teil!').setDescription(`Du nimmst am Giveaway **${gw.prize}** teil! Viel Glück!`).setColor(0x00FF00).setTimestamp()], ephemeral: true }).catch(() => {});
      }
      if (i.customId === 'ticket_create') {
        await i.deferReply({ ephemeral: true }).catch(() => {});
        const setupCheck = await TicketSetup.findOne({ guildId: i.guild.id });
        if (!setupCheck?.categoryId) return i.editReply({ embeds: [new EmbedBuilder().setTitle('❌ Kein Ticket-System').setDescription('Ein Admin muss zuerst `!ticketkategorie <Kategorie-ID>` setzen!').setColor(0xFF0000).setTimestamp()] }).catch(() => {});
        const ex = await Ticket.findOne({ guildId: i.guild.id, userId: i.user.id, status: 'open' });
        if (ex) return i.editReply({ embeds: [new EmbedBuilder().setTitle('❌ Schon ein Ticket').setDescription(`Du hast schon ein Ticket: <#${ex.channelId}>`).setColor(0xFF0000).setTimestamp()] }).catch(() => {});
        const ch = await createTicketChannel(i.guild, i.user, 'Über Panel erstellt');
        if (!ch) return i.editReply({ embeds: [new EmbedBuilder().setTitle('❌ Fehler').setDescription('Ticket-Kategorie nicht gefunden! Admin muss `!ticketkategorie` neu setzen.').setColor(0xFF0000)] }).catch(() => {});
        await Ticket.create({ guildId: i.guild.id, userId: i.user.id, userTag: i.user.tag, channelId: ch.id, reason: 'Über Panel erstellt' });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Schließen').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('ticket_claim').setLabel('🙋 Claimen').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary));
        await ch.send({ content: `<@${i.user.id}>`, embeds: [new EmbedBuilder().setTitle('🎫 Neues Ticket!').setDescription(`Hey ${i.user}, willkommen in deinem Ticket!\n\n**Bitte beschreibe dein Anliegen so genau wie möglich.**\nEin Team-Mitglied meldet sich gleich bei dir.`).setColor(0x5865F2).addFields({ name: '👤 Erstellt von', value: `${i.user} - \`${i.user.tag}\``, inline: true }, { name: '📅 Erstellt am', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }).setTimestamp()], components: [row] }).catch(() => {});
        return i.editReply({ embeds: [new EmbedBuilder().setTitle('✅ Ticket erstellt!').setDescription(`Dein Ticket: ${ch}`).setColor(0x00FF00).setTimestamp()] }).catch(() => {});
      }
      if (i.customId === 'ticket_close') {
        await i.reply({ embeds: [new EmbedBuilder().setTitle('🔒 Ticket wird geschlossen...').setDescription(`Geschlossen von ${i.user} - Channel wird in 5 Sekunden gelöscht. Transcript wird gespeichert.`).setColor(0xFF0000).setTimestamp()] }).catch(() => {});
        const t = await closeTicket(i.channel, i.user, i.guild);
        if (!t) return i.followUp({ embeds: [new EmbedBuilder().setTitle('❌ Kein Ticket').setDescription('Dieser Channel ist kein offenes Ticket.').setColor(0xFF0000)], ephemeral: true }).catch(() => {});
        setTimeout(() => i.channel.delete().catch(() => {}), 5000); return;
      }
      if (i.customId === 'ticket_claim') {
        const t = await Ticket.findOne({ channelId: i.channel.id, status: 'open' });
        if (!t) return i.reply({ embeds: [new EmbedBuilder().setTitle('❌ Kein Ticket').setDescription('Kein offenes Ticket.').setColor(0xFF0000)], ephemeral: true }).catch(() => {});
        if (t.claimedBy) return i.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Schon geclaimt').setDescription(`Schon geclaimt von ${t.claimedByTag}`).setColor(0xFFAA00)], ephemeral: true }).catch(() => {});
        t.claimedBy = i.user.id; t.claimedByTag = i.user.tag; await t.save();
        return i.reply({ embeds: [new EmbedBuilder().setTitle('🙋 Ticket geclaimt!').setDescription(`${i.user} kümmert sich jetzt um dieses Ticket!`).setColor(0x00FF00).setTimestamp()] }).catch(() => {});
      }
      if (i.customId === 'ticket_transcript') {
        const t = await Ticket.findOne({ channelId: i.channel.id });
        if (!t) return i.reply({ content: 'Kein Ticket gefunden.', ephemeral: true }).catch(() => {});
        let txt = `Transcript für ${i.channel.name} - ${new Date().toISOString()}\n\n`;
        try { const msgs = await i.channel.messages.fetch({ limit: 100 }); const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp); for (const m of sorted) txt += `[${new Date(m.createdTimestamp).toLocaleString('de-DE')}] ${m.author.tag}: ${m.content || '[Embed/Bild]'}\n`; } catch {}
        return i.reply({ embeds: [new EmbedBuilder().setTitle('📄 Transcript').setDescription('Hier ist das Transcript bis jetzt:').setColor(0x00AAFF).setTimestamp()], files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${i.channel.name}.txt` }], ephemeral: true }).catch(() => {});
      }
    }
