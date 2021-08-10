import { setupCron } from "./rss/cron";
import { listen } from "./api";
import dotenv from "dotenv";
import { setupTaskQueue } from "./queue";

dotenv.config();

setupCron();

setupTaskQueue();

listen();
