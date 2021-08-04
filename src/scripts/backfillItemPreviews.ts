import {
  contentResolver,
  createPreviewRecord,
  ItemRow,
  originResolver,
} from "../api/item";
import { client } from "../lib/db";
import dotenv from "dotenv";
import { convertKeysToCamelCase } from "../lib/utils";

dotenv.config();

const backfillItemPreviews = async () => {
  const { rows: items } = await client.query(`select * from items;`);

  for (let i = 0; i < items.length; i++) {
    const item: ItemRow = items[i];

    const {
      id,
      legacyId,
      source,
      url,
      createdAt,
      createdBy,
    } = convertKeysToCamelCase(item);

    console.log(`Creating item preview record ${i + 1} of ${items.length}`);

    const content = await contentResolver(`${id}`);
    const origin = await originResolver(`${id}`);

    const previewRecord = await createPreviewRecord({
      content,
      origin,
      source,
      url,
      legacyId,
      createdAt,
      createdBy,
    });

    console.log(previewRecord);
  }
};

backfillItemPreviews();
