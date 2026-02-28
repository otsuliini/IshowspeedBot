const { Events } = require("discord.js");

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return; // return if command is not a slash command
	console.log(interaction);

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`no command matching ${interaction.commandName} was found.`)
        return; 
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred){
            await interaction.followUp({
                content: 'Error while executing command', 
                flags: MessageFlags.Ephmeral    
        
            });
            
        } else {
            await interaction.reply({
                content: 'Error while executing command',
                flags: MessageFlags.Ephmeral    
            });
        }
    }

});

