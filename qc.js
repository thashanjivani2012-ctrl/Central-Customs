const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qc')
        .setDescription('Request Quality Control review')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Upload the file for QC review')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('ticketchannel')
                .setDescription('The ticket channel')
                .setRequired(true)),

    async execute(interaction) {
        const staffRoleIds = [
            "",
          ];
          
      if (!interaction.member.roles.cache.some(role => staffRoleIds.includes(role.id))) {
        return interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
      }
        const file = interaction.options.getAttachment('file');
        const user = interaction.user;
        const ticketChannel = interaction.options.getChannel('ticketchannel');

        const designRoleId = '';
        const qcRoleId = '';
        const qcChannelId = '';

        if (!interaction.member.roles.cache.has(designRoleId)) {
            return interaction.reply({
                content: '❌ Only Designers can use this command.',
                ephemeral: true
            });
        }

        const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            return interaction.reply({
                content: '❌ Only image files (PNG, JPG, JPEG, GIF, WEBP) are allowed.',
                ephemeral: true
            });
        }

        const qcRole = interaction.guild.roles.cache.get(qcRoleId);
        const qcChannel = interaction.guild.channels.cache.get(qcChannelId);

        if (!qcRole || !qcChannel) {
            return interaction.reply({
                content: '❌ Failed to find QC role or channel. Please check configuration.',
                ephemeral: true
            });
        }

        const imageEmbed = new EmbedBuilder()
            .setImage(file.url)
            .setColor('#FFB400');

        const infoEmbed = new EmbedBuilder()
            .setColor('#FFB400')
            .setTitle('Quality Control Review Request')
            .setDescription(`**Designer:** ${user}\n**Ticket:** ${ticketChannel}\n\n*Designers may now suggest changes in the QC thread, but approval must come from QC.*`)
            .setFooter({ text: `Requested by ${user.username}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();

            
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('approve')
                .setLabel('Approve')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('deny')
                .setLabel('Deny')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.deferReply({ ephemeral: true });

        const sentMessage = await qcChannel.send({
            content: `<@&${qcRole.id}>`,
            embeds: [imageEmbed, infoEmbed],
            components: [buttons]
        });

        const thread = await sentMessage.startThread({
            name: `QC Review - ${user.username}`,
            autoArchiveDuration: 10080,
            reason: 'QC review request'
        });

        const collector = sentMessage.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
            const response = i.customId === 'approve' ? 'approved' : 'denied';
            const message = response === 'approved'
                ? '✅ Your design has been approved for delivery.'
                : '❌ Your design did not meet our QC standards.';

            await user.send(message).catch(() => null);

            const updatedButtons = buttons.components.map(button =>
                button.setDisabled(true).setLabel(
                    `${button.customId === i.customId ? response.charAt(0).toUpperCase() + response.slice(1) + ' by ' + i.user.username : button.label}`
                ).setStyle(button.customId === 'approve' ? ButtonStyle.Secondary : ButtonStyle.Danger)
            );

            const updatedEmbed = EmbedBuilder.from(infoEmbed).addFields({ name: 'Status', value: message });

            await i.update({
                embeds: [updatedEmbed],
                components: [new ActionRowBuilder().addComponents(updatedButtons)]
            });

            await thread.send(`Review **${response.charAt(0).toUpperCase() + response.slice(1)}** by ${i.user.username}`);
        });

        collector.on('end', () => {
            sentMessage.edit({ components: [] }).catch(() => null);
        });

        await interaction.followUp({
            content: '✅ QC review request has been sent.',
            ephemeral: true
        });
    }
};
