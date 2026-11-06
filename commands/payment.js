const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const noblox = require('noblox.js');

const paymentOptions = {
  1000000001: 'Payment Option 1',
  1000000002: 'Payment Option 2',
  1000000003: 'Payment Option 3',
  1000000004: 'Payment Option 4',
  1000000005: 'Payment Option 5',
  1000000006: 'Payment Option 6',
  1000000007: 'Payment Option 7',
  1000000008: 'Payment Option 8',
  1000000009: 'Payment Option 9',
  1000000010: 'Payment Option 10',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('payment')
    .setDescription('Create a gamepass and set price.')
    .addIntegerOption(option =>
      option.setName('price')
        .setDescription('The price to set for the gamepass')
        .setRequired(true)
    ),

  async execute(interaction) {
    const staffRoleId = process.env.STAFF_ROLE_ID || '';
    if (!interaction.member.roles.cache.has(staffRoleId)) {
      return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
    }

    const price = interaction.options.getInteger('price');
    if (!price || price <= 0) {
      return interaction.reply({ content: '❌ Please provide a valid price greater than 0.', ephemeral: true });
    }

    const paymentIds = Object.keys(paymentOptions);
    const randomPaymentId = paymentIds[Math.floor(Math.random() * paymentIds.length)];
    const paymentName = paymentOptions[randomPaymentId];

    try {
      await noblox.configureGamePass(randomPaymentId, paymentName, '.', price);

      const assetUrl = `https://www.roblox.com/game-pass/${randomPaymentId}`;

      const embed = new EmbedBuilder()
        .setTitle(paymentName)
        .setDescription('Click the button below to complete your payment.')
        .addFields({ name: 'Price', value: `R$${price}`, inline: true })
        .setColor('#6da9f1');

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Pay Now')
          .setStyle(ButtonStyle.Link)
          .setURL(assetUrl)
      );

      await interaction.reply({ embeds: [embed], components: [buttonRow] });
    } catch (error) {
      console.error('Error configuring game pass:', error);
      return interaction.reply({ content: '⚠️ Failed to configure the game pass. Please try again later.', ephemeral: true });
    }
  },
};
