const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
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

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        
        const audioPlayer = createAudioPlayer();

        const sound = createAudioResource(path.join(__dirname, '../../../assets/bark-bark-ishowspeed.mp3'));

     

        audioPlayer.play(sound);
        const subscription = connection.subscribe(audioPlayer);

        if (subscription) {
            setTimeout(() => subscription.unsubscribe(), 5_000);
        }

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        
    },
};