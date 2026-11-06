const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

if (!fs.existsSync(configPath)) {
    console.error('❌ config.json not found. Please create one in the project root.');
    process.exit(1);
}

const { MONGO_URI } = require(configPath);

const connectDatabase = async () => {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in config.json.');
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
