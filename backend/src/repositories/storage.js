import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Pool } from "pg";
import { config } from "../config.js";

const defaultProfile = {
  id: "default",
  preference: "Vegan",
  sugar_goal_g: 36,
  protein_goal_g: 60,
  updated_at: new Date().toISOString()
};

export async function createRepository() {
  if (config.databaseUrl) {
    try {
      const repository = new PostgresRepository(config.databaseUrl);
      await repository.init();
      return repository;
    } catch (error) {
      console.warn(`PostgreSQL unavailable; using local JSON storage. ${error.message}`);
    }
  }

  const repository = new JsonRepository(config.localDataPath);
  await repository.init();
  return repository;
}

class JsonRepository {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await this.writeStore({
        profile: defaultProfile,
        scans: []
      });
    }
  }

  async getProfile() {
    const store = await this.readStore();
    return store.profile ?? defaultProfile;
  }

  async updateProfile(nextProfile) {
    const store = await this.readStore();
    const profile = {
      ...store.profile,
      ...nextProfile,
      id: "default",
      updated_at: new Date().toISOString()
    };
    store.profile = profile;
    await this.writeStore(store);
    return profile;
  }

  async addScan(scan) {
    const store = await this.readStore();
    const created = {
      id: randomUUID(),
      product_name: scan.product_name,
      raw_text: scan.rawText,
      parsed: scan.parsed,
      result: scan.result,
      nutrition: scan.nutrition,
      created_at: new Date().toISOString()
    };
    store.scans = [created, ...(store.scans ?? [])];
    await this.writeStore(store);
    return created;
  }

  async listScans() {
    const store = await this.readStore();
    return store.scans ?? [];
  }

  async getScan(id) {
    const store = await this.readStore();
    return (store.scans ?? []).find((scan) => scan.id === id) ?? null;
  }

  async readStore() {
    const contents = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(contents);
  }

  async writeStore(store) {
    await fs.writeFile(this.filePath, JSON.stringify(store, null, 2));
  }
}

class PostgresRepository {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined
    });
  }

  async init() {
    const schemaUrl = new URL("../../db/schema.sql", import.meta.url);
    const schema = await fs.readFile(schemaUrl, "utf8");
    await this.pool.query(schema);
    await this.pool.query(
      `INSERT INTO user_profiles (id, preference, sugar_goal_g, protein_goal_g)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [
        defaultProfile.id,
        defaultProfile.preference,
        defaultProfile.sugar_goal_g,
        defaultProfile.protein_goal_g
      ]
    );
  }

  async getProfile() {
    const result = await this.pool.query("SELECT * FROM user_profiles WHERE id = $1", ["default"]);
    return result.rows[0] ?? defaultProfile;
  }

  async updateProfile(nextProfile) {
    const result = await this.pool.query(
      `UPDATE user_profiles
       SET preference = $2, sugar_goal_g = $3, protein_goal_g = $4, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        "default",
        nextProfile.preference,
        nextProfile.sugar_goal_g,
        nextProfile.protein_goal_g
      ]
    );
    return result.rows[0];
  }

  async addScan(scan) {
    const id = randomUUID();
    const result = await this.pool.query(
      `INSERT INTO scan_history (id, product_name, raw_text, parsed, result, nutrition)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        id,
        scan.product_name,
        scan.rawText,
        scan.parsed,
        scan.result,
        scan.nutrition
      ]
    );
    return result.rows[0];
  }

  async listScans() {
    const result = await this.pool.query("SELECT * FROM scan_history ORDER BY created_at DESC");
    return result.rows;
  }

  async getScan(id) {
    const result = await this.pool.query("SELECT * FROM scan_history WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }
}
