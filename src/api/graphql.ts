import { ApolloServer, gql } from "apollo-server-express";
import { GraphQLJSON } from "graphql-type-json";
import { GraphQLScalarType, Kind } from "graphql";
import { Application } from "express";
import {
  userMetadataResolver,
  rssSubscriptionsForUserResolver,
  createRssSubscriptionResolver,
  deleteRssSubscriptionResolver,
  createEmailIngestAddressResolver,
  deleteEmailIngestAddressResolver,
  createPhoneNumberResolver,
  deletePhoneNumberResolver,
} from "./userMeta";
import {
  itemResolver,
  legacyItemResolver,
  clipsForItemResolver,
  itemPageResolver,
  contentDataLoader,
  originDataLoader,
} from "./item";
import { clipPageResolver } from "./clip";
import { convertKeysToCamelCase } from "../lib/utils";
import { SortOrder } from "./lib/constants";

const typeDefs = gql`
  scalar JSON
  scalar Date

  type RssSubscription {
    id: ID!
    createdAt: Date!
    createdBy: String!
    feedUrl: String!
  }

  type UserMetadata {
    userId: String!
    phoneNumber: String
    emailIngestAddress: String
    rssSubscriptions: [RssSubscription]
  }

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

  type ClipPage {
    results: [Clip]
    next: ID
  }

  enum SortOrder {
    ASC
    DESC
  }

  type DeleteResponse {
    id: ID
  }

  type Query {
    userMetadata(userId: String!): UserMetadata
    legacyItem(id: ID!): Item
    item(id: ID!): Item
    items(
      size: Int
      cursor: ID
      userId: String!
      sortOrder: SortOrder!
    ): ItemPage
    clips(
      size: Int
      cursor: ID
      userId: String!
      sortOrder: SortOrder!
    ): ClipPage
  }

  type Mutation {
    createRssSubscription(userId: String!, feedUrl: String!): RssSubscription!
    deleteRssSubscription(userId: String!, feedId: String!): DeleteResponse!
    createEmailIngestAddress(
      userId: String!
      emailIngestAddress: String!
    ): UserMetadata
    deleteEmailIngestAddress(userId: String!): UserMetadata!
    createPhoneNumber(userId: String!, phoneNumber: String!): UserMetadata!
    deletePhoneNumber(userId: String!): UserMetadata!
  }
`;

const resolvers = {
  Query: {
    async userMetadata(parent: any, args: { userId: string }) {
      void parent;

      const userMetadataObj = await userMetadataResolver(args.userId);

      return userMetadataObj ? convertKeysToCamelCase(userMetadataObj) : null;
    },

    async legacyItem(parent: any, args: { id: string }) {
      void parent;

      const item = await legacyItemResolver(args.id);

      return item ? convertKeysToCamelCase(item) : null;
    },

    async item(parent: any, args: { id: number }) {
      void parent;

      const item = await itemResolver(`${args.id}`);

      return item ? convertKeysToCamelCase(item) : null;
    },

    async items(
      parent: any,
      {
        size = 20,
        cursor,
        userId,
        sortOrder,
      }: { size: number; cursor?: number; userId: string; sortOrder: SortOrder }
    ) {
      void parent;

      const itemPage = await itemPageResolver({
        size,
        cursor,
        userId,
        sortOrder,
      });

      return {
        results: itemPage.results.map((item) => convertKeysToCamelCase(item)),
        next: itemPage.next,
      };
    },

    async clips(
      parent: any,
      {
        size = 20,
        cursor,
        userId,
        sortOrder,
      }: { size: number; cursor?: number; userId: string; sortOrder: SortOrder }
    ) {
      void parent;

      const clipPage = await clipPageResolver({
        size,
        cursor,
        userId,
        sortOrder,
      });

      return {
        results: clipPage.results.map((clip) => convertKeysToCamelCase(clip)),
        next: clipPage.next,
      };
    },
  },

  Mutation: {
    async createRssSubscription(
      parent: any,
      args: { userId: string; feedUrl: string }
    ) {
      void parent;

      const { userId, feedUrl } = args;

      const rssSubscription = await createRssSubscriptionResolver({
        userId,
        feedUrl,
      });

      return convertKeysToCamelCase(rssSubscription);
    },

    async deleteRssSubscription(
      parent: any,
      args: { userId: string; feedId: string }
    ) {
      void parent;

      const { userId, feedId } = args;

      const deletedRssSubscription = await deleteRssSubscriptionResolver({
        userId,
        feedId,
      });

      void deletedRssSubscription;

      return {
        id: feedId,
      };
    },

    async createEmailIngestAddress(
      parent: any,
      args: { userId: string; emailIngestAddress: string }
    ) {
      void parent;

      const { userId, emailIngestAddress } = args;

      const userMetadata = await createEmailIngestAddressResolver({
        userId,
        emailIngestAddress,
      });

      return convertKeysToCamelCase(userMetadata);
    },

    async deleteEmailIngestAddress(parent: any, args: { userId: string }) {
      void parent;

      const { userId } = args;

      const userMetadata = await deleteEmailIngestAddressResolver({
        userId,
      });

      return convertKeysToCamelCase(userMetadata);
    },

    async createPhoneNumber(
      parent: any,
      args: { userId: string; phoneNumber: string }
    ) {
      void parent;

      const { userId, phoneNumber } = args;

      const userMetadata = await createPhoneNumberResolver({
        userId,
        phoneNumber,
      });

      return convertKeysToCamelCase(userMetadata);
    },

    async deletePhoneNumber(parent: any, args: { userId: string }) {
      void parent;

      const { userId } = args;

      const userMetadata = await deletePhoneNumberResolver({
        userId,
      });

      return convertKeysToCamelCase(userMetadata);
    },
  },

  UserMetadata: {
    async rssSubscriptions(parent: Partial<{ userId: string }>) {
      const rssSubscriptions = await rssSubscriptionsForUserResolver(
        `${parent.userId}`
      );

      return rssSubscriptions.map((rssSub: { [key: string]: any }) =>
        convertKeysToCamelCase(rssSub)
      );
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
