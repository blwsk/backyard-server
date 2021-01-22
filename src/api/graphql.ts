import { ApolloServer, gql } from "apollo-server-express";
import { GraphQLJSON } from "graphql-type-json";
import { GraphQLScalarType, Kind } from "graphql";
import { Application } from "express";
import {
  itemResolver,
  clipsForItemResolver,
  itemPageResolver,
  contentDataLoader,
  originDataLoader,
} from "./item";
import { convertKeysToCamelCase } from "../utils";
import { auth } from "./lib/auth";

const typeDefs = gql`
  scalar JSON
  scalar Date

  type Content {
    id: ID!
    itemId: ID!
    body: String
    title: String
    metaTitle: String
    metaDescription: String
    json: JSON
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
    createdAt: Date!
    createdBy: String!
  }

  type Item {
    id: ID!
    url: String!
    createdAt: Date!
    createdBy: String!
    source: String
    legacyId: String
    content: Content
    origin: Origin
    clips: [Clip]
  }

  type ItemPage {
    results: [Item]
    next: ID
  }

  type Query {
    item(id: ID!): Item
    items(size: Int, cursor: ID): ItemPage
  }
`;

const resolvers = {
  Query: {
    async item(parent: any, args: { id: number }) {
      void parent;

      const item = await itemResolver(`${args.id}`);

      return item ? convertKeysToCamelCase(item) : null;
    },

    async items(
      parent: any,
      { size = 20, cursor }: { size: number; cursor?: number }
    ) {
      void parent;

      const itemPage = await itemPageResolver({
        size,
        cursor,
      });

      return {
        results: itemPage.results.map((item) => convertKeysToCamelCase(item)),
        next: itemPage.next,
      };
    },
  },

  Item: {
    async content(parent: Partial<{ id: number }>) {
      const content = await contentDataLoader.load(`${parent.id}`);

      return content ? convertKeysToCamelCase(content) : null;
    },

    async origin(parent: Partial<{ id: number }>) {
      const content = await originDataLoader.load(`${parent.id}`);

      return content ? convertKeysToCamelCase(content) : null;
    },

    async clips(parent: Partial<{ id: number }>) {
      const clips = await clipsForItemResolver(`${parent.id}`);

      return clips.map((clip: { [key: string]: any }) =>
        convertKeysToCamelCase(clip)
      );
    },
  },

  JSON: GraphQLJSON,

  Date: new GraphQLScalarType({
    name: "Date",
    parseValue(value) {
      /**
       * Converts Unix Epoch MS to ISO date string
       *
       * Client -> Server -> Database
       */
      return new Date(value).toISOString(); // value from the client
    },
    serialize(value) {
      /**
       * Converts ISO date string to Unix Epoch MS
       *
       * Database -> Server -> Client
       */
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const applyApollo = (app: Application) =>
  server.applyMiddleware({ app });
