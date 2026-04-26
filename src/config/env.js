require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://Erpsystem:erpSystem@cluster0.bc2yuc7.mongodb.net/vantus_erp?appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'https://erp-frontent.vercel.app',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

module.exports = env;
