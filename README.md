# NeuroArt DApp

> **"Arte que financia ciência"**
> Tokenização fracionada de obras de artistas neurodivergentes na rede Base L2.

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Network: Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue.svg)](https://sepolia.basescan.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Contracts-Solidity%200.8.28-363636.svg)](https://soliditylang.org)

---

## Sobre o Projeto

O **NeuroArt DApp** é um ecossistema tecnológico e científico que une a tokenização de ativos artísticos com o financiamento de pesquisas bioinspiradas. Cada obra de arte produzida por talentos neurodivergentes é fracionada em tokens ERC20, permitindo que investidores adquiram participações enquanto financiam diretamente pesquisas não medicamentosas.

**Fundadores:**
- **Tales Hack** — Fundador (15% — 1.500.000 $NEURO)
- **Prof. Alexandre de Souza Fortis** — Co-fundador (15% — 1.500.000 $NEURO)

**Local:** Florianópolis/SC, Brasil · **Rede:** Base L2 (Ethereum Rollup)

---

## Pilares Científicos

- **BCI (Brain-Computer Interface):** Captura de estados de hiperfoco para geração de metadados artísticos únicos
- **Neuroplasticidade via Arte:** Estudo do impacto da criação visual na reconfiguração de redes neurais
- **Jiu-Jitsu:** Protocolo de controle inibitório e regulação proprioceptiva
- **Protocolos Ambientais:** Interfaces que minimizam sobrecarga sensorial

---

## Tokenomics $NEURO

| Alocação | Tokens | % |
|---|---|---|
| Venda Pública / Liquidez DApp | 7.000.000 | 70% |
| Tales Hack (Fundador) | 1.500.000 | 15% |
| Prof. Alexandre Fortis (Co-fundador) | 1.500.000 | 15% |
| **Total Supply** | **10.000.000** | **100%** |

**Mecanismo deflacionário:** 1% de burn em todas as taxas do marketplace.

---

## Arquitetura dos Contratos

| Contrato | Descrição |
|---|---|
| `NeuroToken.sol` | ERC20 com burn deflacionário de 1% |
| `NeuroSBT.sol` | Soulbound Token — identidade imutável do artista |
| `NeuroArtFractionalVault.sol` | Cofre fracionado — artista define quantidade de frações |
| `ArtVaultFactory.sol` | Fábrica Minimal Proxy ERC1167 — controlada pelos fundadores |

**Threshold Redemption:** 100% das frações = direito ao resgate físico da obra.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + Framer Motion |
| Web3 | Wagmi + Viem + ConnectKit |
| Contratos | Solidity 0.8.28 + OpenZeppelin 5.x |
| Deploy | Hardhat 2.x |
| Rede | Base Sepolia (testnet) / Base Mainnet |
| Storage | IPFS via Pinata |

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js v18+
- MetaMask com ETH na Base Sepolia

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Preencha as variáveis no .env.local
npm run dev
```
Acesse: http://localhost:3000

### Contratos
```bash
cd contracts
npm install
cp .env.example .env
# Preencha PRIVATE_KEY e BASE_SEPOLIA_RPC_URL
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network baseSepolia
```

---

## Roadmap

| Fase | Objetivo | Status |
|---|---|---|
| Fase 1: MVP (Q3 2026) | Dashboard + Tokenização + Pré-venda $NEURO | 🔄 Em construção |
| Fase 2: Expansão (Q1 2027) | BCI no DApp + Marketplace + Editais DeSci | ⏳ Planejado |
| Fase 3: Descentralização (Q4 2027) | Migração governança para holders $NEURO | ⏳ Planejado |

---

## Compliance

- **MiCA:** Estruturação conforme regulação europeia de crypto-assets
- **GDPR:** Privacy by Design para dados neurais — hashes on-chain, dados off-chain
- **Linguagem Neuroafirmativa:** Zero termos patologizantes em toda a documentação

---

## Whitepaper

O whitepaper do projeto está registrado com hash imutável na blockchain Base Sepolia.
Hash SHA-256 será adicionado após o deploy dos contratos.

---

*Documento técnico — não constitui oferta de investimento.*
*NeuroArt DApp © 2026 · Florianópolis/SC, Brasil*
