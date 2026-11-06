require('./utils/ProcessHandlers.js')();

const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.AutoModerationExecution,
    ],
    partials: [
        Partials.GuildMember,
        Partials.Channel,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User,
    ],
});

client.config = Object.assign(
    {},
    require('./config.json'),
    Object.fromEntries(['TOKEN', 'APP_ID', 'MONGO_URI'].filter(k => process.env[k]).map(k => [k, process.env[k]]))
);
client.logs = require('./utils/Logs.js');
client.cooldowns = new Map();

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);
require('./utils/database.js')();
require('./utils/RobloxLogin.js')();

client.logs.info('Logging in...');
client.login(client.config.TOKEN);
