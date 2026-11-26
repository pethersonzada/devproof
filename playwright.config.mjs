import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",
  workers:1,
  use:{baseURL:"http://127.0.0.1:3190"},
  webServer:{command:"npm run start -- --hostname 127.0.0.1 --port 3190",url:"http://127.0.0.1:3190",reuseExistingServer:false},
});
