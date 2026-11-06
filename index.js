require('./utils/ProcessHandlers.js')();

const PREFIX = '-';


const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require(`discord.js`);


const { Partials } = require('discord.js');
const { ActivityType } = require('discord-api-types/v9');
const Ticket = require(`./schemas/Ticket.js`);
const DiscordTranscripts = require('discord-html-transcripts');
const noblox = require('noblox.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.AutoModerationExecution,
    ],

    partials: [
        Partials.GuildMember,
        Partials.Channel,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
    ]
});


client.config = Object.assign({}, require('./config.json'), Object.fromEntries(['TOKEN', 'APP_ID', 'MONGO_URI'].filter(k => process.env[k]).map(k => [k, process.env[k]])));
client.logs = require('./utils/Logs.js');
client.cooldowns = new Map();

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', function () {
});

client.on('ready', (c) => {
    console.log(`✅ ${c.user.tag} is online.`);

    client.config = Object.assign({}, require('./config.json'), Object.fromEntries(['TOKEN', 'APP_ID', 'MONGO_URI'].filter(k => process.env[k]).map(k => [k, process.env[k]])));

    client.user.setActivity({
        name: 'Server Name',
        type: ActivityType.Watching,
    });
});

async function sendCloseConfirmation(interaction) {
    const confirmationEmbed = new EmbedBuilder()
        .setColor("#")
        .setTitle("Confirm Ticket Closure")
        .setDescription(
            "Are you sure you want to close this ticket? This action cannot be undone."
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("confirm_close")
            .setLabel("Close")
            .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
        embeds: [confirmationEmbed],
        components: [row],
    });
}

async function closeTicket(interaction, client) {
    const channel = interaction.channel;
    const guild = interaction.guild;

    const openTime = new Date(channel.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const now = new Date();
    const isToday = now.toDateString() === new Date().toDateString();
    const formattedCloseTime = isToday
        ? `Today at ${now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        })}`
        : now.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const file = await DiscordTranscripts.createTranscript(channel, {
        limit: -1,
        returnBuffer: false,
        filename: `${channel.name.toLowerCase()}.html`,
    });

    const logChannelFiles = await guild.channels
        .fetch(process.env.TICKET_FILES_CHANNEL_ID || "0")
        .catch(() => null);
    const logChannelTranscripts = await guild.channels
        .fetch(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID || "0")
        .catch(() => null);

    if (!logChannelFiles || !logChannelTranscripts) {
        return interaction.reply({
            content: "Log channels not found.",
            flags: MessageFlags.Ephemeral,
        });
    }
    const ticket = await Ticket.findOne({ ChannelID: channel.id }).catch(
        () => null
    );
    const ticketId = ticket?.TicketID || "Unknown";
    const topic = channel.topic;
    let openerId = null;

    if (topic && topic.includes("OpenerID:")) {
        openerId = topic.match(/OpenerID:\s*(\d+)/)?.[1];
    }

    const opener = openerId
        ? await guild.members.fetch(openerId).catch(() => null)
        : null;
    const staff = interaction.user;

    const claimedById = ticket ? ticket.ClaimedBy : null;
    const claimedBy = claimedById
        ? await guild.members.fetch(claimedById).catch(() => null)
        : null;

    await interaction.reply({ content: "The ticket is being closed." });

    const msg = await logChannelFiles.send({ files: [file] });
    const transcriptUrl = msg.attachments.first()?.url;
    const ticketEmbed = new EmbedBuilder()
        .setColor("#")
        .setTitle(`${guild.name}`)
        .setDescription("Order Ticket Closed")
        .addFields(
            {
                name: "`🎟️` **Ticket ID**",
                value: ticketId.toString(),
                inline: true,
            },
            {
                name: "`✅` **Opened By**",
                value: opener ? `<@${opener.id}>` : "Unknown",
                inline: true,
            },
            { name: "`⛔` **Closed By**", value: `${staff}`, inline: true },
            { name: "`🕒` **Open Time**", value: openTime, inline: true },
            { name: "`📢` **Reason**", value: `Reason not provided`, inline: true }
        )
        .setFooter({ text: formattedCloseTime });

    const transcriptButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("📄 View Transcript")
            .setStyle(ButtonStyle.Link)
            .setURL(transcriptUrl)
    );

    await logChannelTranscripts.send({
        embeds: [ticketEmbed],
        components: [transcriptButton],
    });

    if (opener) {
        try {
            await opener.send({
                embeds: [ticketEmbed],
                components: [transcriptButton],
            });
        } catch (err) {
            console.error("Failed to DM opener:", err);
        }
    }

    setTimeout(async () => {
        await channel.delete().catch(() => { });
    }, 5000);
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const channelLocks = new Set();

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== "claim") return;

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
        await interaction.deferReply({ ephemeral: true });
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
            deny: [PermissionsBitField.SendMessages],
        });

        overwrites.push({
            id: user.id,
            allow: [
                PermissionsBitField.SendMessages,
                PermissionsBitField.ViewChannel,
            ],
        });

        allowedRoleIds.forEach((roleId) => {
            overwrites.push({
                id: roleId,
                allow: [
                    PermissionsBitField.SendMessages,
                    PermissionsBitField.ViewChannel,
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
});

connectDatabase = require(`./utils/database.js`)

connectDatabase();

client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    const channel = guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID || "");

    if (!channel) return console.error("Welcome channel not found!");

    const memberCount = guild.memberCount;

    const welcomeMessage = `Welcome to **Server Name** <@${member.user.id}>! We're a top-tier design server offering high-quality services tailored to your needs. Check out for more information!`;

    const buttonmembercount = new ButtonBuilder()
        .setCustomId("member_count_display")
        .setLabel(`${memberCount}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const buttonlink = new ButtonBuilder()
        .setLabel("Order")
        .setStyle(ButtonStyle.Link)
        .setURL(
            process.env.ORDER_LINK_URL || "https://discord.com"
        );

    const row = new ActionRowBuilder().addComponents(
        buttonmembercount,
        buttonlink
    );

    channel.send({ content: welcomeMessage, components: [row] });
});

(async () => {
    try {
        const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
        console.log("✅ Logged in as:", user);
    } catch (err) {
        console.error("❌ Failed to login:", err.message || err);
    }
})();

function CheckAccess(requiredRoles, userIDs, member, user) {
    if (member && requiredRoles) {
        const hasRole = requiredRoles.some(roleID => member._roles.includes(roleID));
        if (!hasRole && !member.permissions.has('Administrator')) {
            throw 'Missing roles';
        }
    }

    if (userIDs) {
        if (!userIDs.includes(user.id)) {
            throw 'Missing user whitelist';
        }
    }
}

function CheckPermissions(permissionsArray, member) {
    if (!Array.isArray(permissionsArray)) return;

    const missingPermissions = [];
    if (member && permissionsArray.length > 0) {
        for (const permission of permissionsArray) {
            if (member.permissions.has(Permissions[permission])) continue;
            missingPermissions.push(permission);
        }
    }

    if (missingPermissions.length > 0) throw missingPermissions.join(', ');
}

function CheckCooldown(user, command, cooldown) {
    if (client.cooldowns.has(user.id)) {
        const expiration = client.cooldowns.get(user.id);
        if (expiration > Date.now()) {
            const remaining = (expiration - Date.now()) / 1000;
            throw `Please wait ${remaining.toFixed(1)} more seconds before reusing the \`${command}\` command!`;
        }
    }
    if (!cooldown) return;
    client.cooldowns.set(user.id, Date.now() + cooldown * 1000);
}


async function InteractionHandler(interaction, type) {

    const args = interaction.customId?.split("_") ?? [];
    const name = args.shift();

    interaction.deferUpdate ??= interaction.deferReply;

    const component = client[type].get(name ?? interaction.commandName);
    if (!component) {
        client.logs.error(`${type} not found: ${interaction.customId}`);
        return;
    }

    try {
        CheckAccess(component.roles, component.users, interaction.member, interaction.user);
    } catch (reason) {
        await interaction.reply({
            content: "You don't have permission to use this command!",
            ephemeral: true
        }).catch(() => { });
        client.logs.error(`Blocked user from ${type}: ${reason}`);
        return;
    }

    try {
        CheckCooldown(interaction.user, component.customID ?? interaction.commandName, component.cooldown);
    } catch (reason) {
        await interaction.reply({
            content: reason,
            ephemeral: true
        }).catch(() => { });
        client.logs.error(`Blocked user from ${type}: On cooldown`);
        return;
    }

    try {
        CheckPermissions(component.userPerms, interaction.member);
    } catch (permissions) {
        await interaction.reply({
            content: `You are missing the following permissions: \`${permissions}\``,
            ephemeral: true
        }).catch(() => { });
        client.logs.error(`Blocked user from ${type}: Missing permissions`);
        return;
    }

    try {
        const botMember = interaction.guild.members.cache.get(client.user.id) ?? await interaction.guild.members.fetch(client.user.id);
        CheckPermissions(component.clientPerms, botMember);
    } catch (permissions) {
        await interaction.reply({
            content: `I am missing the following permissions: \`${permissions}\``,
            ephemeral: true
        }).catch(() => { });
        client.logs.error(`Could not execute ${type}: Missing bot permissions`);
        return;
    }

    try {
        if (interaction.isAutocomplete()) {
            await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
        } else {
            await component.execute(interaction, client, type === 'commands' ? undefined : args);
        }
    } catch (error) {
        client.logs.error(error.stack);
        await interaction.deferReply({ ephemeral: true }).catch(() => { });
        await interaction.editReply({
            content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
            embeds: [],
            components: [],
            files: [],
            ephemeral: true
        }).catch(() => { });
    }
}

client.on('interactionCreate', async function (interaction) {
    if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

    const subcommand = interaction.options._subcommand ?? "";
    const subcommandGroup = interaction.options._subcommandGroup ?? "";
    const commandArgs = interaction.options._hoistedOptions ?? [];
    const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);

    await InteractionHandler(interaction, 'commands');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isButton()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
    await InteractionHandler(interaction, 'buttons');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isStringSelectMenu()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
    await InteractionHandler(interaction, 'menus');
});


client.on('interactionCreate', async function (interaction) {
    if (!interaction.isModalSubmit()) return;
    client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
    await InteractionHandler(interaction, 'modals');
});

client.on('messageCreate', async function (message) {
    if (message.author.bot) return;
    if (!message.content?.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).split(/\s+/);
    const name = args.shift().toLowerCase();

    const command = client.messages.get(name);
    if (!command) {
        client.logs.error(`Command not found: ${name}`);
        return await message.reply(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``).catch(() => { });
    }

    try {
        CheckAccess(command.roles, command.users, message.member, message.author);
    } catch (reason) {
        await message.reply("You don't have permission to use this command!").catch(() => { });
        client.logs.error(`Blocked user from message: ${reason}`);
        return;
    }

    try {
        CheckCooldown(message.author, name, command.cooldown);
    } catch (reason) {
        await message.reply(reason).catch(() => { });
        client.logs.error(`Blocked user from message: On cooldown`);
        return;
    }

    try {
        CheckPermissions(command.userPerms, message.member);
    } catch (permissions) {
        await message.reply(`You are missing the following permissions: \`${permissions}\``).catch(() => { });
        client.logs.error(`Blocked user from message: Missing permissions`);
        return;
    }

    try {
        CheckPermissions(command.clientPerms, message.guild.me);
    } catch (permissions) {
        await message.reply(`I am missing the following permissions: \`${permissions}\``).catch(() => { });
        client.logs.error(`Could not execute message: Missing bot permissions`);
        return;
    }



    try {
        await command.execute(message, client, args);
    } catch (error) {
        client.logs.error(error.stack);
        await message.reply(`There was an error while executing this command!\n\`\`\`${error}\`\`\``).catch(() => { });
    } finally {
        client.cooldowns.set(message.author.id, Date.now() + command.cooldown * 1000);
        setTimeout(client.cooldowns.delete.bind(client.cooldowns, message.author.id), command.cooldown * 1000);
    }
});

client.login(process.env.TOKEN);