const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { createReadStream } = require('node:fs');
const { join } = require('node:path');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('bark')
        .setDescription('Ishowspeed barks, only available if you are in a voice channel'),
    async execute(interaction) {
        const userVoice = interaction.member.voice;
        if (!userVoice.channel) return interaction.reply("You must be in a voice channel!");

        const voiceConnection = joinVoiceChannel({
            channelId: userVoice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        // Corrected path to your MP3
        const audioFile = createAudioResource(
            createReadStream(join(__dirname, '..', '..', '..', 'assets', 'bark-bark-ishowspeed.mp3')),
            { inlineVolume: true }
        );
        audioFile.volume.setVolume(0.3);
        
        const musicPlayer = createAudioPlayer();
        voiceConnection.subscribe(musicPlayer);
        musicPlayer.play(audioFile);

        console.log('Audio should be playing now');
        await interaction.reply('Bot has joined and should be playing music!');
    }
};