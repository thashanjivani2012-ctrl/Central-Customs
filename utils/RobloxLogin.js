const noblox = require('noblox.js');

module.exports = async function () {
    try {
        const user = await noblox.setCookie(process.env.ROBLOX_COOKIE);
        console.log('✅ Logged in as:', user);
    } catch (err) {
        console.error('❌ Failed to login:', err.message || err);
    }
};
