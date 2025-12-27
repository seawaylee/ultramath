import { Question, Operation } from "../types";

// --- Math Tips Engine ---

const ADDITION_TIPS = [
  "试试'凑十法'：看到9想到1，看到8想到2，先把一个数凑成10更好算！",
  "数位要对齐：个位加个位，十位加十位，满十别忘了进一哦！",
  "把大数记在心里，小数伸出手指接着数，这样会更快！",
  "交换律：两个数相加，交换位置和不变，挑好算的先算。",
  "如果接近整十数（比如19, 28），可以先按整十加，再减去多加的数。"
];

const SUBTRACTION_TIPS = [
  "试试'破十法'：十几减九，几加一；十几减八，几加二。",
  "想加算减：想一想，多少加上减数等于被减数？",
  "个位不够减时，记得向十位借一当十，别忘了借位！",
  "如果减数接近整十，可以先减整十，再把多减的补回来。",
  "被减数和减数同时加上一个数，差不变，试试把减数凑成整十。"
];

const MULTIPLICATION_TIPS = [
  "乘法口诀背熟了吗？一一得一，二二得四...",
  "任何数乘以0都等于0，任何数乘以1都等于它自己。",
  "积的个位通常由两个因数的个位决定，先算个位试试。",
  "如果乘以9，可以看作乘以10再减去原数（比如 9x6 = 60-6）。",
  "乘以5的技巧：任何偶数乘5，就是那一半再加0（如6x5=30）。"
];

const DIVISION_TIPS = [
  "除法是乘法的逆运算，想一想括号里填几能算出被除数？",
  "试商技巧：除数乘以几最接近被除数？",
  "0除以任何不是0的数，结果都是0哦！",
  "余数一定要比除数小，如果余数大了说明商小了。",
  "从高位除起，一位一位往下算，不够除就商0。"
];

export const generateErrorExplanation = (q: Question): string => {
  let tips: string[] = [];

  // Special Cases
  if (q.operation === Operation.MULTIPLY && (q.num1 === 0 || q.num2 === 0)) {
    return "记住哦：0乘以任何数都等于0！这是宇宙定律！";
  }
  if (q.operation === Operation.DIVIDE && q.num1 === 0) {
    return "记住哦：0除以任何数（非0）都还是0！";
  }
  if (q.num1 === q.num2 && q.operation === Operation.SUBTRACT) {
    return "两个一样的数相减，结果肯定是0啦！";
  }

  // General Tips
  switch (q.operation) {
    case Operation.ADD: tips = ADDITION_TIPS; break;
    case Operation.SUBTRACT: tips = SUBTRACTION_TIPS; break;
    case Operation.MULTIPLY: tips = MULTIPLICATION_TIPS; break;
    case Operation.DIVIDE: tips = DIVISION_TIPS; break;
    default: tips = ["仔细检查一下数字，相信你下次一定能算对！"];
  }

  // Return a random tip + correct answer
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  return `正确答案是 ${q.correctAnswer}。${randomTip}`;
};

// --- Ultraman Phrase Corpus Generator (Combinatorial > 1000 variations) ---

// Components for Perfect Score (100%)
const PERFECT_OPENERS = [
  "来自M78星云的急电！", "简直是奇迹！", "光之国全体起立！", "奥特之父发来贺电！", 
  "不可思议的能量反应！", "太完美了！", "这就是传说的战士吗？", "赛罗奥特曼为你点赞！"
];
const PERFECT_BODIES = [
  "你以满分的成绩守护了地球！", "所有的怪兽都在你的智慧面前颤抖！", 
  "你的计算速度超越了光速！", "这种力量甚至超越了等离子火花！", 
  "没有任何一道题能难倒你！", "你的准确率达到了百分之百！",
  "你就是我们要寻找的光之继承者！", "怪兽还没反应过来就被你消灭了！"
];
const PERFECT_CLOSERS = [
  "光之国的历史将刻下你的名字！", "继续保持，新的英雄！", "你就是未来的希望！", 
  "让我们一起飞向宇宙吧！", "完美的战斗，致敬！", "你是最强的！"
];

// Components for Great Score (80-99%)
const GREAT_OPENERS = [
  "干得漂亮！", "非常优秀的战绩！", "佐菲队长很满意！", "战斗非常精彩！", 
  "好样的，特级战士！", "怪兽已被击退！", "胜利属于你！"
];
const GREAT_BODIES = [
  "虽然战斗激烈，但你成功击败了大部分怪兽！", "你的光芒已经足够耀眼！", 
  "只差一点点就能成为传说！", "你的反应速度非常快！", 
  "大部分难题都被你轻松解决了！", "这就是宇宙警备队的实力！"
];
const GREAT_CLOSERS = [
  "下次争取一个都不漏掉！", "继续磨练你的光线技能吧！", "地球的和平由你守护！", 
  "稍微休息一下，准备迎接新挑战！", "我看好你，加油！"
];

// Components for Good Score (60-79%)
const GOOD_OPENERS = [
  "任务完成！", "战斗结束！", "还不错哦！", "辛苦了，战士！", 
  "坚持到了最后！", "虽然受了点伤！"
];
const GOOD_BODIES = [
  "有些怪兽很狡猾，但你没有退缩！", "你做对了很多题，继续努力！", 
  "只要消灭剩下的错误，你就是最强的！", "哪怕能量灯闪烁，你也没有放弃！", 
  "这是一场艰难的战斗，但你赢了！"
];
const GOOD_CLOSERS = [
  "特训之后你会更强！", "这就是奥特精神！", "下次我们一定能赢回来！", 
  "不要气馁，继续加油！", "光永远与你同在！"
];

// Components for Bad Score (<60%)
const BAD_OPENERS = [
  "站起来，英雄！", "别灰心！", "这是一次特训！", "不要哭泣！", 
  "呼叫奥特支援！", "怪兽太强了吗？"
];
const BAD_BODIES = [
  "一次失败不代表结束，奥特曼也输过！", "把眼泪化作力量，去复习错题吧！", 
  "你的潜力是无限的，相信自己！", "失败是成功之母，我们重新来过！", 
  "只要心中有光，就永远不会输！"
];
const BAD_CLOSERS = [
  "让我们回光之国特训吧！", "再试一次，你能行！", "我看好你，加油啊！", 
  "为了地球，请不要放弃！", "下一次，必胜！"
];

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const generateUltramanSummary = (correctCount: number, total: number): { message: string; mood: string } => {
  const percentage = (correctCount / total) * 100;
  let message = "";
  let mood = "";

  if (percentage === 100) {
    message = `${getRandom(PERFECT_OPENERS)} ${getRandom(PERFECT_BODIES)} ${getRandom(PERFECT_CLOSERS)}`;
    mood = "happy";
  } else if (percentage >= 80) {
    message = `${getRandom(GREAT_OPENERS)} ${getRandom(GREAT_BODIES)} ${getRandom(GREAT_CLOSERS)}`;
    mood = "proud";
  } else if (percentage >= 60) {
    message = `${getRandom(GOOD_OPENERS)} ${getRandom(GOOD_BODIES)} ${getRandom(GOOD_CLOSERS)}`;
    mood = "encouraging";
  } else {
    message = `${getRandom(BAD_OPENERS)} ${getRandom(BAD_BODIES)} ${getRandom(BAD_CLOSERS)}`;
    mood = "sad";
  }

  // Ensure total length isn't too crazy, though our parts are short.
  return { message, mood };
};
