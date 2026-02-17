import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: "All fields are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const BOT_TOKEN = Netlify.env.get("TELEGRAM_BOT_TOKEN");
        const CHAT_ID = Netlify.env.get("TELEGRAM_CHAT_ID");

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const text = [
            `🔮 *New Contact — xxxenia999.tech*`,
            ``,
            `👤 *Name:* ${name}`,
            `📧 *Email:* ${email}`,
            ``,
            `💬 *Message:*`,
            message,
        ].join("\n");

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text,
                    parse_mode: "Markdown",
                }),
            }
        );

        const result = await telegramResponse.json();

        if (!result.ok) {
            console.error("Telegram API error:", result);
            return new Response(JSON.stringify({ error: "Failed to send message" }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Contact function error:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const config: Config = {
    path: "/api/contact",
};
