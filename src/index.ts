import { DURATIONS, MARKDOWN_CHARS, EMBED_LIMITS } from "./constants";
import { EmbedLimits, EmbedLimitOverrides } from "./types";

export { DURATIONS, MARKDOWN_CHARS, EMBED_LIMITS };
export { EmbedLimits, EmbedLimitOverrides };

/**
 * Polyfill for Promise.allSettled as it is not supported until Node v12.9.0
 */
export function allSettled<T>(promises: Promise<T>[]): Promise<T[]> {
  let count = 0;
  const size = promises.length;
  const responses: T[] = new Array(size);

  return new Promise(resolve => {
    if (size === 0) return resolve([]);
    for (let i = 0; i < size; i++) {
      const onFufilled = (res: T) => {
        responses[i] = res;
        count += 1;
        if (count >= size) resolve(responses);
      };
      promises[i].then(onFufilled).catch(onFufilled);
    }
  });
}

/**
 * Wrap async functions and handle errors
 * @param callable - Async function to wrap
 * @param onError - Optional to function to call on error
 * @returns non async function that will run provided callable
 */
export function errorWrap<T>(
  callable: (...args: any[]) => Promise<T>,
  onError?: (...args: any[]) => void
): (...args: any[]) => Promise<void | T> {
  return function(this: any, ...args: any[]) {
    return callable
      .apply(this, args)
      .then(null)
      .catch(function(this: any, ...e) {
        console.error(`Encountered error running ${callable.name}`, ...e);
        if (onError) onError.apply(this, e);
      });
  };
}

/**
 * Check the constructor of an item, useful for checking type
 * @param object the value to check the type of
 * @param constructor the constructor to check for (e.g. String)
 * @returns Whether the object has specified constructor
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function isOfBaseType(obj: any, constr: Function): boolean {
  return ![null, undefined].includes(obj) && obj.constructor === constr;
}

/**
 * Extend the prototype of a class
 * @param class - The class defenition to extend the prototype of
 * @param method - Object of methods to add
 */
export function extendPrototype(
  classVar: any,
  methods: { [key: string]: any }
): void {
  for (const key in methods) {
    /* defineProperty not required here, could use regular assignment */
    Object.defineProperty(classVar.prototype, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: methods[key]
    });
  }
}

/**
 * Escape all markdown characters in string
 * @param text - The text to escape
 * @returns Escaped text
 */
export function markdownEscape(text: string): string {
  return Array.from(text)
    .map(c => (MARKDOWN_CHARS.includes(c) ? `\\${c}` : c))
    .join("");
}

/**
 * Discord type checking
 * @exports is
 * @namespace is
 */
export class is {
  /**
   * Check if text is a user mention
   * @memberof is
   * @param text - text to check (must be trimmed)
   * @param allowSnowflake - Allow plain snowlake IDs
   * @returns mentioned user's snowflake ID or undefined
   */
  static discordMention(
    text: string,
    allowSnowflake?: boolean
  ): string | undefined {
    return is.discordReference(text, "<@", ["!", "&"], allowSnowflake);
  }

  /**
   * Check if text is a role mention
   * @memberof is
   * @param text - text to check (must be trimmed)
   * @param allowSnowflake - Allow plain snowlake IDs
   * @returns mentioned roles's snowflake ID or undefined
   */
  static discordRole(
    text: string,
    allowSnowflake?: boolean
  ): string | undefined {
    return is.discordReference(text, "<@&", [], allowSnowflake);
  }

  /**
   * Check if text is a channel mention
   * @memberof is
   * @param text - text to check (must be trimmed)
   * @param allowSnowflake - Allow plain snowlake IDs
   * @returns mentioned channels's snowflake ID or undefined
   */
  static discordChannel(
    text: string,
    allowSnowflake?: boolean
  ): string | undefined {
    return is.discordReference(text, "<#", [], allowSnowflake);
  }

  /**
   * Check if text is a discord reference
   * @memberof is
   * @param text - text to check
   * @param start - Start to check for
   * @param extras - Additionals to check for after start
   * @param allowSnowflake - Allow plain snowlake IDs
   * @returns snowflake ID contained in reference
   */
  static discordReference(
    text: string,
    start: string,
    extras: string[],
    allowSnowflake?: boolean
  ): string | undefined {
    if (text.startsWith(start)) {
      let begin = start.length;
      for (const extra of extras) {
        if (text.substr(begin, extra.length) === extra) {
          begin += extra.length;
          break;
        }
      }
      const toCheck = text.substr(begin, text.length - begin - 1);
      if (is.discordSnowflake(toCheck)) {
        return toCheck;
      }
    } else if (allowSnowflake && is.discordSnowflake(text)) {
      return text;
    }
    return undefined;
  }

  /**
   * Check if text is a discord snowflake
   * @memberof is
   * @param text - text to check (must be trimmed)
   * @returns whether the text is a discord snowflake
   */
  static discordSnowflake(text: string): boolean {
    return text.length > 0 && text.length <= 20 && is.stringOfNums(text);
  }

  /**
   * Check if text contains only numbers
   * @memberof is
   * @param text - text to check (must be trimmed)
   * @returns whether the text contains only numbers
   */
  static stringOfNums(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      const n = text.charCodeAt(i);
      if (n < 48 || n > 57) return false; // '0' | '9'
    }
    return true;
  }
}

/**
 * Check if a map has any of the keys provided
 * @param map - The map to check
 * @param keys - The keys to check for
 * @returns  Whether the map has any of the keys
 */
export function hasAny<T>(map: Map<string, T>, keys: string[]): boolean {
  for (const key of keys) {
    if (map.has(key)) return true;
  }
  return false;
}

/**
 * Create a duration in ms from a time string
 * @param time - duration string (e.g. "24h 5m 1s")
 * @returns duration in ms
 */
export function parseTime(time: string): number {
  let res = 0;
  for (const part of time.matchAll(/([0-9]+)([a-z]?)/gi)) {
    const n = parseInt(part[1], 10);
    switch (part[2].toLowerCase()) {
      case "w":
        res += n * 604800000;
        break;
      case "d":
        res += n * 86400000;
        break;
      case "h":
        res += n * 3600000;
        break;
      case "m":
        res += n * 60000;
        break;
      case "s":
      default:
        res += n * 1000;
        break;
    }
  }
  return res;
}

/**
 * Convert a time duration in ms to human string
 * @param duration - time duration in ms
 * @param [smallest=0] - The smallest time duration to include in output (e.g. 1000 exclude ms from output)
 * @returns humanified time duration
 */
export function humanDuration(duration: number, smallest = 0): string {
  const res = [];
  for (const d of DURATIONS) {
    const n = Math.floor(duration / d.n);
    if (n > 0 && d.n >= smallest) res.push(`${n} ${d.name}${n > 1 ? "s" : ""}`);
    duration = duration % d.n;
  }
  return res.join(" ");
}

/**
 * Convert a number between 0 and 10 the coresponding number tile emoji
 * @param n
 * @returns the emoji (or ? emoji)
 */
export function numberEmoji(n: number): string {
  if (isNaN(n) || n < 0 || n > 10) return "❓";
  if (n === 10) return String.fromCodePoint(0x1f51f);
  return [
    String.fromCharCode(48 + n),
    String.fromCharCode(65039),
    String.fromCharCode(8419)
  ].join("");
}

/**
 * Truncate a string
 * @param text - String to truncate
 * @param size - Length to truncate to
 * @param ending - Optional ending when truncated
 * @returns Truncated string
 */
export function truncateString(
  text: string,
  size: number,
  ending = ""
): string {
  if (text.length <= size) return text;
  return text.substring(0, size - ending.length) + ending;
}

/**
 * Truncate an embed
 * @param embed - embed to truncate
 * @param limitOverrides - limit overrides
 * @returns the embed
 */
export function truncateEmbed(
  embed: any,
  limitOverrides?: EmbedLimitOverrides
): any {
  const overrides = limitOverrides || {};

  for (const stringKey of [
    "title",
    "description",
    "footer.text",
    "author.name"
  ]) {
    const propNames: any[] = stringKey.split(".");
    let item = embed;
    for (let i = 0; i < propNames.length - 1; i++) {
      if (propNames[i] instanceof Object && propNames[i] in item) {
        item = item[propNames[i]];
      } else {
        item = undefined;
        break;
      }
    }
    if (item instanceof Object) {
      const lastProp = propNames[propNames.length - 1];
      if (lastProp in item) {
        if (isOfBaseType(item[lastProp], String)) {
          item[lastProp] = truncateString(
            item[lastProp],
            overrides[stringKey as keyof EmbedLimitOverrides] ||
              EMBED_LIMITS[stringKey as keyof EmbedLimits],
            "..."
          );
        }
      }
    }
  }

  if (embed.fields) {
    embed.fields.splice(overrides.fields || EMBED_LIMITS.fields);
    for (const field of embed.fields) {
      if ("name" in field) {
        field.name = truncateString(
          field.name,
          overrides["fields.name"] || EMBED_LIMITS["fields.name"],
          "..."
        );
      }
      if ("value" in field) {
        field.value = truncateString(
          field.value,
          overrides["fields.value"] || EMBED_LIMITS["fields.value"],
          "..."
        );
      }
    }
  }

  return embed;
}
