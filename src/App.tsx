import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  Feather, 
  History, 
  Languages, 
  Moon, 
  ScrollText, 
  Sun, 
  Coffee, 
  X, 
  Compass, 
  FileCheck2, 
  Search, 
  Check, 
  Sparkles, 
  Loader2, 
  Trophy, 
  PartyPopper, 
  Target, 
  Home, 
  CheckSquare, 
  Square, 
  ArrowRight,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { generateTheologicalStudy } from './services/aiDevotionalService';
import { AuthModal } from './components/AuthModal';
import type {
  DevotionalDay,
  ThemeMode,
  CrossReference,
  ExegesisInsight,
  TheologicalLocus,
  PracticalLifeChallenge
} from './types/devotional';

export default function App() {
  // Lista de estudos salvos
  const [devotionalsList, setDevotionalsList] = useState<DevotionalDay[]>(() => {
    const saved = localStorage.getItem('kerygma_studies_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Controle de Navegação: 'home' (dashboard) ou 'reading' (leitura do estudo)
  const [viewMode, setViewMode] = useState<'home' | 'reading'>('home');
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);

  // Usuário autenticado
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('kerygma_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Estudo ativo na leitura
  const currentDevotional: DevotionalDay | undefined = useMemo(() => {
    return devotionalsList.find(d => d.id === activeStudyId) || devotionalsList[0];
  }, [devotionalsList, activeStudyId]);

  // Aparência e preferências
  const [theme, setTheme] = useState<ThemeMode>('sepia');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  
  // Barra de progresso de scroll
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Modal de celebração e conclusão
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Modal de histórico e busca
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocus, setSelectedLocus] = useState<string>('Todos');
  const [filterOnlyBookmarks, setFilterOnlyBookmarks] = useState<boolean>(false);
  
  // Geração de estudo
  const [customPassageInput, setCustomPassageInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Seções expansíveis
  const [showExegesis, setShowExegesis] = useState<boolean>(true);
  const [showConfessions, setShowConfessions] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  
  // Diário
  const [userNote, setUserNote] = useState<string>('');
  const [savedNoteStatus, setSavedNoteStatus] = useState<boolean>(false);

  // Desafios práticos marcados como concluídos
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});

  // Detecta se já existe o estudo de hoje
  const todayIso = new Date().toISOString().split('T')[0];
  const todaysStudy = useMemo(() => {
    return devotionalsList.find(d => d.date === todayIso);
  }, [devotionalsList, todayIso]);

  // Cálculo da barra de progresso durante o scroll
  useEffect(() => {
    if (viewMode !== 'reading') return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(100);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode, currentDevotional]);

  // Carrega notas, favoritos e desafios ao selecionar um estudo
  useEffect(() => {
    if (!currentDevotional || viewMode !== 'reading') return;
    const saved = localStorage.getItem(`note_${currentDevotional.id}`);
    setUserNote(saved || '');
    const completed = localStorage.getItem(`completed_${currentDevotional.id}`);
    setIsCompleted(completed ? JSON.parse(completed) : false);
    const bookmarked = localStorage.getItem(`bookmarked_${currentDevotional.id}`);
    setIsBookmarked(bookmarked ? JSON.parse(bookmarked) : false);
    
    const savedChallenges = localStorage.getItem(`challenges_${currentDevotional.id}`);
    setCompletedChallenges(savedChallenges ? JSON.parse(savedChallenges) : {});

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setScrollProgress(0);
  }, [currentDevotional, viewMode]);

  const handleSaveNote = () => {
    if (!currentDevotional) return;
    localStorage.setItem(`note_${currentDevotional.id}`, userNote);
    setSavedNoteStatus(true);
    setTimeout(() => setSavedNoteStatus(false), 2000);
  };

  const handleToggleCompleted = () => {
    if (!currentDevotional) return;
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    localStorage.setItem(`completed_${currentDevotional.id}`, JSON.stringify(nextState));
    
    if (nextState) {
      setShowCompletionModal(true);
    }
  };

  const toggleChallenge = (index: number) => {
    if (!currentDevotional) return;
    const nextState = {
      ...completedChallenges,
      [index]: !completedChallenges[index]
    };
    setCompletedChallenges(nextState);
    localStorage.setItem(`challenges_${currentDevotional.id}`, JSON.stringify(nextState));
  };

  const toggleBookmark = () => {
    if (!currentDevotional) return;
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    localStorage.setItem(`bookmarked_${currentDevotional.id}`, JSON.stringify(nextState));
  };

  const handleGenerateStudy = async (targetPassage?: string) => {
    try {
      setIsGenerating(true);
      const newStudy = await generateTheologicalStudy(targetPassage);
      const updatedList = [newStudy, ...devotionalsList];
      setDevotionalsList(updatedList);
      localStorage.setItem('kerygma_studies_list', JSON.stringify(updatedList));
      setActiveStudyId(newStudy.id);
      setViewMode('reading');
      setCustomPassageInput('');
      setIsCalendarOpen(false);
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar o estudo agora. Tente novamente em instantes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishAndReturnHome = () => {
    setShowCompletionModal(false);
    setViewMode('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openStudy = (id: string) => {
    setActiveStudyId(id);
    setViewMode('reading');
    setIsCalendarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('kerygma_token');
    localStorage.removeItem('kerygma_user');
    setCurrentUser(null);
  };

  const availableLoci = useMemo(() => {
    const set = new Set<TheologicalLocus>();
    devotionalsList.forEach(d => {
      if (d.theologicalTheme?.locus) set.add(d.theologicalTheme.locus);
    });
    return ['Todos', ...Array.from(set)];
  }, [devotionalsList]);

  const filteredDevotionals = useMemo(() => {
    return devotionalsList.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.scripture?.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.scripture?.keyVerse?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocus = selectedLocus === 'Todos' || item.theologicalTheme?.locus === selectedLocus;
      const isBookmarkedItem = localStorage.getItem(`bookmarked_${item.id}`) === 'true';
      const matchesBookmark = filterOnlyBookmarks ? isBookmarkedItem : true;

      return matchesSearch && matchesLocus && matchesBookmark;
    });
  }, [searchQuery, selectedLocus, filterOnlyBookmarks, devotionalsList]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          bg: 'bg-[#FAF7F2]',
          card: 'bg-[#F2ECE1] border-[#E2D5C3]',
          cardHover: 'hover:border-[#C4B29B]',
          textPrimary: 'text-[#2C241D]',
          textSecondary: 'text-[#6B5A4B]',
          border: 'border-[#E2D5C3]',
          quoteBox: 'bg-[#EAE1D3] border-l-[#8C4A2F]',
          progressBar: 'bg-[#8C4A2F]'
        };
      case 'dark':
        return {
          bg: 'bg-[#121316]',
          card: 'bg-[#1A1C23] border-[#2A2E39]',
          cardHover: 'hover:border-[#4B5563]',
          textPrimary: 'text-[#EDEDED]',
          textSecondary: 'text-[#9CA3AF]',
          border: 'border-[#2A2E39]',
          quoteBox: 'bg-[#202430] border-l-[#3B82F6]',
          progressBar: 'bg-amber-600'
        };
      default:
        return {
          bg: 'bg-slate-50',
          card: 'bg-white border-slate-200',
          cardHover: 'hover:border-slate-400',
          textPrimary: 'text-slate-900',
          textSecondary: 'text-slate-600',
          border: 'border-slate-200',
          quoteBox: 'bg-slate-100 border-l-indigo-600',
          progressBar: 'bg-amber-700'
        };
    }
  };

  const currentTheme = getThemeClasses();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${currentTheme.bg} ${currentTheme.textPrimary}`}>
      
      {/* Barra de Progresso no modo Leitura */}
      {viewMode === 'reading' && currentDevotional && (
        <div className="fixed top-0 left-0 w-full h-1 z-50 bg-black/5 dark:bg-white/5">
          <div 
            className={`h-full transition-all duration-150 ${currentTheme.progressBar}`}
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* Cabeçalho */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${currentTheme.border} ${theme === 'dark' ? 'bg-[#121316]/90' : 'bg-white/80'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <button 
            onClick={() => setViewMode('home')}
            className="flex items-center space-x-3 text-left hover:opacity-85 transition"
            title="Voltar ao início"
          >
            <BookOpen className="w-6 h-6 text-amber-700" />
            <h1 className="font-semibold text-lg tracking-tight font-serif">Kerygma Devocional</h1>
          </button>

          <div className="flex items-center space-x-2">
            {viewMode === 'reading' && (
              <button
                onClick={() => setViewMode('home')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Início</span>
              </button>
            )}

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Estudos ({devotionalsList.length})</span>
            </button>

            {/* Alternador de Tema */}
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10">
              <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-white shadow-sm' : ''}`} title="Modo Claro">
                <Sun className="w-4 h-4 text-amber-600" />
              </button>
              <button onClick={() => setTheme('sepia')} className={`p-1.5 rounded ${theme === 'sepia' ? 'bg-[#EAE1D3] shadow-sm' : ''}`} title="Modo Sépia">
                <Coffee className="w-4 h-4 text-amber-900" />
              </button>
              <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-zinc-800 shadow-sm' : ''}`} title="Modo Escuro">
                <Moon className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {/* Tamanho da Fonte */}
            {viewMode === 'reading' && (
              <div className="hidden sm:flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10 text-xs font-semibold">
                <button onClick={() => setFontSize('sm')} className={`px-2 py-1 rounded ${fontSize === 'sm' ? 'bg-white/20' : ''}`}>A-</button>
                <button onClick={() => setFontSize('base')} className={`px-2 py-1 rounded ${fontSize === 'base' ? 'bg-white/20' : ''}`}>A</button>
                <button onClick={() => setFontSize('lg')} className={`px-2 py-1 rounded ${fontSize === 'lg' ? 'bg-white/20' : ''}`}>A+</button>
              </div>
            )}

            {/* Favorito */}
            {viewMode === 'reading' && currentDevotional && (
              <button 
                onClick={toggleBookmark} 
                className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                title="Favoritar estudo"
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
              </button>
            )}

            {/* Autenticação / Perfil */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-black/10 dark:border-white/10">
                <span className="text-xs font-semibold hidden md:inline truncate max-w-[90px]">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-500 hover:text-red-600 transition"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900 transition shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      {viewMode === 'home' && (
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
          
          {/* Card: Devocional Inteligente do Dia */}
          <section className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${currentTheme.card} relative overflow-hidden`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
              <Sparkles className="w-4 h-4" /> Devocional Inteligente do Dia
            </div>

            {todaysStudy ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono text-stone-500">Hoje &bull; {todaysStudy.theologicalTheme?.locus}</span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-1">{todaysStudy.title}</h2>
                  <p className="text-sm font-reading italic text-stone-600 dark:text-stone-300 mt-1">
                    "{todaysStudy.scripture?.keyVerse}" — {todaysStudy.scripture?.reference}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => openStudy(todaysStudy.id)}
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 transition flex items-center gap-2 shadow-md"
                  >
                    <span>Abrir Estudo de Hoje</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs flex items-center gap-1.5 text-emerald-600 font-semibold px-3 py-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4" /> Estudo do dia pronto
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif">Alimente sua mente e espírito hoje</h2>
                  <p className={`text-sm ${currentTheme.textSecondary} mt-1 leading-relaxed`}>
                    A inteligência artificial prepara um estudo novo todos os dias com exegese bíblica nos originais, teologia clássica, reflexão profunda e desafios práticos para a sua vida.
                  </p>
                </div>

                <button
                  onClick={() => handleGenerateStudy()}
                  disabled={isGenerating}
                  className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50 transition flex items-center gap-2 shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando Estudo e Desafios de Hoje...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar Devocional de Hoje</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Gerador de Estudo Sob Demanda */}
          <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-3`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              <Target className="w-4 h-4 text-amber-700" />
              <span>Ou estude uma passagem específica</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Romanos 8:1-4, Tiago 1 ou A Soberania de Deus..."
                value={customPassageInput}
                onChange={(e) => setCustomPassageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateStudy(customPassageInput);
                }}
                disabled={isGenerating}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <button
                onClick={() => handleGenerateStudy(customPassageInput)}
                disabled={isGenerating || !customPassageInput.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Estudar</span>}
              </button>
            </div>
          </section>

          {/* Estudos Salvos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Seus Estudos Salvos ({devotionalsList.length})
              </h3>
              {devotionalsList.length > 0 && (
                <button 
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>

            {devotionalsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 text-xs text-stone-400">
                Você ainda não gerou nenhum estudo. Clique em "Gerar Devocional de Hoje" para começar!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {devotionalsList.slice(0, 4).map((dev) => {
                  const isItemCompleted = localStorage.getItem(`completed_${dev.id}`) === 'true';
                  return (
                    <div
                      key={dev.id}
                      onClick={() => openStudy(dev.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${currentTheme.card} ${currentTheme.cardHover}`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span className="font-semibold text-amber-700 dark:text-amber-400">{dev.theologicalTheme?.locus}</span>
                          <span>{dev.date}</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm leading-snug">{dev.title}</h4>
                        <p className="text-xs text-stone-500 mt-1">{dev.scripture?.reference}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 dark:border-white/5 text-xs">
                        <span className="text-stone-400">Clique para abrir</span>
                        {isItemCompleted && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Concluído
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </main>
      )}

      {/* TELA DE LEITURA DO ESTUDO */}
      {viewMode === 'reading' && currentDevotional && (
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-10 animate-in fade-in duration-300">
          
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm pb-4 border-b border-black/10 dark:border-white/10">
            <button
              onClick={() => setViewMode('home')}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar ao Início
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">{currentDevotional.date}</span>
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-300">
                {currentDevotional.theologicalTheme?.locus}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
              {currentDevotional.title}
            </h2>
            <p className={`mt-2 text-base sm:text-lg ${currentTheme.textSecondary} italic font-reading`}>
              {currentDevotional.theologicalTheme?.subtitle}
            </p>
          </div>

          {/* Contexto Histórico-Redentivo */}
          {currentDevotional.historicalRedemptiveContext && (
            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-2`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <Compass className="w-4 h-4" /> Panorama & Contexto Canônico
              </div>
              <p className={`text-sm leading-relaxed ${currentTheme.textSecondary} font-reading text-justify`}>
                {currentDevotional.historicalRedemptiveContext}
              </p>
            </section>
          )}

          {/* Texto Bíblico Base */}
          <section className={`p-6 sm:p-8 rounded-2xl border shadow-sm ${currentTheme.card}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <ScrollText className="w-4 h-4" /> Texto Bíblico ({currentDevotional.scripture?.version || 'NVT'})
              </span>
              <span className="text-sm font-semibold">{currentDevotional.scripture?.reference}</span>
            </div>
            <p className="text-xl sm:text-2xl font-serif italic leading-relaxed text-amber-900 dark:text-amber-200">
              "{currentDevotional.scripture?.keyVerse}"
            </p>
            <p className={`mt-4 text-sm sm:text-base leading-relaxed ${currentTheme.textSecondary} font-reading`}>
              {currentDevotional.scripture?.fullText}
            </p>

            {currentDevotional.crossReferences?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Referências Cruzadas:</span>
                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                  {currentDevotional.crossReferences.map((ref: CrossReference, idx: number) => (
                    <div key={idx} className="text-xs p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                      <strong className="text-amber-800 dark:text-amber-300 block font-mono">{ref.ref}</strong>
                      <span className={currentTheme.textSecondary}>{ref.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Exegese nos Originais */}
          {currentDevotional.exegesisInsights?.length > 0 && (
            <section className={`rounded-2xl border overflow-hidden ${currentTheme.card}`}>
              <button 
                onClick={() => setShowExegesis(!showExegesis)}
                className="w-full p-5 flex items-center justify-between text-left font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <Languages className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <span>Vocabulário & Exegese nos Originais</span>
                </div>
                {showExegesis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showExegesis && (
                <div className="p-5 pt-0 space-y-4">
                  {currentDevotional.exegesisInsights.map((item: ExegesisInsight, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 space-y-2 border border-black/5 dark:border-white/5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xl font-bold font-serif tracking-wide text-amber-900 dark:text-amber-300">
                          {item.originalWord}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-900/10 text-amber-800 dark:text-amber-300">
                          {item.transliteration} ({item.morphology})
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                        Definição: {item.definition}
                      </p>
                      <p className={`text-sm leading-relaxed ${currentTheme.textSecondary} font-reading`}>
                        {item.exegeticalContext}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Exposição Doutrinária */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 border-b pb-2 border-black/10 dark:border-white/10">
              <Feather className="w-4 h-4" /> Exposição Doutrinária Aprofundada
            </div>

            <div className={`space-y-8 font-reading leading-relaxed ${
              fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'
            }`}>
              {currentDevotional.expositionSections?.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h4 className="text-lg sm:text-xl font-serif font-bold text-stone-800 dark:text-stone-100">
                    {section.heading}
                  </h4>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="indent-5 text-justify leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Ecos Confessionais */}
          {currentDevotional.confessionalEchoes?.length > 0 && (
            <section className={`rounded-2xl border overflow-hidden ${currentTheme.card}`}>
              <button 
                onClick={() => setShowConfessions(!showConfessions)}
                className="w-full p-5 flex items-center justify-between text-left font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <FileCheck2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <span>Ecos Confessionais & Credos Históricos</span>
                </div>
                {showConfessions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showConfessions && (
                <div className="p-5 pt-0 space-y-3">
                  {currentDevotional.confessionalEchoes.map((conf, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                        <span>{conf.confession}</span>
                        <span className="font-normal font-mono opacity-80">{conf.article}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-reading italic text-stone-700 dark:text-stone-300 pt-1">
                        "{conf.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* A Voz da História */}
          {currentDevotional.historicalNote && (
            <section className={`rounded-2xl border overflow-hidden ${currentTheme.card}`}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-5 flex items-center justify-between text-left font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <History className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  <span>A Voz dos Mestres da Igreja</span>
                </div>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHistory && (
                <div className="p-5 pt-0">
                  <div className={`p-4 rounded-xl border-l-4 ${currentTheme.quoteBox}`}>
                    <p className="italic font-serif leading-relaxed text-base">
                      "{currentDevotional.historicalNote.quote}"
                    </p>
                    <div className="mt-3 text-xs flex flex-wrap items-center justify-between gap-1 text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-amber-800 dark:text-amber-300">
                        — {currentDevotional.historicalNote.theologianOrDoc} ({currentDevotional.historicalNote.work}, c. {currentDevotional.historicalNote.dateEstimate})
                      </span>
                      <span className="uppercase tracking-wider">{currentDevotional.historicalNote.era}</span>
                    </div>
                    <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
                      {currentDevotional.historicalNote.historicalContext}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Desafios Práticos para a Vida */}
          {currentDevotional.practicalChallenges?.length > 0 && (
            <section className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${currentTheme.card} space-y-4`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                <Target className="w-4 h-4" /> Desafios Práticos para a Vida
              </div>
              <p className={`text-xs sm:text-sm ${currentTheme.textSecondary}`}>
                A teologia bíblica autêntica se manifesta em obediência real. Marque as ações conforme colocá-las em prática:
              </p>

              <div className="grid gap-3 pt-2">
                {currentDevotional.practicalChallenges.map((item: PracticalLifeChallenge, idx: number) => {
                  const isDone = !!completedChallenges[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChallenge(idx)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10'
                      }`}
                    >
                      <button className="mt-0.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                            {item.category}
                          </span>
                          <h5 className={`text-sm font-semibold ${isDone ? 'line-through text-stone-400' : ''}`}>
                            {item.title}
                          </h5>
                        </div>
                        <p className={`text-xs sm:text-sm font-reading leading-relaxed ${isDone ? 'line-through text-stone-400' : currentTheme.textSecondary}`}>
                          {item.challenge}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Meditação, Oração & Diário */}
          <section className={`p-6 sm:p-8 rounded-2xl border ${currentTheme.card} space-y-6`}>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-amber-800 dark:text-amber-300">
                Questões para Meditação Prática
              </h4>
              <ul className="space-y-3">
                {currentDevotional.meditationQuestions?.map((q: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base font-reading">
                    <span className="font-bold text-amber-700 text-lg leading-none">&bull;</span>
                    <span className={currentTheme.textSecondary}>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300 mb-2">
                Oração Guiada
              </h4>
              <p className="text-sm sm:text-base font-reading italic text-stone-700 dark:text-stone-300 leading-relaxed">
                {currentDevotional.guidedPrayer}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Meu Diário & Reflexões do Dia:
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Escreva as suas reflexões teológicas, desdobramentos de oração ou notas de estudo..."
                rows={5}
                className="w-full p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm font-reading"
              />
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSaveNote}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 hover:opacity-90 transition"
                >
                  {savedNoteStatus ? 'Anotação Guardada!' : 'Guardar no Diário'}
                </button>

                <button
                  onClick={handleToggleCompleted}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition shadow-sm ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-800 text-white hover:bg-amber-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleted ? 'Estudo Concluído' : 'Concluir Estudo de Hoje'}
                </button>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* Modal de Conclusão e Retorno Automático à Home */}
      {showCompletionModal && currentDevotional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl ${currentTheme.card} text-center space-y-5 relative`}>
            
            <button 
              onClick={handleFinishAndReturnHome}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/10 transition"
            >
              <X className="w-5 h-5 text-stone-400" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                <PartyPopper className="w-4 h-4" /> Parabéns!
              </div>
              <h3 className="text-2xl font-bold font-serif">Devocional Concluído</h3>
              <p className={`mt-2 text-xs sm:text-sm ${currentTheme.textSecondary} leading-relaxed`}>
                Você completou o estudo de <strong>"{currentDevotional.title}"</strong> ({currentDevotional.scripture?.reference}). Não esqueça de colocar os desafios em prática hoje!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300 italic">
              "Sede praticantes da palavra, e não apenas ouvintes..." — Tiago 1:22
            </div>

            <button
              onClick={handleFinishAndReturnHome}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 transition shadow-md flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Voltar à Tela Inicial</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal com Catálogo e Histórico de Estudos */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${currentTheme.card} flex flex-col max-h-[85vh]`}>
            
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-lg">Índice & Histórico de Estudos</h3>
              </div>
              <button onClick={() => setIsCalendarOpen(false)} className="p-1.5 rounded-lg hover:bg-black/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Pesquisar estudos por título, versículo ou tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {availableLoci.map((locus) => (
                <button
                  key={locus}
                  onClick={() => setSelectedLocus(locus)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
                    selectedLocus === locus
                      ? 'bg-amber-800 text-white'
                      : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10'
                  }`}
                >
                  {locus}
                </button>
              ))}

              <button
                onClick={() => setFilterOnlyBookmarks(!filterOnlyBookmarks)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full whitespace-nowrap transition font-medium ${
                  filterOnlyBookmarks
                    ? 'bg-amber-700 text-white'
                    : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${filterOnlyBookmarks ? 'fill-white' : ''}`} />
                Favoritos
              </button>
            </div>

            <div className="mt-3 overflow-y-auto space-y-2 pr-1 flex-1">
              {filteredDevotionals.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Nenhum estudo corresponde aos filtros definidos.
                </div>
              ) : (
                filteredDevotionals.map((dev: DevotionalDay) => {
                  const isItemCompleted = localStorage.getItem(`completed_${dev.id}`) === 'true';
                  const isItemBookmarked = localStorage.getItem(`bookmarked_${dev.id}`) === 'true';

                  return (
                    <button
                      key={dev.id}
                      onClick={() => openStudy(dev.id)}
                      className="w-full text-left p-3 rounded-xl border transition flex items-center justify-between border-black/5 dark:border-white/5 hover:bg-black/5"
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <span>{dev.date}</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400">{dev.theologicalTheme?.locus}</span>
                        </div>
                        <h4 className="font-serif font-medium text-sm mt-0.5">{dev.title}</h4>
                        <p className="text-xs text-stone-500">{dev.scripture?.reference} ({dev.scripture?.version})</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isItemBookmarked && (
                          <Bookmark className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                        )}
                        {isItemCompleted && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal de Autenticação (Login / Cadastro SQLite) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

    </div>
  );
}