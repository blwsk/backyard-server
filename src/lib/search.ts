import algoliasearch from "algoliasearch";
import {
  ItemRow,
  itemResolver,
  contentResolver,
  originResolver,
  makePreviewTemplate,
} from "../api/item";
import { convertKeysToCamelCase, doAsync } from "./utils";

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY } = process.env;

export const ITEMS = "backyard_test";
export const CLIPS = "backyard_clips_test";

export type SearchIndex = "backyard_test" | "backyard_clips_test";

export const indexes = [ITEMS, CLIPS];

const algoliaClient = algoliasearch(
  ALGOLIA_APP_ID as string,
  ALGOLIA_ADMIN_API_KEY as string
);

const index = algoliaClient.initIndex(ITEMS);

export const handleIndexForSearch = async (itemId: number) => {
  console.log("starting search indexing", itemId);
  const item = await itemResolver(`${itemId}`);
  const content = await contentResolver(`${itemId}`);
  const origin = await originResolver(`${itemId}`);

  const {
    createdAt,
    legacyId,
    createdBy,
    url,
    source,
  } = convertKeysToCamelCase(item) as ItemRow;

  const previewTemplate = convertKeysToCamelCase(
    makePreviewTemplate({
      content,
      origin,
      source,
      url,
      legacyId,
      createdAt,
      createdBy,
    })
  );

  const microSecondTs = createdAt * 1000;

  const indexingResultPair = await doAsync(async () => {
    const fullObject = {
      objectID: legacyId,
      _id: legacyId,
      _ts: microSecondTs,
      createdBy,
      url,
      source,
      domain: previewTemplate.domain,
      content: {
        title: previewTemplate.title,
        metaTitle: previewTemplate.subtitle,
      },
    };

    return index.saveObject(fullObject, {
      autoGenerateObjectIDIfNotExist: true,
    });
  });

  console.log("finished search indexing", itemId, indexingResultPair);

  return indexingResultPair;
};

export const handleDeleteFromIndex = async (legacyItemIds: bigint[]) => {
  console.log("started deleting items from search index", legacyItemIds);

  const deleteResultPair = await doAsync(async () =>
    index.deleteObjects(legacyItemIds.map((id) => `${id}`))
  );

  console.log("finished deleting items from search index", legacyItemIds);

  return deleteResultPair;
};
