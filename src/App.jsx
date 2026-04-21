import { useState, useMemo, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Globe, Sun, CloudRain, CheckCircle2, AlertCircle,
  CreditCard, Home, Briefcase, BarChart3, ArrowRight,
  MessageSquare, Loader2, Bike, Beer, Waves, Mountain,
  Building2, MapPin, Clock, Banknote, Star, X, ChevronDown
} from 'lucide-react'

/* ─────────────────────────────────────────────
   COUNTRY DATABASE  (schema from PRD §5)
───────────────────────────────────────────── */
const IconMap = {
  Waves, Mountain, Building2, Beer, Bike, MapPin, Globe
}

const INITIAL_COUNTRIES = {
  澳洲: {
    flag: '🇦🇺',
    icon: 'Waves',
    tagline: '陽光、海浪、充飽電的靈魂。',
    fee: 'A$635',
    duration: '1–3 個月前申請',
    bank: 'CommBank, NAB, ANZ',
    housing: 'Flatmates.com.au, Gumtree',
    jobs: 'Seek.com.au, Indeed AU',
    sunLevel: '極高 ☀️☀️☀️',
    sunScore: 5,
    theme: 'linear-gradient(135deg, #f59e0b 0%, #0ea5e9 60%, #1e3a5f 100%)',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-200',
    navActive: 'bg-amber-100 text-amber-800',
    scoreBg: 'bg-amber-500',
    pros: ['日照極其豐富，對抗季節性憂鬱效果最佳', '農場工打黑工機會多，存錢速度快', '戶外運動文化盛行，跑步/重訓設施完備', '物理治療師普及，高足弓友善'],
    cons: ['大城市（雪梨、墨爾本）房租昂貴', '部分農場工環境惡劣，需做功課', '距離台灣最遠，機票貴'],
    timeToJob: '1–2 週',
    avgRent: 'A$250–350/週',
    mentalRisk: '低',
    score: 94,
    summary: '澳洲是怕抑鬱且愛戶外運動者的最優解。乾燥氣候對寒濕水腫體質有正向助益，豐沛的陽光和完善的運動設施讓心理健康有強力支撐。主要挑戰是大城市的高生活成本，但農業區存錢速度可補足。',
  },
  紐西蘭: {
    flag: '🇳🇿',
    icon: 'Mountain',
    tagline: '壯闊山河，讓人重新喘息的地方。',
    fee: 'NZ$455',
    duration: '搶名額制，需即時申請',
    bank: 'ANZ NZ, BNZ, Kiwibank',
    housing: 'Trade Me Property, Flatmates NZ',
    jobs: 'Seek NZ, Backpacker Board',
    sunLevel: '高 ☀️☀️',
    sunScore: 4,
    theme: 'linear-gradient(135deg, #6366f1 0%, #22c55e 60%, #1a472a 100%)',
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-700',
    accentBorder: 'border-indigo-200',
    navActive: 'bg-indigo-100 text-indigo-800',
    scoreBg: 'bg-indigo-500',
    pros: ['步調慢、生活品質高，適合需要獨處回復的人格特質', '自然景觀極致，跑步路線世界級', '社群友善，台灣人接受度高'],
    cons: ['名額競爭激烈，搶到帶有運氣成分', '薪資水準低於澳洲', '某些地區冬季潮濕'],
    timeToJob: '2–3 週',
    avgRent: 'NZ$220–320/週',
    mentalRisk: '中低',
    score: 87,
    summary: '紐西蘭的步調與你需要定期獨處回復的性格高度契合。慢活文化不要求你不停「証明自己」，對完美主義焦慮是種解藥。唯一變數是搶名額的不確定性。',
  },
  加拿大: {
    flag: '🇨🇦',
    icon: 'Mountain',
    tagline: '楓葉之國，選擇自由的地方。',
    fee: 'C$346',
    duration: '抽籤制（IEC Pool）',
    bank: 'CIBC, Scotiabank, TD Bank',
    housing: 'Kijiji, Zumper, Facebook Marketplace',
    jobs: 'Indeed CA, LinkedIn, Workopolis',
    sunLevel: '中（東部冬季長）',
    sunScore: 3,
    theme: 'linear-gradient(135deg, #dc2626 0%, #ffffff 50%, #dc2626 100%)',
    accentBg: 'bg-red-50',
    accentText: 'text-red-700',
    accentBorder: 'border-red-200',
    navActive: 'bg-red-100 text-red-800',
    scoreBg: 'bg-red-500',
    pros: ['制度對亞裔友善，族裔多元', '大城市（多倫多、溫哥華）華人社群龐大', '戶外活動豐富，滑雪/健行頂級'],
    cons: ['東部冬季長且陰暗，抑鬱風險中等', '稅收高，淨存款低於澳洲', 'IEC 抽籤不確定性高'],
    timeToJob: '3–5 週',
    avgRent: 'C$1,200–1,800/月',
    mentalRisk: '中（視城市）',
    score: 78,
    summary: '加拿大文化多元、制度友善，但東部冬季的長期陰暗對怕抑鬱的你是明確風險點。若選擇溫哥華（西岸，冬季雨多但不像東部那麼黑暗），整體分數提升。',
  },
  英國: {
    flag: '🇬🇧',
    icon: 'Building2',
    tagline: '深厚文化底蘊，但冬日考驗心靈。',
    fee: '£298',
    duration: '6–8 個月前申請',
    bank: 'Monzo, Revolut, Starling',
    housing: 'Rightmove, SpareRoom',
    jobs: 'Indeed UK, LinkedIn, Reed.co.uk',
    sunLevel: '低 ⚠️（冬季易 SAD）',
    sunScore: 1,
    theme: 'linear-gradient(135deg, #1d4ed8 0%, #dc2626 50%, #1a1a2e 100%)',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-200',
    navActive: 'bg-blue-100 text-blue-800',
    scoreBg: 'bg-blue-600',
    pros: ['持 UK Visa 旅遊歐洲極方便', '文化深度高，博物館免費', '英語環境對英文進步最直接'],
    cons: ['冬季陰雨，SAD（季節性情緒失調）風險是本列表最高', '物價極高，存錢速度最慢', '找工作競爭激烈，外國人不易'],
    timeToJob: '5–8 週',
    avgRent: '£180–280/週',
    mentalRisk: '⚠️ 高（冬季日照最少）',
    score: 58,
    summary: '英國的文化與地理位置誘人，但對於你明確標示「怕抑鬱、季節性憂鬱傾向」的體質，英國冬季是最大危險。若選英國，需有強力的冬季心理支持計畫（燈箱療法、運動習慣）。',
  },
  愛爾蘭: {
    flag: '🇮🇪',
    icon: 'Beer',
    tagline: '溫暖的酒館文化，但濕冷是日常。',
    fee: '€300',
    duration: '特定時段開放申請',
    bank: 'AIB, Bank of Ireland, Revolut IE',
    housing: 'Daft.ie, Rent.ie',
    jobs: 'Jobs.ie, LinkedIn IE',
    sunLevel: '低（全年潮濕）',
    sunScore: 1,
    theme: 'linear-gradient(135deg, #15803d 0%, #f97316 60%, #064e3b 100%)',
    accentBg: 'bg-green-50',
    accentText: 'text-green-700',
    accentBorder: 'border-green-200',
    navActive: 'bg-green-100 text-green-800',
    scoreBg: 'bg-green-600',
    pros: ['人際溫度極高，愛爾蘭人外向熱情', '社交文化（pub culture）很容易認識新朋友', '英語母語環境'],
    cons: ['濕冷氣候對寒濕水腫體質是雙重打擊', '都柏林租屋市場極度緊張', '薪資水準低於澳洲/英國'],
    timeToJob: '4–6 週',
    avgRent: '€1,000–1,600/月',
    mentalRisk: '⚠️ 高（濕冷+低日照）',
    score: 55,
    summary: '愛爾蘭的人際溫度和社交文化對你認識新朋友的需求很對味，但濕冷氣候對你的寒濕水腫體質與抑鬱傾向是雙重負面加成。除非對愛爾蘭文化有強烈嚮往，否則不建議列為優先。',
  },
  荷蘭: {
    flag: '🇳🇱',
    icon: 'Bike',
    tagline: '單車王國，高效開放的北歐精神。',
    fee: '€210',
    duration: '特定名額，競爭中等',
    bank: 'ING, ABN AMRO, Revolut NL',
    housing: 'Kamernet, Pararius',
    jobs: 'LinkedIn NL, Indeed NL, Nationale Vacaturebank',
    sunLevel: '中低（夏季佳，冬季灰）',
    sunScore: 2,
    theme: 'linear-gradient(135deg, #f97316 0%, #1d4ed8 60%, #f59e0b 100%)',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-700',
    accentBorder: 'border-orange-200',
    navActive: 'bg-orange-100 text-orange-800',
    scoreBg: 'bg-orange-500',
    pros: ['英語普及率全歐最高', '單車文化對 active lifestyle 超友善', '社會開放，對 LGBTQ+ 及外國人包容度高'],
    cons: ['住房嚴重短缺，特別是阿姆斯特丹', '薪資雖高但生活成本也高', '冬季仍偏灰暗，日照不足'],
    timeToJob: '3–4 週',
    avgRent: '€800–1,400/月',
    mentalRisk: '中（冬季需注意）',
    score: 72,
    summary: '荷蘭的開放文化和英語環境讓適應門檻低，單車文化對你的運動習慣是加分。但阿姆斯特丹的租屋困難是實際挑戰，需提早規劃。',
  },
  捷克: {
    flag: '🇨🇿',
    icon: 'Building2',
    tagline: '隱藏版歐洲，CP值最高的體驗場。',
    fee: '約 NT$3,500',
    duration: '3 個月前申請',
    bank: 'Air Bank, Moneta, Revolut CZ',
    housing: 'Bezrealitky.cz, Sreality.cz',
    jobs: 'Jobs.cz, Prace.cz, LinkedIn CZ',
    sunLevel: '中（四季分明）',
    sunScore: 3,
    theme: 'linear-gradient(135deg, #dc2626 0%, #1d4ed8 50%, #f5f5f5 100%)',
    accentBg: 'bg-red-50',
    accentText: 'text-red-700',
    accentBorder: 'border-red-100',
    navActive: 'bg-red-100 text-red-800',
    scoreBg: 'bg-red-600',
    pros: ['生活成本全列表最低，省錢最快', '布拉格文化底蘊深厚，生活品質高', '台灣人少，獨特的人生體驗'],
    cons: ['捷克語門檻高，英語不如西歐普及', '工作機會相對少，找工難度較高', '台灣社群資源少，初期較孤獨'],
    timeToJob: '6–10 週',
    avgRent: 'CZK 12,000–18,000/月',
    mentalRisk: '中（需自律維持社群連結）',
    score: 68,
    summary: '捷克適合喜歡「非主流體驗」的人。低生活成本讓財務壓力小，但英語障礙和台灣社群資源稀少，孤獨感是真實風險——對你需要定期社交充電的特質是挑戰。',
  },
  法國: {
    flag: '🇫🇷',
    icon: 'MapPin',
    tagline: '藝術與生活的完美平衡，但現實磨人。',
    fee: '€99',
    duration: '4–6 個月前申請',
    bank: 'BNP Paribas, Crédit Agricole, N26',
    housing: 'SeLoger, LeBonCoin, PAP.fr',
    jobs: 'Indeed FR, LinkedIn FR, Pôle emploi',
    sunLevel: '中（南法高，巴黎中低）',
    sunScore: 3,
    theme: 'linear-gradient(135deg, #1d4ed8 0%, #f5f5f5 45%, #dc2626 100%)',
    accentBg: 'bg-cyan-50',
    accentText: 'text-cyan-700',
    accentBorder: 'border-cyan-200',
    navActive: 'bg-cyan-100 text-cyan-800',
    scoreBg: 'bg-cyan-600',
    pros: ['申請費全列表最低（€99）', '南法日照充足，適合怕抑鬱者', '飲食文化世界頂尖，生活美感極高'],
    cons: ['法語必要，英語接受度低', '官僚體系複雜，辦事效率低', '巴黎治安分區差距大，需謹慎選址'],
    timeToJob: '5–8 週',
    avgRent: '€700–1,200/月',
    mentalRisk: '中低（南法佳，巴黎中）',
    score: 70,
    summary: '法國的美感生活和低廉申請費是亮點。南法（普羅旺斯、尼斯一帶）日照充足，對你的心理健康有正向效果。主要障礙是語言——若法語程度弱，融入和找工都會很吃力。',
  },
  比利時: {
    flag: '🇧🇪',
    icon: 'Beer',
    tagline: '巧克力、啤酒與低調的歐洲核心。',
    fee: '€180',
    duration: '4 個月前申請',
    bank: 'BNP Paribas BE, ING BE, Belfius',
    housing: 'Immoweb.be, Logic-immo.be',
    jobs: 'Stepstone BE, VDAB, LinkedIn BE',
    sunLevel: '中低（冬季陰雨）',
    sunScore: 2,
    theme: 'linear-gradient(135deg, #1a1a1a 0%, #f59e0b 50%, #dc2626 100%)',
    accentBg: 'bg-yellow-50',
    accentText: 'text-yellow-700',
    accentBorder: 'border-yellow-200',
    navActive: 'bg-yellow-100 text-yellow-800',
    scoreBg: 'bg-yellow-500',
    pros: ['地理位置絕佳，可快速往返歐洲多國', '法語＋荷蘭語雙語環境，語言學習機會多', '美食（巧克力/啤酒/薯條）文化豐富'],
    cons: ['冬季陰暗偏長，日照不足', '工作市場競爭激烈，外籍人士劣勢明顯', '布魯塞爾生活成本高'],
    timeToJob: '5–8 週',
    avgRent: '€700–1,100/月',
    mentalRisk: '中（冬季需注意日照）',
    score: 63,
    summary: '比利時的歐洲中心位置讓旅行便利，但它在本列表中很難找到突出優勢——日照中低、工作難找、語言要求高。適合已有歐洲工作人脈或對比利時文化有特殊情感者。',
  },
}

/* ─────────────────────────────────────────────
   SUN INDICATOR
───────────────────────────────────────────── */
function SunIndicator({ score }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${i <= score ? 'bg-amber-400' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SCORE BAR
───────────────────────────────────────────── */
function ScoreBar({ score, color = 'bg-blue-500' }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full score-bar`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────
   COUNTRY DASHBOARD
───────────────────────────────────────────── */
function CountryDashboard({ name, data }) {
  const IconComponent = IconMap[data.icon] || Globe;

  return (
    <div className="fade-slide-in">
      {/* Banner */}
      <div
        className="relative rounded-[32px] overflow-hidden mb-8 p-10 text-white shadow-neu-extruded"
        style={{ background: data.theme, minHeight: 200 }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{data.flag}</span>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-neu-inset">
              <IconComponent className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-5xl font-display font-black mb-2">{name}</h2>
          <p className="text-lg font-medium opacity-90 italic">"{data.tagline}"</p>
        </div>
        {/* Score badge */}
        <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-sm shadow-neu-inset rounded-2xl p-4 text-center">
          <div className="text-xs font-black uppercase opacity-80 mb-1">決策得分</div>
          <div className="text-4xl font-display font-black">{data.score}</div>
          <div className="text-xs opacity-70">/ 100</div>
        </div>
      </div>

      {/* Cards row 1 - quick facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
        {[
          { label: '簽證費', value: data.fee, icon: <Banknote className="w-4 h-4" /> },
          { label: '申請時程', value: data.duration, icon: <Clock className="w-4 h-4" /> },
          { label: '平均租金', value: data.avgRent ?? '詳見下方', icon: <Home className="w-4 h-4" /> },
          { label: '平均找工', value: data.timeToJob ?? '3–5 週', icon: <Briefcase className="w-4 h-4" /> },
          { label: '日照等級', value: <SunIndicator score={data.sunScore} />, icon: <Sun className="w-4 h-4" /> },
          { label: '抑鬱風險', value: data.mentalRisk, icon: <AlertCircle className="w-4 h-4" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="neu-card p-4">
            <div className="flex items-center gap-1 text-xs font-black uppercase mb-2 text-neu-muted">
              {icon}{label}
            </div>
            <div className="text-sm font-bold text-neu-text">{value}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="neu-well mb-8">
        <div className="text-xs font-black text-neu-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-neu-accent" />
          AI 深度語義摘要
        </div>
        <p className="text-xl font-semibold text-neu-text leading-relaxed">
          "{data.summary}"
        </p>
      </div>

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="neu-card p-7">
          <h4 className="font-black text-neu-success mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
            <CheckCircle2 className="w-5 h-5" /> 優勢 Pros
          </h4>
          <div className="space-y-3">
            {(data.pros || []).map((p, idx) => (
              <div key={idx} className="flex items-start gap-3 shadow-neu-inset-sm bg-neu-bg rounded-xl p-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neu-success mt-2 shrink-0" />
                <span className="text-sm font-semibold text-neu-text">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card p-7">
          <h4 className="font-black text-rose-500 mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
            <AlertCircle className="w-5 h-5" /> 劣勢 Cons
          </h4>
          <div className="space-y-3">
            {(data.cons || []).map((c, idx) => (
              <div key={idx} className="flex items-start gap-3 shadow-neu-inset-sm bg-neu-bg rounded-xl p-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                <span className="text-sm font-semibold text-neu-text">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mental health alert for low-sun countries */}
      {data.sunScore <= 2 && (
        <div className="neu-well flex gap-4 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
          <CloudRain className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-amber-600 text-sm">⚠️ 心理健康警告</span>
            <p className="text-sm text-neu-text mt-1">
              此國家冬季日照嚴重不足，對有季節性憂鬱傾向者風險偏高。
              若仍選擇前往，建議備齊 SAD 燈箱、維生素 D 補充，並在啟程前建立心理支持網絡。
            </p>
          </div>
        </div>
      )}

      {/* Tools & resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="neu-card p-7">
          <h4 className="font-black text-neu-text mb-5 flex items-center gap-2 text-sm uppercase">
            <div className="neu-icon-well"><CreditCard className="w-4 h-4 text-neu-accent" /></div> 數位金融
          </h4>
          <div className="space-y-3">
            {(data.bank || '請查閱相關文章').split(',').map((b, idx) => (
              <div key={idx} className="flex items-center gap-3 shadow-neu-inset-sm rounded-xl p-3">
                <span className="text-sm font-semibold text-neu-text">{b.trim()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card p-7">
          <h4 className="font-black text-neu-text mb-5 flex items-center gap-2 text-sm uppercase">
            <div className="neu-icon-well"><Home className="w-4 h-4 text-neu-accent" /></div> 找房平台
          </h4>
          <div className="space-y-3">
            {(data.housing || '請查閱相關文章').split(',').map((h, idx) => (
              <div key={idx} className="p-3 shadow-neu-inset-sm rounded-xl text-sm font-semibold text-neu-text">
                {h.trim()}
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card p-7">
          <h4 className="font-black text-neu-text mb-5 flex items-center gap-2 text-sm uppercase">
            <div className="neu-icon-well"><Briefcase className="w-4 h-4 text-neu-accent" /></div> 求職管道
          </h4>
          <div className="space-y-3">
            {(data.jobs || '請查閱相關文章').split(',').map((j, idx) => (
              <div key={idx} className="p-3 shadow-neu-inset-sm rounded-xl text-sm font-semibold text-neu-text">
                {j.trim()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analyzed articles placeholder */}
      {data.articles?.length > 0 && (
        <div className="mt-8">
          <h4 className="font-black text-neu-text mb-4 flex items-center gap-2">
            <div className="neu-icon-well p-2"><MessageSquare className="w-4 h-4 text-neu-accent" /></div> 爬取文章摘要
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.articles.map((a, i) => (
              <div key={i} className="neu-well">
                <div className="text-xs font-black text-neu-muted mb-2">已分析 {a.commentCount} 則留言</div>
                <h5 className="font-bold text-sm mb-2 text-neu-text">{a.title}</h5>
                <p className="text-xs text-neu-muted line-clamp-3">{a.excerpt}</p>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-neu-accent font-semibold mt-3 inline-block hover:underline">查看原文 →</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SUMMARY PAGE
───────────────────────────────────────────── */
function SummaryPage({ countriesData }) {
  const ranked = useMemo(() => {
    return Object.keys(countriesData)
      .map(name => ({ name, ...countriesData[name] }))
      .sort((a, b) => b.score - a.score)
  }, [countriesData])

  const top = ranked[0]

  return (
    <div className="fade-slide-in">
      {/* AI Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 neu-card p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-neu-accent" />
          <div className="text-xs font-black text-neu-muted uppercase tracking-widest mb-4">✦ AI 個人化決策推薦</div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-7xl">{top.flag}</span>
            <h3 className="text-6xl font-display font-black text-neu-accent">{top.name}</h3>
          </div>
          <p className="text-lg text-neu-text leading-relaxed mb-6">
            綜合你對日照、寒濕體質、運動需求與社交平衡的偏好，<strong>{top.name}</strong>是目前數據中最符合你需求的「人生測試場」。
            {top.name === '澳洲' && ' 乾燥充沛的陽光直接對應你最核心的抑鬱預防需求，農場工機會讓財務壓力可控，完善的運動設施支持你的 HYROX/重訓習慣。'}
          </p>
          <div className="neu-icon-well bg-neu-bg p-4 flex gap-3 text-left items-start">
            <CloudRain className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-neu-text">
              <span className="font-black">心理健康提醒：</span>
              英國與愛爾蘭冬季日照嚴重不足，對有季節性憂鬱傾向者風險偏高，建議暫不列為優先考量。
            </p>
          </div>
        </div>

        {/* Score board */}
        <div className="neu-well">
          <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-neu-text">
            <BarChart3 className="w-5 h-5 text-neu-accent" />各國決策得分
          </h3>
          <div className="space-y-5">
            {ranked.map((c, i) => (
              <div key={c.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold flex items-center gap-2 text-neu-text">
                    <span>{c.flag}</span>{c.name}
                    {i === 0 && <span className="text-xs text-neu-accent shadow-neu-inset-sm px-2 py-0.5 rounded-full font-black">TOP</span>}
                  </span>
                  <span className="text-xl font-display font-black text-neu-text">{c.score}</span>
                </div>
                <ScoreBar score={c.score} color={i === 0 ? 'bg-neu-accent' : 'bg-neu-muted'} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country cards grid */}
      <h3 className="text-xl font-display font-black text-neu-text mb-5">各國快速比較</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {ranked.map(c => (
          <div
            key={c.name}
            className="neu-card p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{c.flag}</span>
                <span className="font-display font-black text-xl text-neu-text">{c.name}</span>
              </div>
              <span className="text-3xl font-display font-black text-neu-text opacity-50">{c.score}</span>
            </div>
            <div className="mb-4">
              <ScoreBar score={c.score} color={ranked[0].name === c.name ? 'bg-neu-accent' : 'bg-neu-muted'} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4 text-amber-500" />
              <SunIndicator score={c.sunScore} />
            </div>
            <p className="text-sm text-neu-muted line-clamp-2 italic flex-grow">"{c.tagline}"</p>
            <div className="mt-4 pt-4 flex justify-between text-xs font-bold text-neu-muted border-t border-black/5">
              <span>簽證費 {c.fee}</span>
              <span className={c.sunScore <= 2 ? 'text-rose-500' : 'text-neu-success'}>
                抑鬱風險 {c.mentalRisk}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   URL INPUT PANEL
───────────────────────────────────────────── */
function URLInputPanel({ urls, setUrls, loading, analysisComplete, queue, onAnalyze }) {
  return (
    <section className="mb-10">
      <div className="neu-well">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-display font-black text-neu-text">批次網址深度探勘</h2>
            <p className="text-sm text-neu-muted mt-1">
              貼入 Dcard、Threads、PTT 討論串連結（一行一個）
            </p>
          </div>
          {queue.length > 0 && (
            <div className="flex gap-1.5 pt-1">
              {queue.map((q, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${q.status === 'done' ? 'bg-neu-accent' : 'bg-neu-muted pulse-dot'}`}
                />
              ))}
            </div>
          )}
        </div>

        <textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          placeholder={"https://www.dcard.tw/f/whv/p/12345\nhttps://www.ptt.cc/bbs/WHV/...\nhttps://www.threads.net/..."}
          className="w-full h-36 p-5 neu-input mt-5 mb-4 resize-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-neu-muted font-bold">
            {urls.split('\n').filter(u => u.trim()).length} 個網址待分析
          </span>
          <button
            onClick={onAnalyze}
            disabled={loading || !urls.trim()}
            className={`px-8 py-3.5 flex items-center gap-3 ${analysisComplete ? 'bg-neu-success text-white neu-button' : 'neu-button-primary'}`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />分析中...</>
            ) : analysisComplete ? (
              <><CheckCircle2 className="w-5 h-5" />探勘完畢</>
            ) : (
              <>執行深度探勘<ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  const [countriesData, setCountriesData] = useState(INITIAL_COUNTRIES)
  const [analysisResultModal, setAnalysisResultModal] = useState(null)
  const [queue, setQueue] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Firebase Load
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'whv', 'main_countries'))
        if (docSnap.exists()) {
          setCountriesData(docSnap.data())
        } else {
          // 初始化時儲存基準資料到 Firebase
          await setDoc(doc(db, 'whv', 'main_countries'), INITIAL_COUNTRIES)
        }
      } catch (err) {
        console.error("Firebase init error:", err)
      }
    }
    loadFromDB()
  }, [])

  const handleAnalyze = async () => {
    // 過濾空白並「去除重複的網址」，避免浪費時間重複爬取
    const rawUrls = urls.split('\n').filter(u => u.trim())
    const urlList = Array.from(new Set(rawUrls))
    if (!urlList.length) return

    setLoading(true)
    setAnalysisComplete(false)
    setQueue(urlList.map(url => ({ url, status: 'pending' })))

    let i = 0
    const tick = setInterval(() => {
      if (i < urlList.length) {
        setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'done' } : q))
        i++
      }
    }, 1000)

    try {
      // 自動判斷要打本機後端還是雲端後端
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList })
      })
      const data = await response.json()
      clearInterval(tick)
      setQueue(prev => prev.map(q => ({ ...q, status: 'done' })))

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.analyzedData) {
        setCountriesData(prev => {
          const next = { ...prev }
          Object.entries(data.analyzedData).forEach(([cName, cData]) => {
            if (!next[cName]) {
              next[cName] = {
                flag: cData.flag || '🏳️',
                icon: 'Globe',
                tagline: cData.summary || 'AI 動態新增的國家',
                fee: '依當地規定',
                duration: '請查詢官方資訊',
                bank: '請查閱相關文章',
                housing: '請查閱相關文章',
                jobs: '請查閱相關文章',
                sunLevel: '未知',
                sunScore: 3,
                theme: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
                accentBg: 'bg-gray-50',
                accentText: 'text-gray-700',
                accentBorder: 'border-gray-200',
                navActive: 'bg-gray-100 text-gray-800',
                scoreBg: 'bg-gray-500',
                pros: cData.pros || [],
                cons: cData.cons || [],
                timeToJob: '未知',
                avgRent: '未知',
                mentalRisk: '未知',
                score: cData.score || 50,
                summary: cData.summary || '',
                articles: cData.articles || []
              }
            } else {
              // 如果國家已經存在（例如澳洲），我們保留原本的客觀資訊，
              // 但用 AI 最新爬取的論點覆蓋（或補充）優缺點與分數
              next[cName] = {
                ...next[cName],
                score: cData.score || next[cName].score,
                // 將 AI 的新優點合併進去，並排除重複
                pros: Array.from(new Set([...cData.pros, ...next[cName].pros])).slice(0, 5), 
                cons: Array.from(new Set([...cData.cons, ...next[cName].cons])).slice(0, 5),
                // 如果 AI 有給出新的結論，加上一個標記
                summary: cData.summary ? `[最新探勘] ${cData.summary}` : next[cName].summary,
                articles: [...(next[cName].articles || []), ...(cData.articles || [])]
              }
            }
          })

          // Save to Firebase immediately after merging
          setDoc(doc(db, 'whv', 'main_countries'), next).catch(err => {
            console.error("Firebase save error:", err)
          });

          return next
        })
        
        // Show success modal
        setAnalysisResultModal({
          count: Object.keys(data.analyzedData).length,
          countries: Object.keys(data.analyzedData)
        })
      }
    } catch (error) {
      console.error(error)
      alert('分析失敗：' + error.message)
    } finally {
      clearInterval(tick)
      setLoading(false)
      setAnalysisComplete(true)
      setTimeout(() => setAnalysisComplete(false), 3000)
    }
  }

  const countryNames = Object.keys(countriesData)
  const tabs = ['summary', ...countryNames]

  return (
    <div className="min-h-screen bg-neu-bg text-neu-text font-body">
      {/* ── HEADER ── */}
      <header className="bg-neu-bg sticky top-0 z-30 shadow-neu-extruded-sm mb-8">
        <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0 neu-icon-well p-2">
            <div className="bg-neu-text p-2 rounded-xl">
              <Globe className="text-neu-bg w-5 h-5" />
            </div>
            <div className="leading-none pr-2">
              <div className="text-xs font-black text-neu-muted uppercase tracking-widest">LIFE BETA TEST</div>
              <div className="text-base font-display font-black text-neu-text">打工度假決策儀表板</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex gap-2 overflow-x-auto no-scrollbar flex-1 justify-center p-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap ${activeTab === tab
                  ? 'shadow-neu-inset text-neu-accent bg-neu-bg'
                  : 'text-neu-muted hover:text-neu-text hover:shadow-neu-extruded-sm bg-neu-bg'
                  }`}
              >
                {tab === 'summary' ? '✦ 總結推薦' : `${countriesData[tab].flag} ${tab}`}
              </button>
            ))}
          </nav>

          {/* Mental health badge */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 shadow-neu-inset rounded-full shrink-0">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black text-amber-700 uppercase">優先日照健康</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-xl bg-gray-100"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMobileMenuOpen(false) }}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-gray-500 bg-gray-50'
                  }`}
              >
                {tab === 'summary' ? '✦ 總結推薦' : `${countriesData[tab].flag} ${tab}`}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <URLInputPanel
          urls={urls}
          setUrls={setUrls}
          loading={loading}
          analysisComplete={analysisComplete}
          queue={queue}
          onAnalyze={handleAnalyze}
        />

        {/* Summary tab */}
        {activeTab === 'summary' && (
          <SummaryPage countriesData={countriesData} />
        )}

        {/* Country tabs */}
        {activeTab !== 'summary' && countriesData[activeTab] && (
          <CountryDashboard
            name={activeTab}
            data={countriesData[activeTab]}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-4 py-8 text-center text-xs text-gray-400">
        LIFE BETA TEST · 打工度假決策支援系統 v1.1 · 數據僅供參考，請結合個人判斷
      </footer>

      {/* Analysis Result Modal */}
      {analysisResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-slide-in">
          <div className="neu-card p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-neu-success/20 text-neu-success rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-black text-neu-text mb-2">探勘與分析完成！</h3>
            <p className="text-neu-muted mb-6">
              AI 成功分析了網址內容，並整理出 <strong>{analysisResultModal.count}</strong> 個國家的相關情報（包含最新文章摘要）。
              <br/><br/>
              探勘到的國家：{analysisResultModal.countries.join(', ')}
            </p>
            <button
              onClick={() => setAnalysisResultModal(null)}
              className="neu-button-primary w-full py-4 text-lg"
            >
              我知道了，查看結果
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
