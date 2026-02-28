const { SlashCommandBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    demuxProbe,
} = require('@discordjs/voice');
const fs = require('node:fs');
const path = require('path');

module.exports = {
    cooldown: 60,
    data: new SlashCommandBuilder().setName('bark').setDescription('Make Ishowspeed bark for you'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        await interaction.reply('Barking now...');

        try {
            if (!process.env.FFMPEG_PATH) {
                process.env.FFMPEG_PATH = require('ffmpeg-static');
            }
        } catch {
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        
        const audioPlayer = createAudioPlayer();
        const audioPath = path.join(__dirname, '../../../assets/bark-bark-ishowspeed.mp3');

        try {
            if (!fs.existsSync(audioPath)) {
                throw new Error('Audio file not found.');
            }

            await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

            const stream = fs.createReadStream(audioPath);
            const { stream: probedStream, type } = await demuxProbe(stream);
            const sound = createAudioResource(probedStream, { inputType: type });

            connection.subscribe(audioPlayer);
            audioPlayer.play(sound);
        } catch (error) {
            connection.destroy();
            return interaction.followUp({
                content: `Could not play bark audio: ${error.message}`,
                ephemeral: true,
            });
        }

        audioPlayer.on('error', () => {
            connection.destroy();
        });

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        
    },
};