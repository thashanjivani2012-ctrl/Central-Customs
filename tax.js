const { SlashCommandBuilder } = require("@discordjs/builders");
const { numberWithCommas } = require("../utils/numberWithCommas");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tax")
    .setDescription("Roblox tax calculator.")
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to calculate tax for")
        .setRequired(true)
    ),
  async execute(interaction) {
    const amount = interaction.options.getNumber("amount");
    const taxed = Math.round(amount / 0.7);
    const nicerAmount = numberWithCommas(amount);
    const nicerTaxedAmount = numberWithCommas(taxed);

    await interaction.reply({
      content: `You have entered a price of **${nicerAmount}**, and after tax, the final price is **${nicerTaxedAmount}**`,
    });
  },
};
