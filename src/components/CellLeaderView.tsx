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
  BookOpen
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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [studyResult, setStudyResult] = useState<CellStudyInsight | null>(() => {
    const saved = localStorage.getItem('kerygma_active_cell_study');
    return saved ? JSON.parse(saved) : null;
  });

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
      setStudyResult(result);
      localStorage.setItem('kerygma_active_cell_study', JSON.stringify(result));
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao processar o PDF. Certifica-te de que o ficheiro não está protegido por palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif">Preparador de Estudo para Célula</h2>
        <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} max-w-lg mx-auto`}>
          Envia o PDF do estudo da semana e recebe um roteiro dinâmico com quebra-gelo, analogias práticas e perguntas para conduzir o teu grupo.
        </p>
      </div>

      <div className={`p-6 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4`}>
        <div className="border-2 border-dashed border-black/15 dark:border-white/15 rounded-2xl p-6 text-center space-y-3 bg-black/5 dark:bg-white/5">
          <UploadCloud className="w-10 h-10 mx-auto text-amber-700 opacity-80" />
          <div>
            <label className="text-xs sm:text-sm font-semibold cursor-pointer text-amber-800 dark:text-amber-400 hover:underline">
              <span>{file ? file.name : 'Clica para selecionar o PDF do estudo'}</span>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-stone-400 mt-1">Formatos aceites: PDF de roteiros, esboços ou estudos bíblicos.</p>
          </div>
        </div>

        {file && (
          <button
            onClick={handleProcessPdf}
            disabled={loading}
            className="w-full py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A analisar o PDF e a gerar o roteiro da célula...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Roteiro de Ministração</span>
              </>
            )}
          </button>
        )}
      </div>

      {studyResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="border-b pb-4 border-black/10 dark:border-white/10 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700">
              {studyResult.passageBase}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif">{studyResult.title}</h3>
            <p className={`text-sm italic font-reading ${currentTheme.textSecondary}`}>
              "Ideia Central: {studyResult.mainIdea}"
            </p>
          </div>

          <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-3`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <Sparkles className="w-4 h-4" /> 1. Quebra-Gelo Inicial: {studyResult.icebreaker.title}
            </div>
            <p className={`text-xs sm:text-sm font-reading ${currentTheme.textSecondary}`}>
              {studyResult.icebreaker.description}
            </p>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300">
              Pergunta para o grupo: "{studyResult.icebreaker.question}"
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 border-b pb-2 border-black/10 dark:border-white/10">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>2. Roteiro da Mensagem (15 a 20 minutos)</span>
            </div>

            <div className="space-y-4">
              {studyResult.outlinePoints.map((item, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${currentTheme.card} space-y-3 shadow-xs`}>
                  <h4 className="font-serif font-bold text-base sm:text-lg text-amber-900 dark:text-amber-300">
                    {idx + 1}. {item.point}
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed font-reading ${currentTheme.textSecondary}`}>
                    {item.explanation}
                  </p>

                  <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
                        Exemplo / Analogia Prática para usar:
                      </span>
                      <p className="text-xs sm:text-sm italic leading-relaxed text-stone-700 dark:text-stone-300">
                        {item.practicalAnalogy}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`p-6 rounded-3xl border ${currentTheme.card} space-y-4 shadow-xs`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" /> 3. Perguntas para Conduzir a Roda de Conversa
            </div>
            <ul className="space-y-3">
              {studyResult.discussionQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-reading">
                  <span className="font-bold text-amber-700 text-base leading-none mt-0.5">&bull;</span>
                  <span className={currentTheme.textSecondary}>{q}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-3`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <Compass className="w-4 h-4 text-amber-700" /> Referências de Apoio
              </div>
              <div className="space-y-2">
                {studyResult.crossReferences.map((ref, idx) => (
                  <div key={idx} className="text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                    <strong className="text-amber-800 dark:text-amber-300 block">{ref.ref}</strong>
                    <span className="text-stone-500 text-[11px]">{ref.howItConnects}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-3`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <CheckCircle className="w-4 h-4" /> Desafio Prático da Semana
              </div>
              <p className="text-xs sm:text-sm font-reading leading-relaxed text-stone-700 dark:text-stone-300">
                {studyResult.lifeChallenge}
              </p>
              
              <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400">Motivos de Oração em Dupla:</span>
                <ul className="text-xs text-stone-500 space-y-1">
                  {studyResult.closingPrayerTopics.map((topic, idx) => (
                    <li key={idx}>- {topic}</li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}