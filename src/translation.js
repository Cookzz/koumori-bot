const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth')
const { IBM_API_KEY } = require('../constants');

const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  authenticator: new IamAuthenticator({
    apikey: IBM_API_KEY,
  }),
  serviceUrl: 'https://api.jp-tok.language-translator.watson.cloud.ibm.com/instances/db997016-5397-4c2e-8d4e-947ea873f30e',
});

const translate = require("baidu-translate-api");

class Translation {
  constructor(client) {
    this.client=client
  }

  /**
   * Detect language from user input
   *
   * @param {String} text User input text
   * @return {String} User text
  **/
  async detectLanguage(text){
    let result = await languageTranslator.identify({text})

    return result.result.languages[0].language
  }

  /**
   * Run the IBM cloud translator
   *
   * @param {Object} params Translation parameters
   * @param {Object} message Message object
   * @return void.
  **/
  async IBMTranslator(params, message){
    try {
      const { result } = await languageTranslator.translate(params)

      const translatedMessage = result.translations[0].translation
      const { MessageEmbed } = require('discord.js');
      const { languages } = require('./constants/languages.json')

      const embeddedMsg = new MessageEmbed()
                            .setAuthor(message.author.username, message.author.displayAvatarURL())
                            .setDescription(translatedMessage)
                            .setFooter(`From ${languages[params.source].language_name}`)

      message.channel.send(embeddedMsg)
    } catch (err){
      console.log('error:', err);

      let error = JSON.stringify(err)

      if (error.includes('Unable to automatically detect the source language, confidence too low')){
        message.reply("Unable to translate.")
      } else if (error.includes('target language is not supported')){
        message.reply("Unsupported language")
      } else {
        //if the failure is unknown, fallback to baidu
        this.BaiduTranslator(params, message)
      }
    }
  }

  /**
   * Run Baidu Translator
   *
   * @param {Object} params Translation parameters
   * @param {Object} message Message object
   * @return void.
  **/
  async BaiduTranslator(params, message){
    const options = {
      to: params.target
    }

    try {
      const result = await translate(params.text, options)
      const translatedMessage = result.trans_result.dst

      const { MessageEmbed } = require('discord.js');
      const { languages } = require('./constants/languages.json')

      const embeddedMsg = new MessageEmbed()
                            .setAuthor(message.author.username, message.author.displayAvatarURL())
                            .setDescription(translatedMessage)
                            .setFooter(`From ${languages[params.source].language_name}`)

      message.channel.send(embeddedMsg)
    } catch (err){
      console.log('error:', err);

      let error = JSON.stringify(err)

      if (error.includes('Unable to automatically detect the source language, confidence too low')){
        message.reply("Unable to translate.")
      } else if (error.includes('target language is not supported')){
        message.reply("Unsupported language")
      }
    }
  }
}

module.exports=Translation