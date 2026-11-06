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
    customID: 'starter1',
    execute: async function (interaction) {
        if (interaction.isStringSelectMenu() && interaction.customId === 'starter1') {
            const type = interaction.values[0].toLowerCase();

            const categories = {
                liveryels: process.env.ORDER_LIVERYELS_CATEGORY_ID || '',
                graphic: process.env.ORDER_GRAPHIC_CATEGORY_ID || '',
                discord: process.env.ORDER_DISCORD_CATEGORY_ID || '',
                clothing: process.env.ORDER_CLOTHING_CATEGORY_ID || '',
                photographs: process.env.ORDER_PHOTOGRAPHS_CATEGORY_ID || '',
                botservices: process.env.ORDER_BOTSERVICES_CATEGORY_ID || ''
            };

            const roles = {
                liveryels: process.env.ORDER_LIVERYELS_ROLE_ID || '',
                graphic: process.env.ORDER_GRAPHIC_ROLE_ID || '',
                discord: process.env.ORDER_DISCORD_ROLE_ID || '',
                clothing: process.env.ORDER_CLOTHING_ROLE_ID || '',
                photographs: process.env.ORDER_PHOTOGRAPHS_ROLE_ID || '',
                botservices: process.env.ORDER_BOTSERVICES_ROLE_ID || ''
            };


            const customreplies = {
                liveryels: {
                    title: ``,
                    message: ``,
                },
                graphic: {
                    title: ``,
                    message: ``,
                },
                discord: {
                    title: ``,
                    message: ``,
                },
                clothing: {
                    title: ``,
                    message: ``,
                },
                photographs: {
                    title: ``,
                    message: ``,
                },
                botservices: {
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
            const channelName = `order-${interaction.user.username}`;

            try {
                const channel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryID,
                    topic: `Order by ${interaction.user.tag} - ${type}`,
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
                    content: `<@&${roleID}>`,
                    embeds: [imageembed, textembed],
                    components: [actionRow]
                });

                await interaction.reply({ content: `Your order has been submitted and a ticket has been created in <#${channel.id}>!`, ephemeral: true });

            } catch (error) {
                console.error('Error creating the order channel:', error);
                await interaction.reply({ content: 'There was an error creating your order channel. Please try again later.', ephemeral: true });
            }
        }
    }
};
