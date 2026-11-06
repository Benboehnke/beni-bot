const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ]
});

const PREFIX = '!';

client.once('ready', () => {
  console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isAdmin = message.member?.permissions.has(PermissionsBitField.Flags.Administrator);

  if (!isAdmin) {
    // Nur Admins dürfen alle Commands
    if (['ban','timeout','clear','spezclear','dm','message'].includes(command)) {
      return message.reply('Du brauchst Admin-Rechte dafür!');
    }
  }

  // 1. !ban @User Grund
  if (command === 'ban') {
    const member = message.mentions.members.first();
    const grund = args.slice(1).join(' ');
    if (!member || !grund) return message.reply('Benutzung: `!ban @User Grund`');
    try {
      await member.send(`Du wurdest auf **${message.guild.name}** gebannt.\nGrund: ${grund}`);
    } catch {}
    await member.ban({ reason: grund, deleteMessageDays: 7 });
    return message.reply(`✅ ${member} wurde gebannt. Grund: ${grund}`);
  }

  // 2. !timeout @User 10m Grund
  if (command === 'timeout') {
    const member = message.mentions.members.first();
    const zeitText = args[1];
    const grund = args.slice(2).join(' ');
    if (!member || !zeitText || !grund) return message.reply('Benutzung: `!timeout @User 10m Grund` (m=Minuten, h=Stunden, d=Tage)');
    const match = zeitText.toLowerCase().match(/^(\d+)([mhd])$/);
    if (!match) return message.reply('Zeit falsch! Beispiel: `10m`, `1h`, `1d`');
    const zahl = parseInt(match[1]);
    const einheit = match[2];
    let ms = zahl * 60 * 1000;
    if (einheit === 'h') ms = zahl * 60 * 60 * 1000;
    if (einheit === 'd') ms = zahl * 24 * 60 * 60 * 1000;
    try {
      await member.send(`Du wurdest auf **${message.guild.name}** getimeoutet für ${zeitText}.\nGrund: ${grund}`);
    } catch {}
    await member.timeout(ms, grund);
    return message.reply(`✅ ${member} wurde für ${zeitText} getimeoutet. Grund: ${grund}`);
  }

  // 3. !clear 10
  if (command === 'clear') {
    const anzahl = parseInt(args[0]);
    if (isNaN(anzahl)) return message.reply('Benutzung: `!clear 10`');
    if (anzahl < 1 || anzahl > 100) return message.reply('Bitte eine Zahl zwischen 1 und 100!');
    const geloescht = await message.channel.bulkDelete(anzahl + 1, true);
    const msg = await message.channel.send(`✅ ${geloescht.size - 1} Nachrichten gelöscht.`);
    setTimeout(() => msg.delete().catch(()=>{}), 5000);
    return;
  }

  // 4. !Spezclear @User 10
  if (command === 'spezclear') {
    const member = message.mentions.members.first();
    const anzahl = parseInt(args[1]);
    if (!member || isNaN(anzahl)) return message.reply('Benutzung: `!Spezclear @User 10`');
    // Mindestens letzte 100 durchsuchen, damit wir 30+ sicher finden
    const fetched = await message.channel.messages.fetch({ limit: 100 });
    const vonUser = fetched.filter(m => m.author.id === member.id).first(anzahl);
    for (const m of vonUser) {
      await m.delete().catch(()=>{});
    }
    // Eigenen Befehl auch löschen
    await message.delete().catch(()=>{});
    const msg = await message.channel.send(`✅ ${vonUser.length} Nachrichten von ${member} gelöscht.`);
    setTimeout(() => msg.delete().catch(()=>{}), 5000);
    return;
  }

  // 5. !dm @User Text
  if (command === 'dm') {
    const member = message.mentions.members.first();
    const text = args.slice(1).join(' ');
    if (!member || !text) return message.reply('Benutzung: `!dm @User Text`');
    try {
      await member.send(text);
      return message.reply(`✅ DM gesendet an ${member}`);
    } catch {
      return message.reply(`❌ Konnte keine DM an ${member} senden. User hat DMs aus oder Bot blockiert.`);
    }
  }

  // 6. !message
  if (command === 'message') {
    // Fall A: !message #channel Text
    const channelMention = message.mentions.channels.first();
    let ziel = message.channel;
    let text = '';

    if (channelMention) {
      ziel = channelMention;
      // Text ohne den Channel-Mention
      text = message.content.replace(`!message`, '').replace(/<#\d+>/, '').trim();
      // Attachments mitschicken
      const files = [...message.attachments.values()].map(a => a.url);
      await ziel.send({ content: text, files: files.length ? files : undefined });
    } else {
      // Fall B: !message Text (gleicher Channel)
      text = message.content.slice('!message'.length).trim();
      if (!text && message.attachments.size === 0) return message.reply('Benutzung: `!message Text` oder `!message #channel Text`');
      const files = [...message.attachments.values()].map(a => a.url);
      await ziel.send({ content: text || null, files: files.length ? files : undefined });
    }
    // Eigenen Befehl löschen
    await message.delete().catch(()=>{});
    // Bestätigung per DM an dich
    try {
      await message.author.send(`✅ Nachricht gesendet in ${ziel}`);
    } catch {}
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
