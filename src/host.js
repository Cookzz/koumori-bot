const Translation = require('./translation')

class Host{
  constructor(client) {
    this.prefix="." //prefix for running koumori
    this.client=client
    this.translator = new Translation(client)

    /*
      Exceptions:
        youtube
        bilibili
        twitter,
        pixiv
    */
    this.urlExceptions = [
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:bilibili|live\.bilibili)\.com\/?/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(b23\.tv)\/?/,
      /http(?:s)?:\/\/(?:www)?twitter\.com\/([a-zA-Z0-9_]+)/,
      /http(?:s)?:\/\/(?:www)?pixiv\.net\/?/
    ]

    this.command={
      wink : (c, m)=>this.wink(c, m),
      t: (c, m)=>this.translate(c, m)
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

  /**
   * Process the content that has to be passed to the translator
   *
   * @param {String} content A string of message
   * @param {Object} message Message object
   * @return void.
  **/
  async translate(content, message){
    // console.log("content", content)
    let newContent = content.split((/(?<=^\S+)\s/))
    // console.log('new content', newContent)

    /* Check if the language is supported or not */
    const { languages } = require('./constants/languages.json')
    if (!languages[newContent[0]]){
      message.reply("Invalid language parameter")
      return
    }

    const target = newContent[0]
    const translateText = newContent[1]
    const source = await this.translator.detectLanguage(translateText)

    const translateParams = {
      text: translateText,
      source,
      target
    };

    if (target == 'zh'){
      this.translator.BaiduTranslator(translateParams, message)
    } else {
      this.translator.IBMTranslator(translateParams, message)
    }
  }

  onMessage(message){
    //ignore messages sent by "bots" including self
    if (message.author.bot){
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
