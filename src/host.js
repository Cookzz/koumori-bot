const Translation = require('./translation')
const MessageUtils = require('./utils/MessageUtils')
const { languages } = require('./constants/languages.json')

class Host{
  constructor(client) {
    this.prefix="." //prefix for running koumori
    this.client=client
    this.translator = new Translation(client)
    this.messageBuilder = new MessageUtils(client)

    /*
      Exceptions:
        youtube
        bilibili
        twitter,
        pixiv
    */
    this.urlExceptions = [
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/?)/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:bilibili|live\.bilibili)\.com\/?/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(b23\.tv)\/?/,
      /http(?:s)?:\/\/(?:www)?twitter\.com\/([a-zA-Z0-9_]+)/,
      /http(?:s)?:\/\/(?:www)?pixiv\.net\/?/
    ]

    this.command={
      wink : (c, m)=>this.wink(c, m),
      t: (c, m)=>this.translate(c, m),
      help: (c, m)=>this.help(c, m),
      test: (c,m)=>this.test(c,m)
    }
  }

  /**
   * Receives messages from the server that the bot resides in
   *
   * @param {Object} message Message object.
   * @return void.
  **/
  onMessage(message){
    // console.log("message", message)
    //first, check if message comes from Pingcord
    if (message.author.bot && message.author.id == '282286160494067712'){
      //read from embed
      if (message.embeds.length > 0){
        let embeddedText = message.embeds[0].description

        this.translateTweet(embeddedText, message)
      }
    } else if (message.author.bot){
      //ignore messages sent by "bots" including self
      return
    }

    //if message contains url, remove it
    const hasUrl = this.filterUrl(message);
    if (hasUrl){
      return
    }

    if ((message.content).charAt(0) == this.prefix){
      // console.log("message", message)
      let content = (message.content).substring(1)
      this.processCommands(content.split((/(?<=^\S+)\s/)), message)
    }
  }

  /**
   * Process the messages before running any function based on parameters provided
   *
   * @param {Object} m Message object.
   * @param {Array} c The "contents" of the message.
   * @return void.
  **/
  processCommands(c, m){
    if (this.command[c[0]] && c.length > 1){
      this.command[c[0]](c[1], m)
    } else if (this.command[c[0]]){
      this.command[c[0]](c[0], m)
    } else {
      m.reply("This command does not exist")
    }
  }

  async test(content, message){
    if (message.embeds.length > 0){
      let embedText = message.embeds[0].description

      this.translateTweet(embedText, message)
    }
  }

  /*
    command functions (need to move to another class soon)
  */
  wink(content, message){
    const { MessageEmbed } = require('discord.js');

    const embeddedMsg = new MessageEmbed()
                          .setTitle('Nano winks.')
                          .setImage('https://media.giphy.com/media/I0qM3KvtqikqXowbSZ/giphy-downsized-large.gif')
    message.channel.send(embeddedMsg)
  }

  //create help message to use Koumori Bot
  help(content, message){
    const embeddedMsg = this.messageBuilder.showHelp(message)

    message.reply(embeddedMsg)
  }

  /**
   * Process the content that has to be passed to the translator
   *
   * @param {String} content A string of message
   * @param {Object} message Message object
   * @return void.
  **/
  translate(content, message){
    // console.log("content", content)
    let newContent = content.split((/(?<=^\S+)\s/))
    // console.log('new content', newContent)

    //Check if the language is supported or not
    if (!newContent[1]){
      message.reply("No message to translate.")
      return
    }

    //check if there are multiple languages (ex: cn,en)
    if (newContent[0].match(/\s*,\s*/)){
      let languageList = newContent[0].split(/\s*,\s*/)

      if (languageList.some(lang => !languages[lang])){
        message.reply("Invalid language parameter.")
        return
      }

      this.multiLanguageTranslation(newContent[1], languageList, message)
    } else {
      if (!languages[newContent[0]]){
        message.reply("Invalid language parameter.")
        return
      }
      this.singleLanguageTranslation(newContent, message)
    }
  }

  /**
   * Handles translations for a single language
   *
   * @param {Array} content An array of content ['<target_language>', '<text>']
   * @param {Object} message Message object
   * @return void.
  **/
  async singleLanguageTranslation(content, message){
    const target = content[0]
    const translateText = content[1]
    const source = await this.translator.detectLanguage(translateText)

    const translateParams = {
      text: translateText,
      source,
      target
    };

    if (source == target){
      message.reply("Same language do not need to be translated.")
      return
    }

    let embeddedMsg = null

    if (target == 'zh'){
      let translatedText = await this.translator.BaiduTranslator(translateParams, message)
      const fieldParam = {
        title: languages[translateParams.target].language_name,
        description: translatedText
      }
    
      embeddedMsg = this.messageBuilder.embedMessageBuilder([fieldParam], translateParams, message)
    } else {
      // let translatedText = await this.translator.IBMTranslator(translateParams, message)
      let translatedText = await this.translator.GoogleTranslator(translateParams, message)
      const fieldParam = {
        title: languages[translateParams.target].language_name,
        description: translatedText
      }

      embeddedMsg = this.messageBuilder.embedMessageBuilder([fieldParam], translateParams, message)
    }

    if (embeddedMsg){
      message.channel.send(embeddedMsg)
    } else {
      message.channel.send("Something went wrong with the translation.")
    }
  }

  /**
   * Handles translations for more than one languages
   *
   * @param {String} content A string of content to be translated 
   * @param {Array} list An array of languages to translate to
   * @param {Object} message Message object
   * @return void.
  **/
  async multiLanguageTranslation(content, list, message){
    const parallel = require('async/parallel')
    const source = await this.translator.detectLanguage(content)

    //compile an object that we will have to run in parallel
    let translationAry = list.map((lang)=>{
      const langParams = {
        text: content,
        source,
        target: lang
      };

      if (lang == 'zh'){
        return (
          (callback) => {
            this.translator.BaiduTranslator(langParams).then((enTranslationText)=>{
              callback(null, { 
                lang,
                text: enTranslationText 
              })
            }, (err)=>{
              callback(err, null)
            })
          }
        )
      } else {
        return (
          (callback) => {
            this.translator.GoogleTranslator(langParams).then((enTranslationText)=>{
              callback(null, { 
                lang,
                text: enTranslationText 
              })
            }, (err)=>{
              callback(err, null)
            })
          }
        )
      }
    })

    //run translations in parallel
    parallel(translationAry, (err, res)=>{
      if (err || res.length == 0){
        return
      }

      let fieldParams = res.map((translation)=>({
        title: languages[translation.lang].language_name,
        description: translation.text
      }))

      let embeddedMsg = this.messageBuilder.embedMessageBuilder(fieldParams, {source}, message)
    
      if (embeddedMsg){
        message.channel.send(embeddedMsg)
      } else {
        message.channel.send("Something went wrong with the translation.")
      }
    })
  }

  /**
   * Handles translations from twitter
   *
   * @param {String} content A string of content to be translated
   * @param {Object} message Message object
   * @return void.
  **/
  async translateTweet(text, message){
    const parallel = require('async/parallel')

    const formattedText = text.replace(/(^|[^\n])\n{1}(?!\n)/g, (match) => {
      return `${match}\n`
    });

    const source = await this.translator.detectLanguage(text)

    //translate to en and cn
    const enParams = {
      text: formattedText,
      source,
      target: 'en'
    }
    const cnParams = {
      text: formattedText,
      source,
      target: 'zh'
    }

    //translate both en and cn in parallel
    parallel({
      en: (callback)=>{
        this.translator.GoogleTranslator(enParams).then((enTranslationText)=>{
          callback(null, enTranslationText)
        }, (err)=>{
          callback(err, null)
        })
        
      },
      cn: (callback)=>{
        this.translator.GoogleTranslator(cnParams).then((cnTranslationText)=>{
          callback(null, cnTranslationText)
        }, (err)=>{
          callback(err, null)
        })
        
      }
    }, (err, res) => {
      if (!err){
        const fieldParams = [{
          title: languages[enParams.target].language_name,
          description: res.en
        },{
          title: languages[cnParams.target].language_name,
          description: res.cn
        }]
    
        let embeddedMsg = this.messageBuilder.embedMessageBuilder(fieldParams, {source}, message)
    
        if (embeddedMsg){
          message.channel.send(embeddedMsg)
        } else {
          message.channel.send("Something went wrong with the translation.")
        }

      } else {
        message.channel.send("Something went wrong with the translation.")
      }
    })
  }

  checkRole(roles){
    const whitelistRoles = [
      "Admin",
      "Translators"
    ]

    return whitelistRoles.find(
      (role) => roles.find(r => r.name === role)
    )
  }

  filterUrl(message){
    //check for role first
    let isPermitted = this.checkRole(message.member.roles.cache)

    if (!isPermitted && (message.content).match(/(?:https?:\/\/)/)){
      let isException = this.urlExceptions.some(url => url.test(message.content))

      if (!isException){
        //log what link is being deleted
        console.log("deleted: " + message.content)

        message.delete()

        return true
      }
    }

    return false
  }


}

module.exports=Host
