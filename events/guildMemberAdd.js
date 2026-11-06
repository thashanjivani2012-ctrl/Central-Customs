const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: "guildMemberAdd",
    async execute(client, member) {
        const guild = member.guild;
        const channel = guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID || "");

        if (!channel) return console.error("Welcome channel not found!");

        const memberCount = guild.memberCount;

        const welcomeMessage = `Welcome to **Server Name** <@${member.user.id}>! We're a top-tier design server offering high-quality services tailored to your needs. Check out for more information!`;

        const buttonmembercount = new ButtonBuilder()
            .setCustomId("member_count_display")
            .setLabel(`${memberCount}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const buttonlink = new ButtonBuilder()
            .setLabel("Order")
            .setStyle(ButtonStyle.Link)
            .setURL(
                process.env.ORDER_LINK_URL || "https://discord.com"
            );

        const row = new ActionRowBuilder().addComponents(
            buttonmembercount,
            buttonlink
        );

        channel.send({ content: welcomeMessage, components: [row] });
    },
};
