const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the message to')
        .setRequired(false)),
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
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel');

    if (channel && !channel.isTextBased()) {
      return interaction.reply({ content: 'That channel is not text-based.', ephemeral: true });
    }

    try {
      if (channel) {
        await channel.send(message);
      } else {
        await interaction.channel.send(message);
      }

      await interaction.reply({ content: '✅ Message sent!', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Failed to send the message.', ephemeral: true });
    }
  },
};
