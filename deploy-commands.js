//adds commmands to discord so that when user types / it'll show the possible commandds

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require(process.env.BOT_TOKEN);
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);


(async () => {
    
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const guildCommands = [];
        const globalCommands = [];

        for (const command of commands){
            if (command.guildOnly){
                 // The put method is used to fully refresh all commands in the guild with the current set
                guildCommands.push(command.data.toJSON());
            }
            else{
                globalCommands.push(command.data.toJSON());
            }
        }

        //deploy commands
        if (guildCommands.length > 0){
            await rest.put(Routes.applicationGuildCommands(clientId, guildId)),
            { body: guildCommands}
        }

        if (globalCommands.length > 0){
            await rest.put(
                Routes.applicationCommands(clientId),
                {body: globalCommands}
            )
        }
		
		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		
		console.error(error);
	}
})();
