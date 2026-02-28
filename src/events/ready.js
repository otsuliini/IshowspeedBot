const { Events } = require('discord.js');
// Event listner for when the bot has logged in
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};


