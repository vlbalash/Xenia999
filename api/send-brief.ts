import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.OWNER_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ error: 'Bot not configured' });

  const { text, parse_mode, reply_markup } = req.body as {
    text: string; parse_mode?: string; reply_markup?: object;
  };

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parse_mode ?? 'HTML',
      ...(reply_markup ? { reply_markup } : {}),
    }),
  });

  const data = await tgRes.json();
  return res.status(tgRes.ok ? 200 : 502).json(data);
}
