import baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { writeFileSync, existsSync, mkdirSync, createReadStream } from 'fs';
import { join } from 'path';
import axios from 'axios';
import FormData from 'form-data';

const {
  makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion
} = baileys;

const authFolder = './auth';
if (!existsSync(authFolder)) mkdirSync(authFolder);

// Upload QR to Imgur
async function uploadQRToImgur(filePath) {
  try {
    const form = new FormData();
    form.append('image', createReadStream(filePath));

    const response = await axios.post('https://api.imgur.com/3/image', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: 'Client-ID 2b3e4f5d6a7b8c9' // Replace with your own if needed
      }
    });

    const link = response.data?.data?.link;
    console.log(`🌐 Scan your QR here: ${link}`);
    return link;
  } catch (err) {
    console.error(`❌ Failed to upload QR: ${err.message}`);
    return null;
  }
}

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

  socket.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      writeFileSync('./qr.png', qr);
      console.log('📸 QR code saved as qr.png');

      const link = await uploadQRToImgur('./qr.png');
      if (link) {
        console.log(`🌐 Scan your QR here: ${link}`);
      }
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