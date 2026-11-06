const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { numberWithCommas } = require("../utils/numberWithCommas");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('orderlog')
        .setDescription('Log a completed order')
        .addUserOption(option =>
            option.setName('designer')
                .setDescription('Ping the designer who made the product')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('customer')
                .setDescription('Ping the customer who ordered the product')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Name of the product delivered')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('finalizer')
                .setDescription('Ping the person who finalized the payment')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price_without_tax')
                .setDescription('Price before tax (in Robux)')
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
        const customer = interaction.options.getUser('customer');
        const finalizer = interaction.options.getUser('finalizer');
        const product = interaction.options.getString('product');
        const priceWithoutTax = interaction.options.getNumber('price_without_tax');

        // Calculate taxed amount
        const taxedPrice = Math.floor(priceWithoutTax / 0.7);
        const formattedPrice = numberWithCommas(priceWithoutTax);
        const formattedTaxed = numberWithCommas(taxedPrice);

        const embed = new EmbedBuilder()
            .setColor('#6da9f1')
            .setTitle('Order Log')
            .setDescription('Make sure the user is in your Roblox group to receive payment.')
            .addFields(
                { name: 'Designer', value: designer.toString(), inline: true },
                { name: 'Customer', value: customer.toString(), inline: true },
                { name: 'Product', value: product, inline: true },
                { name: 'Price (No Tax)', value: `${formattedPrice} Robux`, inline: true },
                { name: 'Price (With Tax)', value: `${formattedTaxed} Robux`, inline: true },
                { name: 'Finalizer', value: finalizer.toString(), inline: true },
            )
            .setTimestamp();

        const orderLogChannelId = process.env.ORDER_LOG_CHANNEL_ID; // Set your log channel ID here
        const orderLogChannel = interaction.guild.channels.cache.get(orderLogChannelId);

        if (!orderLogChannel) {
            return interaction.reply({
                content: '❌ Order log channel not found. Please check the configuration.',
                ephemeral: true
            });
        }

        if (!orderLogChannel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                content: '❌ I do not have permission to send messages in the order log channel.',
                ephemeral: true
            });
        }

        await orderLogChannel.send({ content: `<@${designer.id}>`, embeds: [embed] });
        await interaction.reply({
            content: '✅ Order log successfully sent to the order log channel.',
            ephemeral: true
        });
    }
};
