const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

let MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

if (!MONGO_URI && fs.existsSync(configPath)) {
    ({ MONGO_URI } = require(configPath));
}

const connectDatabase = async () => {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in environment or config.json.');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connection established.');
        
        const schemasPath = path.join(__dirname, '..', 'schemas');
        fs.readdirSync(schemasPath).forEach(file => {
            if (file.endsWith('.js')) {
                require(path.join(schemasPath, file));
            }
        });

        console.log('📦 All schemas loaded.');
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err);
        process.exit(1);
    }
};

module.exports = connectDatabase;
