const { Vonage } = require("@vonage/server-sdk");

console.log("API KEY: ",process.env.VONAGE_API_KEY);

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

module.exports = vonage;
