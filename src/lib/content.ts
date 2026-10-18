import type { Region, Resort, Spot } from './types';
import { LINKS, mapSearch } from './links';

export const REGIONS: Region[] = [
  {
    id: 'otaru',
    name: '小樽',
    nameEn: 'Otaru',
    nameJa: '小樽',
    scene: 'otaru',
    keywords: ['运河', '历史街道', '玻璃工艺', '音乐盒', '甜点', '雪灯之路'],
    intro:
      '石造仓库沿运河排开，煤气灯在雪夜里亮起暖黄色的光。小樽曾是北海道的港口与金融重镇，如今以玻璃工艺、音乐盒和甜点闻名。二月的雪灯之路让运河与旧手宫线铺满雪烛与浮灯，是北海道冬季最浪漫的夜晚之一。',
    experiences: [
      '黄昏沿运河散步，看煤气灯逐盏亮起',
      '堺町通逛玻璃工房、甜品店与老字号',
      '在小樽音乐盒堂挑一只音乐盒',
      '入夜去雪灯之路：运河会场与旧手宫线会场',
    ],
    foods: ['LeTAO 双层芝士蛋糕', '寿司与海鲜丼', '北海道牛奶甜品'],
    dayIds: ['d1', 'd2'],
    links: [
      { label: '雪灯之路 · Visit Hokkaido', url: LINKS.snowLightPath },
      { label: 'Visit Hokkaido', url: LINKS.visitHokkaido },
    ],
  },
  {
    id: 'sapporo',
    name: '札幌',
    nameEn: 'Sapporo',
    nameJa: '札幌',
    scene: 'sapporo',
    keywords: ['北海道最大城市', '购物', '美食', '夜景', '雪景'],
    intro:
      '北海道最大的城市，棋盘式街道清晰好走。大通公园横贯市中心，薄野是札幌最热闹的美食与夜生活区，狸小路是历史悠久的拱廊商店街。冬天的札幌适合吃一碗浓郁的味噌拉面、一份汤咖喱，再上藻岩山看整座城市的灯海。札幌雪祭在本次抵达前已经结束，不在行程中。',
    experiences: [
      '札幌站商圈与狸小路购物',
      '薄野夜晚：拉面、海鲜、烧肉',
      '藻岩山夜景',
      '白色恋人公园',
      '札幌电视塔观景台俯瞰大通公园',
    ],
    foods: ['味噌拉面', '汤咖喱', '北海道海鲜（蟹、海胆）', '成吉思汗烤羊肉 · 烧肉'],
    dayIds: ['d2', 'd3'],
    links: [{ label: 'Sapporo Travel（札幌观光官方）', url: LINKS.sapporoTravel }],
  },
  {
    id: 'niseko',
    name: '二世古',
    nameEn: 'Niseko',
    nameJa: 'ニセコ',
    scene: 'niseko',
    keywords: ['日本粉雪', '国际滑雪目的地', '羊蹄山', '树林滑雪', '温泉'],
    intro:
      '在 Niseko Annupuri 与对面被称为「虾夷富士」的羊蹄山之间，是全球滑雪者心中的粉雪目的地。冬季风越过日本海带来干爽轻盈的雪，四个雪场在山顶附近相连。滑完一天，在森林里的温泉看雪落下，是二世古最完整的一天。',
    experiences: [
      'Grand Hirafu / Hanazono 粉雪与树线滑雪',
      '晴天远眺羊蹄山',
      '滑雪后泡温泉',
      '晚餐：汤咖喱、拉面、烧肉或北海道海鲜',
    ],
    foods: ['汤咖喱', '拉面', '烧肉', '北海道海鲜'],
    dayIds: ['d4'],
    links: [
      { label: 'Niseko United 官网', url: LINKS.nisekoUnited },
      { label: 'Ikon Pass · Niseko United', url: LINKS.ikonNiseko },
    ],
  },
  {
    id: 'rusutsu',
    name: '留寿都',
    nameEn: 'Rusutsu',
    nameJa: 'ルスツ',
    scene: 'rusutsu',
    keywords: ['粉雪', '树林雪道', '地形变化', '山景'],
    intro:
      'Rusutsu 由 West Mountain、East Mountain 与 Mt. Isola 三座相连的山组成。压雪道宽阔舒展，林间又藏着大量粉雪线路，地形变化丰富；天气晴朗时可以远眺羊蹄山与洞爷湖一带的山景。',
    experiences: ['Mt. Isola 长距离雪道', 'East Mountain 树林与变化地形', 'West Mountain 热身', '连续两天的树林粉雪'],
    foods: ['度假村内餐饮', '洞爷湖周边餐厅'],
    dayIds: ['d5', 'd6'],
    links: [
      { label: 'Rusutsu Resort 官网', url: LINKS.rusutsu },
      { label: 'Epic Pass · Rusutsu', url: LINKS.epicRusutsu },
    ],
  },
  {
    id: 'toya',
    name: '洞爷湖',
    nameEn: 'Lake Toya',
    nameJa: '洞爺湖',
    scene: 'toya',
    keywords: ['火山湖', '温泉', '雪山湖景', '高端度假'],
    intro:
      '洞爷湖是一座近圆形的破火山口湖，湖心有中岛，南岸是仍在活动的有珠山与昭和新山。湖面冬季不封冻，雪山倒映在深蓝色的湖水里。The Windsor Hotel TOYA 坐落在湖畔山顶，一侧俯瞰洞爷湖，一侧望向内浦湾，2008 年曾举办 G8 峰会。',
    experiences: ['在 Windsor 观景：湖景与海景', '酒店温泉与设施', '冬季湖景与火山地貌', '洞爷湖温泉街'],
    foods: ['酒店早餐（已含）', '酒店餐厅'],
    dayIds: ['d5', 'd6', 'd7'],
    links: [
      { label: 'The Windsor Hotel TOYA 官网', url: LINKS.windsor },
      { label: 'Visit Hokkaido', url: LINKS.visitHokkaido },
    ],
  },
];

export const SPOTS: Spot[] = [
  { id: 'otaru-canal', regionId: 'otaru', name: '小樽运河', nameEn: 'Otaru Canal', kind: 'sight', desc: '石造仓库与煤气灯，雪夜最美', place: 'Otaru Canal' },
  { id: 'sakaimachi', regionId: 'otaru', name: '堺町通', nameEn: 'Sakaimachi Street', kind: 'shopping', desc: '玻璃工房、甜品店与老字号', place: 'Sakaimachi Street, Otaru' },
  { id: 'music-box', regionId: 'otaru', name: '小樽音乐盒堂', nameEn: 'Otaru Music Box Museum', kind: 'sight', desc: '门前蒸汽钟与满屋音乐盒', place: 'Otaru Music Box Museum' },
  { id: 'letao', regionId: 'otaru', name: 'LeTAO 本店', nameEn: 'LeTAO', kind: 'food', desc: '双层芝士蛋糕', place: 'LeTAO Main Store Otaru' },
  { id: 'snow-light', regionId: 'otaru', name: '小樽雪灯之路', nameEn: 'Otaru Snow Light Path', kind: 'sight', desc: '运河与旧手宫线的雪烛灯光', place: 'Otaru Canal' },

  { id: 'sapporo-station', regionId: 'sapporo', name: '札幌站商圈', nameEn: 'Sapporo Station area', kind: 'shopping', desc: '百货、地下街与电器城', place: 'Sapporo Station' },
  { id: 'tanukikoji', regionId: 'sapporo', name: '狸小路商店街', nameEn: 'Tanukikoji Shopping Street', kind: 'shopping', desc: '有顶棚的长商店街，药妆与伴手礼', place: 'Tanukikoji Shopping Street' },
  { id: 'susukino', regionId: 'sapporo', name: '薄野', nameEn: 'Susukino', kind: 'food', desc: '拉面、居酒屋与夜生活', place: 'Susukino, Sapporo' },
  { id: 'odori', regionId: 'sapporo', name: '大通公园', nameEn: 'Odori Park', kind: 'sight', desc: '横贯市中心的雪中公园', place: 'Odori Park, Sapporo' },
  { id: 'moiwa', regionId: 'sapporo', name: '藻岩山夜景', nameEn: 'Mount Moiwa', kind: 'sight', desc: '缆车 + 观景台俯瞰札幌灯海', place: 'Mt. Moiwa Ropeway' },
  { id: 'shiroi', regionId: 'sapporo', name: '白色恋人公园', nameEn: 'Shiroi Koibito Park', kind: 'sight', desc: '白色恋人饼干工厂与欧式庭园', place: 'Shiroi Koibito Park' },
  { id: 'tv-tower', regionId: 'sapporo', name: '札幌电视塔观景台', nameEn: 'Sapporo TV Tower', kind: 'sight', desc: '大通公园东端的观景台', place: 'Sapporo TV Tower' },
  { id: 'soup-curry', regionId: 'sapporo', name: '北海道汤咖喱', nameEn: 'Soup curry', kind: 'food', desc: '札幌发源的汤咖喱', place: 'soup curry Sapporo' },
  { id: 'miso-ramen', regionId: 'sapporo', name: '味噌拉面', nameEn: 'Miso ramen', kind: 'food', desc: '札幌代表性的浓郁味噌拉面', place: 'miso ramen Susukino Sapporo' },
  { id: 'seafood', regionId: 'sapporo', name: '北海道海鲜', nameEn: 'Hokkaido seafood', kind: 'food', desc: '蟹、海胆、海鲜丼', place: 'seafood restaurant Sapporo' },
  { id: 'yakiniku', regionId: 'sapporo', name: '烧肉 · 成吉思汗', nameEn: 'Yakiniku / Jingisukan', kind: 'food', desc: '北海道烤羊肉与和牛烧肉', place: 'jingisukan Sapporo' },

  { id: 'hirafu', regionId: 'niseko', name: 'Grand Hirafu', nameEn: 'Niseko Grand Hirafu', kind: 'ski', desc: '最大、最热闹的雪区，本次优先', place: 'Niseko Grand Hirafu' },
  { id: 'hanazono', regionId: 'niseko', name: 'Hanazono', nameEn: 'Niseko HANAZONO', kind: 'ski', desc: '与 Hirafu 相连，树林与粉雪', place: 'Niseko HANAZONO Resort' },
  { id: 'annupuri', regionId: 'niseko', name: 'Annupuri', nameEn: 'Niseko Annupuri', kind: 'ski', desc: '山的西侧，雪道宽缓', place: 'Niseko Annupuri International Ski Area' },
  { id: 'niseko-soup-curry', regionId: 'niseko', name: '二世古汤咖喱 / 拉面', nameEn: 'Dinner in Niseko', kind: 'food', desc: '滑雪后晚餐候选', place: 'restaurant Hirafu Niseko' },

  { id: 'rusutsu-resort', regionId: 'rusutsu', name: 'Rusutsu Resort', nameEn: 'Rusutsu Resort', kind: 'ski', desc: '三山雪场，度假村本体', place: 'Rusutsu Resort' },
  { id: 'isola', regionId: 'rusutsu', name: 'Mt. Isola', nameEn: 'Mt. Isola', kind: 'ski', desc: '面积最大，长距离雪道', place: 'Mt. Isola Rusutsu' },
  { id: 'east-mt', regionId: 'rusutsu', name: 'East Mountain', nameEn: 'East Mountain', kind: 'ski', desc: '树林与变化地形', place: 'Rusutsu East Mountain' },
  { id: 'west-mt', regionId: 'rusutsu', name: 'West Mountain', nameEn: 'West Mountain', kind: 'ski', desc: '紧邻度假村，适合热身', place: 'Rusutsu West Mountain' },

  { id: 'lake-toya', regionId: 'toya', name: '洞爷湖', nameEn: 'Lake Toya', kind: 'sight', desc: '冬季不封冻的火山湖', place: 'Lake Toya' },
  { id: 'windsor', regionId: 'toya', name: 'The Windsor Hotel TOYA', nameEn: 'The Windsor Hotel TOYA', kind: 'onsen', desc: '山顶度假酒店', place: 'The Windsor Hotel Toya Resort & Spa' },
  { id: 'usu', regionId: 'toya', name: '有珠山 · 昭和新山', nameEn: 'Mt. Usu · Showa-shinzan', kind: 'sight', desc: '活火山地貌', place: 'Showa-shinzan' },
  { id: 'toya-onsen', regionId: 'toya', name: '洞爷湖温泉街', nameEn: 'Toyako Onsen', kind: 'onsen', desc: '湖畔温泉街', place: 'Toyako Onsen' },
];

export const RESORTS: Resort[] = [
  {
    id: 'niseko',
    name: 'Niseko United',
    nameZh: '二世古联合滑雪场',
    regionId: 'niseko',
    scene: 'niseko',
    intro:
      '由 Grand Hirafu、Hanazono、Niseko Village、Annupuri 四个雪场组成，同在海拔 1,308 m 的 Niseko Annupuri 山上，距札幌约 100 km。四个雪场在山顶附近相连，全山通票（All Mountain Pass）可通用。',
    areas: [
      { name: 'Grand Hirafu', desc: '面积最大、山脚最热闹，本次优先' },
      { name: 'Hanazono', desc: '与 Grand Hirafu 相连，树林与粉雪地形' },
      { name: 'Niseko Village', desc: '位于 Hirafu 与 Annupuri 之间' },
      { name: 'Annupuri', desc: '山的西侧，雪道宽缓' },
    ],
    terrain: ['干爽粉雪', '树林滑雪', '羊蹄山景观', '四雪场山顶互通'],
    passNote:
      '旅客 A 需单独购买雪票（参考 CAD 110–125，之前查询价，非实付）。旅客 B 考虑使用 Ikon Session Pass 3-Day 中的 1 天，适用范围与兑换规则待确认。是否购买全山通票未决定。',
    links: [
      { label: '官网', url: LINKS.nisekoUnited },
      { label: '雪况 OnTheSnow', url: LINKS.snowNiseko },
      { label: 'Ikon Pass 页面', url: LINKS.ikonNiseko },
    ],
    mapQuery: 'Niseko Grand Hirafu',
  },
  {
    id: 'rusutsu',
    name: 'Rusutsu Resort',
    nameZh: '留寿都度假村',
    regionId: 'rusutsu',
    scene: 'rusutsu',
    intro:
      '由 West Mountain、East Mountain、Mt. Isola 三座相连的山组成。West Mountain 紧邻度假村本体、坡度较缓；East Mountain 与 Mt. Isola 承载了大部分雪道，Mt. Isola 面积最大。以宽阔压雪道和林间粉雪著称。',
    areas: [
      { name: 'West Mountain', desc: '度假村正上方，适合热身' },
      { name: 'East Mountain', desc: '树林与变化地形' },
      { name: 'Mt. Isola', desc: '面积最大，长距离雪道与林间粉雪' },
    ],
    terrain: ['林间粉雪', '宽阔压雪道', '地形变化', '羊蹄山 / 洞爷湖方向山景'],
    passNote:
      '旅客 A：Epic Pass 合作雪场权益（epicpass.com 页面称可获 5 个连续日，需持实体卡 + 有效证件到售票窗口兑换；资格与手续仍需核实）。旅客 B：需购买两日票（参考约 JPY 26,000，非实付）。Ikon Pass 不覆盖 Rusutsu。',
    links: [
      { label: '官网', url: LINKS.rusutsu },
      { label: '雪况 OnTheSnow', url: LINKS.snowRusutsu },
      { label: 'Epic Pass 页面', url: LINKS.epicRusutsu },
    ],
    mapQuery: 'Rusutsu Resort',
  },
];

export function regionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function spotsFor(regionId: string): Spot[] {
  return SPOTS.filter((s) => s.regionId === regionId);
}

export const WEATHER_LINKS = [
  { label: '日本气象厅 天气预报', url: LINKS.jmaForecast },
  { label: 'NEXCO 东日本 高速公路', url: LINKS.nexcoEast },
  { label: 'Niseko 雪况', url: LINKS.snowNiseko },
  { label: 'Rusutsu 雪况', url: LINKS.snowRusutsu },
];

export { mapSearch };
