const ReadFolder = require('./ReadFolder.js');
const { existsSync } = require('node:fs');

const { PermissionsBitField: { Flags: Permissions } } = require('discord.js');

const modules = [
	'commands',
	'buttons',
	'menus',
	'modals',
	'messages',
];

module.exports = function (client) {
	for (const module of modules) {
		client.logs.debug(`Loading ${module}...`)
		client[module] = new Map();

		if (!existsSync(`${__dirname}/../${module}`)) {
			client.logs.warn(`No ${module} folder found - Skipping...`);
			continue;
		}

		const files = ReadFolder(module);
		for (const { path, data } of files) {
			try {
				if (!data.execute) throw `No execute function found`;
				if (typeof data.execute !== 'function') throw `Execute is not a function`;
				
				if (data.roles) {
					if (!Array.isArray(data.roles)) throw `Invalid roles type - Must be an array`;
					if (data.roles.every(role => typeof role !== 'string')) throw `Invalid roles type - Must be an array of strings`;
				}

				if (data.users) {
					if (!Array.isArray(data.users)) throw `Invalid users type - Must be an array`;
					if (data.users.every(user => typeof user !== 'string')) throw `Invalid users type - Must be an array of strings`;
				}

				if (data.clientPerms) {
					if (!Array.isArray(data.clientPerms)) throw `Invalid bot permissions type - Must be an array`;
					if (data.clientPerms.every(perm => typeof perm !== 'string')) throw `Invalid bot permissions type - Must be an array of strings`;
					CheckPerms(data.clientPerms, 'bot');
				}

				if (data.userPerms) {
					if (!Array.isArray(data.userPerms)) throw `Invalid user permissions type - Must be an array`;
					if (data.userPerms.every(perm => typeof perm !== 'string')) throw `Invalid user permissions type - Must be an array of strings`;
					CheckPerms(data.userPerms, 'user');
				}

				switch (module) {
					case 'messages':
						if (!data.name) throw 'No name property found';
						if (!data.description) throw 'No description property found';
						if (data.cooldown && typeof data.cooldown !== 'number') throw 'Invalid cooldown type - Must be a number (seconds)';
						addComponent(client[module], data.name, data);
						break;
					case 'commands':
						if (!data.data) throw 'No data property found';
						addComponent(client[module], data.data.name, data);
						break;
					case 'buttons':
					case 'menus':
					case 'modals':
						if (!data.customID) throw 'No custom ID has been set';
						if (!Array.isArray(data.customID) && typeof data.customID !== 'string') throw 'Invalid custom ID type - Must be string (single) or array (multiple)';
						addComponent(client[module], data.customID, data);
						break;
				}
			} catch (error) {
				client.logs.error(`[${module.toUpperCase()}] Failed to load ./${path}: ${error.stack || error}`);
			}

		}
		client.logs.success(`Loaded ${client[module].size} ${module}`)
	}
};

function CheckPerms(perms, type) {
	if (!Array.isArray(perms)) return;
	const invalidPerms = [];
	for (let i = 0; i < perms.length; i++) {
		if (Permissions[perms[i]]) continue;
		invalidPerms.push(perms[i]);
	}
	if (invalidPerms.length > 0) throw `Invalid ${type} permissions found: ${invalidPerms.join(', ')}`;
}

function addComponent(map, id, data) {
	const duplicateIDs = [];
	if (Array.isArray(id)) {
		for (const i of id) {
			if (map.has(i)) duplicateIDs.push(i);
			map.set(i, Object.assign(data, { customID: i }));
		}
	}

	if (typeof id === 'string') {
		if (map.has(id)) duplicateIDs.push(id);
		map.set(id, Object.assign(data, { customID: id }));
	}

	if (duplicateIDs.length > 0) throw `Duplicate IDs found: ${duplicateIDs.join(', ')}`;
}