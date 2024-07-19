import { Client, GatewayIntentBits, ChannelType } from "discord.js";
import backup from "discord-backup";
import { writeFile } from "fs/promises";

// PARAMETERS
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_TOKEN
const TEAMS_ROLES_COLOR = 3447003; // Blue
const ROLES_A_CONSERVER = [
	"351047914874994698", // Staff+
	"896118952525176843", // Admin
	"876545170466807858", // Bot
	"876442563874275339", // JoséBot
	"896105840732422197", // UTT Arena
	"914105296610283551", // Cantine UTT Arena
	"632194002141184000", // Nitro Booster
	"351055948007342082", // Casteur
	"1209241608500027392", // Staff Animation UA23 (sauvegarde)
];
const CATEGORIES_TO_KEEP = [
	"693057070869774406", // STAFF
	"491953709123764236", // Général
	"368536098571550721", // Par tournoi
];

const bot = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
	],
	presence: {
		status: "invisible",
	},
});

const teamsRolesDeletion = async (guild) => {
	console.log(">>> Teams Roles Deletion > start");
	const roles = await guild.roles.cache.filter(
		(role) => role.color === TEAMS_ROLES_COLOR
	);
	const player_roles = await roles.map((r) => guild.roles.cache.get(r.id));
	await Promise.all(
		player_roles
			.filter((pr) => !ROLES_A_CONSERVER.includes(pr.id))
			.map((pr) => {
				console.log(`Deletion of the ${pr.name} (id:${pr.id}) role`);
				pr.delete();
			})
	);
	console.log(">>> Teams Roles Deletion > ok\n");
};

const rolesRemoving = async (guild) => {
	console.log(">>> Roles Removing > start");
	// Fetch guild members
	const members = Array.from(await guild.members.fetch());
	// List all the roles
	const roles = members
		.map(([, member]) =>
			Array.from(member.roles.cache.values())
				.map((role) => [member, role])
				.filter(
					([, role]) =>
						!ROLES_A_CONSERVER.includes(role.id) && role.id != GUILD_ID
				)
		)
		.flat();
	// Execute role removal
	await Promise.all(
		roles.map(async ([member, role]) => {
			console.log(
				`Removing role ${role.name} (id:${role.id}) from ${member.user.username} (id:${member.id})`
			);
			return member.roles.remove(role.id);
		})
	);
	console.log(">>> Roles Removing > ok\n");
};

const teamsChannelsCleaning = async (guild) => {
	console.log(">>> Tournaments Channels Cleaning > start");
	const categories = await guild.channels.cache.filter(
		(channel) => channel.type == ChannelType.GuildCategory // Get just categories
	);
	for (let [catId, category] of categories) {
		if (!CATEGORIES_TO_KEEP.includes(catId)) {
			let channelsToDelete = category.children.cache.filter(
				(children) =>
					!children.name.includes("｜annonces") &&
					!children.name.includes("｜général")
			);
			await Promise.all(
				Array.from(channelsToDelete).map(async ([channelId, channel]) => {
					console.log(
						`Deleting channel ${channel.name} (id:${channel.id}) in category ${category.name} (id:${category.id})`
					);
					return channel.delete();
				})
			);
			let channelsToClear = category.children.cache.filter(
				(children) =>
					children.name.includes("｜annonces") ||
					children.name.includes("｜général")
			);
			await Promise.all(
				Array.from(channelsToClear).map(async ([channelId, channel]) => {
					console.log(
						`Clearing channel ${channel.name} (id:${channel.id}) in category ${category.name} (id:${category.id})`
					);
					await guild.channels.create({
						type: channel.type,
						name: channel.name,
						topic: channel.topic,
						reason: "Recréation du channel pour le clear",
						position: channel.position,
						permissionOverwrites: channel.permissionOverwrites.cache,
						parent: channel.parent,
						nsfw: channel.nsfw,
						rateLimitPerUser: channel.rateLimitPerUser,
					});
					return channel.delete();
				})
			);
		}
	}
	console.log(">>> Teams Channels Cleaning > ok\n");
};

const backupGuild = async (guild) => {
	console.log(">>> Backup > start");
	const result = await backup.create(guild, {
		saveImages: "base64",
		backupMembers: true,
		jsonSave: true,
		maxMessagesPerChannel: 10000000000,
		jsonBeautify: true,
	});
	await writeFile("backup.json", JSON.stringify(result));
	console.info(">>> Backup > ok\n");
};

bot.once("ready", async () => {
	const guild = bot.guilds.resolve(GUILD_ID);
	try {
		// SUPPRESSION DES ROLES D'EQUIPE
		if (!process.argv.includes("--no-roles-deletion")) {
			await teamsRolesDeletion(guild);
		}

		// RETIREMENT DES ROLES
		if (!process.argv.includes("--no-roles-removing")) {
			await rolesRemoving(guild);
		}

		// NETTOYAGE DES CHANNELS DE TOURNOIS
		if (!process.argv.includes("--no-channels-cleaning")) {
			await teamsChannelsCleaning(guild);
		}
	} catch (err) {
		console.error(err);
	}

	if (process.argv.includes("--backup")) {
		await backupGuild(guild);
	}

	bot.destroy();
});

bot.login(TOKEN);
