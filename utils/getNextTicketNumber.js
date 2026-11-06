const Counter = require("../schemas/Counter");

/**
 * Gets the next global ticket number.
 * @returns {Promise<number>}
 */
module.exports = async function getNextTicketNumber() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "ticketCounter" },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    return counter.value;
  } catch (err) {
    console.error("Error incrementing ticket number:", err);
    return Math.floor(Math.random() * 1000);
  }
};
