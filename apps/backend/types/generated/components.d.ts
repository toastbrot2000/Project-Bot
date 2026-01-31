import type { Schema, Struct } from '@strapi/strapi';

export interface DefaultOption extends Struct.ComponentSchema {
  collectionName: 'components_default_options';
  info: {
    displayName: 'Option';
    icon: 'cog';
  };
  attributes: {
    option_id: Schema.Attribute.Integer & Schema.Attribute.Required;
    question: Schema.Attribute.Relation<'oneToOne', 'api::question.question'>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'default.option': DefaultOption;
    }
  }
}
