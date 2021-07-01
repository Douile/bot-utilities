import { EmbedLimits } from './types';

/* Characters to escape when escaping markdown */
export const MARKDOWN_CHARS = '*_|~>`';

/* Time durations with human names in ms */
export const DURATIONS = [
  { n: 31557600000, name: 'year'},
  { n: 2629800000, name: 'month' },
  { n: 604800000, name: 'week'},
  { n: 86400000, name: 'day' },
  { n: 3600000, name: 'hour' },
  { n: 60000, name: 'minute' },
  { n: 1000, name: 'second' },
  { n: 1, name: 'millisecond' }
];

/* Discord limits for embed fields */
export const EMBED_LIMITS: EmbedLimits = {
  title: 256,
  description: 2048,
  fields: 25,
  'fields.name': 256,
  'fields.value': 1024,
  'footer.text': 2048,
  'author.name': 256,
};
