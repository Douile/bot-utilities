const { DURATIONS, MARKDOWN_CHARS, EMBED_LIMITS } = require('./constants.js');

/**
* Polyfill for Promise.allSettled as it is not supported until Node v12.9.0
* @async
* @param {Iterable.<AsyncFunction>} promises - Promises to wait for
*/
exports.allSettled = function(promises) {
  var count = 0, size = promises.length, responses = new Array(size);
  return new Promise((resolve) => {
    if (size === 0) return resolve([]);
    for (let i=0;i<size;i++) {
      let onFufilled = function() {
        let res = Array.from(arguments);
        if (res.length === 0) res = undefined;
        if (res.length === 1) res = res[0];
        responses[i] = res;
        count += 1;
        if (count >= size) resolve(responses);
      }
      promises[i].then(onFufilled).catch(onFufilled);
    }
  });
}

/**
* Wrap async functions and handle errors
* @param {AsyncFunction} callable - Async function to wrap
* @param {Function?} onError - Optional to function to call on error
* @returns {Function} non async function that will run provided callable
*/
exports.errorWrap = function(callable, onError) {
  return function() {
    return callable.apply(this,arguments).then(null).catch(function(...e) {
      console.error(`Encountered error running ${callable.name}`, ...e);
      if (exports.isOfBaseType(onError, Function)) onError.apply(this, e);
    })
  }
}

/**
* Check the constructor of an item, useful for checking type
* @param {*} object the value to check the type of
* @param {Function} constructor the constructor to check for (e.g. String)
* @returns {boolean} Whether the object has specified constructor
*/
exports.isOfBaseType = function(obj, constr) {
  return (![null, undefined].includes(obj)) && (obj.constructor === constr);
}

/**
* Extend the prototype of a class
* @param class - The class defenition to extend the prototype of
* @param {Object.<string, Function>} method - Object of methods to add
*/
exports.extendPrototype = function(classVar, methods) {
  for (let key in methods) {
    /* defineProperty not required here, could use regular assignment */
    Object.defineProperty(classVar.prototype, key, {
      configurable: true,
      enumberable: true,
      writable: true,
      value: methods[key]
    });
  }
}

/**
* Escape all markdown characters in string
* @param {string} text - The text to escape
* @returns {string} Escaped text
*/
exports.markdownEscape = function(text) {
  return Array.from(text).map(c => MARKDOWN_CHARS.includes(c) ? `\\${c}` : c).join('');
}

/**
* Discord type checking
* @exports is
* @namespace is
*/
const is = {};

/**
* Check if text is a user mention
* @memberof is
* @param {string} text - text to check (must be trimmed)
* @returns {string?} mentioned user's snowflake ID or undefined
*/
is.discordMention = function(text) {
  return is.discordReference(text, '<@', ['!', '&']);
}

/**
* Check if text is a role mention
* @memberof is
* @param {string} text - text to check (must be trimmed)
* @returns {string?} mentioned roles's snowflake ID or undefined
*/
is.discordRole = function(text) {
  return is.discordReference(text, '<@&', []);
}

/**
* Check if text is a channel mention
* @memberof is
* @param {string} text - text to check (must be trimmed)
* @returns {string?} mentioned channels's snowflake ID or undefined
*/
is.discordChannel = function(text) {
  return is.discordReference(text, '<#', []);
}

/**
* Check if text is a discord reference
* @memberof is
* @param {string} text - text to check
* @param {string} start - Start to check for
* @param {array.<string>} extras - Additionals to check for after start
* @returns {string?} snowflake ID contained in reference
*/
is.discordReference = function(text, start, extras) {
  let toCheck = text;
  if (text.startsWith(start)) {
    let begin = start.length;
    for (let extra of extras) {
      if (text.substr(begin, extra.length) === extra) {
        begin += extra.length;
        break;
      }
    }
    toCheck = text.substr(begin, text.length-begin-1);
  }
  if (is.discordSnowflake(toCheck)) {
    return toCheck; // Return snowflake ID if found
  }
  return undefined;
}

/**
* Check if text is a discord snowflake
* @memberof is
* @param {string} text - text to check (must be trimmed)
* @returns {bool} whether the text is a discord snowflake
*/
is.discordSnowflake = function(text) {
  return text.length > 0 && text.length <= 20 && is.stringOfNums(text);
}

/**
* Check if text contains only numbers
* @memberof is
* @param {string} text - text to check (must be trimmed)
* @returns {bool} whether the text contains only numbers
*/
is.stringOfNums = function(text) {
  for (let i=0; i<text.length; i++) {
    let n = text.charCodeAt(i);
    if (n < 48 || n > 57) return false; // '0' | '9'
  }
  return true;
}

exports.is = is;

/**
* Check if a map has any of the keys provided
* @param {object} map - The map to check
* @param {string[]} keys - The keys to check for
* @returns {boolean} Whether the map has any of the keys
*/
exports.hasAny = function(map, keys) {
  for (let key of keys) {
    if (map.has(key)) return true;
  }
  return false;
}

/**
* Create a duration in ms from a time string
* @param {string} time - duration string (e.g. "24h 5m 1s")
* @returns {number} duration in ms
*/
exports.parseTime = function(time)  {
  let res = 0;
  for (let part of time.matchAll(/([0-9]+)([a-z]?)/ig)) {
    const n = parseInt(part[1]);
    switch(part[2].toLowerCase()) {
      case 'w':
      res += n * 604800000;
      break;
      case 'd':
      res += n * 86400000;
      break;
      case 'h':
      res += n * 3600000;
      break;
      case 'm':
      res += n * 60000;
      break;
      case 's':
      default:
      res += n * 1000;
      break;
    }
  }
  return res;
}

/**
* Convert a time duration in ms to human string
* @param {number} duration - time duration in ms
* @param {number} [smallest=0] - The smallest time duration to include in output (e.g. 1000 exclude ms from output)
* @returns {string} humanified time duration
*/
exports.humanDuration = function(duration, smallest) {
  if (isNaN(smallest)) smallest = 0;
  const res = [];
  for (let d of DURATIONS) {
    const n = Math.floor(duration / d.n);
    if (n > 0 && d.n >= smallest) res.push(`${n} ${d.name}${n > 1 ? 's' : ''}`);
    duration = duration % d.n;
  }
  return res.join(' ');
}

/**
* Convert a number between 0 and 10 the coresponding number tile emoji
* @param {number} n
* @returns {string} the emoji (or ? emoji)
*/
exports.numberEmoji = function(n) {
  if (isNaN(n) || n < 0 || n > 10) return '❓';
	if (n === 10) return String.fromCodePoint(0x1f51f)
	return [
		String.fromCharCode(48+n),
		String.fromCharCode(65039),
		String.fromCharCode(8419)
	].join('');
}

/**
* Truncate a string
* @param {string} text - String to truncate
* @param {number} size - Length to truncate to
* @param {string} [ending] - Optional ending when truncated
* @returns {string} Truncated string
*/
exports.truncateString = function(text, size, ending) {
  let res;
  if (text.length > size) {
    if (exports.isOfBaseType(ending, String)) {
      res = text.substring(0,size-ending.length)+ending;
    } else {
      res = text.substring(0,size);
    }
  } else {
    res = text;
  }
  return res;
}


/**
* Truncate an embed
* @param {Object} embed - embed to truncate
* @param {Object} [limitOverrides] - limit overrides
* @returns {Object} the embed
*/
exports.truncateEmbed = function(embed, limitOverrides) {
  const overrides = limitOverrides || {};

  for (let stringKey of ['title','description','footer.text','author.name']) {
    let propNames = stringKey.split('.');
    let item = embed;
    for (let i=0;i<propNames.length-1;i++) {
      if (propNames[i] instanceof Object && propNames[i] in item) {
        item = item[propNames[i]];
      } else {
        item = undefined;
        break;
      }
    }
    if (item instanceof Object) {
      const lastProp = propNames[propNames.length-1];
      if (lastProp in item) {
        if (exports.isOfBaseType(item[lastProp], String)) {
          item[lastProp] = exports.truncateString(item[lastProp], stringKey in overrides ? overrides[stringKey] : EMBED_LIMITS[stringKey], '...');
        }
      }
    }
  }

  if (embed.fields) {
    embed.fields.splice('fields' in overrides ? overrides['fields'] : EMBED_LIMITS['fields']);
    for (let i=0;i<embed.fields.length;i++) {
      if ('name' in embed.fields[i]) {
        embed.fields[i].name = exports.truncateString(embed.fields[i].name, 'fields.name' in overrides ? overrides['fields.name'] : EMBED_LIMITS['fields.name'], '...');
      }
      if ('value' in embed.fields[i]) {
        embed.fields[i].value = exports.truncateString(embed.fields[i].value, 'fields.value' in overrides ? overrides['fields.value'] : EMBED_LIMITS['fields.value'], '...');
      }
    }
  }

  return embed;
}
