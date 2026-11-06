const {
    StringSelectMenuInteraction,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    EmbedBuilder,
    ChannelType,
    ActionRowBuilder
} = require('discord.js');

module.exports = {
    customID: 'starter',
    execute: async function (interaction) {
        if (interaction.isStringSelectMenu() && interaction.customId === 'starter') {
            const type = interaction.values[0].toLowerCase();
            const userID = interaction.user;

            const categories = {
                general_support: '',
                high_rank_support: '',
            };

            const roles = {
                general_support: '',
                high_rank_support: '',
            };

            const customreplies = {
                general_support: {
                    title: ``,
                    message: ``,
                },
                high_rank_support: {
                    title: ``,
                    message: ``,
                }
            }


            if (!categories[type] || !roles[type] || !customreplies[type]) {
                await interaction.reply({ content: 'Invalid ticket type selected. Please try again.', ephemeral: true });
                return;
            }

            const categoryID = categories[type];
            const roleID = roles[type];
            const customReplyID = customreplies[type];

            const guild = interaction.guild;
            const channelName = `support-${interaction.user.username}`;

            try {
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryID,
                    topic: `Support by ${interaction.user.tag} - ${type}`,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        },
                        {
                            id: roleID,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages]
                        }
                    ]
                });

                const claimButton = new ButtonBuilder()
                    .setCustomId('claim')
                    .setLabel('🙋‍♂️ Claim')
                    .setStyle(ButtonStyle.Primary);

                const closeButton = new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('🔒 Close')
                    .setStyle(ButtonStyle.Danger);

                const actionRow = new ActionRowBuilder()
                    .addComponents(claimButton, closeButton);

                const imageembed = new EmbedBuilder()
                    .setColor(`#`)
                    .setImage(``);

                const textembed = new EmbedBuilder()
                    .setColor(`#`)
                    .setImage(``)
                    .setTitle(customReplyID.title)
                    .setDescription(customReplyID.message)

                await channel.send({
                    embeds: [imageembed, textembed],
                    content: `<@&${roleID}>`,
                    components: [actionRow]
                });

                await interaction.reply({ content: `Your support ticket has been submitted and a ticket has been created in <#${channel.id}>!`, ephemeral: true });

            } catch (error) {
                console.error('Error creating the support ticket channel:', error);
                await interaction.reply({ content: 'There was an error creating your support ticket channel. Please try again later.', ephemeral: true });
            }
        }
    }
};
