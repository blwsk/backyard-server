import { setupCron } from "./rss/cron";
import { listen } from "./api";
import dotenv from "dotenv";

dotenv.config();

setupCron();

listen();
