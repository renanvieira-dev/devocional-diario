import { useState } from 'react';
import { 
  Mic, 
  Sparkles, 
  Loader2, 
  FolderOpen, 
  BookOpen, 
  Lightbulb, 
  Check, 
  Edit3, 
  Trash2, 
  X, 
  Plus, 
  Compass, 
  Calendar, 
  ScrollText, 
  Flame 
} from 'lucide-react';
import { generateSermonOutline } from '../services/aiDevotionalService';
import type { SermonInsight } from '../types/sermon';

interface SermonViewProps {
  currentTheme: {
    bg: string;
    card: string;
    cardHover: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    quoteBox: string;
    progressBar: string;
  };
}

export function SermonView({ currentTheme }: SermonViewProps) {
  const [library, setLibrary] = useState<SermonInsight[]>(() => {
    const saved = localStorage.getItem('kerygma_sermons_library');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSermonId, setActiveSermonId] = useState<string | null>(() => {
    const saved = localStorage.getItem('kerygma_active_sermon_id');
    return saved || (library.length > 0 ? library[0].id : null);
  });

  const [themeInput, setThemeInput] = useState('');
  const [passageInput, setPassageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showInputBox, setShowInputBox] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const currentSermon: SermonInsight | undefined = 
    library.find((s) => s.id === activeSermonId) || library[0];

  const handleGenerate = async () => {
    if (!themeInput.trim() && !passageInput.trim()) {
      alert('Informe ao menos o tema ou a passagem bíblica.');
      return;
    }

    try {
      setLoading(true);
      const newSermon = await generateSermonOutline(themeInput.trim(), passageInput.trim());
      const updated = [newSermon, ...library];
      setLibrary(updated);
      localStorage.setItem('kerygma_sermons_library', JSON.stringify(updated));

      setActiveSermonId(newSermon.id);
      localStorage.setItem('kerygma_active_sermon_id', newSermon.id);

      setThemeInput('');
      setPassageInput('');
      setShowInputBox(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar sermão. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  const saveRename = () => {
    if (!currentSermon || !editedTitle.trim()) return;
    const updated = library.map((s) =>
      s.id === currentSermon.id ? { ...s, title: editedTitle.trim() } : s
    );
    setLibrary(updated);
    localStorage.setItem('kerygma_sermons_library', JSON.stringify(updated));
    setIsEditingTitle(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = library.find((s) => s.id === id);
    if (!window.confirm(`Excluir sermão "${item?.title || 'este sermão'}"?`)) return;

    const updated = library.filter((s) => s.id !== id);
    setLibrary(updated);
    localStorage.setItem('kerygma_sermons_library', JSON.stringify(updated));

    if (activeSermonId === id) {
      const nextId = updated.length > 0 ? updated[0].id : null;
      setActiveSermonId(nextId);
      if (nextId) localStorage.setItem('kerygma_active_sermon_id', nextId);
      else localStorage.removeItem('kerygma_active_sermon_id');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Topo / Barra de Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif leading-tight">Preparador de Sermões</h2>
            <p className="text-[11px] text-stone-500">Esboços expositivos, proposição & ilustrações</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-800/10 text-amber-800 dark:text-amber-300 border border-amber-800/20 hover:bg-amber-800/20 transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Biblioteca ({library.length})</span>
          </button>

          <button
            onClick={() => setShowInputBox(!showInputBox)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 hover:opacity-90 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Sermão</span>
          </button>
        </div>
      </div>

      {/* Caixa de Entrada para Geração */}
      {(showInputBox || library.length === 0) && (
        <div className={`p-6 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4 animate-in fade-in`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Planejar Nova Mensagem
            </h3>
            {library.length > 0 && (
              <button 
                onClick={() => setShowInputBox(false)}
                className="p-1 rounded-lg hover:bg-black/10 text-stone-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Tema / Assunto
              </label>
              <input
                type="text"
                placeholder="Ex: Vencendo a Ansiedade, Graça Radical, Fidelidade..."
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Texto Bíblico Base
              </label>
              <input
                type="text"
                placeholder="Ex: Filipenses 4:4-9, Romanos 8:28-39..."
                value={passageInput}
                onChange={(e) => setPassageInput(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Construindo estrutura homilética e ilustrações...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Gerar Esboço do Sermão</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Sermão Aberto */}
      {currentSermon ? (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Cabeçalho */}
          <div className="p-5 sm:p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                {currentSermon.biblicalText} &bull; {currentSermon.theme}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setEditedTitle(currentSermon.title);
                    setIsEditingTitle(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Renomear</span>
                </button>

                <button
                  onClick={() => handleDelete(currentSermon.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="flex-1 px-3 py-2 text-base sm:text-lg font-serif font-bold rounded-xl border border-amber-600 bg-white dark:bg-black focus:outline-none"
                />
                <button
                  onClick={saveRename}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-2 rounded-xl bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
                {currentSermon.title}
              </h3>
            )}

            {/* Ideia Central do Sermão */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-0.5">
                Grande Ideia (Proposição Central):
              </span>
              <p className="text-sm font-reading italic font-medium">
                "{currentSermon.centralProposition}"
              </p>
            </div>
          </div>

          {/* 1. Introdução */}
          <section className={`p-6 rounded-3xl border ${currentTheme.card} space-y-4 shadow-xs`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <ScrollText className="w-4 h-4" /> 1. Introdução Homilética
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-reading leading-relaxed">
              <div>
                <strong className="text-stone-500 uppercase tracking-wider text-[11px] block">
                  O Gancho Inicial:
                </strong>
                <p className="mt-0.5">{currentSermon.introduction.hook}</p>
              </div>

              <div>
                <strong className="text-stone-500 uppercase tracking-wider text-[11px] block">
                  Contexto & Problema Humano:
                </strong>
                <p className="mt-0.5">{currentSermon.introduction.context}</p>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 italic">
                <span className="font-semibold text-amber-800 dark:text-amber-300 not-italic block text-[10px] uppercase">
                  Transição para o Texto Sagrado:
                </span>
                {currentSermon.introduction.transitionToText}
              </div>
            </div>
          </section>

          {/* 2. Pontos do Sermão */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 border-b pb-2 border-black/10 dark:border-white/10">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>2. Desenvolvimento & Tópicos da Mensagem</span>
            </div>

            {currentSermon.points.map((pt, idx) => (
              <div key={idx} className={`p-6 rounded-3xl border ${currentTheme.card} space-y-4 shadow-xs`}>
                <div className="border-b pb-2 border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Ponto {idx + 1}
                  </span>
                  <h4 className="text-lg sm:text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-0.5">
                    {pt.heading}
                  </h4>
                </div>

                <div className="text-xs sm:text-sm font-reading leading-relaxed text-stone-700 dark:text-stone-300">
                  <strong className="text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    Exposição Bíblica:
                  </strong>
                  {pt.biblicalSupport}
                </div>

                {/* Ilustração / Analogia */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold uppercase text-[10px] tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Ilustração / Analogia para o Púlpito:</span>
                  </div>
                  <p className="italic font-reading text-stone-800 dark:text-stone-200">
                    "{pt.contemporaryAnalogy}"
                  </p>
                </div>

                {/* Aplicação Prática */}
                <div className="text-xs sm:text-sm font-reading p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <strong className="text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    Aplicação na Prática da Igreja:
                  </strong>
                  {pt.pastoralApplication}
                </div>
              </div>
            ))}
          </div>

          {/* 3. Conclusão & Apelo Pastoral */}
          <section className={`p-6 rounded-3xl border ${currentTheme.card} space-y-4 shadow-xs`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <Flame className="w-4 h-4" /> 3. Conclusão & Apelo Pastoral
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-reading leading-relaxed">
              <p>
                <strong className="text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  Recapitulação dos Pontos:
                </strong>
                {currentSermon.conclusion.recap}
              </p>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <strong className="text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] block mb-1">
                  O Chamado à Decisão / Apelo:
                </strong>
                <p className="italic font-medium">{currentSermon.conclusion.pastoralAppeal}</p>
              </div>

              <div>
                <strong className="text-stone-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  Direcionamento da Oração Final:
                </strong>
                <p className="text-stone-600 dark:text-stone-300">
                  {currentSermon.conclusion.closingPrayerDirection}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Textos de Apoio */}
          {currentSermon.complementaryPassages?.length > 0 && (
            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-2`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <Compass className="w-4 h-4 text-amber-700" /> Passagens Bíblicas de Apoio
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {currentSermon.complementaryPassages.map((ref, idx) => (
                  <div key={idx} className="text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-0.5">
                    <strong className="text-amber-800 dark:text-amber-300 block font-mono">{ref.ref}</strong>
                    <span className="text-stone-500 text-[11px]">{ref.purpose}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      ) : (
        <div className="p-10 text-center rounded-3xl border border-dashed border-black/15 dark:border-white/15 text-xs text-stone-400">
          Nenhum sermão salvo na biblioteca. Informe o tema ou texto acima para gerar o primeiro.
        </div>
      )}

      {/* Modal da Biblioteca de Sermões */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${currentTheme.card} flex flex-col max-h-[85vh]`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-lg">Biblioteca de Sermões</h3>
              </div>
              <button 
                onClick={() => setIsLibraryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto space-y-2 pr-1 flex-1">
              {library.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Nenhum sermão arquivado.
                </div>
              ) : (
                library.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveSermonId(item.id);
                      localStorage.setItem('kerygma_active_sermon_id', item.id);
                      setShowInputBox(false);
                      setIsLibraryOpen(false);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      activeSermonId === item.id
                        ? 'border-amber-600 bg-amber-500/10'
                        : 'border-black/5 dark:border-white/5 hover:bg-black/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-0.5">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">{item.biblicalText}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.createdAt}
                        </span>
                      </div>
                      <h4 className="font-serif font-semibold text-sm truncate">{item.title}</h4>
                    </div>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/10 mt-2">
              <button
                onClick={() => {
                  setShowInputBox(true);
                  setIsLibraryOpen(false);
                }}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Planejar Outro Sermão</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}