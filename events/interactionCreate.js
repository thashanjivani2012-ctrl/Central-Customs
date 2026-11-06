const InteractionHandler = require('../utils/InteractionHandler.js');

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        let type;
        if (interaction.isCommand() || interaction.isAutocomplete()) {
            type = 'commands';
            const subcommand = interaction.options._subcommand ?? '';
            const subcommandGroup = interaction.options._subcommandGroup ?? '';
            const commandArgs = interaction.options._hoistedOptions ?? [];
            const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(' ')}`.trim();
            client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);
        } else if (interaction.isButton()) {
            type = 'buttons';
            client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
        } else if (interaction.isStringSelectMenu()) {
            type = 'menus';
            client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
        } else {
            return;
        }

        await InteractionHandler(client, interaction, type);
    },
};
