import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Play, RefreshCw, Star, 
  CheckCircle, XCircle, ChevronRight, Trophy,
  Zap, ArrowRight, Home, AlertCircle, Delete,
  Calculator
} from 'lucide-react';
import { 
  Operation, Difficulty, GameSettings, Question, GameResult 
} from './types';
import { generateQuestion, getDefaultSettings, getNextDifficulty } from './utils/math';
import { playSound, speakUltraman } from './utils/audio';
import { generateUltramanSummary, generateErrorExplanation } from './services/geminiService';

// --- Constants ---

// 扩充后的海量正确提示语 (50+)
const PRAISE_PHRASES = [
  "斯派修姆光线！好样的！",
  "正义必胜！做得好！",
  "你拥有光的力量！",
  "奥特光线！回答正确！",
  "精彩的计算！",
  "怪兽被打倒了！",
  "能量满满！你做到了！",
  "好快的速度，英雄！",
  "光与你同在！",
  "完美！继续保持！",
  "你的大脑里有等离子火花！",
  "M78星云发来贺电！",
  "这道题被你秒杀了！",
  "光之巨人为你点赞！",
  "准确率百分之百！",
  "奥特意念！计算正确！",
  "像赛罗一样帅气！",
  "你的智慧超越了美菲拉斯星人！",
  "守护地球的任务交给你了！",
  "这招是...奥特计算光线！",
  "太强了，简直是光之国的希望！",
  "连佐菲队长都对你点头！",
  "怪兽根本不是你的对手！",
  "不仅快，而且准！",
  "这种力量，难道是...奇迹型？",
  "保持这个节奏，特级战士！",
  "你的计算像八分光轮一样犀利！",
  "没有怪兽能逃过你的眼睛！",
  "胜利属于光之战士！",
  "太棒了！彩色计时器还是蓝色的！",
  "完全正确！",
  "你的数学水平已经是宇宙级了！",
  "光之能量正在汇聚！",
  "一击必杀！",
  "这就是奥特曼的智慧！",
  "没有任何破绽！",
  "继续前进，向着光！",
  "你的潜力无限大！",
  "又一只怪兽被净化了！",
  "奥特之父都在夸你！",
  "闪耀吧，光之子！",
  "绝对的计算力！",
  "这就是你的必杀技吗？太强了！",
  "没有什么能难倒你！",
  "光芒万丈！",
  "漂亮的解题思路！",
  "你就是数学界的迪迦！",
  "完美的逻辑！",
  "宇宙警备队需要你！",
  "继续战斗，不要停下！"
];

// 扩充后的海量错误鼓励语 (50+)
const ENCOURAGE_PHRASES = [
  "别放弃！",
  "彩色计时器在闪烁，加油啊！",
  "站起来，英雄！",
  "我们绝不投降！",
  "集中精神！",
  "相信未来！",
  "汇聚光芒！",
  "还没结束呢！",
  "保持坚强！",
  "再试一次，守护者！",
  "怪兽有点强，但你更强！",
  "这点困难算什么！",
  "深呼吸，感受光的能量！",
  "失败是成功之母，特训开始！",
  "不要让光芒熄灭！",
  "奥特曼也输过，但最后都赢了！",
  "仔细看清怪兽的弱点！",
  "不要慌，重新计算能量！",
  "光之国在看着你！",
  "把眼泪化作勇气！",
  "相信自己，你可以的！",
  "只是一次小小的失误！",
  "重新站起来，发射光线！",
  "不要被黑暗吞噬！",
  "你的潜力还没完全爆发！",
  "再来一次，这次一定行！",
  "奥特之星在指引你！",
  "坚持就是胜利！",
  "冷静思考，看穿它的诡计！",
  "我们一起打败它！",
  "不要气馁，英雄！",
  "哪怕倒下，也要向前倒！",
  "心中的光永远不会消失！",
  "特训之后，你会更强！",
  "这道题只是个小喽啰！",
  "用勇气填满彩色计时器！",
  "调整姿态，准备反击！",
  "你的光芒正在觉醒！",
  "不要害怕犯错！",
  "每一次失败都是为了更伟大的胜利！",
  "你可以战胜它的！",
  "想想爱迪奥特曼老师会怎么做！",
  "数学怪兽虽然狡猾，但你有智慧！",
  "加油！光在呼唤你！",
  "不到最后一刻绝不放弃！",
  "让我们一起通过这道难关！",
  "英雄是不会被打倒的！",
  "擦干眼泪，继续战斗！",
  "下一次，必胜！",
  "为了地球的和平，再算一次！"
];

// 结语语音库 - 按成绩分类
const END_GAME_COMMENTS = {
  perfect: [ // 100%
    "简直是奇迹！你以满分的成绩守护了地球！光之国的历史书上将刻下你的名字！",
    "太强了！所有的怪兽都在你的智慧面前颤抖！你就是新的光之巨人！",
    "完美无缺的计算！你的大脑里一定藏着等离子火花塔的能量！",
    "不可思议！连佐菲队长都会对你竖起大拇指！你已经超越了特级战士的水平！",
    "这就是奥特精神！没有任何难题能阻挡你前进的脚步！满分！",
    "你的智慧光芒照亮了整个宇宙！M78星云为你感到骄傲！",
    "不仅速度快，而且准确率百分之百！你就是我们要找的超级人间体！",
    "没有任何失误！你的专注力比奥特屏障还要坚固！",
    "英雄！你用完美的算术击败了黑暗！地球的未来交给你我放心了！",
    "这种力量...是满分的力量！你已经觉醒了真正的光！"
  ],
  great: [ // 80% - 99%
    "干得漂亮！虽然战斗很激烈，但你成功击退了大部分怪兽！胜利属于你！",
    "非常优秀的成绩！你的光芒已经足够耀眼，只差一点点就能成为传说！",
    "英雄的战斗总是充满挑战，你表现得非常棒！继续磨练光线技能吧！",
    "很棒！大部分难题都被你解决了！剩下的那些小怪兽，下次一定能打败它们！",
    "这就是宇宙警备队的实力吗？做得好！稍微休息一下，准备迎接新的挑战！",
    "你的计算能力很强！只要再多一点点细心，你就能成为奥特之王！",
    "好样的！地球的和平被你守护住了！下次争取一个都不漏掉！",
    "强大的能量反应！你已经掌握了数学光线的精髓，继续加油！"
  ],
  good: [ // 60% - 79%
    "战斗结束！虽然受了点伤，但你坚持到了最后！这就是奥特精神！",
    "还不错！有些怪兽很狡猾，但你没有退缩！特训之后你会更强！",
    "哪怕能量指示灯开始闪烁，你也没有放弃！这份勇气值得表扬！",
    "这是一场艰难的战斗。你做对了很多题，只要消灭剩下的错误，你就是最强的！",
    "不要气馁！奥特曼也需要不断的练习才能发射出强大的光线！",
    "只要心中有光，无论失败多少次都能站起来！下次我们一定能赢回来！"
  ],
  bad: [ // < 60%
    "站起来，英雄！一次失败不代表结束！奥特曼也曾被怪兽打倒，但我们通过特训变强了！",
    "不要哭泣！把眼泪化作力量！去复习一下错题，那是你变强的钥匙！",
    "看来怪兽很强大。但请相信，你的潜力是无限的！让我们回光之国特训吧！",
    "虽然这次输了，但只要你不放弃，光就永远不会消失！再试一次！",
    "听着，真正的英雄不是从不失败，而是失败后依然敢于挑战！我看好你！",
    "深呼吸，集中精神！数学怪兽并不可怕，可怕的是失去信心！加油啊！"
  ]
};

// --- Components ---

const UltramanBadge = ({ mood }: { mood: string }) => {
  // Visual representation of Ultraman's "Color Timer"
  const getColor = () => {
    switch(mood) {
      case 'happy': return 'bg-blue-500 shadow-blue-400';
      case 'proud': return 'bg-cyan-400 shadow-cyan-300';
      case 'sad': return 'bg-red-500 shadow-red-500 animate-pulse';
      default: return 'bg-blue-500 shadow-blue-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 mb-6">
       <div className={`relative w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center shadow-xl`}>
          {/* The Color Timer */}
          <div className={`w-12 h-12 rounded-full ${getColor()} shadow-[0_0_30px_5px] transition-all duration-1000`}></div>
          {/* Silver body plating simulation */}
          <div className="absolute -inset-1 border-2 border-slate-400 rounded-full opacity-50"></div>
       </div>
       <div className="text-sm font-bold text-slate-500 tracking-widest uppercase">宇宙警备队 (Ultra Guardian)</div>
    </div>
  );
};

// --- Vertical Calculation Animation Component ---
const VerticalWorking = ({ q }: { q: Question }) => {
  const { num1, num2, operation, correctAnswer } = q;
  
  // Format numbers for display
  const strN1 = String(num1);
  const strN2 = String(num2);
  const strRes = String(correctAnswer);
  
  // Division Layout (China Style: divisor ) dividend)
  if (operation === Operation.DIVIDE) {
    // dividend / divisor = quotient => num1 / num2 = correctAnswer
    // Layout: num2 ) num1
    //            res
    
    return (
      <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
        <div className="text-xs text-slate-400 mb-1 font-bold">竖式解析</div>
        <svg width="100" height="90" viewBox="0 0 100 90" className="w-24">
          {/* Quotient (Result) */}
          <text x="60" y="20" textAnchor="middle" className="text-lg font-mono font-bold fill-green-600 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">{strRes}</text>
          
          {/* Top Line */}
          <path d="M 35 25 L 95 25" stroke="currentColor" strokeWidth="2" className="text-slate-800 animate-in zoom-in-x duration-500" />
          
          {/* Curve */}
          <path d="M 35 25 Q 25 45 35 65" stroke="currentColor" fill="none" strokeWidth="2" className="text-slate-800 animate-in zoom-in-y duration-500" />
          
          {/* Divisor */}
          <text x="20" y="50" textAnchor="end" className="text-lg font-mono fill-slate-800 animate-in fade-in delay-100 duration-500">{strN2}</text>
          
          {/* Dividend */}
          <text x="60" y="50" textAnchor="middle" className="text-lg font-mono fill-slate-800 animate-in fade-in delay-200 duration-500">{strN1}</text>
        </svg>
      </div>
    );
  }

  // Standard vertical for +, -, *
  const opMap: Record<string, string> = { '+': '+', '-': '-', '×': '×', '÷': '÷' };
  const strOp = opMap[operation] || operation;
  
  return (
    <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
       <div className="text-xs text-slate-400 mb-1 font-bold">竖式解析</div>
       <svg width="80" height="100" viewBox="0 0 80 100" className="w-20">
        {/* Num 1 */}
        <text x="75" y="25" textAnchor="end" className="text-lg font-mono fill-slate-800 animate-in slide-in-from-right-4 duration-500">{strN1}</text>
        
        {/* Operator */}
        <text x="10" y="50" textAnchor="middle" className="text-lg font-mono fill-slate-800 animate-in fade-in duration-500">{strOp}</text>
        
        {/* Num 2 */}
        <text x="75" y="50" textAnchor="end" className="text-lg font-mono fill-slate-800 animate-in slide-in-from-right-4 delay-100 duration-500">{strN2}</text>
        
        {/* Line */}
        <line x1="5" y1="60" x2="75" y2="60" stroke="currentColor" strokeWidth="2" className="text-slate-800 animate-in zoom-in-x delay-200 duration-500" />
        
        {/* Result */}
        <text x="75" y="85" textAnchor="end" className="text-lg font-bold font-mono fill-green-600 animate-in zoom-in delay-300 duration-500">{strRes}</text>
      </svg>
    </div>
  );
};

// --- Views ---

// 1. Settings View
const SettingsView = ({ onStart, initialSettings }: { onStart: (s: GameSettings) => void, initialSettings: GameSettings }) => {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);

  const toggleOp = (op: Operation) => {
    const current = settings.operations;
    const newOps = current.includes(op) 
      ? current.filter(o => o !== op)
      : [...current, op];
    if (newOps.length > 0) setSettings({ ...settings, operations: newOps });
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setSettings(getDefaultSettings(diff));
  };

  return (
    <div className="max-w-md mx-auto w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="inline-block p-3 bg-red-500 rounded-2xl shadow-lg mb-4">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">奥特数学 (UltraMath)</h1>
        <p className="text-slate-500 mt-2">准备好执行任务了吗？</p>
      </div>

      <div className="space-y-6 bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50">
        
        {/* Difficulty Selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">任务难度</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(Difficulty).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultySelect(d)}
                className={`h-12 rounded-xl font-bold transition-all duration-200 ${
                  settings.difficulty === d 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Operations */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">选择武器 (运算)</label>
          <div className="flex justify-between gap-2">
            {[Operation.ADD, Operation.SUBTRACT, Operation.MULTIPLY, Operation.DIVIDE].map(op => (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                className={`flex-1 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  settings.operations.includes(op)
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Range */}
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">能量限制 (最大数值): {settings.range}</label>
           <input 
             type="range" 
             min="10" max="1000" step="10"
             value={settings.range}
             onChange={(e) => setSettings({...settings, range: Number(e.target.value) as any})}
             className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
           />
           <div className="flex justify-between text-xs text-slate-400 mt-2">
             <span>10</span>
             <span>1000</span>
           </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-4">
           <button 
             onClick={() => setSettings(s => ({...s, allowNegative: !s.allowNegative}))}
             className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors border ${settings.allowNegative ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`}
           >
             负数 (-1)
           </button>
           <button 
             onClick={() => setSettings(s => ({...s, allowDecimals: !s.allowDecimals}))}
             className={`flex-1 p-3 rounded-xl text-sm font-medium transition-colors border ${settings.allowDecimals ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
           >
             小数 (0.5)
           </button>
        </div>

        <button
          onClick={() => {
            playSound('start');
            onStart(settings);
          }}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          开始任务
        </button>
      </div>
    </div>
  );
};

// 2. Game View
const GameView = ({ settings, onComplete, onHome }: { 
  settings: GameSettings, 
  onComplete: (result: GameResult) => void,
  onHome: () => void 
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [staticExplanation, setStaticExplanation] = useState<string>('');

  // Initialize questions
  useEffect(() => {
    const qs = Array.from({ length: 10 }).map((_, i) => generateQuestion(settings, i));
    setQuestions(qs);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, [settings]);

  const currentQ = questions[currentIdx];

  const handleSubmit = async () => {
    if (!input || showFeedback !== 'none' || !currentQ) return;
    
    if (input === '-' || input === '.') return;

    const userVal = parseFloat(input);
    const isCorrect = Math.abs(userVal - currentQ.correctAnswer) < 0.01; 
    
    // IMPORTANT: Create the updated questions array HERE
    const newQuestions = [...questions];
    newQuestions[currentIdx] = { ...currentQ, userAnswer: userVal, isCorrect };
    
    // Update state for UI
    setQuestions(newQuestions);

    if (isCorrect) {
      playSound('correct');
      const praise = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
      speakUltraman(praise);
      
      setShowFeedback('correct');
      // Pass the *updated* array to nextQuestion to ensure we don't rely on stale state
      setTimeout(() => nextQuestion(newQuestions), 1500);
    } else {
      playSound('wrong');
      const encourage = ENCOURAGE_PHRASES[Math.floor(Math.random() * ENCOURAGE_PHRASES.length)];
      speakUltraman(encourage);

      setShowFeedback('wrong');
      
      // Get static math tip
      const expl = generateErrorExplanation(currentQ);
      setStaticExplanation(expl);
    }
  };

  // Accept optional updated questions array
  const nextQuestion = (updatedQuestions?: Question[]) => {
    // Fallback to current state if no update passed (e.g. from button click)
    const qsToUse = updatedQuestions || questions;

    setShowFeedback('none');
    setStaticExplanation('');
    setInput('');
    
    if (currentIdx < 9) {
      setCurrentIdx(c => c + 1);
    } else {
      finishGame(qsToUse);
    }
  };

  const finishGame = async (finalQuestions: Question[]) => {
    playSound('win');
    const correctCount = finalQuestions.filter(q => q.isCorrect).length;
    
    onComplete({
      totalQuestions: 10,
      correctCount,
      questions: finalQuestions, // Use the guaranteed latest data
      feedbackMessage: "Loading Ultra Report...",
      ultramanMood: 'encouraging'
    });
  };

  if (!currentQ) return <div className="p-10 text-center">怪兽正在接近中...</div>;

  return (
    <div className="max-w-md mx-auto w-full h-screen flex flex-col p-6">
      {/* Header / Progress */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => { playSound('click'); onHome(); }}
          className="p-2 -ml-2 text-slate-400 hover:text-blue-500 hover:bg-white rounded-xl transition-all"
        >
          <Home className="w-6 h-6" />
        </button>
        
        <div className="text-slate-400 font-bold text-sm tracking-wider">
          任务 {currentIdx + 1}/10
        </div>
        
        <div className="flex gap-1">
          {questions.map((q, i) => (
             <div key={i} className={`w-2 h-2 rounded-full ${
               i === currentIdx ? 'bg-blue-500 animate-pulse' :
               i < currentIdx ? (q.isCorrect ? 'bg-green-400' : 'bg-red-400') : 'bg-slate-200'
             }`} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-indigo-100 p-8 text-center border border-white relative overflow-hidden transition-all duration-300">
            {/* Beam Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-slate-300 to-blue-500 opacity-50"></div>

            <div className="text-6xl font-black text-slate-800 mb-8 tracking-tighter">
              {currentQ.num1} {currentQ.operation} {currentQ.num2}
            </div>

            <div className={`relative transition-all duration-300 transform ${showFeedback === 'wrong' ? 'shake' : ''}`}>
              <input 
                type="text" 
                value={input}
                readOnly
                placeholder="?"
                className={`w-full text-center text-4xl font-bold py-4 rounded-2xl bg-slate-50 border-2 outline-none transition-colors ${
                  showFeedback === 'correct' ? 'border-green-400 text-green-600 bg-green-50' :
                  showFeedback === 'wrong' ? 'border-red-400 text-red-600 bg-red-50' :
                  'border-slate-200 focus:border-blue-500 text-slate-800'
                }`}
              />
              {/* Inside Input Delete Button */}
              {input && showFeedback === 'none' && (
                <button 
                  onClick={() => setInput(prev => prev.slice(0, -1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-2 active:scale-90 transition-transform"
                >
                  <Delete className="w-8 h-8" />
                </button>
              )}
            </div>

            {/* Feedback Overlay */}
            {showFeedback === 'wrong' && (
              <div className="mt-4 bg-red-50 rounded-xl p-3 text-left animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-row items-start gap-3">
                  {/* Left Side: Text */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-red-600 font-bold mb-1">
                      <XCircle className="w-5 h-5" />
                      <span>任务失败！</span>
                    </div>
                    <div className="text-slate-600 text-sm mb-2">
                      正确答案： <span className="font-bold">{currentQ.correctAnswer}</span>
                    </div>
                    
                    <div className="text-sm text-slate-500 italic border-l-2 border-red-200 pl-2">
                      "{staticExplanation}"
                    </div>
                  </div>
                  
                  {/* Right Side: Vertical Calculation SVG */}
                  <VerticalWorking q={currentQ} />
                </div>

                {/* Manual Next Button */}
                <button onClick={() => nextQuestion()} className="mt-3 w-full py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200">
                  挑战下一题
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Numpad */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '-'].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (showFeedback === 'none') {
                playSound('click');
                // Don't allow multiple decimals or negatives in wrong places
                if (item === '.' && input.includes('.')) return;
                if (item === '-' && input.length > 0) return; // Negative only at start
                setInput(prev => prev + item);
              }
            }}
            className="h-14 bg-white rounded-xl shadow-sm border border-slate-100 text-xl font-bold text-slate-700 active:bg-slate-100 active:scale-95 transition-all"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {showFeedback === 'none' && (
        <button
          onClick={handleSubmit}
          disabled={!input || input === '-' || input === '.'}
          className={`mt-4 w-full py-4 rounded-2xl font-bold text-white text-lg transition-all shadow-lg ${
            input && input !== '-' && input !== '.' ? 'bg-blue-600 shadow-blue-200 hover:scale-[1.02]' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          发射光线！
        </button>
      )}
    </div>
  );
};

// 3. Summary View
const SummaryView = ({ result, currentDifficulty, onRestart, onNextLevel, onHome }: { 
  result: GameResult, 
  currentDifficulty: Difficulty,
  onRestart: () => void,
  onNextLevel: () => void,
  onHome: () => void
}) => {
  const [aiData, setAiData] = useState<{message: string, mood: string} | null>(null);

  const percentage = (result.correctCount / result.totalQuestions) * 100;
  const isPerfect = result.correctCount === result.totalQuestions;
  const wrongQuestions = result.questions.filter(q => !q.isCorrect);

  // Determine speech category based on percentage
  const getSpeechCategory = () => {
    if (percentage === 100) return 'perfect';
    if (percentage >= 80) return 'great';
    if (percentage >= 60) return 'good';
    return 'bad';
  };

  useEffect(() => {
    // 1. Generate text summary (Instant now)
    const data = generateUltramanSummary(result.correctCount, result.totalQuestions);
    setAiData(data);

    // 2. Play Long Emotional Voice Logic
    const category = getSpeechCategory();
    const phrases = END_GAME_COMMENTS[category as keyof typeof END_GAME_COMMENTS];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Wait for the "Win" sound to finish (approx 1s) then speak
    const timer = setTimeout(() => {
      speakUltraman(randomPhrase);
    }, 1200);

    return () => clearTimeout(timer);
  }, [result]); // Only run once when result changes

  return (
    <div className="max-w-md mx-auto w-full h-screen flex flex-col p-6 overflow-hidden">
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 flex flex-col items-center">
        
        <div className="mt-8 animate-in zoom-in-95 duration-500 w-full flex flex-col items-center">
          <UltramanBadge mood={aiData?.mood || 'encouraging'} />

          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {isPerfect ? "奥特曼胜利！" : "任务完成"}
          </h2>
          
          <div className="flex gap-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-8 h-8 ${i < Math.floor((percentage / 100) * 3) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
              />
            ))}
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-xl w-full text-center border border-white mb-6">
            <div className="text-5xl font-black text-slate-800 mb-2">
              {result.correctCount}<span className="text-2xl text-slate-400">/{result.totalQuestions}</span>
            </div>
            <p className="text-slate-500 font-medium">答对数量</p>

            {/* Message Display */}
            <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <p className="text-slate-700 italic font-medium leading-relaxed">
                "{aiData ? aiData.message : "正在接收来自M78星云的信号..."}"
              </p>
            </div>
          </div>
          
          {/* Wrong Answers List */}
          {wrongQuestions.length > 0 && (
            <div className="w-full mb-6">
              <div className="flex items-center gap-2 mb-3 px-2">
                 <AlertCircle className="w-5 h-5 text-orange-500" />
                 <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">错题回顾</h3>
              </div>
              <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-lg overflow-hidden">
                {wrongQuestions.map((q, i) => (
                  <div key={q.id} className={`p-4 flex items-center justify-between ${i !== wrongQuestions.length - 1 ? 'border-b border-slate-100' : ''}`}>
                     <div className="font-bold text-slate-700 text-lg">
                       {q.num1} {q.operation} {q.num2}
                     </div>
                     <div className="text-right">
                       <div className="text-xs text-slate-400 mb-1">你的答案</div>
                       <div className="font-bold text-red-500 flex items-center justify-end gap-1">
                         <XCircle className="w-3 h-3" /> {q.userAnswer}
                       </div>
                       <div className="text-xs text-slate-400 mt-1">正确答案</div>
                       <div className="font-bold text-green-500 flex items-center justify-end gap-1">
                         <CheckCircle className="w-3 h-3" /> {q.correctAnswer}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons (Fixed at bottom) */}
      <div className="w-full space-y-3 pt-4 border-t border-slate-200/50 bg-[#f5f5f7]">
        {isPerfect ? (
          <button
            onClick={() => {
              playSound('start');
              onNextLevel();
            }}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            下一关 (等级 {getNextDifficulty(currentDifficulty)})
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex gap-2">
             <button
              onClick={onRestart}
              className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              重试
            </button>
            <button
               onClick={() => {
                 playSound('click');
                 onHome();
               }}
               className="px-6 bg-white text-slate-600 border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 flex items-center justify-center"
            >
               <Home className="w-6 h-6" />
            </button>
          </div>
        )}
        
        {isPerfect && (
           <div className="flex gap-2">
             <button
               onClick={onRestart} 
               className="flex-1 py-3 bg-white text-slate-500 rounded-2xl font-medium text-sm hover:bg-slate-50 border border-slate-200"
             >
               留在此关
             </button>
             <button
               onClick={() => {
                 playSound('click');
                 onHome();
               }}
               className="px-6 bg-white text-slate-500 rounded-2xl font-medium text-sm hover:bg-slate-50 border border-slate-200 flex items-center justify-center"
             >
               <Home className="w-5 h-5" />
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Controller ---

export default function App() {
  const [view, setView] = useState<'settings' | 'game' | 'summary'>('settings');
  const [settings, setSettings] = useState<GameSettings>(getDefaultSettings(Difficulty.C));
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const startGame = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setView('game');
  };

  const handleGameComplete = (result: GameResult) => {
    setLastResult(result);
    setView('summary');
  };

  const restartLevel = () => {
    setView('game');
  };

  const nextLevel = () => {
    const nextDiff = getNextDifficulty(settings.difficulty);
    const newSettings = getDefaultSettings(nextDiff);
    setSettings(newSettings);
    setView('game');
  };

  const goHome = () => {
    setView('settings');
    setLastResult(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] flex items-center justify-center text-slate-800 selection:bg-blue-100">
      {view === 'settings' && (
        <SettingsView onStart={startGame} initialSettings={settings} />
      )}
      {view === 'game' && (
        <GameView settings={settings} onComplete={handleGameComplete} onHome={goHome} />
      )}
      {view === 'summary' && lastResult && (
        <SummaryView 
          result={lastResult} 
          currentDifficulty={settings.difficulty}
          onRestart={restartLevel}
          onNextLevel={nextLevel}
          onHome={goHome}
        />
      )}
    </div>
  );
}
