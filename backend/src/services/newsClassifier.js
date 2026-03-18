const CATEGORY_RULES = [
  {
    category: '央行/利率',
    scope: 'global',
    keywords: [
      ['fed', 3], ['fomc', 3], ['ecb', 3], ['boj', 3], ['pboc', 3], ['central bank', 2],
      ['interest rate', 2], ['rate cut', 3], ['rate hike', 3], ['加息', 3], ['降息', 3],
      ['逆回购', 3], ['mlf', 3], ['lpr', 3], ['存款准备金率', 3], ['央行', 2],
    ],
  },
  {
    category: '通胀/就业',
    scope: 'global',
    keywords: [
      ['inflation', 3], ['cpi', 3], ['ppi', 2], ['payroll', 3], ['nonfarm', 3], ['jobs report', 2],
      ['unemployment', 3], ['labor market', 2], ['通胀', 3], ['非农', 3], ['失业率', 3],
      ['就业', 2], ['薪资', 2],
    ],
  },
  {
    category: '汇率/债券',
    scope: 'global',
    keywords: [
      ['treasury', 3], ['bond yield', 3], ['yield', 2], ['forex', 3], ['currency', 2],
      ['dollar', 2], ['yuan', 3], ['renminbi', 3], ['usd/cny', 3], ['国债收益率', 3],
      ['美债', 3], ['人民币', 3], ['汇率', 3], ['外汇', 2],
    ],
  },
  {
    category: '股市/盘面',
    scope: 'global',
    keywords: [
      ['stocks', 3], ['shares', 2], ['equities', 2], ['nasdaq', 3], ['s&p 500', 3], ['dow', 3],
      ['futures', 2], ['earnings', 2], ['market close', 2], ['收盘', 2], ['盘前', 2], ['盘后', 2],
      ['股市', 3], ['指数', 2],
    ],
  },
  {
    category: '大宗商品',
    scope: 'global',
    keywords: [
      ['oil', 3], ['crude', 3], ['brent', 3], ['wti', 3], ['gold', 3], ['silver', 3],
      ['copper', 2], ['commodity', 2], ['原油', 3], ['黄金', 3], ['白银', 3], ['大宗商品', 2],
    ],
  },
  {
    category: '公司/财报',
    scope: 'global',
    keywords: [
      ['earnings', 3], ['guidance', 2], ['revenue', 2], ['profit', 2], ['ipo', 2],
      ['merger', 2], ['acquisition', 2], ['财报', 3], ['业绩', 3], ['营收', 2], ['净利', 2],
      ['并购', 2], ['ipo', 2],
    ],
  },
  {
    category: '地缘/政策',
    scope: 'global',
    keywords: [
      ['tariff', 2], ['sanction', 3], ['war', 3], ['ceasefire', 2], ['election', 2],
      ['policy', 2], ['regulation', 2], ['出口管制', 3], ['制裁', 3], ['关税', 2],
      ['地缘', 2], ['政策', 2], ['监管', 2],
    ],
  },
  {
    category: '中国宏观',
    scope: 'china',
    keywords: [
      ['中国', 2], ['社融', 3], ['pmi', 2], ['财政', 2], ['地产政策', 3], ['地方债', 2],
      ['国常会', 3], ['国务院', 2], ['发改委', 2], ['统计局', 2],
    ],
  },
  {
    category: 'A股盘面',
    scope: 'a_share',
    keywords: [
      ['a股', 3], ['沪深', 3], ['创业板', 3], ['科创板', 3], ['北向资金', 3], ['南向资金', 2],
      ['涨停', 3], ['跌停', 3], ['板块', 2], ['题材', 2], ['龙虎榜', 3], ['两市', 2],
      ['上证', 2], ['深证', 2], ['沪指', 2],
    ],
  },
  {
    category: 'A股公司',
    scope: 'a_share',
    keywords: [
      ['公告', 3], ['回购', 2], ['减持', 2], ['增持', 2], ['定增', 3], ['停牌', 2],
      ['复牌', 2], ['业绩预告', 3], ['股东', 2], ['上市公司', 2],
    ],
  },
]

const TAG_RULES = [
  ['美联储', ['fed', 'fomc', 'powell']],
  ['通胀', ['inflation', 'cpi', 'ppi', '通胀']],
  ['就业', ['nonfarm', 'payroll', 'unemployment', '非农', '失业率']],
  ['人民币', ['yuan', 'renminbi', '人民币', 'usd/cny']],
  ['美债', ['treasury', 'yield', '美债', '国债收益率']],
  ['原油', ['oil', 'crude', 'brent', 'wti', '原油']],
  ['黄金', ['gold', '黄金']],
  ['A股', ['a股', '沪深', '创业板', '科创板', '上证', '深证']],
  ['财联社', ['财联社']],
  ['东方财富', ['东方财富']],
  ['科技股', ['nasdaq', 'tech', 'semiconductor', '半导体']],
  ['地产', ['property', 'real estate', '地产']],
]

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[|｜丨]/g, ' ')
    .replace(/[^\p{L}\p{N}\s/%.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreRule(text, rule) {
  return rule.keywords.reduce((total, [keyword, weight]) => {
    return text.includes(keyword) ? total + weight : total
  }, 0)
}

function inferScope(text, region) {
  if (region === 'CN' || /a股|沪深|创业板|科创板|北向资金|财联社|东方财富/.test(text)) return 'a_share'
  if (/中国|社融|国常会|发改委|统计局|国务院/.test(text)) return 'china'
  return 'global'
}

export function classifyNewsItem(item) {
  const text = normalizeText(`${item?.title || ''} ${item?.source || ''}`)
  const scope = inferScope(text, item?.region)

  let bestCategory = scope === 'a_share' ? 'A股盘面' : scope === 'china' ? '中国宏观' : '宏观'
  let bestScore = 0

  for (const rule of CATEGORY_RULES) {
    if (rule.scope !== scope && !(scope === 'a_share' && rule.scope === 'china')) continue
    const score = scoreRule(text, rule)
    if (score > bestScore) {
      bestScore = score
      bestCategory = rule.category
    }
  }

  const tags = TAG_RULES
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([tag]) => tag)
    .slice(0, 4)

  return {
    ...item,
    category: bestCategory,
    tags,
    marketScope: scope,
  }
}
