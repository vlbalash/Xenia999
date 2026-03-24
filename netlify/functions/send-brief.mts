import type { Config } from "@netlify/functions";

export default async (req: Request) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const token = Netlify.env.get("TG_BOT_TOKEN");
    const chatId = Netlify.env.get("OWNER_CHAT_ID");

    if (!token || !chatId) {
        return new Response(JSON.stringify({ error: "Bot not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { text, parse_mode, reply_markup } = await req.json() as {
        text: string;
        parse_mode?: string;
        reply_markup?: object;
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parse_mode ?? "HTML",
            ...(reply_markup ? { reply_markup } : {}),
        }),
    });

    const data = await tgRes.json();
    return new Response(JSON.stringify(data), {
        status: tgRes.ok ? 200 : 502,
        headers: { "Content-Type": "application/json" },
    });
};

export const config: Config = {
    path: "/api/send-brief",
};
