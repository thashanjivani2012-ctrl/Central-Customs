module.exports = {
    customID: 'deny',
    execute: async function(interaction) {
        await interaction.deferUpdate();
        await interaction.editReply({ content: `The work has been denied by ${interaction.user.username} - (${interaction.user.id})\nEnsure to leave feedback for improvement`, components: [] });
    }
};
