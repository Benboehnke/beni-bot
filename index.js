const http = require('http');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const PORT = process.env.PORT || 3000;

// Webserver für Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Beni Bot is alive!');
}).listen(PORT, () => {
  console.log('Webserver läuft auf Port ' + PORT);
});

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

  // !ban @user reason
  if (command === '!ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return replyAndDelete(message, 'Nö, du darfst niemanden bannen. Dafür fehlen dir die Rechte!');
    }
    const user = message.mentions.members.first();
    if (!user) return replyAndDelete(message, 'Ey, wen soll ich denn bannen? Markier mal jemanden! Beispiel: `!ban @Max nervt`');
    const reason = args.slice(1).join(' ') || 'Kein Grund angegeben';
    if (!user.bannable) return replyAndDelete(message, 'Den kann ich leider nicht bannen, der steht über mir!');

    // DM an den Gebannten
    try {
      await user.send(`Du wurdest vom Server **${message.guild.name}** gebannt!\n\n**Grund:** ${reason}\n**Gebannt von:** ${message.author.tag}\n\nTja, das war's leider. Wenn du denkst, das war ein Fehler, melde dich beim Team!`);
    } catch {}

    await user.ban({ reason });
    return replyAndDelete(message, `BAM! ${user.user.tag} wurde aus dem Server gekickt... äh gebannt! Grund: ${reason} - Der kommt so schnell nicht wieder!`);
  }

  // !kick @user reason
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

  // !clear -Anzahl-
  if (command === '!clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return replyAndDelete(message, 'Du darfst keine Nachrichten löschen!');
    }
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return replyAndDelete(message, 'Sag mir mal eine Zahl von 1 bis 100! Beispiel: `!clear 10`');
    await message.channel.bulkDelete(amount + 1, true).catch(() => {});
    const reply = await message.channel.send(`Sauber! Ich habe ${amount} Nachrichten weggeputzt! Der Chat glänzt wieder!`);
    deleteAfter(reply);
  }

  // !mute @user duration reason
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

    // DM an den Gemuteten
    try {
      await user.send(`Du wurdest auf dem Server **${message.guild.name}** gemutet!\n\n**Dauer:** ${durationStr}\n**Grund:** ${reason}\n**Gemutet von:** ${message.author.tag}\n\nErstmal kurz durchatmen und chillen, danach darfst du wieder schreiben!`);
    } catch {}

    await user.timeout(ms, reason);
    return replyAndDelete(message, `Pssst! ${user.user.tag} muss jetzt für ${durationStr} leise sein! Grund: ${reason} - Mal gucken ob er sich benimmt!`);
  }

  // !sendmessage #channel (Text)
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

  // !dm @user (text)
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
    return replyAndDelete(message, `Zugeschlossen! In diesem Channel kann jetzt keiner mehr schreiben. Nur noch lesen und staunen!`);
  }

  // !unlock
  if (command === '!unlock') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return replyAndDelete(message, 'Du darfst den Channel nicht entsperren!');
    }
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return replyAndDelete(message, `Wieder offen! Ihr dürft hier wieder schreiben, tobt euch aus!`);
  }
});

client.login(process.env.TOKEN);
