const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("promote")
      .setDescription("Promote a user by changing their role and logging the action.")
      .addUserOption(option =>
        option
          .setName("user")
          .setDescription("The user to promote")
          .setRequired(true)
      )
      .addRoleOption(option =>
        option
          .setName("oldrole")
          .setDescription("The user's current role to remove")
          .setRequired(true)
      )
      .addRoleOption(option =>
        option
          .setName("newrole")
          .setDescription("The higher role to assign to the user")
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName("reason")
          .setDescription("Reason for the promotion")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
  
    async execute(interaction) {
      const staffRoleIds = [
        "",
      ];
  
      const logChannelId = "";
  
      if (!interaction.member.roles.cache.some(role => staffRoleIds.includes(role.id))) {
        return interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
      }
  
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const oldrole = interaction.options.getRole("oldrole");
      const newrole = interaction.options.getRole("newrole");
  
      const member = interaction.guild.members.cache.get(user.id);
      if (!member) {
        return interaction.reply({
          content: "❌ Could not find the user in this server.",
          ephemeral: true,
        });
      }
  
      if (user.id === interaction.user.id) {
        return interaction.reply({
          content: "❌ You can't promote yourself.",
          ephemeral: true,
        });
      }
  
      if (
        interaction.member.roles.highest.position <=
        member.roles.highest.position
      ) {
        return interaction.reply({
          content: "❌ You can't promote someone with equal or higher role.",
          ephemeral: true,
        });
      }
  
      try {
        await member.roles.remove(oldrole);
        await member.roles.add(newrole);
      } catch (err) {
        return interaction.reply({
          content:
            "❌ Failed to update roles. Make sure I have the correct permissions and hierarchy.",
          ephemeral: true,
        });
      }
  
      const embed = new EmbedBuilder()
        .setColor("#57F287")
        .setAuthor({
          name: `Signed, ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Staff Promotion Notice")
        .setDescription(
          "This is to inform you of a staff promotion. Congratulations!"
        )
        .addFields([
          { name: "User", value: `<@${user.id}>`, inline: true },
          { name: "Old Role", value: `${oldrole}`, inline: true },
          { name: "New Role", value: `${newrole}`, inline: true },
          { name: "Reason", value: `${reason}`, inline: true },
        ])
        .setTimestamp();
  
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
  
      if (!logChannel) {
        return interaction.reply({
          content: "❌ Log channel not found.",
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
        content: "✅ Promotion completed and logged.",
        ephemeral: true,
      });
    },
  };
  