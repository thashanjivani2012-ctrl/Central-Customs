const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client, c) {
        console.log(`✅ ${c.user.tag} is online.`);
        client.user.setActivity({ name: 'Server Name', type: ActivityType.Watching });
    },
};
