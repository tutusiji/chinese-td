/**
 * SQLite 数据库 — 服务端统一存储
 * 所有表通过 initSchema() 自动创建
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', 'moshou.db');
export const sqlite = new Database(DB_PATH);

// 启用 WAL 模式提升并发性能
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export function initSchema() {
  sqlite.exec(`
    -- 物料管理
    CREATE TABLE IF NOT EXISTS materials (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'ui',
      level         TEXT NOT NULL DEFAULT 'basic',
      source        TEXT NOT NULL DEFAULT 'procedural',
      prompt        TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      entity_type   TEXT,
      image_url     TEXT,
      model_url     TEXT,
      skeleton_actions TEXT,  -- JSON array
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    -- 3D 生成任务
    CREATE TABLE IF NOT EXISTS jobs (
      job_id        TEXT PRIMARY KEY,
      material_id   TEXT NOT NULL REFERENCES materials(id),
      prompt        TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      backend       TEXT NOT NULL DEFAULT 'hunyuan',
      error         TEXT,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    -- 游戏存档
    CREATE TABLE IF NOT EXISTS saves (
      id            TEXT PRIMARY KEY,
      label         TEXT NOT NULL,
      map_id        TEXT NOT NULL,
      mode          TEXT NOT NULL DEFAULT 'defense',
      gold          INTEGER NOT NULL DEFAULT 0,
      castle_hp     INTEGER NOT NULL DEFAULT 20,
      wave          INTEGER NOT NULL DEFAULT 0,
      wave_cd       INTEGER NOT NULL DEFAULT 0,
      spawned_count INTEGER NOT NULL DEFAULT 0,
      total_spawned INTEGER NOT NULL DEFAULT 0,
      game_speed    INTEGER NOT NULL DEFAULT 1,
      towers        TEXT NOT NULL DEFAULT '[]',  -- JSON
      attack_form   TEXT NOT NULL DEFAULT '{}',  -- JSON
      supply        INTEGER NOT NULL DEFAULT 200,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    -- 用户 (预留)
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL
    );

    -- 排行榜 (预留)
    CREATE TABLE IF NOT EXISTS leaderboard (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER REFERENCES users(id),
      map_id        TEXT NOT NULL,
      mode          TEXT NOT NULL,
      score         INTEGER NOT NULL DEFAULT 0,
      waves         INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL
    );

    -- 物料预设 (默认数据)
    INSERT OR IGNORE INTO materials (id, name, category, level, source, prompt, description, entity_type, created_at, updated_at)
    VALUES
      ('enemy-sword', '刀兵', 'enemy', 'basic', 'procedural', '中国古代步兵，持刀，布甲', '基础近战单位', 'sword', 0, 0),
      ('enemy-spear', '枪兵', 'enemy', 'basic', 'procedural', '中国古代枪兵，持长枪，皮甲', '长柄武器单位', 'spear', 0, 0),
      ('enemy-cavalry', '骑兵', 'enemy', 'intermediate', 'procedural', '中国古代骑兵，骑马持刀，铁甲', '高速突击单位', 'horse', 0, 0),
      ('enemy-artillery', '炮兵', 'enemy', 'intermediate', 'ai-2d', '中国古代炮兵，小型火炮，布甲', '远程拆塔单位', 'artillery', 0, 0),
      ('enemy-brute', '大力士', 'enemy', 'advanced', 'ai-2d', '中国古代大力士，肌肉壮汉，持锤', '重甲肉盾单位', 'brute', 0, 0),
      ('enemy-wizard', '巫师', 'enemy', 'advanced', 'ai-2d', '中国古代方士，持拂尘，道袍', '范围法术单位', 'wizard', 0, 0),
      ('enemy-ram', '攻城车', 'enemy', 'advanced', 'ai-3d', '中国古代攻城槌车，木制金属撞头', '破门攻城器械', 'ram', 0, 0),
      ('enemy-trebuchet', '投石车', 'enemy', 'advanced', 'ai-3d', '中国古代投石车，杠杆结构', '远程重型攻城器械', 'trebuchet_unit', 0, 0),
      ('tower-arrow-lv1', '箭塔 Lv.1', 'tower', 'basic', 'procedural', '中国古代箭塔，木石结构，单层瓦顶', '基础箭塔', 'arrow', 0, 0),
      ('tower-arrow-lv2', '箭塔 Lv.2', 'tower', 'intermediate', 'procedural', '中国古代箭塔，砖石强化，双层瓦顶', '强化箭塔', 'arrow', 0, 0),
      ('tower-arrow-lv3', '箭塔 Lv.3', 'tower', 'advanced', 'procedural', '中国古代箭塔，城防重器，三层瓦顶', '重型箭塔', 'arrow', 0, 0),
      ('tower-cannon-lv1', '炮台 Lv.1', 'tower', 'basic', 'procedural', '中国古代炮台，石基铁炮', '基础炮台', 'cannon', 0, 0),
      ('tower-cannon-lv2', '炮台 Lv.2', 'tower', 'intermediate', 'procedural', '中国古代炮台，砖石底座，加长炮管', '强化炮台', 'cannon', 0, 0),
      ('tower-cannon-lv3', '炮台 Lv.3', 'tower', 'advanced', 'procedural', '中国古代炮台，重型城防炮', '重型炮台', 'cannon', 0, 0),
      ('tower-ice-lv1', '冰塔 Lv.1', 'tower', 'basic', 'procedural', '寒冰机关塔，冰晶核心', '基础冰塔', 'ice', 0, 0),
      ('tower-ice-lv2', '冰塔 Lv.2', 'tower', 'intermediate', 'procedural', '寒冰机关塔，大型冰晶', '强化冰塔', 'ice', 0, 0),
      ('tower-ice-lv3', '冰塔 Lv.3', 'tower', 'advanced', 'procedural', '寒冰机关塔，巨型冰晶', '重型冰塔', 'ice', 0, 0),
      ('tower-stone-lv1', '投石车 Lv.1', 'tower', 'intermediate', 'ai-3d', '守城投石车，木制杠杆', '基础投石车', 'stone_thrower', 0, 0),
      ('tower-rocket-lv1', '火箭塔 Lv.1', 'tower', 'intermediate', 'ai-2d', '中国古代火箭塔，多管发射架', '基础火箭塔', 'rocket_tower', 0, 0),
      ('terrain-mountain', '山地', 'terrain', 'basic', 'procedural', '中国山水画风格山峰', '山地地形', 'mountain', 0, 0),
      ('terrain-tree', '树木', 'terrain', 'basic', 'procedural', '中国风松树，层叠树冠', '树木障碍', 'tree', 0, 0),
      ('terrain-grass', '草地', 'terrain', 'basic', 'procedural', '绿色草地，散落草叶', '可建造草地', 'grass', 0, 0),
      ('terrain-river', '河流', 'terrain', 'basic', 'procedural', '浅蓝透明水面', '河流地形', 'river', 0, 0),
      ('resource-wood', '木材', 'resource', 'basic', 'ai-2d', '中国风木材资源图标', '建造资源', NULL, 0, 0),
      ('resource-stone', '石料', 'resource', 'basic', 'ai-2d', '中国风石料资源图标', '防御升级资源', NULL, 0, 0),
      ('resource-grain', '粮草', 'resource', 'basic', 'ai-2d', '中国风粮草资源图标', '兵力维持资源', NULL, 0, 0),
      ('resource-gold', '金币', 'resource', 'basic', 'ai-2d', '中国风金币资源图标', '通用资源', NULL, 0, 0),
      ('structure-castle', '城池', 'structure', 'advanced', 'procedural', '中国古代城池，城墙城垛，双层瓦顶', '主城/大本营', 'castle', 0, 0),
      ('structure-wall', '城墙', 'structure', 'basic', 'procedural', '中国古代城墙段，砖石结构', '防御城墙', 'wall', 0, 0);
  `);

  console.log('[DB] SQLite 初始化完成:', DB_PATH);
}
