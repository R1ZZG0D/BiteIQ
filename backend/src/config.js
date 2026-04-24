import dotenv from "dotenv";

dotenv.config({ path: process.env.ENV_FILE ?? ".env" });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  databaseUrl: process.env.DATABASE_URL ?? "",
  localDataPath: process.env.LOCAL_DATA_PATH ?? ".data/biteiq.json",
  openFoodFactsBaseUrl:
    process.env.OPENFOODFACTS_BASE_URL ?? "https://world.openfoodfacts.org/api/v2"
};
