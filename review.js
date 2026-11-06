const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Give a review to a designer')
        .addUserOption(option =>
            option.setName('designer')
                .setDescription('Ping the designer')
                .setRequired(true))
        .addStringOption(option =>
            option.setName("stars")
                .setDescription("Amount of stars.")
                .setRequired(true)
                .addChoices(
                    { name: "⭐", value: "⭐" },
                    { name: "⭐⭐", value: "⭐⭐" },
                    { name: "⭐⭐⭐", value: "⭐⭐⭐" },
                    { name: "⭐⭐⭐⭐", value: "⭐⭐⭐⭐" },
                    { name: "⭐⭐⭐⭐⭐", value: "⭐⭐⭐⭐⭐" }
                ))
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('feedback')
                .setDescription('Feedback')
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
        const designer = interaction.options.getUser('designer');
        const stars = interaction.options.getString("stars");
        const product = interaction.options.getString('product');
        const feedback = interaction.options.getString('feedback');

        const embed = new EmbedBuilder()
            .setColor('#6da9f1')
            .setAuthor({
                name: `Review by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .addFields(
                { name: `Designer`, value: `${designer}`, inline: true },
                { name: `Rating`, value: `${stars}`, inline: true },
                { name: `Product`, value: `${product}`, inline: true },
                { name: `Feedback`, value: `${feedback}`, inline: false }
            )
            .setTimestamp();

        const reviewChannelId = 'CHANNEL_ID_WHERE_THE_REVIEW_IS_GOING_TO_BE_SENT';
        const reviewChannel = interaction.guild.channels.cache.get(reviewChannelId);

        if (!reviewChannel) {
            return interaction.reply({ content: 'Review channel not found.', ephemeral: true });
        }

        if (!reviewChannel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: 'I do not have permission to send messages in the Review channel.', ephemeral: true });
        }

        await reviewChannel.send({ content: `<@${designer.id}>`, embeds: [embed] });
        await interaction.reply({ content: 'Review has been submitted and sent to the Review channel.', ephemeral: true });
    }
};
