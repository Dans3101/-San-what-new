import baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const {
  makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion
} = baileys;

const authFolder = './auth';
if (!existsSync(authFolder)) mkdirSync(authFolder);

export async function startSession(sessionId) {
  const { state, saveState } = useSingleFileAuthState(join(authFolder, `${sessionId}.json`));

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📦 Using Baileys v${version.join('.')}, latest: ${isLatest}`);

  const socket = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    browser: ['DansBot', 'Chrome', '122']
  });

  socket.ev.on('creds.update', saveState);

  socket.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) {
      writeFileSync('./qr.png', qr);
      console.log('📸 QR code saved as qr.png');
    }

    if (connection === 'open') {
      console.log(`✅ WhatsApp session "${sessionId}" connected`);
    }

    if (connection === 'close') {
      const code = update?.lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ Disconnected. Code: ${code}`);
    }
  });

  socket.ev.on('messages.upsert', async (msg) => {
    const message = msg.messages?.[0];
    if (!message?.message?.conversation) return;

    const sender = message.key.remoteJid;
    const text = message.message.conversation?.trim();

    console.log(`📨 Message from ${sender}: ${text}`);

    const admin = process.env.ADMIN_NUMBER || '';

    if (text === '.pairme' && sender.includes(admin)) {
      const pairingCode = Math.floor(100000 + Math.random() * 900000);
      await socket.sendMessage(sender, { text: `🔐 Pairing Code: ${pairingCode}` });
      console.log('📬 Pairing code sent to admin.');
    }
  });
}