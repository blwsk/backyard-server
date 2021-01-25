import { setupCron } from "./rss/cron";
import { listen } from "./api";

setupCron();

listen();
