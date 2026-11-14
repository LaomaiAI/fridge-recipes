// 确定性匹配层：全部计算都是代码规则，没有大模型参与。
// 规则：
// 1. 只统计非调料食材（STAPLE_INGREDIENTS 默认厨房常备，不计入）。
// 2. 一道菜的“缺失数” = 菜谱里非调料食材中，用户冰箱没有的个数。
// 3. 排序：缺失数越少越靠前；缺失数相同按已有食材占比高者优先；
//    再相同按耗时短者优先。
// 4. 状态：缺失 0 样为“食材齐全”；缺 1 样且已有至少 1 样为“只差 1 样”；
//    其余为“还差 N 样”。只有 1 种主料、用户一样没有的菜不算“只差 1 样”，
//    否则空冰箱也会排出一周都是同一道菜的计划。

import { STAPLE_INGREDIENTS } from '../data/ingredients'
import { RECIPES, type Recipe } from '../data/recipes'

export type MatchStatus = 'ready' | 'almost' | 'partial'

export interface MatchResult {
  recipe: Recipe
  have: string[]
  missing: string[]
  missingCount: number
  matchRate: number
  status: MatchStatus
}

/** 一道菜的非调料食材（去重） */
export function coreIngredients(recipe: Recipe): string[] {
  const names = recipe.ingredients
    .map((i) => i.name)
    .filter((name) => !STAPLE_INGREDIENTS.has(name))
  return Array.from(new Set(names))
}

export function matchOne(recipe: Recipe, selected: Set<string>): MatchResult {
  const core = coreIngredients(recipe)
  const have = core.filter((name) => selected.has(name))
  const missing = core.filter((name) => !selected.has(name))
  const status: MatchStatus =
    missing.length === 0
      ? 'ready'
      : missing.length === 1 && have.length >= 1
        ? 'almost'
        : 'partial'
  return {
    recipe,
    have,
    missing,
    missingCount: missing.length,
    matchRate: core.length === 0 ? 1 : have.length / core.length,
    status,
  }
}

/** 对全部菜谱做匹配并排序 */
export function matchRecipes(selected: Set<string>): MatchResult[] {
  return RECIPES.map((r) => matchOne(r, selected)).sort((a, b) => {
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount
    if (a.matchRate !== b.matchRate) return b.matchRate - a.matchRate
    return a.recipe.minutes - b.recipe.minutes
  })
}

export interface ShoppingItem {
  name: string
  dishCount: number
  amounts: string[]
  dishes: string[]
}

/**
 * 汇总买菜清单：把若干道菜的缺失食材合并，
 * 同名食材只出现一次，注明要做几道菜、每道菜的用量。
 */
export function aggregateShoppingList(results: MatchResult[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()
  for (const r of results) {
    for (const name of r.missing) {
      const amount =
        r.recipe.ingredients.find((i) => i.name === name)?.amount ?? ''
      const item = map.get(name)
      if (item) {
        item.dishCount += 1
        if (amount && !item.amounts.includes(amount)) item.amounts.push(amount)
        if (!item.dishes.includes(r.recipe.name)) item.dishes.push(r.recipe.name)
      } else {
        map.set(name, {
          name,
          dishCount: 1,
          amounts: amount ? [amount] : [],
          dishes: [r.recipe.name],
        })
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.dishCount - a.dishCount || a.name.localeCompare(b.name, 'zh-CN'),
  )
}

// -- 一周食谱计划 --

export interface DayPlan {
  day: string
  lunch: Recipe | null
  dinner: Recipe | null
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 确定性伪随机数（mulberry32），同一种子每次生成同一份计划 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * 生成一周食谱（午餐 + 晚餐，共 14 顿）。
 * 优先用食材齐全的菜，其次用只差 1 样的菜；
 * 菜谱够用时一周内不重复，菜谱不够时允许重复，但尽量错开；
 * 菜谱不足 2 道时，空位留空（显示“去菜市场看看”）。
 */
export function generateWeekPlan(
  matches: MatchResult[],
  seed: number,
): DayPlan[] {
  const rand = mulberry32(seed)
  const ready = matches.filter((m) => m.status === 'ready').map((m) => m.recipe)
  const almost = matches.filter((m) => m.status === 'almost').map((m) => m.recipe)
  const pool = shuffle([...ready, ...almost], rand)
  const days: DayPlan[] = []
  let used = new Set<string>()
  let cursor = 0

  const pick = (): Recipe | null => {
    if (pool.length === 0) return null
    // 先找本周还没用过的
    for (let k = 0; k < pool.length; k++) {
      const r = pool[(cursor + k) % pool.length]
      if (!used.has(r.id)) {
        used.add(r.id)
        cursor = (cursor + k + 1) % pool.length
        return r
      }
    }
    // 菜谱不够，允许重复
    const r = pool[cursor % pool.length]
    cursor += 1
    return r
  }

  for (const day of WEEK_DAYS) {
    days.push({ day, lunch: pick(), dinner: pick() })
  }
  return days
}
