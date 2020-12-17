const Discord = require('discord.js');

const Host = require('./src/host.js');

const client = new Discord.Client();
const { token } = require('./constants');

const host=new Host(client)
client.login(token)

client.on('ready', () => {
  console.log("koumori bot ready")
});

client.on('message', async message => host.onMessage(message));