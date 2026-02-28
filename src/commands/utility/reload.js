const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {

    //The reload command ideally should not be used by every user. You should deploy it as a guild command in a private guild.
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption((option) => option.setName('command').setDescription('The command to reload.').setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);
		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}
        
        const commandsRoot = path.join(__dirname, '..');
        const commandFolders = fs.readdirSync(commandsRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        let targetPath;
        for (const folder of commandFolders) {
            const candidatePath = path.join(commandsRoot, folder, `${commandName}.js`);
            if (fs.existsSync(candidatePath)) {
                targetPath = candidatePath;
                break;
            }
        }

        if (!targetPath) {
            return interaction.reply(`Could not find a file for command \`${commandName}\`.`);
        }

        delete require.cache[require.resolve(targetPath)];

        try {
            const newCommand = require(targetPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(
                `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
            );
        }
	},

        
    guildOnly: true
};