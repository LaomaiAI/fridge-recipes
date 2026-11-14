import { describe, expect, it } from 'vitest'
import { RECIPES } from '../data/recipes'
import {
  aggregateShoppingList,
  coreIngredients,
  generateWeekPlan,
  matchOne,
  matchRecipes,
  mulberry32,
} from './match'

describe('coreIngredients', () => {
  it('排除常备调料，只留主料', () => {
    const recipe = RECIPES.find((r) => r.id === 'tomato-egg')!
    expect(coreIngredients(recipe).sort()).toEqual(['番茄', '鸡蛋'])
  })

  it('菜谱库里的非调料食材都应在可选食材目录里出现', async () => {
    const { ALL_PANTRY_ITEMS } = await import('../data/ingredients')
    const pantry = new Set(ALL_PANTRY_ITEMS)
    for (const r of RECIPES) {
      for (const name of coreIngredients(r)) {
        expect(pantry.has(name), `${r.name} 的食材 ${name} 不在可选目录里`).toBe(true)
      }
    }
  })
})

describe('matchOne', () => {
  it('食材齐全时缺失为 0，状态 ready', () => {
    const recipe = RECIPES.find((r) => r.id === 'tomato-egg')!
    const result = matchOne(recipe, new Set(['番茄', '鸡蛋']))
    expect(result.missingCount).toBe(0)
    expect(result.status).toBe('ready')
    expect(result.matchRate).toBe(1)
  })

  it('只差 1 样时状态 almost', () => {
    const recipe = RECIPES.find((r) => r.id === 'tomato-egg')!
    const result = matchOne(recipe, new Set(['番茄']))
    expect(result.missing).toEqual(['鸡蛋'])
    expect(result.status).toBe('almost')
  })

  it('调料不需要用户勾选，不计入缺失', () => {
    const recipe = RECIPES.find((r) => r.id === 'tomato-egg')!
    // 用户只勾了番茄和鸡蛋，没勾盐、糖、葱、食用油，仍算齐全
    const result = matchOne(recipe, new Set(['番茄', '鸡蛋']))
    expect(result.missingCount).toBe(0)
  })

  it('空冰箱时缺失数等于主料数', () => {
    const recipe = RECIPES.find((r) => r.id === 'tomato-beef')!
    const result = matchOne(recipe, new Set())
    expect(result.missingCount).toBe(coreIngredients(recipe).length)
    expect(result.status).toBe('partial')
  })
})

describe('matchRecipes', () => {
  it('按缺失数升序排列，缺失少的在前', () => {
    const results = matchRecipes(new Set(['番茄', '鸡蛋', '土豆', '青椒']))
    for (let i = 1; i < results.length; i++) {
      expect(results[i].missingCount).toBeGreaterThanOrEqual(
        results[i - 1].missingCount,
      )
    }
    expect(results[0].status).toBe('ready')
    // 缺失 0 样的有 5 道：番茄鸡蛋汤 10 分钟最短，排第一；
    // 其余 4 道都是 15 分钟，按菜谱库顺序排
    expect(results[0].recipe.id).toBe('tomato-egg-soup')
    expect(results.slice(0, 5).every((r) => r.missingCount === 0)).toBe(true)
    expect(results.slice(0, 5).map((r) => r.recipe.id)).toContain('tomato-egg')
  })

  it('返回全部 26 道菜', () => {
    expect(matchRecipes(new Set())).toHaveLength(RECIPES.length)
    expect(RECIPES.length).toBe(26)
  })

  it('缺失数相同时，已有占比高的排前面', () => {
    // 番茄牛腩缺 3 样（牛腩、土豆、洋葱），土豆炖牛肉缺 3 样（牛肉、土豆、胡萝卜）
    // 给用户番茄：番茄牛腩已有 1/4，土豆炖牛肉已有 0/3，番茄牛腩应在前
    const results = matchRecipes(new Set(['番茄']))
    const beefTomato = results.find((r) => r.recipe.id === 'tomato-beef')!
    const beefPotato = results.find((r) => r.recipe.id === 'beef-potato-stew')!
    expect(beefTomato.missingCount).toBe(beefPotato.missingCount)
    expect(results.indexOf(beefTomato)).toBeLessThan(results.indexOf(beefPotato))
  })
})

describe('aggregateShoppingList', () => {
  it('同名缺失食材合并，只出现一次，并注明涉及几道菜', () => {
    const results = matchRecipes(new Set(['鸡蛋']))
    // 番茄炒蛋缺番茄，青椒土豆丝缺土豆和青椒，选两道缺土豆的菜
    const picked = results.filter((r) =>
      ['hot-sour-potato', 'pepper-potato'].includes(r.recipe.id),
    )
    const list = aggregateShoppingList(picked)
    const potato = list.find((i) => i.name === '土豆')!
    expect(potato.dishCount).toBe(2)
    expect(potato.dishes).toHaveLength(2)
    expect(list.filter((i) => i.name === '土豆')).toHaveLength(1)
  })

  it('食材齐全的菜不产生买菜清单', () => {
    const results = matchRecipes(new Set(['番茄', '鸡蛋']))
    const ready = results.filter((r) => r.status === 'ready')
    expect(aggregateShoppingList(ready)).toHaveLength(0)
  })
})

describe('generateWeekPlan', () => {
  it('生成 7 天，每天午餐晚餐各一道', () => {
    const matches = matchRecipes(
      new Set(['番茄', '鸡蛋', '土豆', '青椒', '猪里脊', '豆腐', '白菜', '排骨', '玉米']),
    )
    const plan = generateWeekPlan(matches, 42)
    expect(plan).toHaveLength(7)
    for (const day of plan) {
      expect(day.lunch).not.toBeNull()
      expect(day.dinner).not.toBeNull()
    }
  })

  it('同一份种子每次生成同一份计划', () => {
    const matches = matchRecipes(new Set(['番茄', '鸡蛋', '土豆']))
    const a = generateWeekPlan(matches, 7)
    const b = generateWeekPlan(matches, 7)
    expect(a).toEqual(b)
  })

  it('不同种子生成不同计划', () => {
    const matches = matchRecipes(
      new Set(['番茄', '鸡蛋', '土豆', '青椒', '猪里脊', '豆腐', '白菜']),
    )
    const a = generateWeekPlan(matches, 1)
    const b = generateWeekPlan(matches, 2)
    expect(a).not.toEqual(b)
  })

  it('菜谱够用时一周内不重复', () => {
    const matches = matchRecipes(new Set(ALL_INGREDIENTS_FOR_TEST))
    const plan = generateWeekPlan(matches, 99)
    const ids = plan.flatMap((d) => [d.lunch?.id, d.dinner?.id])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('冰箱是空的，计划全部留空', () => {
    const plan = generateWeekPlan(matchRecipes(new Set()), 1)
    expect(plan).toHaveLength(7)
    for (const day of plan) {
      expect(day.lunch).toBeNull()
      expect(day.dinner).toBeNull()
    }
  })
})

describe('mulberry32', () => {
  it('同一份种子输出同一串数字', () => {
    const a = mulberry32(123)
    const b = mulberry32(123)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

// 覆盖全部 26 道菜所需的主料集合（用于“菜谱够用”测试）
const ALL_INGREDIENTS_FOR_TEST = [
  '番茄', '鸡蛋', '猪里脊', '青椒', '嫩豆腐', '牛肉末', '鸡腿肉', '花生米',
  '土豆', '茄子', '五花肉', '西兰花', '生菜', '紫菜', '虾皮', '黄瓜',
  '牛肉', '胡萝卜', '鸡翅', '可乐', '木耳', '包菜', '西芹', '鲜百合',
  '枸杞', '韭菜', '白菜', '豆腐', '粉条', '冬瓜', '排骨', '洋葱',
  '绿豆芽', '玉米', '牛腩',
]
