<div align="center">

# 🛠️ OCS | Caçambas Online

### Gestão financeira, notificações inteligentes, atendimentos e atalhos de CTR

**Userscript independente para otimizar rotinas operacionais e financeiras no painel de parceiros do Caçambas Online.**

<br>

[![Instalar no Tampermonkey](https://img.shields.io/badge/INSTALAR%20OCS-008000?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js)

<br>

![Versão](https://img.shields.io/badge/Versão-0.7.93-blue?style=flat-square)
![Plataforma](https://img.shields.io/badge/Plataforma-Tampermonkey-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-yellow?style=flat-square)
![Licença](https://img.shields.io/badge/Projeto-Independente-lightgrey?style=flat-square)

</div>

---

## 🚀 Funcionalidades

### 📊 Gestão financeira

- ✅ Indicadores de lançamentos que vencem hoje, vencidos, pagos, em aberto e sem nota fiscal (SNF)
- ✅ Atalhos de filtros integrados aos controles nativos
- ✅ Duplicação de lançamentos com identificação `[DUPLICATA]` e situação pendente
- ✅ Preparação de lançamentos de juros
- ✅ Acesso rápido aos anexos das transações

### 📋 Atendimentos e produtividade

- ✅ Botão **Ordenar** para organizar os atendimentos por data
- ✅ Prioridade para entregas, trocas e coletas, com **entrega antes da coleta** nas trocas
- ✅ Agrupamento de trocas do **mesmo cliente na mesma data**, mesmo quando os endereços são diferentes (v0.7.93)
- ✅ Separadores visuais por dia na tabela
- ✅ Caixa de seleção do dia, para selecionar os atendimentos daquele dia exibidos na página
- ✅ Caixa extra para selecionar atendimentos do mesmo cliente e dia, mantendo a seleção individual
- ✅ Reagendamento rápido pelas setas ao lado da data, utilizando o fluxo nativo do sistema
- ✅ Paginação nativa preservada; sem carregamento global automático de todas as páginas

> **Seleções e ordenação:** operam sobre os atendimentos carregados na página atual. A caixa extra por cliente não seleciona automaticamente registros de outras páginas. A versão 0.7.93 retoma a base leve da 0.7.78, sem o mecanismo de ordenação global das versões intermediárias.

### 🔔 Notificações inteligentes

- ✅ Avisos de pagamento recebido e atendimento com falha
- ✅ Alertas visuais distintos e efeitos sonoros configuráveis
- ✅ Avisos no topo com duração ajustável de até 10 segundos
- ✅ Notificações compactas e persistentes no canto da tela, com opção de fechar individualmente ou todas
- ✅ Consulta da razão social do cliente quando disponível no cadastro

### 📄 Documentação ambiental (CTR)

- ✅ Botão individual **Exibir CTR** na listagem de atendimentos
- ✅ Ação **Exibir CTRs selecionadas** para abrir múltiplas documentações
- ✅ Abertura em grupos de até **5 guias**, com barra de progresso e contagem regressiva
- ✅ Intervalo entre grupos configurável em **Configurações → CTR** (1 a 30 segundos; padrão 20 segundos)
- ✅ Suporte à seleção de atendimentos na aba **Concluídos**, inclusive quando **Gerar MTR** não estiver presente
- ✅ Utiliza o endereço de visualização da documentação externa disponibilizado pelo sistema

> **Importante:** o intervalo controla somente a abertura das guias; o script não confirma a conclusão dos downloads. O OCS exibe as CTRs; não gera nem baixa automaticamente os PDFs. O botão de download do comprovante do pedido foi removido. O navegador pode solicitar permissão para abrir várias guias.

### ⚙️ Configurações

- ✅ Acesso pelo ícone de ferramentas na barra lateral
- ✅ Preferências para notificações, recursos financeiros, atendimentos e CTR
- ✅ Aba **Atendimentos** para ativar ou desativar separadamente a seleção por dia e por cliente
- ✅ Consulta de novas versões publicadas no GitHub
- ✅ Preferências armazenadas localmente no navegador

---

## 📥 Instalação

**1.** Instale a extensão **Tampermonkey** em um navegador compatível.

**2.** Clique no botão de instalação:

<div align="center">

[![INSTALAR OCS](https://img.shields.io/badge/INSTALAR%20OCS-008000?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js)

</div>

**3.** Confirme a instalação no Tampermonkey.

**4.** Acesse o [Caçambas Online](https://app.cacambasonline.com/) e entre no painel de parceiros.

**5.** Para ajustar as preferências, clique no ícone amarelo de ferramentas da barra lateral.

---

## ⚙️ Como funciona

**Para ordenar atendimentos:** acesse **Atendimentos** e clique em **Ordenar**. A organização considera a data, o tipo de serviço e as trocas identificadas pelo mesmo cliente na mesma data.

**Para selecionar um dia:** marque a caixa adicional na faixa azul da data. Para selecionar atendimentos do mesmo cliente, use a caixa extra junto à seleção individual. Ambas podem ser desativadas em **Configurações → Atendimentos**.

**Para exibir uma CTR:** acesse **Atendimentos**, localize o atendimento e utilize **Exibir CTR**. A documentação abre em outra guia quando o endereço estiver disponível.

**Para exibir várias CTRs:** selecione os atendimentos, abra **AÇÕES** e escolha **Exibir CTRs selecionadas**. Atendimentos sem documentação disponível podem não ser abertos.

**Para usar os recursos financeiros:** acesse a área de transações financeiras. Os indicadores, filtros e atalhos são incorporados à tela correspondente.

---

## 🔄 Atualizações pelo GitHub

O userscript declara `@updateURL` e `@downloadURL` apontando para o arquivo `OCS.user.js` da branch `main` deste repositório.

Quando uma versão nova for publicada, o Tampermonkey poderá detectá-la e instalá-la conforme as configurações da extensão. O painel OCS também permite consultar atualizações.

**Para publicar esta versão:** extraia o ZIP, envie `OCS.user.js` e `README.md` para a raiz do repositório, substitua os arquivos anteriores e registre um commit. O ZIP é um pacote de publicação; **não publica automaticamente no GitHub**.

---

## 🛠️ Informações técnicas

| Informação | Detalhes |
|---|---|
| Projeto | OCS \| Caçambas Online |
| Versão | **0.7.93** |
| Tecnologia | JavaScript (userscript) |
| Gerenciador | Tampermonkey |
| Sistema-alvo | Caçambas Online — painel de parceiros |
| Escopo | `https://app.cacambasonline.com/partner_area/*` |
| Atualizações | GitHub, branch `main` |
| Autor | Tarcísio Silveira |
| Organização | OCS Remoção de Caçambas |

---

## 📝 Histórico de versões recentes

| Versão | Alteração principal |
|---|---|
| **0.7.93** | Corrige a contagem de CTRs selecionadas, ignorando caixas auxiliares de dia e cliente |


| Versão | Alteração principal |
|---|---|
| **0.7.93** | Agrupamento de trocas por cliente e data, mesmo com endereços diferentes |
| **0.7.91** | Retorno à base leve 0.7.78; seleção por dia e por cliente com opções em Configurações |
| **0.7.78** | Botão Ordenar compacto e ajustes de paginação |
| **0.7.77** | Ordenação por data com separadores visuais de dia |
| **0.7.75** | Ordenação de trocas com entrega antes da coleta |
| **0.7.73** | Reagendamento rápido pela rota nativa do sistema |
| **0.7.67** | Ajustes das CTRs selecionadas e intervalo configurável entre lotes |
| **0.7.62** | Remoção do download de comprovante do pedido |
| **0.7.58** | Exibição individual e múltipla de CTRs |
| **0.7.49** | Painel de configurações e consulta de atualizações |

---

## ⚠️ Observações importantes

Este é um projeto **independente**, sem vínculo oficial com a plataforma Caçambas Online.

Algumas funções utilizam recursos nativos do sistema, inclusive a criação e edição de lançamentos financeiros quando acionadas pelo usuário. Confira os dados antes de confirmar operações.

O funcionamento depende da estrutura do site, das permissões, da sessão autenticada e das configurações do navegador. Mudanças na plataforma podem exigir adaptações. A versão 0.7.93 requer validação prática no ambiente real, especialmente após mudanças de filtros e abas.

---

<div align="center">

**Desenvolvido por Tarcísio Silveira**

**OCS Remoção de Caçambas**

Versão **0.7.93**

</div>
