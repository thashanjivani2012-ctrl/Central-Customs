const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ticketSchema = new Schema({
    GuildID: String,
    OwnerID: String,
    OpenerID: [String],
    TicketID: String,
    ChannelID: String,
    Locked: Boolean,
    Claimed: Boolean,
    ClaimedBy: String
});

const Ticket = model('Ticket', ticketSchema);

module.exports = Ticket;
