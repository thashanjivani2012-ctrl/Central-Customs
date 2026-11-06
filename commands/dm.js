const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmuser')
    .setDescription('DM a user and log the interaction')
    .addUserOption(option => option.setName('user').setDescription('The user to DM').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to send').setRequired(true)),

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

const staff = interaction.user;
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');
    
    try {
      await user.send(message);
      
      const logChannel = interaction.guild.channels.cache.find(ch => ch.id === '');
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor('#')
          .setTitle('DM Interaction Logged')
          .addFields(
            { name: 'User DMed', value: `${user.tag} (${user.id})`, inline: false },
            { name: 'Message', value: message, inline: false },
            { name: 'From', value: `${staff}`, inline: false },
          )
          .setTimestamp();
          
        logChannel.send({ embeds: [embed] });
      }

      await interaction.reply({ content: `Successfully DM'd ${user.tag} and logged the interaction.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error sending the DM or logging the interaction.', ephemeral: true });
    }
  }
};
