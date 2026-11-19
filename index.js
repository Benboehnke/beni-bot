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

  // ============================================================================
// BENI BOT v8.0 - TEIL 2 / 3
// LEVEL + ECONOMY + FUN + GIVEAWAY + MODERATION + REPORT + MAIN HANDLER
// Fortsetzung von TEIL 1 - Einfach unter TEIL 1 einfügen!
// ============================================================================
// INHALT TEIL 2:
//  - Interaction: Select Menu Ticket Grund (Rest von Teil 1)
//  - Join / Voice / Logger
//  - Report System (Wörter, Highlight, Embed)
//  - Main Handler mit Prefix + Toggle-Check + Unbekannter Command
//  - Prefix Commands (!setprefix / !prefix / !toggle / !commands / !commandinfo / !setup)
//  - Ticket Commands (!ticketsetup / !ticketkategorie / !ticket / !close / !claim / !add / !remove / !transcript / !tickets)
//  - Mod Commands (!ban / !tempban / !unban / !kick / !mute / !unmute / !warn / !warnings / !unwarn / !clear / !slowmode / !nick)
//  - Level Commands (!rank / !leaderboard / !leveldashboard / !levelups / !setlevelrole / !multiplier / !givexp / !resetxp / !topvoice / !topchat / !daily)
//  - Fun Commands (!8ball / !meme / !poll / !giveaway / !suggest) - KEIN COINFLIP / KEIN GAMBLE
//  - Economy Commands (!balance / !pay / !work / !deposit / !withdraw)
// ============================================================================

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
      const setupCheck = await TicketSetup.findOne({ guildId: i.guild.id });
      if (!setupCheck?.categoryId) {
        return i.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('❌ Kein Ticket-System')
            .setDescription('Ein Admin muss zuerst `!ticketkategorie <Kategorie-ID>` setzen!')
            .setColor(0xFF0000)
          ]
        }).catch(() => {});
      }
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
            .setDescription('Ticket-Kategorie nicht gefunden! Admin muss `!ticketkategorie` neu setzen.')
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
    if (w && w.enabled) {
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
    if (jr && jr.enabled) {
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
    const cfg = await getGuildConfig(guildId).catch(() => null);
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
        const voiceXp = Math.floor(dur / 60000) * (cfg?.voiceXpPerMin || 2);
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
// REPORT SYSTEM - WÖRTER LISTE
// ============================================================================
const REPORT_WORDS = [
  "hurensohn", "huso", "wichser", "arschloch", "fotze", "bastard",
  "idiot", "spast", "behindert", "missgeburt", "schlampe", "hure",
  "fick dich", "fuck you", "halt dein maul", "verpiss dich", "kys",
  "bitch", "arsch", "dumm", "opfer", "hurenkind", "fotzenkind",
  "scheisse", "scheiße", "kacke"
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
  const cfg = await getGuildConfig(guild.id).catch(() => null);
  if (cfg && cfg.reportEnabled === false) return false;
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
// LOGGER - BEARBEITET / GELÖSCHT
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
// MAIN HANDLER
// ============================================================================
const xpCooldown = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

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

  // LOGGER - GESENDET
  try {
    const isLogCommand = isCommand && ['!messagelog','!dashboard','!dash','!website','!web'].includes(command);
    if (!isLogCommand) {
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

  // KEIN COMMAND -> AFK + REPORT + XP
  if (!isCommand) {
    const afk = await AFK.findOne({ guildId: message.guild.id, userId: message.author.id });
    if (afk) {
      await AFK.findOneAndDelete({ guildId: message.guild.id, userId: message.author.id });
      message.channel.send({ embeds: [new EmbedBuilder().setTitle('👋 Willkommen zurück!').setDescription(`${message.author} ist wieder da!\nWar AFK wegen: **${afk.reason}**`).setColor(0x00FF00).setTimestamp()] }).catch(() => {});
    }
    if (message.mentions.users.size > 0) {
      for (const [, u] of message.mentions.users) {
        const tAfk = await AFK.findOne({ guildId: message.guild.id, userId: u.id });
        if (tAfk) message.channel.send({ embeds: [new EmbedBuilder().setTitle('💤 User ist AFK').setDescription(`${u} ist gerade AFK.\n**Grund:** ${tAfk.reason}`).setColor(0xFFAA00).setTimestamp()] }).catch(() => {});
      }
    }
    const found = findReportWords(message.content);
    if (found.length) {
      const ids = await getReportChannels(message.guild.id);
      if (!ids.includes(message.channel.id)) await sendReportEmbed(message.guild, message.author, null, message.content, message.channel, message.url, 'auto');
    }
    // XP
    const cfg = await getGuildConfig(message.guild.id).catch(() => null);
    if (cfg && cfg.levelEnabled === false) return;
    const key = `${message.guild.id}-${message.author.id}`;
    if (!xpCooldown.has(key) || Date.now() - xpCooldown.get(key) > 60000) {
      xpCooldown.set(key, Date.now());
      try {
        let user = await getOrCreateLevel(message.author.id, message.guild.id);
        user.messages += 1; user.lastMessageAt = new Date();
        let mult = 1;
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) {
          const mults = await Multiplier.find({ guildId: message.guild.id });
          for (const m of mults) if (member.roles.cache.has(m.roleId)) mult = Math.max(mult, m.multiplier);
        }
        const min = cfg?.xpPerMessageMin || 5; const max = cfg?.xpPerMessageMax || 15;
        const gained = Math.floor((Math.floor(Math.random() * (max - min + 1)) + min) * mult);
        user.xp += gained; user.totalXp += gained;
        if (user.xp >= getNeededXp(user.level)) {
          user.xp -= getNeededXp(user.level); user.level += 1; await user.save();
          if (member) await handleLevelUp(member, user, message.channel);
        } else await user.save();
        try { await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins: cfg?.coinsPerMessage || 2 } }, { upsert: true, new: true }); } catch {}
      } catch (e) { console.log('Level Fehler:', e.message); }
    } else {
      try { await Level.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { messages: 1 } }, { upsert: true }); } catch {}
    }
    return;
  }

  // COMMAND NICHT GEFUNDEN -> FEHLER EMBED
  if (!ALL_COMMANDS.includes(command)) {
    await reactDone(message);
    return embedReply(message, '❌ Command nicht gefunden!', `Der Command \`${prefix}${command.slice(1)}\` existiert nicht!\n\nSchau dir alle Commands mit \`${prefix}help\` an.\n\n**Tipp:** Mit \`${prefix}commands\` siehst du welche Commands an/aus sind.`, 0xFF0000);
  }

  // COMMAND AUSGESCHALTET? -> FEHLER EMBED
  const cmdNameClean = command.slice(1);
  const enabled = await isCommandEnabled(message.guild.id, cmdNameClean);
  if (!enabled) {
    await reactDone(message);
    return embedReply(message, '⛔ Command deaktiviert!', `Der Command \`${prefix}${cmdNameClean}\` ist auf diesem Server **deaktiviert**!\n\nEin Admin kann ihn wieder anmachen mit:\n\`${prefix}toggle ${cmdNameClean} on\``, 0xFFAA00);
  }

  await reactStart(message);
  await saveCommand(message, command);
  if (isModCommand(command)) setTimeout(() => message.delete().catch(() => {}), 3000);

  const getMember = async (idOrMention) => {
    const id = idOrMention?.replace(/[<@!>]/g, '');
    if (!id) return null;
    return message.guild.members.cache.get(id) || await message.guild.members.fetch(id).catch(() => null);
  };
  const getUserById = async (id) => {
    const clean = id?.replace(/[<@!>]/g, '');
    if (!clean) return null;
    return client.users.cache.get(clean) || await client.users.fetch(clean).catch(() => null);
  };

  // ==========================================================================
  // SETUP - !toggle - JEDEN COMMAND AN/AUS
  // ==========================================================================
  if (command === '!toggle') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins können Commands an/aus machen!');
    const target = args[0]?.toLowerCase().replace('!', '');
    const state = args[1]?.toLowerCase();
    if (!target || !['on','off','an','aus'].includes(state)) {
      return fail(message, `Benutzung: \`${prefix}toggle ban off\` oder \`${prefix}toggle ban on\`\n\nBeispiele:\n\`${prefix}toggle ban off\` = !ban geht nicht mehr\n\`${prefix}toggle rank on\` = !rank geht wieder\n\nAlle Commands: \`${prefix}commands\``);
    }
    if (!ALL_COMMANDS.includes('!' + target)) return fail(message, `Command \`!${target}\` existiert nicht! Schau mit \`${prefix}commands\``);
    const isOn = ['on','an'].includes(state);
    await CommandToggle.findOneAndUpdate({ guildId: message.guild.id, command: target }, { enabled: isOn }, { upsert: true, new: true });
    return success(message, `Command \`!${target}\` ist jetzt **${isOn ? 'AN ✅' : 'AUS ⛔'}**!\n\n${isOn ? 'User können ihn jetzt wieder benutzen.' : 'User bekommen jetzt einen Fehler wenn sie ihn benutzen.'}`);
  }

  // ==========================================================================
  // SETUP - !commands - ALLE COMMANDS + STATUS
  // ==========================================================================
  if (command === '!commands') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const toggles = await getCommandToggleList(message.guild.id);
    const cats = {};
    for (const c of COMMANDS_LIST) {
      if (!cats[c.category]) cats[c.category] = [];
      const isOn = toggles[c.name] !== false;
      cats[c.category].push(`${isOn ? '🟢' : '🔴'} \`${prefix}${c.name}\``);
    }
    let desc = '';
    for (const [cat, list] of Object.entries(cats)) desc += `**${cat}**\n${list.join(' ')}\n\n`;
    await reactDone(message);
    return embedReply(message, '⚙️ Commands Status', desc.slice(0, 3900) + `\n\n**An/Aus machen:** \`${prefix}toggle <command> on/off\`\n**Info:** \`${prefix}commandinfo <command>\``, 0x00AAFF);
  }

  // ==========================================================================
  // SETUP - !commandinfo
  // ==========================================================================
  if (command === '!commandinfo') {
    const target = args[0]?.toLowerCase().replace('!', '');
    if (!target) return fail(message, `Benutzung: \`${prefix}commandinfo ban\``);
    const info = COMMANDS_LIST.find(c => c.name === target);
    if (!info) return fail(message, `Command \`!${target}\` nicht gefunden!`);
    const enabled = await isCommandEnabled(message.guild.id, target);
    await reactDone(message);
    return embedReply(message, `ℹ️ Command Info - !${info.name}`, `**Beschreibung:** ${info.desc}\n**Kategorie:** ${info.category}\n**Benutzung:** \`${info.usage.replace('!', prefix)}\`\n**Braucht Recht:** ${info.perm}\n**Status:** ${enabled ? '🟢 AN' : '🔴 AUS'}\n**Löscht sich nach 3 Sek.:** ${info.modDelete ? 'Ja (Mod-Command)' : 'Nein'}`, 0x5865F2, { fields: [{ name: '⚙️ An/Aus', value: `\`${prefix}toggle ${info.name} on/off\``, inline: true }] });
  }

  // ==========================================================================
  // SETUP - !setup - KOMPLETTE ÜBERSICHT
  // ==========================================================================
  if (command === '!setup') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const cfg = await getGuildConfig(message.guild.id);
    const ticketSetup = await TicketSetup.findOne({ guildId: message.guild.id });
    const welcome = await WelcomeConfig.findOne({ guildId: message.guild.id });
    const logId = await getLogChannel(message.guild.id);
    const reportIds = await getReportChannels(message.guild.id);
    const join = await JoinRole.findOne({ guildId: message.guild.id });
    const toggles = await getCommandToggleList(message.guild.id);
    const offCount = Object.values(toggles).filter(v => v === false).length;
    const total = COMMANDS_LIST.length;
    await reactDone(message);
    return embedReply(message, `⚙️ Setup - ${message.guild.name}`, 'Komplette Übersicht was eingestellt ist:', 0x00AAFF, {
      fields: [
        { name: '🔤 Prefix', value: `\`${prefix}\``, inline: true },
        { name: '🎫 Ticket', value: ticketSetup?.categoryId ? `✅ Kategorie: <#${ticketSetup.categoryId}>` : '❌ Keine Kategorie! `!ticketkategorie <ID>`', inline: true },
        { name: '🎫 Ticket Panel', value: ticketSetup?.channelId ? `<#${ticketSetup.channelId}>` : '❌ Kein Panel', inline: true },
        { name: '👋 Welcome', value: welcome ? `✅ <#${welcome.channelId}>` : '❌ Aus', inline: true },
        { name: '📝 Message Log', value: logId ? `✅ <#${logId}>` : '❌ Aus', inline: true },
        { name: '🚨 Report Channels', value: reportIds.length ? reportIds.map(id => `<#${id}>`).join(', ') : '❌ Keine', inline: true },
        { name: '👋 Join-Rolle', value: join ? `<@&${join.roleId}>` : '❌ Keine', inline: true },
        { name: '📊 Level System', value: cfg.levelEnabled ? '🟢 AN' : '🔴 AUS', inline: true },
        { name: '💰 Economy', value: cfg.economyEnabled ? '🟢 AN' : '🔴 AUS', inline: true },
        { name: '⚙️ Commands', value: `${total - offCount}/${total} AN • ${offCount} AUS`, inline: true },
        { name: '✨ XP pro Nachricht', value: `${cfg.xpPerMessageMin}-${cfg.xpPerMessageMax} XP`, inline: true },
        { name: '💰 Coins pro Nachricht', value: `${cfg.coinsPerMessage} Coins`, inline: true },
        { name: '🎙️ Voice XP', value: `${cfg.voiceXpPerMin} XP / Min`, inline: true },
        { name: '🎁 Daily', value: `${cfg.dailyXpMin}-${cfg.dailyXpMax} XP + ${cfg.dailyCoins} Coins`, inline: true },
        { name: '💡 Alles ändern mit', value: `\`${prefix}toggle <command> on/off\`\n\`${prefix}ticketkategorie <ID>\`\n\`${prefix}setprefix <neu>\`\n\`${prefix}help\``, inline: false }
      ]
    });
  }

  // ==========================================================================
  // !setprefix
  // ==========================================================================
  if (command === '!setprefix') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins können den Prefix ändern!');
    const newPrefix = args[0];
    if (!newPrefix) {
      const cur = await getPrefix(message.guild.id);
      return embedReply(message, '🔤 Aktueller Prefix', `Aktueller Prefix ist: \`${cur}\`\n\n**Benutzung:** \`${cur}setprefix ?\`\nDanach heißen alle Commands z.B. \`?ban\`, \`?mute\`, \`?rank\`, \`?ticket\`\n\n**Erlaubt:** \`!\` \`?\` \`.\` \`+\` \`$\` \`>\` \`<\` \`/\` \`*\` \`#\` \`&\` \`=\` \`-\` \`_\``, 0x5865F2);
    }
    if (newPrefix.length > 3) return fail(message, 'Der Prefix darf maximal 3 Zeichen lang sein! Beispiel: `!setprefix ?`');
    if (newPrefix.includes(' ')) return fail(message, 'Der Prefix darf kein Leerzeichen enthalten!');
    await Prefix.findOneAndUpdate({ guildId: message.guild.id }, { prefix: newPrefix }, { upsert: true, new: true });
    return success(message, `Prefix geändert!\n\n**Neuer Prefix:** \`${newPrefix}\`\n\nAb jetzt: \`${newPrefix}help\`, \`${newPrefix}ban\`, \`${newPrefix}rank\`, \`${newPrefix}ticket\` usw.`);
  }

  // ==========================================================================
  // !prefix
  // ==========================================================================
  if (command === '!prefix') {
    const cur = await getPrefix(message.guild.id);
    await reactDone(message);
    return embedReply(message, '🔤 Prefix', `Aktueller Prefix auf diesem Server ist: \`${cur}\`\n\nBeispiel: \`${cur}help\` - \`${cur}rank\` - \`${cur}ticket\`\n\nÄndern mit: \`${cur}setprefix ?\``, 0x00AAFF);
  }

  // ==========================================================================
  // !ticketsetup
  // ==========================================================================
  if (command === '!ticketsetup') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const ch = message.mentions.channels.first() || message.channel;
    const supportRole = message.mentions.roles.first();
    const logCh = message.mentions.channels.at(1);
    await TicketSetup.findOneAndUpdate({ guildId: message.guild.id }, { channelId: ch.id, supportRoleId: supportRole?.id || null, logChannelId: logCh?.id || null }, { upsert: true, new: true });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_create').setLabel('🎫 Ticket erstellen').setStyle(ButtonStyle.Primary));
    const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('ticket_reason').setPlaceholder('📂 Wähle einen Grund aus...').addOptions([
      { label: 'Support / Hilfe', value: 'support', emoji: '🆘' },
      { label: 'User melden', value: 'report', emoji: '🚨' },
      { label: 'Bug / Fehler melden', value: 'bug', emoji: '🐛' },
      { label: 'Bewerbung', value: 'bewerbung', emoji: '📝' },
      { label: 'Sonstiges', value: 'sonstiges', emoji: '💬' }
    ]));
    const panel = await ch.send({
      embeds: [new EmbedBuilder()
        .setTitle('🎫 TICKET SYSTEM')
        .setDescription(`Hey! Brauchst du Hilfe?\n\n**Klicke auf den Button** oder wähle unten einen Grund aus, um ein Ticket zu erstellen.\n\nEin Team-Mitglied meldet sich dann so schnell wie möglich bei dir!\n\n> Bitte erstelle kein Ticket aus Spaß!`)
        .setColor(0x5865F2)
        .addFields(
          { name: '📂 Kategorien', value: '🆘 Support / Hilfe\n🚨 User melden\n🐛 Bug melden\n📝 Bewerbung\n💬 Sonstiges', inline: false },
          { name: '⏰ Antwortzeit', value: 'Meist innerhalb von 24h', inline: true }
        )
        .setThumbnail(message.guild.iconURL())
        .setTimestamp()
      ],
      components: [row, menu]
    });
    await TicketSetup.findOneAndUpdate({ guildId: message.guild.id }, { panelMessageId: panel.id });
    return success(message, `Ticket-Panel wurde in ${ch} erstellt!${supportRole ? `\nSupport-Rolle: ${supportRole}` : ''}${logCh ? `\nLog-Channel: ${logCh}` : ''}\n\n**WICHTIG:** Vergiss nicht \`${prefix}ticketkategorie <ID>\` zu setzen, sonst geht kein Ticket!`);
  }

  // ==========================================================================
  // !ticketkategorie - PFLICHT!
  // ==========================================================================
  if (command === '!ticketkategorie') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins können die Ticket-Kategorie setzen!');
    const catId = args[0]?.replace(/[<#>]/g, '');
    if (!catId) return fail(message, `Benutzung: \`${prefix}ticketkategorie <Kategorie-ID>\`\n\nBeispiel: \`${prefix}ticketkategorie 123456789012345678\`\n\nSo kriegst du die ID: Rechtsklick auf Kategorie -> ID kopieren (Entwicklermodus an!)`);
    const cat = await message.guild.channels.fetch(catId).catch(() => null);
    if (!cat || cat.type !== ChannelType.GuildCategory) return fail(message, 'Das ist keine Kategorie! Nimm die ID von einer Kategorie, nicht von einem Textkanal.');
    await TicketSetup.findOneAndUpdate({ guildId: message.guild.id }, { categoryId: catId }, { upsert: true, new: true });
    return success(message, `Ticket-Kategorie gesetzt!\n\n**Kategorie:** ${cat.name}\n**ID:** \`${catId}\`\n\nJetzt geht \`${prefix}ticket\` wieder!`);
  }

  // ==========================================================================
  // !ticket
  // ==========================================================================
  if (command === '!ticket') {
    const setupCheck = await TicketSetup.findOne({ guildId: message.guild.id });
    if (!setupCheck?.categoryId) return fail(message, `Kein Ticket-System eingerichtet!\n\nEin Admin muss zuerst machen:\n\`${prefix}ticketkategorie <Kategorie-ID>\``);
    const ex = await Ticket.findOne({ guildId: message.guild.id, userId: message.author.id, status: 'open' });
    if (ex) return fail(message, `Du hast schon ein Ticket: <#${ex.channelId}>`);
    const reason = args.join(' ') || 'Über Command erstellt';
    const ch = await createTicketChannel(message.guild, message.author, reason);
    if (!ch) return fail(message, 'Ticket-Kategorie nicht gefunden! Admin muss `!ticketkategorie` neu setzen.');
    await Ticket.create({ guildId: message.guild.id, userId: message.author.id, userTag: message.author.tag, channelId: ch.id, reason });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Schließen').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('ticket_claim').setLabel('🙋 Claimen').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('ticket_transcript').setLabel('📄 Transcript').setStyle(ButtonStyle.Secondary));
    await ch.send({ content: `<@${message.author.id}>`, embeds: [new EmbedBuilder().setTitle('🎫 Neues Ticket!').setDescription(`Hey ${message.author}!\n\n**Grund:** ${reason}\nBitte beschreibe dein Anliegen genau.`).setColor(0x5865F2).setTimestamp()], components: [row] });
    return success(message, `Dein Ticket wurde erstellt: ${ch}\n**Grund:** ${reason}`);
  }

  // ==========================================================================
  // !close / !claim / !add / !remove / !transcript / !tickets
  // ==========================================================================
  if (command === '!close') {
    const t = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
    if (!t) return fail(message, 'Dieser Channel ist kein offenes Ticket!');
    await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🔒 Ticket wird geschlossen...').setDescription(`Geschlossen von ${message.author} - Channel wird in 5 Sekunden gelöscht. Transcript wird gespeichert.`).setColor(0xFF0000).setTimestamp()] });
    await closeTicket(message.channel, message.author, message.guild);
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
    return;
  }
  if (command === '!claim') {
    const t = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
    if (!t) return fail(message, 'Kein offenes Ticket in diesem Channel!');
    if (t.claimedBy) return fail(message, `Schon geclaimt von ${t.claimedByTag}`);
    t.claimedBy = message.author.id; t.claimedByTag = message.author.tag; await t.save();
    return success(message, `🙋 ${message.author} kümmert sich jetzt um dieses Ticket!`);
  }
  if (command === '!add' || command === '!ticketadd') {
    const t = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
    if (!t) return fail(message, 'Nur in Tickets!');
    const u = message.mentions.members.first() || (args[0] ? await getMember(args[0]) : null);
    if (!u) return fail(message, `Benutzung: \`${prefix}add @User\``);
    await message.channel.permissionOverwrites.edit(u, { ViewChannel: true, SendMessages: true });
    return success(message, `${u} wurde zum Ticket hinzugefügt!`);
  }
  if (command === '!remove' || command === '!ticketremove') {
    const t = await Ticket.findOne({ channelId: message.channel.id, status: 'open' });
    if (!t) return fail(message, 'Nur in Tickets!');
    const u = message.mentions.members.first() || (args[0] ? await getMember(args[0]) : null);
    if (!u) return fail(message, `Benutzung: \`${prefix}remove @User\``);
    await message.channel.permissionOverwrites.edit(u, { ViewChannel: false, SendMessages: false });
    return success(message, `${u} wurde aus dem Ticket entfernt!`);
  }
  if (command === '!transcript') {
    const t = await Ticket.findOne({ channelId: message.channel.id });
    if (!t) return fail(message, 'Kein Ticket in diesem Channel!');
    let txt = `Transcript ${message.channel.name}\n`;
    try { const msgs = await message.channel.messages.fetch({ limit: 100 }); const sorted = [...msgs.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp); for (const m of sorted) txt += `[${new Date(m.createdTimestamp).toLocaleString('de-DE')}] ${m.author.tag}: ${m.content || '[Embed/Bild]'}\n`; } catch {}
    await reactDone(message);
    return message.reply({ embeds: [new EmbedBuilder().setTitle('📄 Transcript').setDescription('Hier ist das Transcript:').setColor(0x00AAFF).setTimestamp()], files: [{ attachment: Buffer.from(txt, 'utf-8'), name: `transcript-${message.channel.name}.txt` }] });
  }
  if (command === '!tickets') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Nur Team!');
    const open = await Ticket.find({ guildId: message.guild.id, status: 'open' });
    if (!open.length) return embedReply(message, '🎫 Offene Tickets', 'Es gibt gerade **keine** offenen Tickets. 🎉', 0x00FF00);
    const list = open.map(t => `<#${t.channelId}> - <@${t.userId}> - **${t.reason}** - Geclaimt: ${t.claimedByTag || 'Niemand'}`).join('\n');
    await reactDone(message);
    return embedReply(message, `🎫 Offene Tickets - ${open.length}`, list, 0x5865F2);
  }

  // ==========================================================================
  // !savedids
  // ==========================================================================
  if (command === '!savedids') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const logs = await CommandLog.find({ guildId: message.guild.id }).sort({ createdAt: -1 }).limit(10);
    if (!logs.length) return embedReply(message, '💾 Gespeicherte IDs', 'Noch keine Commands gespeichert.', 0x00AAFF);
    const desc = logs.map(l => `\`${l.command}\` von <@${l.userId}> in <#${l.channelId}>\nUser: \`${l.targetUserId || '-'}\` | Role: \`${l.targetRoleId || '-'}\` | Channel: \`${l.targetChannelId || '-'}\``).join('\n\n');
    await reactDone(message);
    return embedReply(message, '💾 Gespeicherte IDs - Letzte 10', desc, 0x00AAFF);
  }

  // ==========================================================================
  // !id - UNSICHTBAR
  // ==========================================================================
  if (command === '!id') {
    await message.delete().catch(() => {});
    const target = message.mentions.users.first() || message.author;
    try { await message.author.send(`Hier zum Kopieren:\n\`${target.id}\``); } catch {
      const m = await message.channel.send(`${message.author}, mach deine DMs an, dann schick ich dir die ID privat!`);
      setTimeout(() => m.delete().catch(() => {}), 5000);
    }
    return;
  }

  // ==========================================================================
  // MOD - !ban
  // ==========================================================================
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return fail(message, 'Nö, du darfst niemanden bannen!');
    let u = message.mentions.members.first(); if (!u && args[0]) u = await getMember(args[0]);
    if (!u) return fail(message, `Wen soll ich bannen? Beispiel: \`${prefix}ban @Max nervt\``);
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.bannable) return fail(message, 'Den kann ich leider nicht bannen, der steht über mir!');
    try { await u.send({ embeds: [new EmbedBuilder().setTitle('⛔ Du wurdest gebannt').setDescription(`Vom Server **${message.guild.name}**\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}`).setColor(0xFF0000).setTimestamp()] }); } catch {}
    await u.ban({ reason });
    return success(message, `${u} wurde von **${message.guild.name}** gebannt.\n**Grund:** ${reason}`);
  }
  if (command === '!tempban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return fail(message, 'Keine Rechte!');
    let u = message.mentions.members.first(); if (!u && args[0]) u = await getMember(args[0]);
    if (!u) return fail(message, `Benutzung: \`${prefix}tempban @User 1d Grund\``);
    const ms = parseDuration(args[1]); if (!ms) return fail(message, `Benutzung: \`${prefix}tempban @User 1d Grund\``);
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    await u.ban({ reason: `Tempban ${formatDuration(ms)} - ${reason}` }).catch(() => {});
    setTimeout(async () => { try { await message.guild.bans.remove(u.id); } catch {} }, ms);
    return success(message, `${u} wurde von **${message.guild.name}** für **${formatDuration(ms)}** gebannt.\n**Grund:** ${reason}`);
  }
  if (command === '!unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return fail(message, 'Keine Rechte!');
    const uid = args[0]?.replace(/[<@!>]/g, '');
    if (!uid) return fail(message, `Benutzung: \`${prefix}unban <User-ID>\``);
    try { await message.guild.bans.remove(uid); const u = await getUserById(uid); return success(message, `${u ? `${u}` : `\`${uid}\``} wurde von **${message.guild.name}** entbannt!`); } catch { return fail(message, 'User nicht gefunden oder nicht gebannt!'); }
  }
  if (command === '!kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return fail(message, 'Du darfst niemanden kicken!');
    let u = message.mentions.members.first(); if (!u && args[0]) u = await getMember(args[0]);
    if (!u) return fail(message, `Wen soll ich kicken? \`${prefix}kick @Max nervt\``);
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!u.kickable) return fail(message, 'Den kann ich nicht kicken!');
    await u.kick(reason);
    return success(message, `**${u.user.tag}** wurde gekickt!\n**Grund:** ${reason}`);
  }
  if (command === '!clear' || command === '!purge') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return fail(message, 'Du darfst keine Nachrichten löschen!');
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return fail(message, `Benutzung: \`${prefix}clear 10\` oder \`${prefix}clear 10 @Max\``);
    const target = message.mentions.members.first() || (args[1] ? await getMember(args[1]) : null);
    await message.delete().catch(() => {});
    if (target) {
      const fetched = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
      if (!fetched) return fail(message, 'Konnte Nachrichten nicht laden!');
      const toDel = fetched.filter(m => m.author.id === target.id).first(amount);
      await message.channel.bulkDelete(toDel, true).catch(() => {});
      const r = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Erfolgreich!').setDescription(`Sauber! **${toDel.size}** Nachrichten von ${target} weggeputzt!`).setTimestamp()] });
      deleteAfter(r, 5000); return;
    }
    await message.channel.bulkDelete(amount, true).catch(() => {});
    const r = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Erfolgreich!').setDescription(`Sauber! **${amount}** Nachrichten weggeputzt!`).setTimestamp()] });
    deleteAfter(r, 5000); return;
  }
  if (command === '!mute' || command === '!timeout') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Du darfst niemanden muten!');
    let u = message.mentions.members.first(); if (!u && args[0]) u = await getMember(args[0]);
    if (!u) return fail(message, `Wen soll ich muten? \`${prefix}mute @Max 10m spammt\``);
    const ms = parseDuration(args[1]); if (!ms) return fail(message, `Wie lange? \`${prefix}mute @Max 10m spammt\``);
    const reason = args.slice(2).join(' ') || 'Kein Grund angegeben';
    try { await u.send({ embeds: [new EmbedBuilder().setTitle('🔇 Du wurdest gemutet').setDescription(`Server: **${message.guild.name}**\n**Dauer:** ${args[1]}\n**Grund:** ${reason}\n**Von:** ${message.author.tag}`).setColor(0xFFAA00).setTimestamp()] }); } catch {}
    await u.timeout(ms, reason);
    return success(message, `${u} wurde für **${formatDuration(ms)}** gemutet.\n**Grund:** ${reason}`);
  }
  if (command === '!unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Keine Rechte!');
    let t = message.mentions.members.first(); if (!t && args[0]) t = await getMember(args[0]);
    if (!t) return fail(message, `Benutzung: \`${prefix}unmute @User\``);
    try { await t.timeout(null); try { await t.send({ embeds: [new EmbedBuilder().setTitle('🔊 Du wurdest entmutet!').setDescription('Du darfst wieder schreiben.').setColor(0x00FF00).setTimestamp()] }); } catch {} return success(message, `${t} wurde entmutet!`); } catch { return fail(message, 'Konnte User nicht entmuten!'); }
  }
  if (command === '!warn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Du brauchst Moderate Members!');
    let t = message.mentions.members.first(); if (!t && args[0]) t = await getMember(args[0]);
    if (!t) return fail(message, `Benutzung: \`${prefix}warn @User 10m Grund\` oder \`${prefix}warn @User Grund\``);
    let durStr = null; let reason = ''; const maybeDur = parseDuration(args[1]);
    if (maybeDur) { durStr = args[1]; reason = args.slice(2).join(' ') || 'Kein Grund angegeben'; } else reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    await Warn.create({ guildId: message.guild.id, userId: t.id, userTag: t.user.tag, reason, warnedBy: message.author.id, warnedByTag: message.author.tag, duration: durStr });
    const count = await Warn.countDocuments({ guildId: message.guild.id, userId: t.id });
    try { await t.send({ embeds: [new EmbedBuilder().setTitle('⚠️ Du wurdest verwarnt!').setDescription(`Server: **${message.guild.name}**\n**Grund:** ${reason}${durStr ? `\n**Dauer:** ${formatDuration(parseDuration(durStr))}` : ''}\n**Warns insgesamt:** ${count}`).setColor(0xFFAA00).setTimestamp()] }); } catch {}
    return success(message, `${t} wurde${durStr ? ` für **${formatDuration(parseDuration(durStr))}` : ''} gewarnt.\n**Grund:** ${reason}\n**Warns insgesamt:** ${count}`);
  }
  if (command === '!warnings') {
    const t = message.mentions.users.first() || (args[0] ? await getUserById(args[0]) : null) || message.author;
    const warns = await Warn.find({ guildId: message.guild.id, userId: t.id }).sort({ createdAt: -1 }).limit(10);
    if (!warns.length) { await reactDone(message); return embedReply(message, `⚠️ Warns - ${t.username}`, `${t} hat **0 Warns**. Sauber! ✅`, 0x00FF00); }
    const list = warns.map((w, i) => `**${i + 1}.** ${w.reason}${w.duration ? ` (Dauer: ${w.duration})` : ''}\nVon: ${w.warnedByTag} • <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:D>`).join('\n\n');
    await reactDone(message);
    return embedReply(message, `⚠️ Warns - ${t.username}`, `${t} hat **${warns.length} Warns**:`, 0xFFAA00, { fields: [{ name: '📋 Liste', value: list.slice(0, 1000), inline: false }] });
  }
  if (command === '!unwarn') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return fail(message, 'Du brauchst Moderate Members!');
    let t = message.mentions.users.first(); if (!t && args[0]) t = await getUserById(args[0]);
    if (!t) return fail(message, `Benutzung: \`${prefix}unwarn @User\``);
    const last = await Warn.findOne({ guildId: message.guild.id, userId: t.id }).sort({ createdAt: -1 });
    if (!last) return fail(message, `${t} hat keine Warns!`);
    await Warn.findByIdAndDelete(last._id);
    return success(message, `Ein Warn von ${t} wurde entfernt!\n**Entfernter Grund war:** ${last.reason}`);
  }
  if (command === '!slowmode') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return fail(message, 'Du brauchst Kanäle verwalten!');
    const sec = parseInt(args[0]);
    if (isNaN(sec) || sec < 0 || sec > 21600) return fail(message, `Benutzung: \`${prefix}slowmode 5\` (0-21600 Sekunden, 0 = aus)`);
    await message.channel.setRateLimitPerUser(sec);
    if (sec === 0) return success(message, 'Slowmode ist jetzt **AUS** in diesem Channel!');
    return success(message, `Slowmode ist jetzt **${sec} Sekunden** in diesem Channel!`);
  }
  if (command === '!nick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) return fail(message, 'Du brauchst Nicknames verwalten!');
    let t = message.mentions.members.first(); if (!t && args[0]) t = await getMember(args[0]);
    if (!t) return fail(message, `Benutzung: \`${prefix}nick @User NeuerName\``);
    const newNick = args.slice(1).join(' ');
    if (!newNick) return fail(message, `Benutzung: \`${prefix}nick @User NeuerName\``);
    try { await t.setNickname(newNick); return success(message, `Nickname von ${t} ist jetzt **${newNick}**!`); } catch { return fail(message, 'Konnte Nickname nicht ändern! Meine Rolle ist zu niedrig.'); }
  }

  // ==========================================================================
  // LEVEL - !rank - MIT KORREKTER XP-BERECHNUNG
  // ==========================================================================
  if (message.content.toLowerCase().startsWith('!rank')) {
    try {
      await message.react('✅').catch(() => {});
      const myData = await Level.findOne({ guildId: message.guild.id, userId: message.author.id });
      if (!myData) {
        const noXpEmbed = new EmbedBuilder().setTitle('🔵 BENI BOT - RANK').setDescription('Du hast noch keine XP!\nSchreib erstmal was im Chat.').setColor('#1a4dff').setThumbnail(message.author.displayAvatarURL());
        return message.channel.send({ embeds: [noXpEmbed] });
      }
      const myXp = myData.xp; const myLevel = myData.level;
      const betterCount = await Level.countDocuments({ guildId: message.guild.id, xp: { $gt: myXp } });
      const myRank = betterCount + 1;
      const messages = myData.messages || 0;
      const voiceSeconds = myData.voiceTime || 0;
      const voiceHours = Math.floor(voiceSeconds / 3600); const voiceMins = Math.floor((voiceSeconds % 3600) / 60);
      const voiceText = voiceHours > 0 ? `${voiceHours}h ${voiceMins}m` : `${voiceMins}m`;
      const xpForNextLevel = 5 * myLevel * myLevel + 50 * myLevel + 100;
      const xpForCurrentLevel = 5 * (myLevel - 1) * (myLevel - 1) + 50 * (myLevel - 1) + 100;
      const progressXp = myXp - xpForCurrentLevel;
      const neededXp = xpForNextLevel - xpForCurrentLevel;
      const percent = Math.max(0, Math.min(100, Math.floor((progressXp / neededXp) * 100)));
      const left = neededXp - progressXp;
      const filled = Math.floor(percent / 5);
      const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
      const embed = new EmbedBuilder().setTitle('🔵 BENI BOT - RANK').setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() }).setThumbnail(message.author.displayAvatarURL()).setColor('#1a4dff')
        .addFields(
          { name: '🏆 Rang', value: `#${myRank}`, inline: true },
          { name: '⭐ Level', value: `${myLevel}`, inline: true },
          { name: '✨ XP Gesamt', value: `${myXp} XP`, inline: true },
          { name: '💬 Messages', value: `${messages.toLocaleString('de-DE')}`, inline: true },
          { name: '🎙️ Voice Time', value: `${voiceText}`, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: `📈 Fortschritt zu Level ${myLevel + 1}`, value: `${bar}\n\`${progressXp} / ${neededXp} XP\` • **${percent}%**\nNoch **${left} XP** bis Level ${myLevel + 1}`, inline: false }
        ).setFooter({ text: 'Beni Bot • Schreibe weiter um aufzusteigen!' }).setTimestamp();
      await message.channel.send({ embeds: [embed] });
    } catch (err) { console.log('RANK FEHLER:', err); await message.channel.send('Rank-Fehler, check Render Logs!'); }
    return;
  }
  if (command === '!leaderboard' || command === '!lb') {
    const top = await Level.find({ guildId: message.guild.id }).sort({ level: -1, xp: -1 }).limit(10);
    if (!top.length) return fail(message, 'Noch keiner auf dem Leaderboard!');
    let desc = ''; const medals = ['🥇', '🥈', '🥉'];
    for (let i = 0; i < top.length; i++) {
      const u = top[i]; const m = await message.guild.members.fetch(u.userId).catch(() => null);
      const n = m ? m.user.username : 'Unbekannt';
      desc += `${medals[i] || `**${i + 1}.**`} **${n}** - Level ${u.level} | ${u.xp} XP | 💬 ${u.messages} | 🎙️ ${formatVoice(u.voiceTime)}\n`;
    }
    await reactDone(message);
    return embedReply(message, `🏆 Leaderboard - ${message.guild.name}`, desc, 0xFFD700, { thumb: message.guild.iconURL() });
  }
  if (command === '!leveldashboard') {
    const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
    const tu = await Level.countDocuments({ guildId: message.guild.id });
    const topU = await Level.findOne({ guildId: message.guild.id }).sort({ level: -1, xp: -1 });
    const tot = await Level.aggregate([{ $match: { guildId: message.guild.id } }, { $group: { _id: null, total: { $sum: '$totalXp' }, msgs: { $sum: '$messages' }, voice: { $sum: '$voiceTime' } } }]);
    const lrs = await LevelRole.find({ guildId: message.guild.id }).sort({ level: 1 });
    let topN = 'Niemand';
    if (topU) { const m = await message.guild.members.fetch(topU.userId).catch(() => null); topN = m ? `${m.user.username} (Level ${topU.level})` : `Level ${topU.level}`; }
    const ct = cfg?.levelupChannelId ? `<#${cfg.levelupChannelId}>` : 'Nicht gesetzt';
    const rt = lrs.length ? lrs.map(r => `Level ${r.level} -> <@&${r.roleId}>`).join('\n') : 'Keine Level-Rollen gesetzt';
    await reactDone(message);
    return embedReply(message, `📊 Level Dashboard - ${message.guild.name}`, 'Übersicht über das Level-System', 0x00AAFF, { thumb: message.guild.iconURL(), fields: [
      { name: '👥 User mit XP', value: `${tu}`, inline: true },
      { name: '✨ Gesamt XP', value: `${tot[0]?.total || 0}`, inline: true },
      { name: '🏆 Top User', value: topN, inline: true },
      { name: '💬 Gesamt Messages', value: `${tot[0]?.msgs || 0}`, inline: true },
      { name: '🎙️ Gesamt Voice-Time', value: formatVoice(tot[0]?.voice || 0), inline: true },
      { name: '📢 Level-Up Channel', value: ct, inline: false },
      { name: '🎭 Level-Rollen', value: rt, inline: false }
    ] });
  }
  if (command === '!levelups' || command === '!levelupchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const ch = message.mentions.channels.first();
    if (!ch) return fail(message, `Benutzung: \`${prefix}levelups #channel\``);
    await GuildConfig.findOneAndUpdate({ guildId: message.guild.id }, { levelupChannelId: ch.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetChannelId: ch.id });
    return success(message, `Level-Ups werden jetzt in ${ch} gesendet.`);
  }
  if (command === '!removelevelup' || command === '!removelevelupchannel') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    await GuildConfig.findOneAndUpdate({ guildId: message.guild.id }, { levelupChannelId: null });
    return success(message, 'Level-Up Channel entfernt. Level-Ups kommen wieder im aktuellen Channel.');
  }
  if (command === '!setlevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const lvl = parseInt(args[0]); const role = message.mentions.roles.first();
    if (!lvl || !role) return fail(message, `Benutzung: \`${prefix}setlevelrole 5 @Role\``);
    await LevelRole.findOneAndUpdate({ guildId: message.guild.id, level: lvl }, { roleId: role.id }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `Ab **Level ${lvl}** bekommt man jetzt ${role}.`);
  }
  if (command === '!removelevelrole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const lvl = parseInt(args[0]);
    if (!lvl) return fail(message, `Benutzung: \`${prefix}removelevelrole 5\``);
    await LevelRole.findOneAndDelete({ guildId: message.guild.id, level: lvl });
    return success(message, `Für **Level ${lvl}** gibt es jetzt keine Rolle mehr.`);
  }
  if (command === '!multiplier') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    if (args[0]?.toLowerCase() === 'list') {
      const all = await Multiplier.find({ guildId: message.guild.id });
      if (!all.length) return fail(message, 'Keine Multiplier gesetzt.');
      return embedReply(message, '✨ XP-Multiplier', all.map(m => `<@&${m.roleId}> → **${m.multiplier}x XP**`).join('\n'), 0xFFAA00);
    }
    const role = message.mentions.roles.first(); const amt = parseFloat(args[1]);
    if (!role || isNaN(amt)) return fail(message, `Benutzung: \`${prefix}multiplier @Role 2\`\n\`${prefix}multiplier list\``);
    if (amt <= 1) { await Multiplier.findOneAndDelete({ guildId: message.guild.id, roleId: role.id }); return success(message, `Für ${role} gibt es jetzt keinen Multiplier mehr (1x).`); }
    await Multiplier.findOneAndUpdate({ guildId: message.guild.id, roleId: role.id }, { multiplier: amt }, { upsert: true, new: true });
    await saveCommand(message, command, { targetRoleId: role.id });
    return success(message, `${role} bekommt jetzt **${amt}x XP** bei jeder Nachricht.`);
  }
  if (command === '!resetxp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const t = message.mentions.users.first() || (args[0] ? await getUserById(args[0]) : null);
    if (!t) return fail(message, `Benutzung: \`${prefix}resetxp @User\``);
    await Level.findOneAndUpdate({ userId: t.id, guildId: message.guild.id }, { xp: 0, level: 1, messages: 0, voiceTime: 0, totalXp: 0 }, { upsert: true, new: true });
    return success(message, `${t} wurde auf **Level 1 | 0 XP** zurückgesetzt.`);
  }
  if (command === '!givexp') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return fail(message, 'Nur Admins!');
    const t = message.mentions.users.first() || (args[0] ? await getUserById(args[0]) : null);
    const amt = parseInt(args[1]);
    if (!t || isNaN(amt)) return fail(message, `Benutzung: \`${prefix}givexp @User 500\``);
    if (amt <= 0) return fail(message, 'Muss über 0 sein.');
    let u = await getOrCreateLevel(t.id, message.guild.id);
    const old = u.level; u.xp += amt; u.totalXp += amt;
    let up = false;
    while (u.xp >= getNeededXp(u.level)) { u.xp -= getNeededXp(u.level); u.level += 1; up = true; }
    await u.save();
    if (up) { const m = await message.guild.members.fetch(t.id).catch(() => null); if (m) await handleLevelUp(m, u, message.channel); }
    return success(message, `${t} hat **${amt} XP** erhalten.\nJetzt: **Level ${u.level} | ${u.xp} / ${getNeededXp(u.level)} XP**${u.level > old ? `\n🎉 Level-Up ${old} → ${u.level}!` : ''}`);
  }
  if (command === '!topvoice') {
    const top = await Level.find({ guildId: message.guild.id }).sort({ voiceTime: -1 }).limit(10);
    if (!top.length) return fail(message, 'Noch keine Voice-Time!');
    let d = ''; for (let i = 0; i < top.length; i++) { const m = await message.guild.members.fetch(top[i].userId).catch(() => null); d += `**${i + 1}.** ${m ? m.user.username : 'Unbekannt'} - 🎙️ ${formatVoice(top[i].voiceTime)}\n`; }
    await reactDone(message);
    return embedReply(message, `🎙️ Top Voice - ${message.guild.name}`, d, 0x00AAFF);
  }
  if (command === '!topchat') {
    const top = await Level.find({ guildId: message.guild.id }).sort({ messages: -1 }).limit(10);
    if (!top.length) return fail(message, 'Noch keine Messages!');
    let d = ''; for (let i = 0; i < top.length; i++) { const m = await message.guild.members.fetch(top[i].userId).catch(() => null); d += `**${i + 1}.** ${m ? m.user.username : 'Unbekannt'} - 💬 ${top[i].messages} Messages\n`; }
    await reactDone(message);
    return embedReply(message, `💬 Top Chat - ${message.guild.name}`, d, 0x00FF00);
  }
  if (command === '!daily') {
    let u = await getOrCreateLevel(message.author.id, message.guild.id);
    const cfg = await getGuildConfig(message.guild.id).catch(() => null);
    const now = new Date();
    if (u.lastDaily && (now - u.lastDaily) < 24 * 60 * 60 * 1000) {
      const left = 24 * 60 * 60 * 1000 - (now - u.lastDaily);
      return fail(message, `Du hast dein Daily schon geholt! In **${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m** wieder.`);
    }
    const min = cfg?.dailyXpMin || 100; const max = cfg?.dailyXpMax || 200;
    const reward = min + Math.floor(Math.random() * (max - min + 1));
    const coins = cfg?.dailyCoins || 50;
    u.xp += reward; u.totalXp += reward; u.lastDaily = now;
    while (u.xp >= getNeededXp(u.level)) { u.xp -= getNeededXp(u.level); u.level += 1; }
    await u.save();
    try { await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins } }, { upsert: true }); } catch {}
    return success(message, `🎁 Daily Belohnung!\nDu hast **${reward} XP** + **${coins} Coins** erhalten!\nJetzt: **Level ${u.level} | ${u.xp} / ${getNeededXp(u.level)} XP**`);
  }

  // ==========================================================================
  // FUN - OHNE COINFLIP / OHNE GAMBLE
  // ==========================================================================
  if (command === '!8ball') {
    const frage = args.join(' ');
    if (!frage) return fail(message, `Benutzung: \`${prefix}8ball Werde ich reich?\``);
    const antworten = ['Ja, auf jeden Fall! ✅','Nein, leider nicht. ❌','Vielleicht... 🤔','Auf jeden Fall! 🔥','Frag später nochmal... 😴','100% Ja! 💯','Niemals! 😂','Das sieht gut aus! 👀','Hmm, eher nicht...','Ja, wenn du dran bleibst! 💪'];
    const antwort = antworten[Math.floor(Math.random() * antworten.length)];
    await reactDone(message);
    return embedReply(message, '🎱 Magic 8Ball', '', 0x5865F2, { fields: [{ name: '❓ Frage', value: frage, inline: false }, { name: '🎱 Antwort', value: antwort, inline: false }] });
  }
  if (command === '!meme' || command === '!witz') {
    const witze = ['Warum mögen Skelette keinen Krieg? Weil sie kein Herz dafür haben! 💀','Was sagt ein Baum zum anderen? Lass uns Blätter tauschen! 🌳','Warum sind Fische so schlecht in Mathe? Weil sie unter Wasser sind! 🐟','Was macht ein Clown im Büro? Er macht Faxen! 🤡','Warum hat der Computer einen Arzt gerufen? Weil er einen Virus hatte! 💻','Was sagt die 0 zur 8? Schicker Gürtel! 😂','Warum gehen Ameisen nicht in die Kirche? Weil sie in Sekten sind! 🐜','Was ist grün und klopft an die Tür? Ein Klopfsalat! 🥗','Warum können Geister so schlecht lügen? Weil man durch sie hindurchsieht! 👻','Was sagt ein Keks zum anderen? Du bist aber krümelig heute! 🍪'];
    const w = witze[Math.floor(Math.random() * witze.length)];
    await reactDone(message);
    return embedReply(message, '😂 Witz des Tages', w, randomColor());
  }
  if (command === '!poll' || command === '!umfrage') {
    const text = args.join(' ');
    if (!text) return fail(message, `Benutzung: \`${prefix}poll Soll Beni Bot bleiben?\``);
    await reactDone(message);
    const r = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('📊 Umfrage').setDescription(text).setColor(0x5865F2).addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true }).setFooter({ text: 'Stimme mit ✅ oder ❌ ab!' }).setTimestamp()] });
    await r.react('✅').catch(() => {}); await r.react('❌').catch(() => {}); return r;
  }
  if (command === '!suggest' || command === '!vorschlag') {
    const text = args.join(' ');
    if (!text) return fail(message, `Benutzung: \`${prefix}suggest Dein Vorschlag\``);
    await reactDone(message);
    const r = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('💡 Neuer Vorschlag').setDescription(text).setColor(0xFFAA00).addFields({ name: '👤 Von', value: `${message.author} - \`${message.author.tag}\``, inline: true }).setFooter({ text: 'Reagiere mit ✅ oder ❌ zum Abstimmen' }).setTimestamp()] });
    await r.react('✅').catch(() => {}); await r.react('❌').catch(() => {}); return r;
  }
  if (command === '!giveaway') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return fail(message, 'Du brauchst Nachrichten verwalten!');
    const timeArg = args[0]; const prize = args.slice(1).join(' ');
    if (!timeArg || !prize) return fail(message, `Benutzung: \`${prefix}giveaway 10m Nitro\``);
    const ms = parseDuration(timeArg); if (!ms) return fail(message, 'Benutze: 10s 10m 1h 1d');
    await reactDone(message);
    const msg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🎉 GIVEAWAY!').setDescription(`**Preis:** ${prize}\n\nKlicke unten auf den Button um teilzunehmen!\nEndet in **${timeArg}**`).setColor(0xFFD700).addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true }).setFooter({ text: 'Viel Glück!' }).setTimestamp()] });
    const gw = await Giveaway.create({ guildId: message.guild.id, channelId: message.channel.id, messageId: msg.id, prize, endsAt: new Date(Date.now() + ms), createdBy: message.author.tag });
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_${gw._id}`).setLabel('🎉 Teilnehmen').setStyle(ButtonStyle.Success));
    await msg.edit({ embeds: [new EmbedBuilder().setTitle('🎉 GIVEAWAY!').setDescription(`**Preis:** ${prize}\n\nKlicke unten auf den Button um teilzunehmen!\nEndet in **${timeArg}**`).setColor(0xFFD700).addFields({ name: '👤 Erstellt von', value: message.author.tag, inline: true }).setTimestamp()], components: [row] });
    setTimeout(async () => {
      const fresh = await Giveaway.findById(gw._id);
      await Giveaway.findByIdAndUpdate(gw._id, { ended: true });
      let win = 'Niemand hat teilgenommen 😢';
      if (fresh?.participants?.length) { const wid = fresh.participants[Math.floor(Math.random() * fresh.participants.length)]; win = `<@${wid}> hat **${prize}** gewonnen! 🎉`; }
      message.channel.send({ embeds: [new EmbedBuilder().setTitle('🎉 GIVEAWAY VORBEI!').setDescription(`Das Giveaway **${prize}** ist vorbei!\n\n**Gewinner:** ${win}`).setColor(0xFFD700).setTimestamp()] }).catch(() => {});
    }, ms);
    return msg;
  }

  // ==========================================================================
  // ECONOMY - OHNE GAMBLE
  // ==========================================================================
  if (command === '!balance' || command === '!coins' || command === '!geld' || command === '!money') {
    const t = message.mentions.users.first() || (args[0] ? await getUserById(args[0]) : null) || message.author;
    const eco = await Economy.findOne({ userId: t.id, guildId: message.guild.id });
    const coins = eco?.coins || 0; const bank = eco?.bank || 0;
    await reactDone(message);
    return embedReply(message, `💰 Balance - ${t.username}`, '', 0xFFD700, { thumb: t.displayAvatarURL(), fields: [{ name: '💰 Coins', value: `${formatNumber(coins)}`, inline: true }, { name: '🏦 Bank', value: `${formatNumber(bank)}`, inline: true }, { name: '💎 Gesamt', value: `${formatNumber(coins + bank)}`, inline: true }] });
  }
  if (command === '!pay') {
    const t = message.mentions.users.first() || (args[0] ? await getUserById(args[0]) : null);
    const amt = parseInt(args[1]);
    if (!t || isNaN(amt) || amt <= 0) return fail(message, `Benutzung: \`${prefix}pay @User 100\``);
    if (t.id === message.author.id) return fail(message, 'Du kannst dir selbst kein Geld schicken!');
    const sender = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!sender || sender.coins < amt) return fail(message, `Du hast nicht genug Coins! Du hast nur **${sender?.coins || 0}** Coins.`);
    await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins: -amt } }, { upsert: true });
    await Economy.findOneAndUpdate({ userId: t.id, guildId: message.guild.id }, { $inc: { coins: amt } }, { upsert: true });
    return success(message, `Du hast **${amt} Coins** an ${t} geschickt! 💸`);
  }
  if (command === '!work' || command === '!arbeiten') {
    const jobs = ['Du hast als Programmierer gearbeitet und 150 Coins verdient! 💻','Du hast im Supermarkt gearbeitet und 80 Coins verdient! 🛒','Du hast als Lehrer gearbeitet und 120 Coins verdient! 👨‍🏫','Du hast als Streamer gearbeitet und 200 Coins verdient! 🎮','Du hast als Koch gearbeitet und 90 Coins verdient! 👨‍🍳'];
    const reward = 50 + Math.floor(Math.random() * 150);
    const jobText = jobs[Math.floor(Math.random() * jobs.length)];
    await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins: reward } }, { upsert: true });
    await reactDone(message);
    return embedReply(message, '💼 Arbeiten', `${jobText}\n\n**Belohnung:** ${reward} Coins`, 0x00FF00);
  }
  if (command === '!deposit' || command === '!dep') {
    const amt = parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) return fail(message, `Benutzung: \`${prefix}deposit 100\``);
    const eco = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!eco || eco.coins < amt) return fail(message, `Du hast nicht genug Coins! Du hast nur **${eco?.coins || 0}**.`);
    await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins: -amt, bank: amt } });
    return success(message, `**${amt} Coins** in die Bank eingezahlt! 🏦`);
  }
  if (command === '!withdraw' || command === '!with') {
    const amt = parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) return fail(message, `Benutzung: \`${prefix}withdraw 100\``);
    const eco = await Economy.findOne({ userId: message.author.id, guildId: message.guild.id });
    if (!eco || eco.bank < amt) return fail(message, `Du hast nicht genug in der Bank! Du hast nur **${eco?.bank || 0}**.`);
    await Economy.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { coins: amt, bank: -amt } });
    return success(message, `**${amt} Coins** aus der Bank abgehoben! 💰`);
  }
