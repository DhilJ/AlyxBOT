// import { create, Client } from '@open-wa/wa-automate';
const { create, Client } = require('@open-wa/wa-automate')
//const welcome = require('./lib/welcome')
//const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./dhil')
const figlet = require('figlet')
const lolcatjs = require('lolcatjs')
const options = require('./options')


// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./dhil.js')
nocache('./dhil.js', module => console.log(`'${module}' Updated!`))

const setting = JSON.parse(fs.readFileSync('./lib/database/settings.json'))
//const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting



lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.colors = true;

const start = async (dhil = new Client()) => {
        console.log('------------------------------------------------')
        lolcatjs.fromString(color(figlet.textSync('ALYX BOT', { horizontalLayout: 'full' })))
        console.log('------------------------------------------------')
        lolcatjs.fromString('[DEV] Dhil J')
        lolcatjs.fromString('[SERVER] Server Started!')
        dhil.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        dhil.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') dhil.forceRefocus()
        })
        // listening on message
        dhil.onMessage((async (message) => {

        dhil.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    dhil.cutMsgCache()
                }
            })
        // msgHndlr(dhil, message)
        // Message Handler (Loaded from recent cache)
        require('./dhil.js')(dhil, message)
    }))

			 //dhil.onGlobalParicipantsChanged((async (heuh) => {
            //await welcome(dhil, heuh) 
            //left(dhil, heuh)
            //}))
        
         dhil.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return dhil.sendText(chat.id, 'Halo, Ketik !help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await dhil.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await dhil.sendText(chat.id, 'Maaf, Batas group yang dapat ku tampung sudah penuh').then(async () =>{
                        dhil.deleteChat(chat.id)
                        dhil.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await dhil.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            dhil.deleteChat(chat.id)
                            dhil.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) dhil.sendText(chat.id, 'Halo, Ketik !help Untuk Melihat List Command Ku...')
                    }
                }
            }else{
                await dhil.sendText(chat.id, 'BOT sedang maintenance, coba lain hari').then(async () => {
                    dhil.deleteChat(chat.id)
                    dhil.leaveGroup(chat.id)
                })
            }
        })

        /*dhil.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) dhil.sendSeen(to)
        }))*/

        // listening on Incoming Call
        dhil.onIncomingCall(( async (call) => {
            await dhil.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => dhil.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(dhil => start(dhil))
    .catch((error) => console.log(error))
