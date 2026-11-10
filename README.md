<div align="center">

# 🛠️ OCS | Caçambas Online

### Gestão financeira, notificações inteligentes e atalhos de CTR

**Userscript independente para otimizar rotinas operacionais e financeiras no painel de parceiros do Caçambas Online.**

<br>

[![Instalar no Tampermonkey](https://img.shields.io/badge/INSTALAR%20OCS-008000?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js)

<br>

![Versão](https://img.shields.io/badge/Versão-0.7.63-blue?style=flat-square)
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

### 🔔 Notificações inteligentes

- ✅ Avisos de pagamento recebido e atendimento com falha
- ✅ Alertas visuais distintos e efeitos sonoros configuráveis
- ✅ Avisos no topo com duração ajustável de até 10 segundos
- ✅ Notificações compactas e persistentes no canto da tela, com opção de fechar individualmente ou todas
- ✅ Consulta da razão social do cliente quando disponível no cadastro

### 📄 Documentação ambiental (CTR)

- ✅ Botão individual **Exibir CTR** na listagem de atendimentos
- ✅ Ação **Exibir CTRs selecionadas** para abrir múltiplas documentações
- ✅ Suporte à seleção de atendimentos na aba **Concluídos**, inclusive quando a opção **Gerar MTR** não estiver presente
- ✅ Utiliza o endereço de visualização da documentação externa disponibilizado pelo sistema

> **Importante:** o OCS exibe as CTRs; não gera nem baixa automaticamente os PDFs. O botão de download do comprovante do pedido foi removido.

### ⚙️ Configurações

- ✅ Acesso pelo ícone de ferramentas na barra lateral
- ✅ Preferências para notificações, recursos financeiros e CTR
- ✅ Consulta de novas versões publicadas no GitHub
- ✅ Preferências armazenadas localmente no navegador

---

## 📥 Instalação

**1.** Instale a extensão **Tampermonkey** em um navegador compatível.

**2.** Clique no botão de instalação:

<div align="center">

[![INSTALAR OCS](https://img.shields.io/badge/INSTALAR%20OCS-008000?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js)

</div>

**3.** Confirme a instalação na tela do Tampermonkey.

**4.** Acesse o [Caçambas Online](https://app.cacambasonline.com/) e entre no painel de parceiros.

**5.** Para ajustar as preferências, clique no ícone amarelo de ferramentas da barra lateral.

---

## ⚙️ Como funciona

O script é executado nas páginas do painel de parceiros (`/partner_area/*`) e acrescenta recursos à interface existente, sem substituir o sistema original.

**Para exibir uma CTR:** acesse **Atendimentos**, localize o atendimento e utilize o botão **Exibir CTR**. A documentação é aberta em outra guia quando o endereço estiver disponível.

**Para exibir várias CTRs:** selecione os atendimentos desejados, abra **AÇÕES** e escolha **Exibir CTRs selecionadas**. O navegador pode solicitar autorização para abrir várias guias; atendimentos sem documentação disponível podem não ser abertos.

**Para usar os recursos financeiros:** acesse a área de transações financeiras. Os indicadores, filtros e atalhos são incorporados à tela correspondente.

---

## 🔄 Atualizações pelo GitHub

O userscript declara os endereços `@updateURL` e `@downloadURL` apontando para o arquivo `OCS.user.js` da branch `main` deste repositório.

Quando uma versão nova for publicada, o Tampermonkey poderá detectá-la e instalá-la de acordo com as configurações da extensão. O painel OCS também oferece consulta de atualizações.

**Para publicar uma nova versão:** atualize o `OCS.user.js` e o `README.md` na raiz do repositório e registre as alterações com um commit.

---

## 🛠️ Informações técnicas

| Informação | Detalhes |
|---|---|
| Projeto | OCS \| Caçambas Online |
| Versão | 0.7.63 |
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
| **0.7.63** | Ajuste da ação de CTRs selecionadas na aba Concluídos |
| **0.7.62** | Remoção do botão de download do comprovante do pedido; manutenção dos atalhos CTR |
| **0.7.60** | Atalhos individuais de CTR e tentativa de download do pedido (posteriormente removida) |
| **0.7.58** | Exibição individual e múltipla de CTRs |
| **0.7.49** | Painel de configurações e consulta de atualizações |

---

## ⚠️ Observações importantes

Este é um projeto **independente**, sem vínculo oficial com a plataforma Caçambas Online.

Algumas funções utilizam os recursos nativos do sistema, inclusive a criação e edição de lançamentos financeiros quando acionadas pelo usuário. Portanto, confira os dados antes de confirmar operações.

O funcionamento depende da estrutura e das permissões do site, da sessão autenticada e das configurações do navegador. Mudanças na plataforma podem exigir adaptações no script. A versão 0.7.63 ainda requer validação prática das ações de CTR na interface real.

---

<div align="center">

**Desenvolvido por Tarcísio Silveira**

**OCS Remoção de Caçambas**

Versão **0.7.63**

</div>
