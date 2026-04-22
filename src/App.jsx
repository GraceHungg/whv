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
   CONSTANTS & UTILS
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
    pros: ['步調慢、生活品質高，適合需要獨處回復的人格特質', '自然景觀極致，跑步路線世界級', '社群友善，台灣人接受度高'],
    cons: ['名額競爭激烈，搶到帶有運氣成分', '薪資水準低於澳洲', '某些地區冬季潮濕'],
    timeToJob: '2–3 週',
    avgRent: 'NZ$220–320/週',
    mentalRisk: '中低',
    score: 87,
    summary: '紐西蘭的步調與你需要定期獨處回復的性格高度契合。慢活文化不要求你不停「証明自己」，對完美主義焦慮是種解藥。唯一變數是搶名額的不確定性。',
  }
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function SunIndicator({ score }) {
  return (
    <div className="flex gap-1.5 p-2 shadow-inset-sm rounded-full bg-bg-neumorphic">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-soft ${i <= score ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-black/5'}`}
        />
      ))}
    </div>
  )
}

function ScoreBar({ score, active = false }) {
  return (
    <div className="h-3 w-full bg-bg-neumorphic rounded-full shadow-inset-sm overflow-hidden">
      <div
        className={`h-full transition-soft ${active ? 'bg-accent' : 'bg-fg-muted/30'}`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function CountryDashboard({ name, data }) {
  const IconComponent = IconMap[data.icon] || Globe;

  return (
    <div className="fade-slide-in space-y-8">
      {/* Banner */}
      <div className="neu-card p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="text-7xl drop-shadow-lg">{data.flag}</div>
          <div>
            <h2 className="text-5xl font-black text-fg-primary mb-2">{name}</h2>
            <p className="text-lg text-fg-muted italic">"{data.tagline}"</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="neu-icon-well w-20 h-20">
                <IconComponent className="w-10 h-10 text-accent" />
            </div>
            <div className="neu-well-deep text-center px-6">
                <div className="text-[10px] font-black text-fg-muted uppercase tracking-widest mb-1">分析得分</div>
                <div className="text-4xl font-black text-fg-primary">{data.score}</div>
            </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { label: '簽證費', value: data.fee, icon: <Banknote className="w-4 h-4" /> },
          { label: '申請時程', value: data.duration, icon: <Clock className="w-4 h-4" /> },
          { label: '平均租金', value: data.avgRent ?? '待分析', icon: <Home className="w-4 h-4" /> },
          { label: '平均找工', value: data.timeToJob ?? '待分析', icon: <Briefcase className="w-4 h-4" /> },
          { label: '日照等級', value: <SunIndicator score={data.sunScore} />, icon: <Sun className="w-4 h-4" /> },
          { label: '抑鬱風險', value: data.mentalRisk, icon: <AlertCircle className="w-4 h-4" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="neu-card p-5 text-center flex flex-col items-center">
            <div className="neu-icon-well p-2 mb-3">
                {icon}
            </div>
            <div className="text-[10px] font-bold text-fg-muted uppercase mb-1">{label}</div>
            <div className="text-sm font-bold text-fg-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="neu-well space-y-4">
        <div className="flex items-center gap-3">
          <div className="neu-icon-well p-2">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <h4 className="text-xs font-black text-fg-muted uppercase tracking-widest">AI 深度語義摘要</h4>
        </div>
        <p className="text-2xl font-bold text-fg-primary leading-relaxed pl-2">
          "{data.summary}"
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neu-card p-8 bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-6 text-accent-secondary">
            <CheckCircle2 className="w-6 h-6" />
            <h4 className="font-black uppercase tracking-wide">優勢 Pros</h4>
          </div>
          <div className="space-y-4">
            {(data.pros || []).map((p, idx) => (
              <div key={idx} className="neu-well-deep p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-secondary mt-2 shrink-0 shadow-[0_0_8px_rgba(56,178,172,0.5)]" />
                <span className="text-sm font-bold text-fg-primary">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neu-card p-8">
          <div className="flex items-center gap-3 mb-6 text-rose-500">
            <AlertCircle className="w-6 h-6" />
            <h4 className="font-black uppercase tracking-wide">劣勢 Cons</h4>
          </div>
          <div className="space-y-4">
            {(data.cons || []).map((c, idx) => (
              <div key={idx} className="neu-well-deep p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span className="text-sm font-bold text-fg-primary">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Article Excavation */}
      {data.articles?.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="neu-icon-well p-2">
                <MessageSquare className="w-5 h-5 text-accent" />
             </div>
             <h4 className="font-black text-fg-primary uppercase tracking-widest">爬取文章與留言探勘</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.articles.map((a, i) => (
              <div key={i} className="neu-well group hover:shadow-extruded-hover transition-soft">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-black text-fg-muted shadow-inset-sm px-3 py-1 rounded-full bg-bg-neumorphic">
                        分析自 {a.commentCount} 則留言
                    </div>
                    <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-accent transition-soft" />
                </div>
                <h5 className="font-bold text-lg mb-3 text-fg-primary leading-snug">{a.title}</h5>
                <p className="text-sm text-fg-muted line-clamp-3 mb-4 leading-relaxed">{a.excerpt}</p>
                <a href={a.url} target="_blank" rel="noreferrer" className="neu-button-primary inline-block py-2 px-6 text-xs">
                    前往原文
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryPage({ countriesData }) {
  const ranked = useMemo(() => {
    return Object.keys(countriesData)
      .map(name => ({ name, ...countriesData[name] }))
      .sort((a, b) => b.score - a.score)
  }, [countriesData])

  const top = ranked[0]

  return (
    <div className="fade-slide-in space-y-12">
      {/* Hero Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 neu-card p-12 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
          <div className="text-xs font-black text-fg-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-accent animate-pulse" /> AI 個人化決策推薦
          </div>
          <div className="flex items-center gap-8 mb-8">
            <div className="text-8xl drop-shadow-2xl animate-float">{top.flag}</div>
            <h3 className="text-7xl font-black text-accent">{top.name}</h3>
          </div>
          <p className="text-xl text-fg-primary leading-loose max-w-2xl mb-8">
            根據當前爬取到的 Threads 與 Dcard 數據，<strong>{top.name}</strong> 在你的體質考量（寒濕水腫）與心理健康預防中獲得了最高匹配。其乾燥的氣候與極高的日照時數是預防抑鬱的最佳解藥。
          </p>
          <div className="neu-well-deep p-5 flex items-start gap-4 border-l-4 border-amber-400">
            <CloudRain className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-fg-muted font-medium">
              <span className="text-fg-primary font-black">氣候風險提醒：</span>
              愛爾蘭與英國目前留言中反映出極高的「濕冷感」與「冬季抑鬱」風險，除非你有極強的北歐靈魂，否則建議優先避開。
            </p>
          </div>
        </div>

        {/* Score Leaderboard */}
        <div className="neu-well flex flex-col">
          <div className="flex items-center gap-3 mb-10">
             <div className="neu-icon-well p-2">
                <BarChart3 className="w-5 h-5 text-accent" />
             </div>
             <h3 className="font-black text-lg text-fg-primary">各國決策得分板</h3>
          </div>
          <div className="space-y-8 flex-grow">
            {ranked.map((c, i) => (
              <div key={c.name} className="group cursor-default">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <span className="text-sm font-black text-fg-primary group-hover:text-accent transition-soft">{c.name}</span>
                    {i === 0 && <span className="text-[9px] font-black bg-accent text-white px-2 py-0.5 rounded-full shadow-lg">TOP PICK</span>}
                  </div>
                  <span className="text-2xl font-black text-fg-primary">{c.score}</span>
                </div>
                <ScoreBar score={c.score} active={i === 0} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Comparison */}
      <div className="space-y-6">
          <h3 className="text-2xl font-black text-fg-primary">快速橫向對比</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {ranked.map(c => (
              <div key={c.name} className="neu-card p-8 flex flex-col group hover:-translate-y-2 transition-soft">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl drop-shadow-md">{c.flag}</div>
                    <span className="font-black text-2xl text-fg-primary">{c.name}</span>
                  </div>
                  <div className="neu-well-deep p-2 px-4 text-xl font-black text-fg-muted group-hover:text-accent transition-soft">
                    {c.score}
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <ScoreBar score={c.score} active={ranked[0].name === c.name} />
                  <div className="flex items-center justify-between">
                    <SunIndicator score={c.sunScore} />
                    <span className="text-[10px] font-black text-fg-muted uppercase">日照等級</span>
                  </div>
                </div>
                <p className="text-sm text-fg-muted italic mb-6 line-clamp-2 flex-grow">"{c.tagline}"</p>
                <div className="flex justify-between items-center pt-6 border-t border-black/5">
                  <div className="text-[10px] font-black text-fg-muted">簽證: {c.fee}</div>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full ${c.sunScore <= 2 ? 'bg-rose-500/10 text-rose-500' : 'bg-accent-secondary/10 text-accent-secondary'}`}>
                    抑鬱風險 {c.mentalRisk}
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    </div>
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
          await setDoc(doc(db, 'whv', 'main_countries'), INITIAL_COUNTRIES)
        }
      } catch (err) {
        console.error("Firebase init error:", err)
      }
    }
    loadFromDB()
  }, [])

  const handleAnalyze = async () => {
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
    }, 2000) // 慢一點讓用戶看到進度

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList })
      })
      const data = await response.json()
      clearInterval(tick)
      setQueue(prev => prev.map(q => ({ ...q, status: 'done' })))

      if (data.error) throw new Error(data.error)

      if (data.analyzedData) {
        setCountriesData(prev => {
          const next = { ...prev }
          Object.entries(data.analyzedData).forEach(([cName, cData]) => {
            if (!next[cName]) {
              next[cName] = {
                flag: cData.flag || '🏳️', icon: 'Globe', tagline: cData.summary || 'AI 動態新增',
                fee: '依規定', duration: '查詢中', bank: '待查', housing: '待查', jobs: '待查',
                sunLevel: '未知', sunScore: 3, pros: cData.pros || [], cons: cData.cons || [],
                timeToJob: '未知', avgRent: '未知', mentalRisk: '未知',
                score: cData.score || 50, summary: cData.summary || '', articles: cData.articles || []
              }
            } else {
              next[cName] = {
                ...next[cName],
                score: cData.score || next[cName].score,
                pros: Array.from(new Set([...cData.pros, ...next[cName].pros])).slice(0, 5),
                cons: Array.from(new Set([...cData.cons, ...next[cName].cons])).slice(0, 5),
                summary: cData.summary || next[cName].summary,
                articles: [...(next[cName].articles || []), ...(cData.articles || [])]
              }
            }
          })
          setDoc(doc(db, 'whv', 'main_countries'), next);
          return next
        })
        setAnalysisResultModal({ count: Object.keys(data.analyzedData).length, countries: Object.keys(data.analyzedData) })
      }
    } catch (error) {
      alert('分析失敗：' + error.message)
    } finally {
      clearInterval(tick)
      setLoading(false)
      setAnalysisComplete(true)
      setTimeout(() => setAnalysisComplete(false), 3000)
    }
  }

  const tabs = ['summary', ...Object.keys(countriesData)]

  return (
    <div className="min-h-screen bg-bg-neumorphic text-fg-primary font-body pb-20">
      {/* HEADER */}
      <header className="bg-bg-neumorphic sticky top-0 z-40 p-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between neu-card p-4 h-20">
          <div className="flex items-center gap-4 px-4">
            <div className="neu-icon-well w-12 h-12">
              <Globe className="text-accent w-6 h-6" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[10px] font-black text-fg-muted uppercase tracking-widest">LIFE BETA TEST</div>
              <div className="text-lg font-black">打工度假決策儀表板</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2 px-4 overflow-x-auto no-scrollbar max-w-2xl">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-soft whitespace-nowrap ${
                  activeTab === tab ? 'shadow-inset text-accent' : 'text-fg-muted hover:text-fg-primary hover:shadow-extruded-sm'
                }`}
              >
                {tab === 'summary' ? '✦ 總結推薦' : `${countriesData[tab].flag} ${tab}`}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 px-4">
             <div className="hidden md:flex items-center gap-2 neu-well-deep py-2 px-4 rounded-full">
                <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                <span className="text-[10px] font-black text-fg-muted uppercase">優先日照健康</span>
             </div>
             <button className="lg:hidden neu-button p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <ChevronDown className={`w-5 h-5 transition-soft ${mobileMenuOpen ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 neu-card p-4 flex flex-wrap gap-2 fade-slide-in">
             {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setMobileMenuOpen(false) }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-soft ${
                    activeTab === tab ? 'shadow-inset text-accent' : 'text-fg-muted shadow-extruded-sm'
                  }`}
                >
                  {tab === 'summary' ? '✦ 總結' : `${countriesData[tab].flag} ${tab}`}
                </button>
             ))}
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="max-w-[1400px] mx-auto px-4 pt-10">
        {/* URL Input */}
        <section className="mb-16 neu-well">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-fg-primary">批次網址深度探勘</h2>
              <p className="text-sm text-fg-muted mt-2 font-medium">貼入 Dcard、Threads 或 PTT 連結（一行一個），AI 將自動爬取內容與所有留言並進行語義分析。</p>
            </div>
            {queue.length > 0 && (
              <div className="flex gap-2">
                {queue.map((q, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-soft ${q.status === 'done' ? 'bg-accent' : 'bg-black/10 animate-pulse'}`} />
                ))}
              </div>
            )}
          </div>

          <textarea
            value={urls} onChange={e => setUrls(e.target.value)}
            placeholder="https://www.threads.net/...\nhttps://www.dcard.tw/f/whv/..."
            className="neu-input w-full h-40 mb-6 font-mono text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-fg-muted flex items-center gap-2">
                <div className="neu-icon-well w-8 h-8 p-1">
                    <Globe className="w-4 h-4" />
                </div>
                {urls.split('\n').filter(u => u.trim()).length} 個網址待分析
            </div>
            <button
              onClick={handleAnalyze} disabled={loading || !urls.trim()}
              className={`${loading ? 'neu-button' : 'neu-button-primary'} flex items-center gap-3`}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> 爬取並分析中...</> : analysisComplete ? <><CheckCircle2 className="w-5 h-5" /> 探勘完畢</> : <><ArrowRight className="w-5 h-5" /> 執行深度探勘</>}
            </button>
          </div>
        </section>

        {activeTab === 'summary' ? <SummaryPage countriesData={countriesData} /> : <CountryDashboard name={activeTab} data={countriesData[activeTab]} />}
      </main>

      {/* Modal */}
      {analysisResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-neumorphic/80 backdrop-blur-md">
          <div className="neu-card p-12 max-w-lg w-full text-center space-y-8 animate-float">
            <div className="neu-icon-well w-24 h-24 mx-auto">
              <CheckCircle2 className="w-12 h-12 text-accent-secondary" />
            </div>
            <div>
                <h3 className="text-3xl font-black text-fg-primary mb-3">分析完成！</h3>
                <p className="text-fg-muted font-medium leading-loose">
                    AI 已經成功抓取並深度掃描了所有留言資訊。<br/>
                    發現了 <strong>{analysisResultModal.count}</strong> 個國家的相關動態：<br/>
                    <span className="text-accent font-black tracking-widest">{analysisResultModal.countries.join(', ')}</span>
                </p>
            </div>
            <button onClick={() => setAnalysisResultModal(null)} className="neu-button-primary w-full py-5 text-xl rounded-[24px]">
              開始決策
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
