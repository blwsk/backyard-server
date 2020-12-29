import { setupCron } from "./cron";
import { listen } from "./api";

setupCron();

listen();
