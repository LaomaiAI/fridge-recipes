// 食材目录：用户在冰箱里勾选的食材从这里选。
// 食材名与 recipes.ts 中的食材名一一对应，匹配按名字精确比较。

export interface IngredientGroup {
  category: string
  items: string[]
}

export const PANTRY_GROUPS: IngredientGroup[] = [
  {
    category: '蔬菜',
    items: [
      '番茄', '青椒', '土豆', '茄子', '西兰花', '生菜', '黄瓜', '胡萝卜',
      '包菜', '西芹', '韭菜', '白菜', '冬瓜', '洋葱', '绿豆芽', '玉米', '木耳',
    ],
  },
  {
    category: '肉蛋',
    items: [
      '鸡蛋', '猪里脊', '五花肉', '牛肉', '牛肉末', '牛腩',
      '鸡腿肉', '鸡翅', '排骨',
    ],
  },
  {
    category: '豆制品',
    items: ['嫩豆腐', '豆腐'],
  },
  {
    category: '干货',
    items: ['紫菜', '虾皮', '粉条', '枸杞', '花生米', '鲜百合'],
  },
  {
    category: '其他',
    items: ['可乐'],
  },
]

// 常备调料：一般家庭厨房默认都有，不参与匹配、不进买菜清单。
// 菜谱详情里仍会列出用量，只是不计入“缺失食材数”。
export const STAPLE_INGREDIENTS = new Set([
  '盐', '食用油', '生抽', '老抽', '料酒', '醋', '糖', '冰糖',
  '葱', '姜', '蒜', '蒜苗', '香油', '蚝油', '淀粉',
  '豆瓣酱', '干辣椒', '花椒', '花椒粉', '八角', '辣椒油', '温水',
])

// 全部可勾选食材（去重后）
export const ALL_PANTRY_ITEMS: string[] = Array.from(
  new Set(PANTRY_GROUPS.flatMap((g) => g.items)),
)
