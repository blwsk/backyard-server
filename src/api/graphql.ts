import { ApolloServer, gql } from "apollo-server-express";
import { Application } from "express";
import {
  itemResolver,
  contentResolver,
  originResolver,
  clipsForItemResolver,
} from "./item";
import { convertKeysToCamelCase } from "../utils";

const typeDefs = gql`
  type Content {
    id: ID!
    itemId: ID!
    body: String
    title: String
    metaTitle: String
    metaDescription: String
    json: String
  }

  type Origin {
    id: ID!
    itemId: ID!
    emailBody: String
    rssFeedUrl: String
    rssEntryContent: String
  }

  type Clip {
    id: ID!
    itemId: ID!
    text: String!
    createdAt: String!
    createdBy: String!
  }

  type Item {
    id: ID!
    url: String!
    createdAt: String!
    createdBy: String!
    source: String
    legacyId: String
    content: Content
    origin: Origin
    clips: [Clip]
  }

  type Query {
    item(id: ID!): Item
  }
`;

const resolvers = {
  Query: {
    async item(parent: any, args: { id: number }) {
      void parent;

      const item = await itemResolver(`${args.id}`);

      return item ? convertKeysToCamelCase(item) : null;
    },
  },

  Item: {
    async content(parent: Partial<{ id: number }>) {
      const content = await contentResolver(`${parent.id}`);

      return content ? convertKeysToCamelCase(content) : null;
    },

    async origin(parent: Partial<{ id: number }>) {
      const origin = await originResolver(`${parent.id}`);

      return origin ? convertKeysToCamelCase(origin) : null;
    },

    async clips(parent: Partial<{ id: number }>) {
      const clips = await clipsForItemResolver(`${parent.id}`);

      return clips.map((clip: { [key: string]: any }) =>
        convertKeysToCamelCase(clip)
      );
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const applyApollo = (app: Application) =>
  server.applyMiddleware({ app });
