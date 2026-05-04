"use client"

import { motion } from "framer-motion"
import { Brain, ArrowLeft, FileText, Zap, FlaskConical, Shield, Globe, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function WhitepaperPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/10 to-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Brain className="text-indigo-500 w-7 h-7" />
              <span className="text-lg font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt DApp
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <FileText className="w-4 h-4" />
            <span>Whitepaper 3.0</span>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/30 to-slate-950">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
              Versao 3.0 - Maio de 2026
            </span>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
                NeuroArt DApp
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Ciencia Descentralizada e Arte Neurodiversa
            </p>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Ecossistema de Tokenizacao de Ativos Artisticos e Financiamento de Pesquisas Bioinspiradas na Rede Base
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span>Fundador: <span className="text-indigo-400 font-semibold">Tales Hack</span></span>
              <span>Co-fundador: <span className="text-indigo-400 font-semibold">Prof. Alexandre de Souza Fortis</span></span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Indice</h3>
            <nav className="space-y-2 text-sm">
              {[
                { id: "visao", label: "1. Visao Geral" },
                { id: "pilares", label: "2. Pilares Cientificos" },
                { id: "arquitetura", label: "3. Arquitetura DApp" },
                { id: "tokenizacao", label: "4. Tokenizacao" },
                { id: "tokenomics", label: "5. Tokenomics" },
                { id: "governanca", label: "6. Governanca" },
                { id: "roadmap", label: "7. Roadmap" },
                { id: "compliance", label: "8. Compliance" },
              ].map(item => (
                <a key={item.id} href={"#" + item.id}
                  className="block text-slate-400 hover:text-indigo-400 transition-colors py-1 border-l-2 border-transparent hover:border-indigo-500 pl-3">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-slate-800">
              <Link href="/gallery" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
                Ver Galeria
              </Link>
            </div>
          </div>
        </aside>

        <article className="flex-1 min-w-0 space-y-16">

          <section id="visao">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">1. Visao Geral e Filosofia Antifragil</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              O NeuroArt DApp surge como uma resposta estrutural a necessidade de novos paradigmas no tratamento e na percepcao da neurodiversidade. Nossa filosofia e fundamentada na Antifragilidade (conceito de Nassim Taleb) e no Pluralismo Cognitivo.
            </p>
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-6 mt-6">
              <p className="text-indigo-300 italic text-lg leading-relaxed">
                O ecossistema opera na interseccao entre a Ciencia Descentralizada (DeSci) e a Economia Criativa, utilizando a rede Base (Ethereum L2) para garantir escalabilidade e seguranca.
              </p>
            </div>
          </section>

          <section id="pilares">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">2. Pilares Cientificos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: <Zap className="w-5 h-5" />, title: "Brain-Computer Interface (BCI)", desc: "Dispositivos para monitoramento de estados de fluxo e biofeedback, com dados anonimizados e protegidos." },
                { icon: <FlaskConical className="w-5 h-5" />, title: "Neuroplasticidade via Arte", desc: "Estudo do impacto da criacao visual e digital na reconfiguracao de redes neurais." },
                { icon: <Shield className="w-5 h-5" />, title: "Artes Marciais (Jiu-Jitsu)", desc: "Ferramenta de controle inibitorio, consciencia proprioceptiva e regulacao sensorial." },
                { icon: <Globe className="w-5 h-5" />, title: "Protocolos Ambientais", desc: "Engenharia de espacos que minimizam a sobrecarga sensorial e maximizam o foco." },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-indigo-400">{item.icon}</div>
                    <h3 className="text-white font-bold text-sm">{item.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="tokenizacao">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">4. Tokenizacao e Economia de Ativos</h2>
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-emerald-400 font-bold mb-3">Clausula de Resgate (Threshold Redemption)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                O portador que consolidar 100% das fracoes de uma obra adquire o direito legal de resgatar a obra fisica. Os tokens sao queimados (burn) e o processo de entrega e iniciado.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2"><span className="text-emerald-400">checkmark</span> Proof of Reserve (PoR) Visual mensais</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">checkmark</span> Seguro de ativo obrigatorio acima do teto de valor</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">checkmark</span> Split automatico: 80% artista / 20% DApp</li>
            </ul>
          </section>

          <section id="tokenomics">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">5. Tokenomics ()</h2>
            <p className="text-slate-400 leading-relaxed mb-6">Supply total: <span className="text-white font-bold">10.000.000 </span></p>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase">Categoria</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase">Alocacao</th>
                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase">Vesting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ["Venda Publica / Liquidez", "20% - 2.000.000", "100% TGE"],
                    ["Ecossistema e Pesquisa DeSci", "40% - 4.000.000", "Linear 48 meses"],
                    ["Equipe e Fundadores", "15% - 1.500.000", "Cliff 12m + 24m"],
                    ["Tesouraria da DAO", "15% - 1.500.000", "Governanca ativa"],
                    ["Parcerias Estrategicas", "10% - 1.000.000", "Cliff 6 meses"],
                  ].map(([label, value, sub], i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-slate-300">{label}</td>
                      <td className="py-3 px-4 text-indigo-400 font-bold">{value}</td>
                      <td className="py-3 px-4 text-slate-500 text-sm">{sub}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="airdrop">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">5.1 Programa de Airdrop para Artistas</h2>
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-emerald-400 font-bold mb-3">500.000 $NEURO para a comunidade criativa</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Para incentivar a participacao de artistas neurodivergentes no ecossistema, 500.000 $NEURO serao distribuidos proporcionalmente ao numero de obras aprovadas por cada artista durante o periodo de 12 meses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                  <div className="text-emerald-400 font-black text-xl mb-1">500.000</div>
                  <div className="text-slate-500 text-xs">$NEURO no pool</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                  <div className="text-emerald-400 font-black text-xl mb-1">12 meses</div>
                  <div className="text-slate-500 text-xs">06/05/2026 a 06/05/2027</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-4 text-center">
                  <div className="text-emerald-400 font-black text-xl mb-1">Proporcional</div>
                  <div className="text-slate-500 text-xs">obras aprovadas / total</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-3">Como funciona</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">1.</span> Artista submete obra pela plataforma</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">2.</span> Fundadores avaliam e aprovam a submissao</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">3.</span> Obra aprovada conta para o calculo proporcional</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">4.</span> Em 06/05/2027, o pool e distribuido automaticamente via contrato inteligente</li>
              </ul>
              <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg">
                <p className="text-indigo-300 text-xs">Exemplo: 20 obras aprovadas no periodo. Artista com 5 obras aprovadas recebe 5/20 x 500.000 = 125.000 $NEURO</p>
              </div>
            </div>
          </section>

          <section id="governanca">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">6. Governanca Hibrida</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-white font-bold">Conselho Criativo</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Detentores de SBTs de reputacao. Tokens nao transferiveis com poder de Veto Protetivo.</p>
              </div>
              <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-bold">Conselho Economico</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Detentores de . Decidem sobre tesouraria, parcerias e parametros de taxas.</p>
              </div>
            </div>
          </section>

          <section id="roadmap">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">7. Roadmap</h2>
            <div className="space-y-4">
              {[
                { fase: "Fase 1", periodo: "Q3 2026", title: "Fundacao e MVP", items: ["Smart Contracts na Base Mainnet", "Dashboard de Tokenizacao", "Venda Seed de NEURO", "Primeira obra tokenizada"] },
                { fase: "Fase 2", periodo: "Q1 2027", title: "Crescimento", items: ["Integracao de BCI", "Marketplace de Arte", "Editais de Pesquisa DeSci", "Listagem em DEX"] },
                { fase: "Fase 3", periodo: "Q4 2027", title: "DAO Plena", items: ["Modelo Bicameral On-chain", "Expansao Global", "Protocolo de Interoperabilidade", "Centros de Neurodiversidade"] },
              ].map((fase, i) => (
                <div key={i} className="border border-slate-800 rounded-xl p-6 bg-slate-900/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{fase.fase}</span>
                      <h3 className="text-white font-bold">{fase.title}</h3>
                    </div>
                    <span className="text-slate-500 text-sm">{fase.periodo}</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {fase.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="text-indigo-400">arrow</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section id="compliance">
            <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-slate-800">8. Compliance e Neuroetica</h2>
            <div className="space-y-4">
              {[
                { title: "MiCA", desc: "Estruturacao dos tokens para conformidade com a regulacao europeia." },
                { title: "GDPR e Privacidade", desc: "Privacy by Design com provas de conhecimento zero (ZKP)." },
                { title: "Linguagem Neuroafirmativa", desc: "Comunicacao que respeita a dignidade de individuos neurodivergentes, focando em potencialidades." },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-slate-800 pt-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div>
                <p className="text-slate-500 text-xs mb-1">Documento elaborado em 02 de maio de 2026</p>
                <p className="text-slate-600 text-xs mt-2">Hash on-chain: 5f5cc82532eea90f7ad63837793f9ac918b7c812f369061a5e79407599c23d88</p>
              </div>
              <div className="flex gap-12">
                <div className="text-center">
                  <div className="w-32 border-t border-slate-600 mb-2"></div>
                  <p className="text-white font-bold text-sm">Tales Hack</p>
                  <p className="text-slate-500 text-xs">Fundador</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-t border-slate-600 mb-2"></div>
                  <p className="text-white font-bold text-sm">Prof. Alexandre de Souza Fortis</p>
                  <p className="text-slate-500 text-xs">Co-fundador</p>
                </div>
              </div>
            </div>
          </div>

        </article>
      </div>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>NeuroArt DApp 2026 - Tales Hack e Prof. Alexandre de Souza Fortis - Base L2</p>
      </footer>
    </main>
  )
}
