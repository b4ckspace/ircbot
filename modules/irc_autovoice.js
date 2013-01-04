var LOGGER;
var CONFIG;

var MODULE_NAME = "AUTOVOICE";


var util = require("util");
var bot_;

function sanitizeNick(nick) {
    return nick.replace(/[^a-zA-Z]+/, '').toLowerCase();    
}

var inSpace = function(username){
    return bot_._bckspcapi.getMembers().some(function(value, key) {
        if(sanitizeNick(value) == sanitizeNick(username)) {
            return true;
        }
    });
};

var setAllChans = function(){
    for(channel in bot_.topics){
        setVoices(channel);
    }
};

var setVoices = function(channel){
    bot_.irc_client.once('names', function(chname, names){
        if(channel!=chname){
            LOGGER.debug("setVoice channel!=nchannel %s != %s", channel, chname);
            return;
        }
        var voicepeople = {};
        for(key in names){
            voicepeople[key.toLowerCase()]=(names[key].indexOf("v")!=-1);
        }
        for(username in voicepeople){
            if(voicepeople[username] && !inSpace(username)){
                LOGGER.debug("user has voice, but not in space: %s", username);
                bot_.irc_client.send('mode', channel, '-v', username);
            }
            if((!voicepeople[username]) && inSpace(username)){
                LOGGER.debug("user has no voice, but in space: %s", username);
                bot_.irc_client.send('mode', channel, '+v', username);
            }
        }
    });
    bot_.irc_client.send('names', channel);
};

module.exports = function(cfg, log, bot){
    LOGGER = log.getLogger(MODULE_NAME);
    CONFIG = cfg;
    bot_   = bot;
    bot.irc_client.on('join', function(channel, nick, message){
        LOGGER.debug("user %s joined chanel", nick, channel);
        setVoices(channel);
    });
    bot._bckspcapi.on('join', function(member){
        LOGGER.debug('member join: %s', member);
        setAllChans();
    });
    bot._bckspcapi.on('part', function(member){
        LOGGER.debug('member part: %s', member);
        setAllChans();
    });
    bot.irc_client.on('+mode', function(channel, by, mode, arg, msg){
        if(by==bot.nick)
            return;
        LOGGER.debug('+modechange: %s, %s, %s, %s, %s', channel, by, mode, arg, msg);
        setVoices(channel);
    });
    bot.irc_client.on('-mode', function(channel, by, mode, arg, msg){
        if(by==bot.nick)
            return;
        LOGGER.debug('-modechange: %s, %s, %s, %s, %s', channel, by, mode, arg, msg);
        setVoices(channel);
    });
    bot.irc_client.on('nick', function(oldnick, newnick, channels){
        LOGGER.debug('nickchange: %s -> %s', oldnick, newnick);
        for(i in channels){
            setVoices(channels[i]);
        }
    });

};
