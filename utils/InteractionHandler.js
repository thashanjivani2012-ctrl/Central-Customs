const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

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

function CheckCooldown(client, user, command, cooldown) {
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

async function InteractionHandler(client, interaction, type) {

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
        CheckCooldown(client, interaction.user, component.customID ?? interaction.commandName, component.cooldown);
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
        if (component.clientPerms?.length && interaction.guild) {
            const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
            CheckPermissions(component.clientPerms, botMember);
        }
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

module.exports = InteractionHandler;
