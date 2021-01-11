const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth')
const { IBM_API_KEY } = require('../constants');

const { Google } = require('@opentranslate/google')

const languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  authenticator: new IamAuthenticator({
    apikey: IBM_API_KEY,
  }),
  serviceUrl: 'https://api.jp-tok.language-translator.watson.cloud.ibm.com/instances/db997016-5397-4c2e-8d4e-947ea873f30e',
});

const translate = require("baidu-translate-api");

const Database = require('./utils/database_utils')

class Translation {
  constructor(client) {
    this.client=client
  }

  /**
   * Detect language from user input
   *
   * @param {String} text   User input text
   * @return {String}       Language (en, cn, etc.)
  **/
  async detectLanguage(text){
    let result = await languageTranslator.identify({text})

    return result.result.languages[0].language
  }

  /**
   * Run the IBM cloud translator
   *
   * @param {Object} params   Translation parameters
   * @param {Object} message  Message object
   * @return {String} Translated text.
  **/
  async IBMTranslator(params, message){
    try {
      const { result } = await languageTranslator.translate(params)
      const translatedMessage = result.translations[0].translation

      const insertObj = {
        source: params.source,
        target: params.target,
        origText: params.text,
        transText: translatedMessage
      }
      Database.insertDb(insertObj)
      
      return translatedMessage
    } catch (err){
      console.log('error:', err);

      let error = JSON.stringify(err)

      if (error.includes('Unable to automatically detect the source language, confidence too low')){
        message.reply("Unable to translate.")
      } else if (error.includes('target language is not supported')){
        message.reply("Unsupported language")
      } else {
        //if the failure is unknown, fallback to baidu
        return await this.BaiduTranslator(params, message)
      }
    }
  }

  /**
   * Run Baidu Translator
   *
   * @param {Object} params   Translation parameters
   * @param {Object} message  Message object
   * @return {String} Translated text.
  **/
  async BaiduTranslator(params, message){
    const options = {
      to: params.target
    }

    try {
      const result = await translate(params.text, options)
      const translatedMessage = result.trans_result.dst

      //Translation object { source: .., target: .., origText: .., transText: .. }.
      const insertObj = {
        source: params.source,
        target: params.target,
        origText: params.text,
        transText: translatedMessage
      }
      Database.insertDb(insertObj)

      return translatedMessage
    } catch (err){
      console.log('error:', err);

      let error = JSON.stringify(err)

      if (error.includes('Unable to automatically detect the source language, confidence too low')){
        message.reply("Unable to translate.")
      } else if (error.includes('target language is not supported')){
        message.reply("Unsupported language")
      }

      //use google translate as last result
      this.GoogleTranslator(params, message)
    }
  }

  /**
   * Run Google Translate
   *
   * @param {Object} params   Translation parameters
   * @param {Object} message  Message object
   * @return {String} Translated text.
  **/
  async GoogleTranslator(params, message){
    const google = new Google({
      order: ['com', 'cn'],
      concurrent: true,
      apiAsFallback: true
    })

    try {
      const result = await google.translate(params.text, params.source, params.target)
      const translatedMessage = result.trans.paragraphs[0]

      const insertObj = {
        source: params.source,
        target: params.target,
        origText: params.text,
        transText: translatedMessage
      }
      Database.insertDb(insertObj)

      return translatedMessage
    } catch (err){
      console.log('error:', err);

      let error = JSON.stringify(err)

      if (error){
        return await this.IBMTranslator(params, message)
      }
    }
  }
}

module.exports=Translation