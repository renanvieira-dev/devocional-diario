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
  HeartHandshake 
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
      
      {/* Título da Aba */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif">Roteiro Completo para Célula</h2>
        <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} max-w-lg mx-auto`}>
          Envia o PDF do estudo: a aplicação mantém todo o texto que precisas de ler para os irmãos e insere analogias, notas e perguntas dinâmicas logo abaixo de cada ponto.
        </p>
      </div>

      {/* Caixa de Upload do PDF */}
      <div className={`p-6 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4`}>
        <div className="border-2 border-dashed border-black/15 dark:border-white/15 rounded-2xl p-6 text-center space-y-3 bg-black/5 dark:bg-white/5">
          <UploadCloud className="w-10 h-10 mx-auto text-amber-700 opacity-80" />
          <div>
            <label className="text-xs sm:text-sm font-semibold cursor-pointer text-amber-800 dark:text-amber-400 hover:underline">
              <span>{file ? file.name : 'Clica para selecionar o PDF da semana'}</span>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-stone-400 mt-1">
              {file ? 'PDF carregado! Clica abaixo para gerar o roteiro.' : 'O sistema extrai o texto original e prepara os teus exemplos práticos.'}
            </p>
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
                <span>A estruturar o roteiro integrado de ministração...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Roteiro da Célula</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ROTEIRO TELEPROMPTER COMPLETO */}
      {studyResult && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* Cabeçalho do Estudo */}
          <div className="border-b pb-5 border-black/10 dark:border-white/10 space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700">
              Passagem Base: {studyResult.passageBase}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
              {studyResult.title}
            </h3>
          </div>

          {/* 1. Quebra-Gelo Inicial */}
          {studyResult.icebreaker && (
            <section className={`p-6 rounded-3xl border ${currentTheme.card} shadow-xs space-y-4`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <HeartHandshake className="w-4 h-4" /> 1. Quebra-Gelo: {studyResult.icebreaker.title}
              </div>
              <p className={`text-xs sm:text-sm font-reading ${currentTheme.textSecondary}`}>
                {studyResult.icebreaker.instructions}
              </p>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Pergunta para os irmãos: "{studyResult.icebreaker.questionToAsk}"</span>
              </div>
            </section>
          )}

          {/* 2. Introdução Original do PDF + Dica do Líder */}
          {studyResult.introSection && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <ScrollText className="w-4 h-4 text-amber-700" />
                <span>2. Introdução (Texto Original do Estudo)</span>
              </div>

              <div className={`p-5 rounded-2xl border ${currentTheme.card} text-xs sm:text-sm font-reading leading-relaxed`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  [ Ler para o grupo ]:
                </span>
                <p className="text-justify indent-3">{studyResult.introSection.originalTextToRead}</p>
              </div>

              {studyResult.introSection.leaderNote && (
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Dica para o Líder:</strong>
                    <span className={currentTheme.textSecondary}>{studyResult.introSection.leaderNote}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. Pontos Centrais do PDF com Seus Adicionais Embutidos */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 border-b pb-2 border-black/10 dark:border-white/10">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>3. Desenvolvimento da Palavra</span>
            </div>

            {studyResult.sections?.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                
                {/* TEXTO QUE O LÍDER LÊ DO PDF */}
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

                {/* ADICIONAIS DA IA EMBUTIDOS LOGO ABAIXO */}
                <div className="pl-3 sm:pl-4 border-l-2 border-amber-600/40 space-y-3">
                  
                  {/* Exemplo / Analogia Prática */}
                  <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs sm:text-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold uppercase text-[11px] tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Exemplo do Quotidiano para Explicar Este Ponto:</span>
                    </div>
                    <p className="italic font-reading text-stone-700 dark:text-stone-300">
                      "{sec.insights.practicalAnalogy}"
                    </p>
                  </div>

                  {/* Insight Pastoral */}
                  <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300">
                    <strong className="text-stone-700 dark:text-stone-200 block mb-0.5">Nota Pastoral:</strong>
                    <span>{sec.insights.explanationKey}</span>
                  </div>

                  {/* Pergunta de Interação */}
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

          {/* 4. Conclusão do PDF + Desafio da Semana */}
          {studyResult.conclusionSection && (
            <section className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>4. Conclusão & Desafio Prático</span>
              </div>

              <div className={`p-5 rounded-2xl border ${currentTheme.card} text-xs sm:text-sm font-reading leading-relaxed`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  [ Conclusão para ler ao grupo ]:
                </span>
                <p className="text-justify indent-3">{studyResult.conclusionSection.originalTextToRead}</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 text-xs sm:text-sm">
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] block mb-1">
                    Desafio Prático da Semana para a Célula:
                  </strong>
                  <p className="font-reading text-stone-700 dark:text-stone-200">
                    {studyResult.conclusionSection.lifeApplicationChallenge}
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-500/20">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Motivos para Oração em Dupla:</span>
                  <ul className="space-y-1 text-stone-600 dark:text-stone-300">
                    {studyResult.conclusionSection.closingPrayerTopics?.map((t, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-600">&bull;</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* 5. Referências de Apoio Opcionais */}
          {studyResult.complementaryPassages?.length > 0 && (
            <section className={`p-5 rounded-2xl border ${currentTheme.card} space-y-2`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <Compass className="w-4 h-4 text-amber-700" /> Versículos Complementares
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {studyResult.complementaryPassages.map((ref, idx) => (
                  <div key={idx} className="text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-0.5">
                    <strong className="text-amber-800 dark:text-amber-300 block font-mono">{ref.ref}</strong>
                    <span className="text-stone-500 text-[11px]">{ref.howItConnects}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  );
}