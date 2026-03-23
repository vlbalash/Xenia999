require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// Initialize bot with your Telegram Bot Token
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE');

console.log('🤖 Vanguard Protocol Initializing...');

// Welcome / Start Command Handler
// This handles the ?start= init payloads from the website
bot.start((ctx) => {
    const payload = ctx.startPayload; // e.g., 'init', 'tier_core', 'tier_nexus', 'tier_vanguard', or encoded loadout string
    
    let welcomeMessage = `*XXXENIA999 System Architecture*\n\nIdentity verified. Protocol initialized.\nI am the Vanguard Concierge. How can we elevate your digital infrastructure today?`;
    
    // Custom responses based on the payload from the website's Loadout Configurator
    if (payload.startsWith('tier_core')) {
        welcomeMessage = `*XXXENIA999 // The Core Protocol*\n\nInitialization sequence complete. You have selected Tier I: The Core Protocol.\n\nThis includes a custom WebGL landing experience and hyper-optimized performance.\n\nPlease describe your brand identity and immediate goals to begin.`;
    } else if (payload.startsWith('tier_nexus')) {
        welcomeMessage = `*XXXENIA999 // The Automation Nexus*\n\nInitialization sequence complete. You have selected Tier II: The Automation Nexus.\n\nThis includes the Core Protocol + Integrated AI agents and bespoke automated funnels.\n\nPlease detail your current bottlenecks and scaling objectives.`;
    } else if (payload.startsWith('tier_vanguard')) {
        welcomeMessage = `*XXXENIA999 // Vanguard Retainer*\n\nInitialization sequence complete. You have selected Tier III: Vanguard Retainer.\n\nWelcome to the elite tier. You have priority 24/7 access.\n\nTo establish the retainer, please summarize your organization's total objective.`;
    } else if (payload.startsWith('init')) {
        welcomeMessage = `*XXXENIA999 System Architecture*\n\nProtocol initialized via direct uplink.\nI am the Vanguard Concierge. Please state your objective.`;
    } else if (payload) {
        // Handle encoded loadout strings (if using the older form approach)
        try {
            const decoded = decodeURIComponent(payload);
            welcomeMessage = `*XXXENIA999 System Architecture*\n\nProtocol initialized. I have received your loadout configuration:\n\`${decoded}\`\n\nPlease confirm these details and provide any additional context.`;
        } catch (e) {
            // Ignore decoding errors
        }
    }

    // Send the welcome message with inline keyboard options
    ctx.replyWithMarkdown(welcomeMessage, Markup.inlineKeyboard([
        [Markup.button.callback('Consultation Request', 'action_consultation')],
        [Markup.button.callback('View Architecture Specs', 'action_specs')],
        [Markup.button.url('Return to Terminal', 'https://xxxenia999.tech')]
    ]));
});

// Callback Handlers for buttons
bot.action('action_consultation', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('To schedule a consultation, please provide your preferred timezone and a brief agenda. The Lead Architect will review your transmission.');
});

bot.action('action_specs', (ctx) => {
    ctx.answerCbQuery();
    ctx.replyWithMarkdown('Our tech stack utilizes:\n- *Frontend:* React, Three.js, React Three Fiber, Framer Motion\n- *Backend/Deploy:* Netlify Serverless, Node.js\n- *Automation:* Telegram API, custom LLM routing\n- *Design:* TailwindCSS, custom shaders');
});

// Fallback message handler for regular text input
bot.on('text', (ctx) => {
    // Basic AI integration point: Here you would ideally connect to an LLM (like OpenAI) to process responses.
    // For now, it's a static auto-reply.
    ctx.reply('Transmission received. The Vanguard system is currently processing your request. Await human override or further system prompts.');
});

// Launch the bot
bot.launch().then(() => {
    console.log('✅ Vanguard Concierge Bot successfully connected to Telegram Protocol.');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
