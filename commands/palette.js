const { SlashCommandBuilder } = require('@discordjs/builders');
const chroma = require('chroma-js');
const { createCanvas } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('palette')
    .setDescription('Generates a random color palette')
    .addIntegerOption(option => 
      option.setName('colors')
        .setDescription('Number of colors in the palette')
        .setRequired(true)),
  async execute(interaction) {
    const numColors = interaction.options.getInteger('colors');

    const palette = Array.from({ length: numColors }, () => chroma.random().hex());

    const width = 100 * numColors;
    const height = 100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    palette.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(index * 100, 0, 100, height);
    });

    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: 'palette.png' });

    await interaction.reply({ files: [attachment] });
  },
};
