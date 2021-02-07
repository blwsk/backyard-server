export const PG_MAX_INTEGER = 2147483647;

export type SortOrder = "ASC" | "DESC";

export const isSortOrder = (str: unknown) => str === "ASC" || str === "DESC";
