const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("infraction")
      .setDescription("Log an infraction for a user.")
      .addUserOption(option =>
        option
          .setName("user")
          .setDescription("The user receiving the infraction")
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName("reason")
          .setDescription("Reason for the infraction")
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName("punishment")
          .setDescription("What punishment was given (e.g., Warning, Kick)")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
  
    async execute(interaction) {
        const staffRoleIds = [
            "",
          ];
      
          const logChannelId = process.env.INFRACTION_LOG_CHANNEL_ID || "";
  
      if (!interaction.member.roles.cache.some(role => staffRoleIds.includes(role.id))) {
        return interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
      }
  
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const punishment = interaction.options.getString("punishment");
  
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: `Signed, ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("User Infraction Logged")
        .addFields([
          { name: "User", value: `<@${user.id}>`, inline: true },
          { name: "Punishment", value: punishment, inline: true },
          { name: "Reason", value: reason, inline: false },
        ])
        .setTimestamp();
  
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
  
      if (!logChannel) {
        return interaction.reply({
          content: "❌ Infraction log channel not found.",
          ephemeral: true,
        });
      }
  
      if (
        !logChannel
          .permissionsFor(interaction.client.user)
          .has(PermissionsBitField.Flags.SendMessages)
      ) {
        return interaction.reply({
          content: "❌ I do not have permission to send messages in the log channel.",
          ephemeral: true,
        });
      }
  
      await logChannel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
      });
  
      await interaction.reply({
        content: "✅ Infraction has been logged successfully.",
        ephemeral: true,
      });
    },
  };
  