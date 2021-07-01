export interface EmbedLimits {
  title: number;
  description: number;
  fields: number;
  "fields.name": number;
  "fields.value": number;
  "footer.text": number;
  "author.name": number;
}

export type EmbedLimitOverrides = {
  [P in keyof EmbedLimits]: EmbedLimits[P] | undefined;
};
