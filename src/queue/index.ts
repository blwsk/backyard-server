import Queue from "bee-queue";
import { handleDeleteFromIndex, handleIndexForSearch } from "../lib/search";

const { REDIS_URL } = process.env;

let taskQueue: Queue | null = null;

export interface Task<T> {
  type: string;
  payload: T;
}

const INDEX_FOR_SEARCH = "INDEX_FOR_SEARCH";

export interface IndexForSearch extends Task<number> {
  type: typeof INDEX_FOR_SEARCH;
}

const DELETE_FROM_SEARCH_INDEX = "DELETE_FROM_SEARCH_INDEX";

export interface DeleteFromSearchIndex extends Task<bigint[]> {
  type: typeof DELETE_FROM_SEARCH_INDEX;
}

export type TaskType = IndexForSearch | DeleteFromSearchIndex;

export const setupTaskQueue = () => {
  taskQueue = new Queue("backyard-server-tasks", {
    redis: {
      url: REDIS_URL,
    },
  });

  taskQueue.process(async (job: Queue.Job<TaskType>) => {
    const { type } = job.data;

    let res;

    switch (type) {
      case INDEX_FOR_SEARCH:
        const { payload: itemId } = job.data as IndexForSearch;
        res = handleIndexForSearch(itemId);
        break;

      case DELETE_FROM_SEARCH_INDEX:
        const { payload: legacyItemIds } = job.data as DeleteFromSearchIndex;
        res = handleDeleteFromIndex(legacyItemIds);
        break;

      default:
        throw new Error(`Missing job handler for task of type, ${type}`);
    }

    console.log(res);
  });
};

export const enqueueTask = async <TaskType>(task: TaskType) => {
  if (taskQueue === null) {
    throw new Error("Task enqueued before queue was set up");
  }

  return taskQueue.createJob(task).timeout(5000).retries(3).save();
};

export const indexForSearch = async (itemId: number) => {
  return enqueueTask<IndexForSearch>({
    type: INDEX_FOR_SEARCH,
    payload: itemId,
  });
};

export const deleteFromSearchIndex = async (legacyItemIds: bigint[]) => {
  return enqueueTask<DeleteFromSearchIndex>({
    type: DELETE_FROM_SEARCH_INDEX,
    payload: legacyItemIds,
  });
};
