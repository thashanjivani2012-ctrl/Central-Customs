const { EmbedBuilder, ButtonBuilder, MessageFlags, PermissionsBitField } = require("discord.js");
const Ticket = require("../schemas/Ticket.js");

const channelLocks = new Set();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
    customID: "claim",
    async execute(interaction) {
        const channel = interaction.channel;
        const user = interaction.user;
        const designerId = user.id;
        const currentName = channel.name;

        const allowedRoleIds = [process.env.CLAIM_ROLE_ID_1, process.env.CLAIM_ROLE_ID_2].filter(Boolean);
        const guild = interaction.guild;

        if (channelLocks.has(channel.id)) {
            return interaction.reply({
                content: "⏳ Please wait a few seconds before trying again.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const claimedTickets = await Ticket.find({
            ClaimedBy: designerId,
            Status: "claimed",
        });

        if (claimedTickets.length >= 3) {
            return interaction.reply({
                content: "❌ You are not allowed to claim more than 3 tickets.",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (currentName.startsWith("🟢・claimed-")) {
            return interaction.reply({
                content: "⚠️ This ticket has already been claimed.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const rawCategory = channel.parent?.name || "unknown";
        const safeCategory = rawCategory
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-]/g, "");

        let baseName = `🟢・claimed-${user.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")}-${safeCategory}`;
        let newName = baseName;
        let counter = 2;

        while (guild.channels.cache.some((ch) => ch.name === newName)) {
            newName = `${baseName}${counter}`;
            counter++;
        }

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            channelLocks.add(channel.id);

            await interaction.editReply({
                content: `Ticket is being claimed. Renaming channel...`,
            });

            await wait(3000);
            await channel.edit({ name: newName });

            const everyoneRole = guild.roles.everyone;
            const overwrites = [];

            overwrites.push({
                id: everyoneRole.id,
                deny: [PermissionsBitField.Flags.SendMessages],
            });

            overwrites.push({
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ViewChannel,
                ],
            });

            allowedRoleIds.forEach((roleId) => {
                overwrites.push({
                    id: roleId,
                    allow: [
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ViewChannel,
                    ],
                });
            });

            for (const perm of channel.permissionOverwrites.cache.values()) {
                if (
                    perm.id !== everyoneRole.id &&
                    perm.id !== user.id &&
                    !allowedRoleIds.includes(perm.id)
                ) {
                    overwrites.push({
                        id: perm.id,
                        allow: perm.allow.bitfield,
                        deny: perm.deny.bitfield,
                    });
                }
            }

            await channel.permissionOverwrites.set(overwrites);

            const message = await channel.messages.fetch(interaction.message.id);
            const oldRow = message.components[0];
            const newRow = {
                type: 1,
                components: oldRow.components.map((btn) =>
                    ButtonBuilder.from(btn).setDisabled(true)
                ),
            };
            await message.edit({ components: [newRow] });

            const claimedEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("🎟️ Ticket Claimed")
                .setDescription(`**Claimed by:** ${user}\n**Category:** ${rawCategory}`)
                .setTimestamp();

            await channel.send({ embeds: [claimedEmbed] });

            await Ticket.findOneAndUpdate(
                { ChannelID: channel.id },
                { ClaimedBy: designerId, Status: "claimed" },
                { new: true }
            );
        } catch (error) {
            console.error("Error claiming ticket:", error);
            try {
                if (!interaction.replied) {
                    await interaction.reply({
                        content: "❌ An error occurred while processing the claim.",
                        flags: MessageFlags.Ephemeral,
                    });
                } else {
                    await interaction.editReply({
                        content: "❌ Error during channel rename or permission edit.",
                    });
                }
            } catch (err) {
                console.error("Failed to send fallback reply:", err);
            }
        } finally {
            channelLocks.delete(channel.id);
        }
    },
};
