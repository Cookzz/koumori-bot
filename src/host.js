class Host{
  constructor(client) {
    this.prefix="~" //prefix for running koumori
    this.client=client

    /*
      Exceptions:
        youtube
        bilibili
        twitter
    */
    this.urlExceptions = [
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(?:bilibili|live\.bilibili)\.com\/?/,
      /(?:https?:\/\/)?(?:m\.|www\.)?(b23\.tv)\/?/,
      /http(?:s)?:\/\/(?:www)?twitter\.com\/([a-zA-Z0-9_]+)/
    ]

    this.command={
  		wink : (message)=>this.wink(message),
    }
  }

  /*
    command functions (need to move to another class soon)
  */
  wink(message){
    const { MessageEmbed } = require('discord.js');

    const embeddedMsg = new MessageEmbed()
                          .setTitle('Nano winks.')
                          .setImage('https://media.giphy.com/media/I0qM3KvtqikqXowbSZ/giphy-downsized-large.gif')
    message.channel.send(embeddedMsg)
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
      let content = (message.content).substring(1)
      this.processCommands(message, content)
    }
  }

  /**
   * Process the messages before running any function based on parameters provided
   *
   * @param {Object} m Message object.
   * @param {String} c The "contents" of the message.
   * @return void.
  **/
  processCommands(m, c){
    if (this.command[c] && c.length > 0){
      this.command[c](m)
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
