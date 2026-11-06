const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
  } = require("discord.js");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("demote")
      .setDescription("Demote a user by changing their role and logging the action.")
      .addUserOption(option =>
        option
          .setName("user")
          .setDescription("The user to demote")
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
          .setDescription("The lower role to assign to the user")
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName("reason")
          .setDescription("Reason for the demotion")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
  
    async execute(interaction) {
        const staffRoleIds = [process.env.STAFF_ROLE_ID].filter(Boolean);
      
          const demotechannelid = process.env.DEMOTE_LOG_CHANNEL_ID || "";
  
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
          content: "❌ You can't demote yourself.",
          ephemeral: true,
        });
      }
  
      if (interaction.guild.ownerId === user.id) {
        return interaction.reply({
          content: "❌ You can't demote the server owner.",
          ephemeral: true,
        });
      }
  
      if (
        interaction.member.roles.highest.position <=
        member.roles.highest.position
      ) {
        return interaction.reply({
          content: "❌ You can't demote someone with equal or higher role.",
          ephemeral: true,
        });
      }
  
      try {
        await member.roles.remove(oldrole);
        await member.roles.add(newrole);
      } catch (err) {
        console.error("Role change failed:", err);
        return interaction.reply({
          content:
            "❌ Failed to update roles. Make sure I have the correct permissions and hierarchy.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: `Signed, ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Staff Demotion Notice")
        .setDescription(
          "This is to inform you of a staff role change. You may appeal in a management ticket."
        )
        .addFields([
          { name: "User", value: `<@${user.id}>`, inline: true },
          { name: "Old Role", value: `${oldrole}`, inline: true },
          { name: "New Role", value: `${newrole}`, inline: true },
          { name: "Reason", value: `${reason}`, inline: true },
        ])
        .setTimestamp();
  
      const demotechannel = interaction.guild.channels.cache.get(demotechannelid);
  
      if (!demotechannel) {
        return interaction.reply({
          content: "❌ Infraction channel not found. Please check the channel ID.",
          ephemeral: true,
        });
      }
  
      if (
        !demotechannel
          .permissionsFor(interaction.client.user)
          .has(PermissionsBitField.Flags.SendMessages)
      ) {
        return interaction.reply({
          content:
            "❌ I do not have permission to send messages in the Infraction channel.",
          ephemeral: true,
        });
      }
  
      await demotechannel.send({
        content: `<@${user.id}>`,
        embeds: [embed],
      });
  
      await interaction.reply({
        content:
          "✅ Demotion completed and logged in the Infraction channel.",
        ephemeral: true,
      });
    },
  };
  