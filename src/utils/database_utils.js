/**
 * An utility to cache translations into an embedded NEDB database.
 * So the more the bot is being used to do translations,
 * the faster the translation becomes as the number of translations done grow in the database.
 * 
 * This is also to reduce the load on the API whenever possible.
 * 
 * Unfortunately, it can only be used to cache full sentences and does not possess the machine learning capabilities to translate
 * on its own.
 */

const Datastore = require('nedb-promises')
let datastore = Datastore.create({ filename: './database/translations.db', autoload: true })

//i dont think we need an update function

/**
   * Insert a translated word/sentence to the database
   *
   * @param {Object} params Translation object { source: .., target: .., origText: .., transText: .. }.
   * @return void.
  **/
async function insertDb(params){
  //reject any data insertion if it fulfills none of the required data as they are important
  if (!params.source && !params.target && !params.origText && !params.transText){
    return
  }

  const { source, target, origText, transText } = params

  const data = {
    [source]: origText,
    [target]: transText,
    info: {
      lang_from: source,
      lang_to: target,
      translation_time: new Date().getTime()
    }
  }

  datastore.insert(data).then((res)=>{
    console.log("Translation caching successful", res)
  }, (err)=>{
    console.log("Caching failed. Ignore this error.", err)
  })
}

async function queryDb(params){
  //reject any query if it fulfills none of the required data as they are important
  if (!params.source && !params.target && !params.origText && !params.transText){
    return null
  }

  const { source, origText } = params

  const query = {
    [source]: origText,
    // info: { lang_to: target }
  }

  try {
    let result = await datastore.findOne(query)

    return result
  } catch (err){
    return null
  }
}

module.exports = {
  insertDb,
  queryDb
}