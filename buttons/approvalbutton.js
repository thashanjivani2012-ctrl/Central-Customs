module.exports = {
    customID: 'approve',
    execute: async function(interaction) {
        await interaction.deferUpdate();
        await interaction.editReply({ 
            content: `The work has been approved by ${interaction.user.username} - (${interaction.user.id})`, 
            components: [] 
        });
    }
};
