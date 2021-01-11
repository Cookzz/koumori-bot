# Koumori Bot

Specially made for nanoha's fan discord.

## Getting Started

Before getting started, you need to create a constants.json file on the root directory of the project and provide the following keys:

1. Discord Bot token (example - "token":"........")
2. IBM API Key (example - "IBM_API_KEY":".......") //this is optional

## Creating an executable for live use

You need these following tools:

1. [ncc](https://github.com/vercel/ncc) - for "file bundling" (combining files into one .js file based on require('..'))
2. [pkg](https://github.com/vercel/pkg) - to convert js/nodejs files to an executable (.exe)

Run these commands on your CLI on the root project directory:

```
ncc build koumori.js -o dist && pkg dist/index.js
```

## TODO Features

- [ ] Implement [Yandex.Translate](https://cloud.yandex.com/docs/translate/) for more accurate en-rus translations
- [ ] Implement [Tencent Translation](https://cloud.tencent.com/product/tmt) as en-cn translation alternative
- [ ] Add more reaction gifs?
- [ ] Assign language roles (EN, CN, JP)

## Misc TODO

- [ ] Get a new power supply to host Koumori Bot 24/7

## Finished Features

- [X] Support translations
- [X] Support multi-language translations (example: .t ja,zh )
- [X] Auto-translate nano's tweets
- [X] Block URLs that are not whitelist
- [X] Cache translations via embedded database

## Whitelisted websites

- [X] Youtube
- [X] Twitter
- [X] Pixiv
- [X] Bilibili

## Translation dependencies

* [IBM Watson Language Translator](https://www.ibm.com/cloud/watson-language-translator)
* [baidu-translate-api](https://github.com/TimLuo465/baidu-translate-api)
* [![OpenTranslate](https://img.shields.io/badge/OpenTranslate-Compatible-brightgreen)](https://github.com/OpenTranslate)

## Special Thanks

For helping me test translations and provide suggestions.

* CarHer94🔺
* RWS
* 茶栗·CharlieJiang