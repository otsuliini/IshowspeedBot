const { SlashCommandBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    StreamType,
    generateDependencyReport,
} = require('@discordjs/voice');
const fs = require('node:fs');
const path = require('path');
const prism = require('prism-media');

module.exports = {
    cooldown: 60,
    data: new SlashCommandBuilder().setName('bark').setDescription('Make Ishowspeed bark for you'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        await interaction.reply('Barking now...');

        let ffmpegPath;
        try {
            ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static');
            process.env.FFMPEG_PATH = ffmpegPath;
        } catch {
        }

        if (!ffmpegPath) {
            return interaction.followUp({
                content: 'Could not play bark audio: ffmpeg binary not found. Run `npm install` and restart the bot.',
                ephemeral: true,
            });
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        
        const audioPlayer = createAudioPlayer();
        const audioPath = path.join(__dirname, '../../../assets/bark-bark-ishowspeed.mp3');
        let playbackStarted = false;
        let playbackFinished = false;

        try {
            if (!fs.existsSync(audioPath)) {
                throw new Error('Audio file not found.');
            }

            const transcoder = new prism.FFmpeg({
                args: [
                    '-analyzeduration',
                    '0',
                    '-loglevel',
                    '0',
                    '-i',
                    audioPath,
                    '-f',
                    's16le',
                    '-ar',
                    '48000',
                    '-ac',
                    '2',
                    'pipe:1',
                ],
            });

            const sound = createAudioResource(transcoder, { inputType: StreamType.Raw });

            connection.subscribe(audioPlayer);
            audioPlayer.play(sound);
        } catch (error) {
            connection.destroy();
            return interaction.followUp({
                content: `Could not play bark audio: ${error.message}`,
                ephemeral: true,
            });
        }

        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            playbackStarted = true;
        });

        audioPlayer.on('error', async (error) => {
            connection.destroy();
            if (!interaction.replied && !interaction.deferred) {
                return;
            }
            const dependencyHint = generateDependencyReport().includes('FFmpeg')
                ? ''
                : ' Voice runtime dependencies are missing.';
            await interaction.followUp({
                content: `Could not play bark audio: ${error.message}.${dependencyHint}`,
                ephemeral: true,
            }).catch(() => {});
        });

        audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            playbackFinished = true;
            connection.destroy();
            if (!playbackStarted) {
                await interaction.followUp({
                    content: 'Bark audio never started. Check bot Speak permission and that ffmpeg/opus dependencies are installed.',
                    ephemeral: true,
                }).catch(() => {});
            }
        });

        setTimeout(async () => {
            if (!playbackStarted && !playbackFinished) {
                connection.destroy();
                await interaction.followUp({
                    content: 'Bark timed out before playback started. Check bot permissions and voice connection stability.',
                    ephemeral: true,
                }).catch(() => {});
            }
        }, 10_000);

        
    },
};  