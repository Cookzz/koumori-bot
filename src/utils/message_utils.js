const { MessageEmbed } = require('discord.js');

class MessageUtils{
  constructor(client) {
    this.client = client
  }

  /**
   * Build Discord's Embedded Message
   *
   * @param {Array} content   An array of contents
   * @param {Object} options  API request parameter
   * @param {Object} message  Message object
   * @return {String} Translated text.
  **/
  embedMessageBuilder(contents = [], options, message){
    const { languages } = require('../constants/languages.json')

    let embeddedMsg = new MessageEmbed()
                          .setAuthor(message.author.username, message.author.displayAvatarURL())
                          .setFooter(`From ${languages[options.source].language_name}`)

    if (contents.length > 0){
      contents.forEach((content, i)=>{
        embeddedMsg.addField(
          content.title,
          content.description,
          false
        )

        if (i !== (contents.length-1)){
          //add if the translated content is not the last one
          embeddedMsg.addField('\u200B', '\u200B')
        }
      })
    }
    
    return embeddedMsg;
  }

  /**
   * Show help
   *
   * @param {Object} message  Message object
   * @return void
  **/
  showHelp(message){
    const bot = this.client

    const description = `
      **What do I do?**
      Currently only handle auto-translations. I even translate nano's tweets so you don't have to pop it in google translate!

      **Prefix:** ${"`.`"}

      **List of commands for Koumori Bot:**

      ${"`wink`"} - Nano wink (?)
      ${"`t <to_language> <message>`"} - Translate message to a specific language
      ${"`help`"} - Show help
    `

    return new MessageEmbed()
                .setDescription(description)
                .setThumbnail(bot.user.displayAvatarURL())
  }
}

module.exports=MessageUtils