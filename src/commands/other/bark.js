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
const { spawn } = require('node:child_process');

module.exports = {
    cooldown: 60,
    data: new SlashCommandBuilder().setName('bark').setDescription('Make Ishowspeed bark for you'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        const botMember = interaction.guild.members.me;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        const permissions = voiceChannel.permissionsFor(botMember);
        if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
            return interaction.reply({
                content: 'I need Connect and Speak permissions in your voice channel.',
                ephemeral: true,
            });
        }

        await interaction.reply('Barking now...');
        let diagnosticSent = false;

        const report = async (message) => {
            console.error('[bark]', message);
            if (diagnosticSent) {
                return;
            }
            diagnosticSent = true;
            try {
                await interaction.followUp({
                    content: message,
                    ephemeral: true,
                });
            } catch {
                await interaction.editReply(`Barking failed: ${message}`).catch(() => {});
            }
        };

        let ffmpegPath;
        try {
            ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static');
            process.env.FFMPEG_PATH = ffmpegPath;
        } catch {
        }

        if (!ffmpegPath) {
            await report('Could not play bark audio: ffmpeg binary not found. Run npm install and restart the bot.');
            return;
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
        let ffmpeg;

        try {
            if (!fs.existsSync(audioPath)) {
                throw new Error('Audio file not found.');
            }

            ffmpeg = spawn(ffmpegPath, [
                '-hide_banner',
                '-loglevel',
                'error',
                '-i',
                audioPath,
                '-f',
                's16le',
                '-ar',
                '48000',
                '-ac',
                '2',
                'pipe:1',
            ]);

            const sound = createAudioResource(ffmpeg.stdout, { inputType: StreamType.Raw });

            connection.subscribe(audioPlayer);
            audioPlayer.play(sound);
        } catch (error) {
            connection.destroy();
            await report(`Could not play bark audio: ${error.message}`);
            return;
        }

        ffmpeg.on('error', async (error) => {
            connection.destroy();
            await report(`Could not start ffmpeg: ${error.message}`);
        });

        ffmpeg.stderr.on('data', async (chunk) => {
            if (playbackStarted) {
                return;
            }
            const message = chunk.toString().trim();
            if (!message) {
                return;
            }
            await report(`ffmpeg error: ${message.slice(0, 1500)}`);
        });

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
            await report(`Could not play bark audio: ${error.message}.${dependencyHint}`);
        });

        audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            playbackFinished = true;
            if (ffmpeg && !ffmpeg.killed) {
                ffmpeg.kill();
            }
            connection.destroy();
            if (!playbackStarted) {
                await report('Bark audio never started. Check bot Speak permission and that ffmpeg/opus dependencies are installed.');
            }
        });

        setTimeout(async () => {
            if (!playbackStarted && !playbackFinished) {
                if (ffmpeg && !ffmpeg.killed) {
                    ffmpeg.kill();
                }
                connection.destroy();
                await report('Bark timed out before playback started. Check bot permissions and voice connection stability.');
            }
        }, 10_000);

        
    },
};  