import { useState, type ChangeEvent } from 'react';
import { 
  UploadCloud, 
  Users, 
  HelpCircle, 
  Lightbulb, 
  Compass, 
  Loader2, 
  CheckCircle, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  ScrollText, 
  HeartHandshake,
  FolderOpen,
  Edit2,
  Check,
  X,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { analyzeCellStudyPdf } from '../services/aiDevotionalService';
import type { CellStudyInsight } from '../types/cellStudy';

interface CellLeaderViewProps {
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

export function CellLeaderView({ currentTheme }: CellLeaderViewProps) {
  // Lista de estudos guardados na Biblioteca
  const [library, setLibrary] = useState<CellStudyInsight[]>(() => {
    const saved = localStorage.getItem('kerygma_cell_library');
    return saved ? JSON.parse(saved) : [];
  });

  // ID do estudo aberto no ecrã
  const [activeStudyId, setActiveStudyId] = useState<string | null>(() => {
    const saved = localStorage.getItem('kerygma_active_cell_id');
    return saved || null;
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Estados para renomear título
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Estudo atualmente em exibição
  const currentStudy: CellStudyInsight | undefined = library.find(s => s.id === activeStudyId) || library[0];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        alert('Por favor, seleciona um ficheiro em formato PDF.');
        return;
      }
      setFile(selected);
    }
  };

  const handleProcessPdf = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const result = await analyzeCellStudyPdf(file);
      
      const updatedLibrary = [result, ...library];
      setLibrary(updatedLibrary);
      localStorage.setItem('kerygma_cell_library', JSON.stringify(updatedLibrary));
      
      setActiveStudyId(result.id);
      localStorage.setItem('kerygma_active_cell_id', result.id);
      
      setFile(null);
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao processar o PDF. Certifica-te de que o ficheiro não está protegido por palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  const startRename = () => {
    if (!currentStudy) return;
    setEditedTitle(currentStudy.title);
    setIsEditingTitle(true);
  };

  const saveRename = () => {
    if (!currentStudy || !editedTitle.trim()) return;
    const updated = library.map(item => 
      item.id === currentStudy.id ? { ...item, title: editedTitle.trim() } : item
    );
    setLibrary(updated);
    localStorage.setItem('kerygma_cell_library', JSON.stringify(updated));
    setIsEditingTitle(false);
  };

  const deleteStudy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Desejas realmente eliminar este estudo da tua biblioteca?')) return;
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    localStorage.setItem('kerygma_cell_library', JSON.stringify(updated));
    if (activeStudyId === id) {
      const nextId = updated.length > 0 ? updated[0].id : null;
      setActiveStudyId(nextId);
      if (nextId) localStorage.setItem('kerygma_active_cell_id', nextId);
      else localStorage.removeItem('kerygma_active_cell_id');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Barra de Ações: Nova Importação & Biblioteca */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif leading-tight">Estudos de Célula</h2>
            <p className="text-[11px] text-stone-500">Roteiro de ministração & dinâmicas</p>
          </div>
        </div>

        <button
          onClick={() => setIsLibraryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Biblioteca ({library.length})</span>
        </button>
      </div>

      {/* Caixa de Importação de Novo PDF */}
      <div className={`p-5 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4`}>
        <div className="border-2 border-dashed border-black/15 dark:border-white/15 rounded-2xl p-5 text-center space-y-2 bg-black/5 dark:bg-white/5">
          <UploadCloud className="w-8 h-8 mx-auto text-amber-700 opacity-80" />
          <div>
            <label className="text-xs sm:text-sm font-semibold cursor-pointer text-amber-800 dark:text-amber-400 hover:underline">
              <span>{file ? file.name : 'Clica para carregar o PDF da semana'}</span>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {file ? 'Ficheiro selecionado! Clica em gerar abaixo.' : 'Gera o roteiro preservando o texto e adicionando analogias e perguntas.'}
            </p>
          </div>
        </div>

        {file && (
          <button
            onClick={handleProcessPdf}
            disabled={loading}
            className="w-full py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A analisar o PDF e a salvar na biblioteca...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar & Guardar na Biblioteca</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ROTEIRO ATIVO COM RENOMEAÇÃO */}
      {currentStudy ? (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Cabeçalho do Estudo com Função de Renomear */}
          <div className="border-b pb-5 border-black/10 dark:border-white/10 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700">
              Passagem Base: {currentStudy.passageBase}
            </span>

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
                  className="flex-1 px-3 py-1.5 text-lg font-serif font-bold rounded-xl border border-amber-600 bg-white/70 dark:bg-black/40 focus:outline-none"
                />
                <button
                  onClick={saveRename}
                  className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                  title="Guardar Título"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-2 rounded-lg bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-200 transition cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
                  {currentStudy.title}
                </h3>
                <button
                  onClick={startRename}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-400 hover:text-amber-700 transition cursor-pointer shrink-0 mt-1"
                  title="Renomear estudo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 1. Quebra-Gelo */}
          {currentStudy.icebreaker && (
            <section className={`p-6 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <HeartHandshake className="w-4 h-4" /> 1. Quebra-Gelo: {currentStudy.icebreaker.title}
              </div>
              <p className={`text-xs sm:text-sm font-reading ${currentTheme.textSecondary}`}>
                {currentStudy.icebreaker.instructions}
              </p>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Pergunta para o grupo: "{currentStudy.icebreaker.questionToAsk}"</span>
              </div>
            </section>
          )}

          {/* 2. Introdução */}
          {currentStudy.introSection && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <ScrollText className="w-4 h-4 text-amber-700" />
                <span>2. Introdução (Texto Original do Estudo)</span>
              </div>

              <div className={`p-5 rounded-2xl border ${currentTheme.card} text-xs sm:text-sm font-reading leading-relaxed`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  [ Ler para o grupo ]:
                </span>
                <p className="text-justify indent-3">{currentStudy.introSection.originalTextToRead}</p>
              </div>

              {currentStudy.introSection.leaderNote && (
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Dica para o Líder:</strong>
                    <span className={currentTheme.textSecondary}>{currentStudy.introSection.leaderNote}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. Desenvolvimento */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 border-b pb-2 border-black/10 dark:border-white/10">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>3. Desenvolvimento da Palavra</span>
            </div>

            {currentStudy.sections?.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <div className={`p-5 sm:p-6 rounded-2xl border ${currentTheme.card} space-y-3 shadow-xs`}>
                  <div className="flex items-baseline justify-between border-b pb-2 border-black/5 dark:border-white/5">
                    <h4 className="font-serif font-bold text-base sm:text-lg text-amber-900 dark:text-amber-300">
                      {sec.heading}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-500">
                      Texto do PDF
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-reading leading-relaxed text-justify indent-3">
                    {sec.originalTextToRead}
                  </p>
                </div>

                <div className="pl-3 sm:pl-4 border-l-2 border-amber-600/40 space-y-3">
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs sm:text-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold uppercase text-[11px] tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Exemplo do Quotidiano para Explicar Este Ponto:</span>
                    </div>
                    <p className="italic font-reading text-stone-700 dark:text-stone-300">
                      "{sec.insights.practicalAnalogy}"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300">
                    <strong className="text-stone-700 dark:text-stone-200 block mb-0.5">Nota Pastoral:</strong>
                    <span>{sec.insights.explanationKey}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs sm:text-sm">
                    <HelpCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-800 dark:text-amber-300 block text-[11px] uppercase tracking-wider mb-0.5">
                        Pergunta para fazer aos irmãos agora:
                      </strong>
                      <span className="font-semibold text-stone-800 dark:text-stone-100 font-reading">
                        "{sec.insights.groupQuestion}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4. Conclusão & Desafio */}
          {currentStudy.conclusionSection && (
            <section className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>4. Conclusão & Desafio Prático</span>
              </div>

              <div className={`p-5 rounded-2xl border ${currentTheme.card} text-xs sm:text-sm font-reading leading-relaxed`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  [ Conclusão para ler ao grupo ]:
                </span>
                <p className="text-justify indent-3">{currentStudy.conclusionSection.originalTextToRead}</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 text-xs sm:text-sm">
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] block mb-1">
                    Desafio Prático da Semana para a Célula:
                  </strong>
                  <p className="font-reading text-stone-700 dark:text-stone-200">
                    {currentStudy.conclusionSection.lifeApplicationChallenge}
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Motivos para Oração em Dupla:</span>
                  <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                    {currentStudy.conclusionSection.closingPrayerTopics?.map((t, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-600">&bull;</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* 5. Versículos Complementares */}
          {currentStudy.complementaryPassages?.length > 0 && (
            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-2`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <Compass className="w-4 h-4 text-amber-700" /> Versículos Complementares
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {currentStudy.complementaryPassages.map((ref, idx) => (
                  <div key={idx} className="text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-0.5">
                    <strong className="text-amber-800 dark:text-amber-300 block font-mono">{ref.ref}</strong>
                    <span className="text-stone-500 text-[11px]">{ref.howItConnects}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="p-10 text-center rounded-3xl border border-dashed border-black/15 dark:border-white/15 text-xs text-stone-400">
          Ainda não tens nenhum roteiro na biblioteca. Carrega o primeiro PDF acima para começar!
        </div>
      )}

      {/* MODAL: BIBLIOTECA DE ESTUDOS DE CÉLULA */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${currentTheme.card} flex flex-col max-h-[80vh]`}>
            
            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-lg">Biblioteca de Célula</h3>
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
                  Nenhum estudo guardado na biblioteca.
                </div>
              ) : (
                library.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveStudyId(item.id);
                      localStorage.setItem('kerygma_active_cell_id', item.id);
                      setIsLibraryOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      activeStudyId === item.id
                        ? 'border-amber-600 bg-amber-500/10'
                        : 'border-black/5 dark:border-white/5 hover:bg-black/5'
                    }`}
                  >
                    <div className="pr-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span className="font-semibold text-amber-700">{item.passageBase}</span>
                        <span>&bull;</span>
                        <span>{item.createdAt}</span>
                      </div>
                      <h4 className="font-serif font-medium text-sm mt-0.5 truncate">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => deleteStudy(item.id, e)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                        title="Eliminar estudo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}