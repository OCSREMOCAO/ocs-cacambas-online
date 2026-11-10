// ==UserScript==
// @name         OCS | Caçambas Online
// @namespace    OCS-CacambasOnline
// @version      0.7.59
// @author       Tarcisio
// @description  Gestão financeira, anexos, indicadores, filtros, juros, duplicatas e notificações inteligentes de pagamentos e atendimentos.
// @match        https://app.cacambasonline.com/partner_area/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js
// @downloadURL  https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js
// @run-at       document-idle
// ==/UserScript==

/*
 * OCS — Otimizações Caçambas Online
 * Gestão Financeira • Alertas • Produtividade
 * Autor: Tarcisio
 * Script independente para melhorias operacionais e financeiras no Caçambas Online.
 * Não é uma ferramenta oficial da plataforma.
 *
 * v0.7.59 — Atalhos distintos: exibir CTR e baixar comprovante do pedido.
 * v0.7.58 — Exibição individual e múltipla de CTR.
 * v0.7.56 — Ícone Ferramentas (chave inglesa) amarelo, robusto e integrado à barra lateral.
 * v0.7.55 — Ícone de configurações nativo, maior e mais robusto.
 * v0.7.54 — Correção de desaparecimento da engrenagem após atualização dinâmica da barra lateral.
 * v0.7.50 — Ícone amarelo de configurações integrado à barra lateral marrom.
 * v0.7.49 — Painel Geral / Financeiro / Atualizações, preferências persistentes.
 * HISTÓRICO DE ALTERAÇÕES
 * v0.7.59 — Identidade e descrição do script atualizadas no Tampermonkey.
 * v0.7.46 — Consulta da razão social para identificação do cliente nos alertas.
 * v0.7.45 — Visual harmonizado e maior legibilidade do nome do cliente.
 * v0.7.44 — Botão para fechar todas as notificações abaixo dos quadradinhos.
 * v0.7.43 — Ação para fechar todas as notificações pendentes.
 * v0.7.42 — Nome do cliente nos avisos de pagamento.
 * v0.7.41 — Notificações individuais compactas, estilo Grepolis.
 *
 * Compatibilidade: namespace, permissões, seletores e chaves de armazenamento
 * existentes foram preservados para não afetar dados ou funcionalidades.
 */

(function () {
    'use strict';

    const VERSION = '0.7.59';
    const PREFIX = 'ocs0739';

    if (window.__OCS_0739__) return;
    window.__OCS_0739__ = true;

    const OCS_SETTINGS_KEY = 'ocs-settings-v0749';
    const OCS_DEFAULTS = Object.freeze({enabled:true, top:true, corner:true, sound:true,
        duration:10, summary:true, filters:true, attachments:true, duplicates:true, interest:true, autoUpdates:true, ctrSingle:true, ctrBatch:true, orderPdf:true});
    function readOCSSettings() {
        try {
            const stored = JSON.parse(localStorage.getItem(OCS_SETTINGS_KEY) || '{}');
            const result = {...OCS_DEFAULTS};
            for (const key of Object.keys(result)) {
                if (key === 'duration') result.duration = Math.min(10, Math.max(1, Number(stored.duration) || 10));
                else if (typeof stored[key] === 'boolean') result[key] = stored[key];
            }
            // Mantém o antigo ajuste de som de versões anteriores.
            if (!Object.hasOwn(stored, 'sound') && localStorage.getItem('ocs0736-sound-enabled') === 'false') result.sound = false;
            return result;
        } catch (_) { return {...OCS_DEFAULTS}; }
    }
    let ocsSettings = readOCSSettings();
    function saveOCSSettings(next) {
        ocsSettings = {...ocsSettings, ...next};
        ocsSettings.duration = Math.min(10, Math.max(1, Number(ocsSettings.duration) || 10));
        localStorage.setItem(OCS_SETTINGS_KEY, JSON.stringify(ocsSettings));
        localStorage.setItem('ocs0736-sound-enabled', String(ocsSettings.sound));
        document.dispatchEvent(new CustomEvent('ocs:settings-changed'));
    }
    const OCS_UPDATE_URL = 'https://raw.githubusercontent.com/OCSREMOCAO/ocs-cacambas-online/main/OCS.user.js';
    const OCS_REPOSITORY = 'https://github.com/OCSREMOCAO/ocs-cacambas-online';
    function versionCompare(a,b) {
        const aa = String(a).split('.').map(x=>parseInt(x,10)||0);
        const bb = String(b).split('.').map(x=>parseInt(x,10)||0);
        for(let i=0;i<Math.max(aa.length,bb.length);i++) if((aa[i]||0)!==(bb[i]||0)) return (aa[i]||0)-(bb[i]||0);
        return 0;
    }
    let ocsLatest = null;
    let ocsUpdateCheckedAt = null;
    async function checkOCSUpdate() {
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(),10000);
        try {
            const response = await fetch(OCS_UPDATE_URL + '?ocs_check=' + Date.now(),
                {cache:'no-store',signal:controller.signal});
            if (!response.ok) throw new Error('GitHub retornou HTTP '+response.status);
            const header = (await response.text()).slice(0,3500);
            const version = header.match(/^\/\/\s*@version\s+(\d+(?:\.\d+)+)/m)?.[1];
            if (!version) throw new Error('Versão não encontrada no arquivo publicado.');
            ocsLatest = version;
            ocsUpdateCheckedAt = Date.now();
            return {version, available:versionCompare(version, VERSION)>0};
        } finally {clearTimeout(timer);}
    }
    function initOCSPanel() {
        const STYLE = 'ocs049-settings-css';
        if (!document.getElementById(STYLE)) {
            const css = document.createElement('style'); css.id=STYLE;
            css.textContent = `
            #ocs049-gear{position:static!important;inset:auto!important;background:transparent!important;color:#ffca00!important;border:0!important;border-radius:0!important;width:100%!important;height:39px!important;box-shadow:none!important;cursor:pointer!important;font-size:23px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;line-height:1!important;transition:background .15s ease!important}
            #ocs049-gear-item{display:list-item!important;position:relative!important;list-style:none!important;margin:0!important;padding:0!important;width:100%!important;background:transparent!important}
            #ocs049-gear:hover,#ocs049-gear:focus-visible{background:#421f17!important;color:#ffe35c!important;outline:none!important}
            #ocs049-gear .ocs049-native-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:26px!important;height:26px!important;font-family:"Material Icons"!important;font-weight:normal!important;font-style:normal!important;font-size:26px!important;line-height:1!important;letter-spacing:normal!important;text-transform:none!important;white-space:nowrap!important;word-wrap:normal!important;direction:ltr!important;-webkit-font-feature-settings:"liga"!important;font-feature-settings:"liga"!important;-webkit-font-smoothing:antialiased!important;filter:drop-shadow(0 0 .25px currentColor)!important}
            #ocs049-gear-item .ocs-update-dot{position:absolute!important;right:3px!important;top:2px!important;width:10px!important;height:10px!important;border-radius:50%!important;background:#f04b36!important;border:2px solid #2b1010!important;box-shadow:0 0 0 1px #ffe04b!important;pointer-events:none!important}
            #ocs049-modal{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#0008!important;padding:12px!important;font:14px Arial,sans-serif!important}
            #ocs049-modal[hidden]{display:none!important}
            #ocs049-modal *{box-sizing:border-box!important}
            #ocs049-panel{background:#fffdf9!important;color:#342b26!important;border-radius:14px!important;max-width:560px!important;width:100%!important;max-height:90vh!important;overflow:auto!important;box-shadow:0 16px 55px #0006!important;padding:20px!important}
            #ocs049-panel h2{font-size:19px!important;margin:0!important;color:#342b26!important}
            #ocs049-panel .ocs049-muted{color:#756b64!important;font-size:12px!important;line-height:1.5!important}
            #ocs049-panel .ocs049-tabs{display:flex!important;gap:5px!important;margin:16px 0!important}
            #ocs049-panel .ocs049-tab{flex:1!important;border:1px solid #e0d4c8!important;border-radius:7px!important;background:#f7f2ec!important;color:#4a3d35!important;padding:10px 4px!important;cursor:pointer!important;font-weight:bold!important;font-size:12px!important}
            #ocs049-panel .ocs049-tab[aria-selected=true]{background:#205d3a!important;color:#fff!important;border-color:#205d3a!important}
            #ocs049-panel .ocs049-row{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:14px!important;padding:11px 2px!important;border-bottom:1px solid #eee6df!important;cursor:pointer!important}
            #ocs049-panel input[type=checkbox]{width:19px!important;height:19px!important;accent-color:#21804b!important;flex-shrink:0!important;cursor:pointer!important}
            #ocs049-panel input[type=range]{width:100%!important;accent-color:#21804b!important}
            #ocs049-panel .ocs049-actions{display:flex!important;justify-content:flex-end!important;gap:9px!important;margin-top:20px!important}
            #ocs049-panel .ocs049-btn{background:#205d3a!important;color:#fff!important;border:0!important;border-radius:7px!important;padding:10px 13px!important;cursor:pointer!important;font-size:13px!important}
            #ocs049-panel .ocs049-secondary{background:#eee7df!important;color:#4a3d35!important}
            #ocs049-panel .ocs049-status{margin-top:12px!important;font-size:12px!important;line-height:1.5!important;white-space:normal!important}
            #ocs049-panel .ocs049-version{font-size:23px!important;font-weight:bold!important;color:#205d3a!important;margin:10px 0!important}
            `;document.head.appendChild(css);
        }
        if (document.getElementById('ocs049-gear')) return;
        const gear=document.createElement('button');gear.id='ocs049-gear';gear.type='button';gear.innerHTML='<span class="ocs049-native-icon material-icons" aria-hidden="true">build</span>';gear.title='Configurações OCS';
        gear.setAttribute('aria-label','Abrir configurações OCS');
        // Insere como um item real da barra marrom, após o último ícone
        // do grupo superior (documento/relatórios), nunca fixo na janela.
        const gearItem=document.createElement('li');
        gearItem.id='ocs049-gear-item';
        gearItem.appendChild(gear);
        function mountGearInSidebar() {
            const nav=document.querySelector('.nav_modules-nav, .nav-modules-nav, .nav-modules ul, .nav_modules ul');
            if (!nav) return false;
            const list=nav.matches('ul,ol') ? nav : nav.querySelector('ul,ol');
            if (!list) return false;
            const items=[...list.children].filter(el=>el.tagName==='LI' && el!==gearItem);
            if (!items.length) return false;
            // Insere logo após o ícone de documento, que é o último
            // item do conjunto de ícones superior da barra lateral.
            const documentItem=items.find(li => {
                const icon=li.querySelector('.material-icons,.material-icons-outlined,.material-symbols-outlined');
                return icon && /^(description|insert_drive_file|article|assignment|receipt|text_snippet)$/i.test((icon.textContent||'').trim());
            });
            const anchor=documentItem || items[items.length-1];
            if (anchor.nextElementSibling!==gearItem) anchor.after(gearItem);
            return true;
        }
        // O Caçambas Online recria a lista do menu em navegações internas.
        // O observador restaura o mesmo botão, sem recriar eventos ou painel.
        let gearMountQueued = false;
        function queueGearMount() {
            if (gearMountQueued) return;
            gearMountQueued = true;
            requestAnimationFrame(() => {
                gearMountQueued = false;
                mountGearInSidebar();
            });
        }
        mountGearInSidebar();
        const sidebarObserver = new MutationObserver(() => {
            const list = document.querySelector('.nav_modules-nav, .nav-modules-nav, .nav-modules ul, .nav_modules ul');
            if (!list) return;
            // Não movimenta a engrenagem quando ela já está no lugar.
            if (!gearItem.isConnected || !list.contains(gearItem)) queueGearMount();
            if (!overlay.isConnected) document.body.appendChild(overlay);
        });
        sidebarObserver.observe(document.body, {childList:true,subtree:true});
        // Proteção adicional contra alterações de menu que não geram
        // eventos de navegação. Verifica apenas a presença do item.
        setInterval(() => {
            if (!gearItem.isConnected) mountGearInSidebar();
            if (!overlay.isConnected) document.body.appendChild(overlay);
        }, 2500);
        document.addEventListener('ocs:sidebar-ready', queueGearMount);
        const overlay=document.createElement('div');overlay.id='ocs049-modal';overlay.hidden=true;
        const panel=document.createElement('section');panel.id='ocs049-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Configurações OCS');
        overlay.appendChild(panel);document.body.appendChild(overlay);
        let draft={...ocsSettings};let tab='general';let status='';
        function element(tag,txt,cls) {const el=document.createElement(tag);if(txt!==undefined)el.textContent=txt;if(cls)el.className=cls;return el;}
        function row(parent,key,label,desc) {
            const line=element('label',undefined,'ocs049-row');const info=element('span');info.appendChild(element('strong',label));
            if(desc)info.appendChild(element('div',desc,'ocs049-muted'));
            const check=document.createElement('input');check.type='checkbox';check.checked=!!draft[key];check.addEventListener('change',()=>{draft[key]=check.checked;});
            line.append(info,check);parent.appendChild(line);
        }
        function action(label,callback,secondary=false) {
            const button=element('button',label,'ocs049-btn'+(secondary?' ocs049-secondary':''));button.type='button';button.addEventListener('click',callback);return button;
        }
        function render() {
            panel.replaceChildren();
            const head=element('div');head.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px';
            head.appendChild(element('h2','⚙ OCS | Configurações'));
            head.appendChild(action('✕',()=>{overlay.hidden=true},true));panel.appendChild(head);
            panel.appendChild(element('div','Gestão financeira, notificações e atualizações','ocs049-muted'));
            const tabs=element('div',undefined,'ocs049-tabs');
            for(const [id,label] of [['general','Geral'],['finance','Financeiro'],['ctr','CTR'],['updates','Atualizações']]){
                const button=element('button',label,'ocs049-tab');button.type='button';button.setAttribute('aria-selected',String(tab===id));
                button.addEventListener('click',()=>{tab=id;status='';render();});tabs.appendChild(button);
            }panel.appendChild(tabs);
            const body=element('div');panel.appendChild(body);
            if(tab==='general') {
                row(body,'enabled','Ativar OCS completo','Inclui todas as melhorias financeiras e notificações.');
                row(body,'top','Notificações no topo');row(body,'corner','Notificações no canto da tela');
                row(body,'sound','Sons dos alertas');
                const duration=element('div');duration.style.marginTop='17px';
                const label=element('strong','Tempo das notificações no topo: '+draft.duration+'s');
                const range=document.createElement('input');range.type='range';range.min='1';range.max='10';range.step='1';range.value=String(draft.duration);
                range.addEventListener('input',()=>{draft.duration=Number(range.value);label.textContent='Tempo das notificações no topo: '+draft.duration+'s';});
                duration.append(label,range,element('div','Mesmo tempo para alertas verdes e vermelhos. Máximo: 10 segundos.','ocs049-muted'));body.appendChild(duration);
            } else if(tab==='finance') {
                body.appendChild(element('div','Todas as opções vêm ativadas por padrão.','ocs049-muted'));
                row(body,'summary','Resumo financeiro e indicadores');row(body,'filters','Filtros dos indicadores');
                row(body,'attachments','Anexos e ícones de clipe');row(body,'duplicates','Duplicar lançamentos');
                row(body,'interest','Adicionar juros');
                body.appendChild(element('div','Ao desligar um recurso, os elementos do OCS correspondentes serão ocultados ou removidos; recursos nativos do site permanecem intactos.','ocs049-muted'));
            } else if(tab==='ctr') {
                body.appendChild(element('div','Atalhos de exibição da documentação ambiental. Não utiliza a opção Imprimir Documentação.','ocs049-muted'));
                row(body,'ctrSingle','Exibir CTR individual','Mantém o atalho de visualização da documentação ambiental.');
                row(body,'orderPdf','Baixar comprovante do pedido','Adiciona um segundo atalho que utiliza o download nativo do pedido.');
                row(body,'ctrBatch','Exibir CTRs selecionados','Adiciona a opção em AÇÕES, abaixo de Gerar MTR, quando houver seleção.');
                body.appendChild(element('div','Os documentos são abertos em novas abas pelo endereço de Exibir Documentação Externa. O site externo pode exigir sessão ativa e o navegador pode bloquear múltiplas abas.','ocs049-muted'));
            } else {
                body.appendChild(element('div','Versão instalada','ocs049-muted'));
                body.appendChild(element('div','v'+VERSION,'ocs049-version'));
                row(body,'autoUpdates','Verificar atualizações automaticamente','Consulta o GitHub periodicamente; a instalação depende do Tampermonkey.');
                const actions=element('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:16px';
                const check=action('↻ Verificar atualizações',async()=>{
                    status='Verificando GitHub…';render();
                    try {const result=await checkOCSUpdate();if(result.available)markUpdateAvailable(result.version);status=result.available?'Nova versão '+result.version+' disponível. Clique em Instalar atualização.':'OCS atualizado (v'+VERSION+').';}
                    catch(e){status='Não foi possível verificar: '+e.message;}render();
                });actions.appendChild(check);
                if(ocsLatest && versionCompare(ocsLatest,VERSION)>0) actions.appendChild(action('Instalar atualização',()=>{
                    // O Tampermonkey reconhece arquivos .user.js e exibe a confirmação de instalação.
                    window.open(OCS_UPDATE_URL,'_blank','noopener,noreferrer');
                }));
                actions.appendChild(action('Abrir GitHub',()=>window.open(OCS_REPOSITORY,'_blank','noopener,noreferrer'),true));
                body.appendChild(actions);
                body.appendChild(element('div',status || (ocsUpdateCheckedAt?'Última consulta: '+new Date(ocsUpdateCheckedAt).toLocaleString('pt-BR'):'Clique em Verificar atualizações para consultar a versão publicada.'),'ocs049-status'));
                body.appendChild(element('div','A atualização automática do Tampermonkey é gerenciada pela extensão; esta opção controla a verificação periódica e o aviso do OCS.','ocs049-muted'));
            }
            const foot=element('div',undefined,'ocs049-actions');
            foot.appendChild(action('Restaurar padrões',()=>{draft={...OCS_DEFAULTS};status='Padrões restaurados na prévia. Clique em Salvar.';render();},true));
            foot.appendChild(action('Salvar',()=>{saveOCSSettings(draft);overlay.hidden=true;location.reload();}));
            panel.appendChild(foot);
        }
        // O menu do site tem handlers delegados: impede que o clique na
        // engrenagem seja tratado como navegação nativa.
        for (const type of ['pointerdown','mousedown','mouseup','click']) {
            gear.addEventListener(type, event => {
                event.stopPropagation();
                if (type === 'click') {
                    event.preventDefault();
                    draft={...ocsSettings};status='';render();
                    if (!overlay.isConnected) document.body.appendChild(overlay);
                    overlay.hidden=false;
                }
            });
        }
        gear.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        });
        overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true;});
        document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.hidden=true;});
        function markUpdateAvailable(version) {
            if (!gearItem.querySelector('.ocs-update-dot')) {
                const dot=document.createElement('span');
                dot.className='ocs-update-dot';
                dot.setAttribute('aria-hidden','true');
                gearItem.appendChild(dot);
            }
            gear.title='Configurações OCS — atualização '+version+' disponível';
            gear.setAttribute('aria-label',gear.title);
        }
        // Verificação de novas versões, sem baixar/instalar código automaticamente.
        async function backgroundCheck() {
            if(!ocsSettings.enabled || !ocsSettings.autoUpdates) return;
            try {const result=await checkOCSUpdate();
                if(result.available) markUpdateAvailable(result.version);
                if(result.available && !document.getElementById('ocs049-update-hint')) {
                    const hint=element('button','OCS v'+result.version+' disponível · Atualizar');hint.id='ocs049-update-hint';hint.type='button';
                    hint.style.cssText='position:fixed;bottom:58px;left:38px;z-index:2147483644;background:#205d3a;color:white;border:0;border-radius:8px;padding:10px;cursor:pointer;box-shadow:0 2px 10px #0004';
                    hint.addEventListener('click',()=>{tab='updates';draft={...ocsSettings};status='Nova versão '+result.version+' disponível.';render();overlay.hidden=false;hint.remove();});
                    document.body.appendChild(hint);
                }
            }catch(e){console.debug('[OCS] Atualizações:',e.message);}
        }
        setTimeout(backgroundCheck,12000);
        setInterval(backgroundCheck,6*60*60*1000);
    }
    if (document.body) initOCSPanel();
    else document.addEventListener('DOMContentLoaded',initOCSPanel,{once:true});

    function initPaymentNotifications() {
        const STYLE_ID = 'ocs0739-payment-style';
        const BANNER_ID = 'ocs0739-payment-banner';
        const STORAGE_KEY = 'ocs0737-notification-seen';
        let hideTimer;
        let checkTimer;
        let initialized = false;
        const SOUND_KEY = 'ocs0736-sound-enabled';
        let soundEnabled = ocsSettings.sound;
        let audioContext = null;
        let audioUnlocked = false;

        function unlockAudio() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                audioContext ||= new AudioCtx();
                if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
                audioUnlocked = true;
            } catch (e) { console.debug('[OCS] Audio indisponível', e); }
        }
        // O navegador exige uma interação do usuário antes de tocar áudio.
        document.addEventListener('pointerdown', unlockAudio, { passive: true });
        document.addEventListener('keydown', unlockAudio);

        function playCashRegister() {
            if (!ocsSettings.enabled || !ocsSettings.sound || !audioUnlocked) return;
            try {
                const ctx = audioContext;
                if (!ctx || ctx.state !== 'running') return;
                // Efeito original de moeda retrô 8-bit: duas alturas dentro de
                // um único aviso muito curto (160 ms), sem intervalo ou eco.
                const start = ctx.currentTime + 0.012;
                const total = 0.16;
                const master = ctx.createGain();
                master.gain.setValueAtTime(0.0001, start);
                master.gain.linearRampToValueAtTime(0.11, start + 0.004);
                master.gain.setValueAtTime(0.11, start + 0.105);
                master.gain.exponentialRampToValueAtTime(0.0001, start + total);
                master.connect(ctx.destination);
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(987.77, start);
                osc.frequency.setValueAtTime(1318.51, start + 0.055);
                osc.connect(master);
                osc.start(start);
                osc.stop(start + total + 0.005);
            } catch (e) {
                console.debug('[OCS] Não foi possível tocar o aviso', e);
            }
        }

        function playFailureSound() {
            if (!ocsSettings.enabled || !ocsSettings.sound || !audioUnlocked) return;
            try {
                const ctx = audioContext;
                if (!ctx || ctx.state !== 'running') return;
                // Um aviso único grave e curto, distinto da moeda de pagamento.
                const start = ctx.currentTime + 0.01;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(490, start);
                osc.frequency.exponentialRampToValueAtTime(230, start + 0.24);
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.linearRampToValueAtTime(0.15, start + 0.015);
                gain.gain.setValueAtTime(0.15, start + 0.10);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.27);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.28);
            } catch (e) { console.debug('[OCS] Falha no som do atendimento', e); }
        }

        async function resolveCustomerName(item) {
            if (!item.href || item.kind !== 'payment') return '';
            try {
                const source = new URL(item.href, location.origin);
                if (source.origin !== location.origin || !source.pathname.startsWith('/partner_area/')) return '';
                async function load(url) {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 6500);
                    try {
                        const response = await fetch(url, {credentials:'same-origin',signal:controller.signal,
                            headers:{Accept:'text/html,application/xhtml+xml,*/*'}});
                        if (!response.ok) return null;
                        return {html:await response.text(), url:response.url};
                    } finally {clearTimeout(timer);}
                }
                function extract(doc, terms) {
                    const els = [...doc.querySelectorAll('label,dt,th,span,div,p,strong,b')]
                        .filter(el => el.children.length === 0 && terms.test((el.textContent || '').trim()));
                    for (const el of els) {
                        const parent = el.parentElement;
                        const input = parent?.querySelector('input:not([type="hidden"]),textarea') ||
                            parent?.nextElementSibling?.querySelector('input:not([type="hidden"]),textarea');
                        if (input?.value?.trim()) return input.value.trim();
                        for (const node of [el.nextElementSibling, parent?.nextElementSibling,
                            ...[...(parent?.children || [])].filter(x => x !== el)]) {
                            const value = (node?.textContent || '').replace(/\s+/g,' ').trim();
                            if (value && value.length < 150 && !terms.test(value)) return value;
                        }
                    }
                    return '';
                }
                function links(html, pattern) {
                    const normalized = html.replace(/\\\//g,'/');
                    return [...new Set((normalized.match(pattern) || []))];
                }
                const first = await load(source.href);
                if (!first) return '';
                let invoice = first;
                const invoicePath = [first.url, ...links(first.html,/\/partner_area\/operational\/invoices\/[a-f\d-]{36}/gi)]
                    .map(x => x.match(/\/partner_area\/operational\/invoices\/[a-f\d-]{36}/i)?.[0]).find(Boolean);
                if (invoicePath && !first.url.includes(invoicePath)) {
                    invoice = await load(new URL(invoicePath, location.origin).href) || first;
                }
                // A razão social verdadeira fica no cadastro do cliente (campo Razão Social).
                // Busca o link do cadastro referenciado pela fatura, nunca o Nome curto.
                const customerPaths = links(invoice.html,
                    /\/partner_area\/operational\/customers\/[a-f\d-]{36}(?:\/edit)?/gi);
                for (const path of customerPaths.slice(0, 3)) {
                    const edit = path.endsWith('/edit') ? path : path + '/edit';
                    const page = await load(new URL(edit, location.origin).href);
                    if (!page) continue;
                    const doc = new DOMParser().parseFromString(page.html,'text/html');
                    const fields = [...doc.querySelectorAll('input[name],textarea[name]')];
                    const social = fields.find(el => /(?:^|\[)(?:company_name|corporate_name|legal_name|razao_social)(?:\]|$)/i.test(el.name));
                    if (social?.value?.trim()) return social.value.trim();
                    const byLabel = extract(doc,/^raz[aã]o social\s*\*?\s*:?$/i);
                    if (byLabel) return byLabel;
                }
                // Fallback: o responsável financeiro da fatura costuma ser a razão social,
                // mas só é usado quando o cadastro não pôde ser consultado.
                const doc = new DOMParser().parseFromString(invoice.html,'text/html');
                return extract(doc,/^respons[aá]vel financeiro\s*:?$/i);
            } catch (_) {return '';}
        }

        let seen;
        try {
            const prior = JSON.parse(localStorage.getItem('ocs0736-payment-seen') || '[]');
            const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            seen = new Set([...prior, ...current]);
        }
        catch (_) { seen = new Set(); }

        function persist() {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-150))); }
            catch (_) { /* armazenamento indisponível */ }
        }

        function getEntries() {
            // Usa somente notificações nativas. Não deduz pagamentos da lista de faturas.
            const links = [...document.querySelectorAll(
                'a.dropdown-item[href*="/activities/"], .dropdown-menu a[href*="/activities/"]'
            )];
            return links.map(link => {
                const body = link.querySelector('.media-body') || link;
                const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
                const kind = /fatura\s+paga/i.test(text) ? 'payment' :
                    /atendimento\s+falhou/i.test(text) ? 'failure' : null;
                if (!kind) return null;
                const href = link.getAttribute('href') || '';
                const key = href.split('?')[0] || text;
                const amount = text.match(/R\$\s*[\d.,]+/i)?.[0] || '';
                const timestamp = body.querySelector('.text-muted')?.textContent.trim() || '';
                const identifier = body.querySelector('.text-primary')?.textContent.trim() || '';
                return { key, kind, amount, timestamp, identifier, href };
            }).filter(Boolean);
        }


        // Caixa de avisos persistente, inspirada na disposição do Grepolis.
        // FIFO: preserva os cinco avisos mais antigos até que o usuário os feche.
        const TRAY_ID = 'ocs0739-notification-tray';
        const TRAY_KEY = 'ocs0739-tray-items';
        let trayItems = [];
        try {
            const stored = JSON.parse(localStorage.getItem(TRAY_KEY) || '[]');
            if (Array.isArray(stored)) trayItems = stored.filter(x => x && x.key && (x.kind === 'payment' || x.kind === 'failure')).slice(0, 5);
        } catch (_) {}
        function persistTray() {
            try { localStorage.setItem(TRAY_KEY, JSON.stringify(trayItems)); } catch (_) {}
        }
        function safeDestination(href) {
            try {
                const u = new URL(href, location.origin);
                return u.origin === location.origin && u.pathname.startsWith('/partner_area/') ? u.href : '';
            } catch (_) { return ''; }
        }
        function ensureTrayStyle() {
            if (document.getElementById('ocs0739-tray-style')) return;
            const style = document.createElement('style');
            style.id = 'ocs0739-tray-style';
            style.textContent = `
              #${TRAY_ID}{position:fixed!important;right:16px!important;bottom:18px!important;
                z-index:2147483645!important;font:13px Arial,sans-serif!important;
                width:46px!important;max-height:calc(100vh - 110px)!important;
                overflow:visible!important;display:flex!important;flex-direction:column!important;
                justify-content:flex-end!important;gap:7px!important;pointer-events:none!important}
              #${TRAY_ID} .ocs-tray-clear-all{position:relative!important;align-self:flex-end!important;flex-shrink:0!important;
                width:44px!important;height:27px!important;pointer-events:auto!important;
                background:#ffffff!important;color:#b42318!important;border:1px solid #d8c9bb!important;
                border-radius:6px!important;font:bold 18px Arial,sans-serif!important;cursor:pointer!important;
                display:flex!important;align-items:center!important;justify-content:center!important;
                box-shadow:0 2px 8px #0006!important}
              #${TRAY_ID} .ocs-tray-clear-all:hover{background:#7f1d1d!important;color:white!important}
              #${TRAY_ID} .ocs-tray-card{box-sizing:border-box!important;position:relative!important;
                align-self:flex-end!important;width:44px!important;min-height:44px!important;
                max-height:44px!important;overflow:hidden!important;pointer-events:auto!important;
                background:#fffdf9!important;color:#35251d!important;border:1px solid #d7c7b8!important;
                border-radius:7px!important;box-shadow:0 3px 12px #321b1540!important;
                padding:0!important;transition:width .16s ease,max-height .16s ease!important}
              #${TRAY_ID} .ocs-tray-card:hover,
              #${TRAY_ID} .ocs-tray-card:focus-within,
              #${TRAY_ID} .ocs-tray-card.ocs-tray-opened{
                width:min(355px,calc(100vw - 32px))!important;max-height:350px!important;
                overflow-y:auto!important}
              #${TRAY_ID} .ocs-tray-payment{border-left:3px solid #15803d!important}
              #${TRAY_ID} .ocs-tray-failure{border-left:3px solid #b91c1c!important}
              #${TRAY_ID} .ocs-tray-card:hover{box-shadow:0 5px 18px #321b1550!important}
              #${TRAY_ID} .ocs-tray-symbol{display:flex!important;align-items:center!important;
                justify-content:center!important;width:42px!important;height:42px!important;
                color:#138a43!important;font:bold 28px Arial,sans-serif!important;flex-shrink:0!important}
              #${TRAY_ID} .ocs-tray-failure .ocs-tray-symbol{color:#c62828!important}
              #${TRAY_ID} .ocs-tray-content{display:none!important;padding:9px 30px 11px 12px!important}
              #${TRAY_ID} .ocs-tray-card:hover .ocs-tray-symbol,
              #${TRAY_ID} .ocs-tray-card:focus-within .ocs-tray-symbol,
              #${TRAY_ID} .ocs-tray-card.ocs-tray-opened .ocs-tray-symbol{display:none!important}
              #${TRAY_ID} .ocs-tray-card:hover .ocs-tray-content,
              #${TRAY_ID} .ocs-tray-card:focus-within .ocs-tray-content,
              #${TRAY_ID} .ocs-tray-card.ocs-tray-opened .ocs-tray-content{display:block!important}
              #${TRAY_ID} .ocs-tray-title{font:bold 13px Arial,sans-serif!important}
              #${TRAY_ID} .ocs-tray-failure .ocs-tray-title{color:#a91e24!important}
              #${TRAY_ID} .ocs-tray-payment .ocs-tray-title{color:#137a38!important}
              #${TRAY_ID} .ocs-tray-meta{font-size:11px!important;color:#65564c!important;margin-top:4px!important}
              #${TRAY_ID} .ocs-tray-close{position:absolute!important;right:5px!important;top:4px!important;
                border:0!important;background:transparent!important;color:#6e5143!important;font-size:18px!important;
                cursor:pointer!important;padding:2px 6px!important;display:none!important}
              #${TRAY_ID} .ocs-tray-card:hover .ocs-tray-close,
              #${TRAY_ID} .ocs-tray-card:focus-within .ocs-tray-close,
              #${TRAY_ID} .ocs-tray-card.ocs-tray-opened .ocs-tray-close{display:block!important}
              #${TRAY_ID} .ocs-tray-more{border:0!important;background:transparent!important;color:#0065a8!important;
                padding:5px 0 0!important;text-decoration:underline!important;cursor:pointer!important;font-size:11px!important}
              #${TRAY_ID} .ocs-tray-details{margin-top:7px!important;border-top:1px solid #e3d7cc!important;
                padding-top:7px!important;line-height:1.5!important;white-space:normal!important}
              #${TRAY_ID} .ocs-tray-details[hidden]{display:none!important}
              #${TRAY_ID} .ocs-tray-open{display:inline-block!important;margin-top:6px!important;
                color:#0065a8!important;text-decoration:underline!important;font-size:12px!important}
            `;
            document.head.appendChild(style);
        }
        function renderTray() {
            ensureTrayStyle();
            let tray = document.getElementById(TRAY_ID);
            if (!tray) {
                tray = document.createElement('aside');
                tray.id = TRAY_ID;
                tray.setAttribute('aria-label', 'Notificações persistentes OCS');
                document.body.appendChild(tray);
            }
            tray.style.display = (ocsSettings.enabled && ocsSettings.corner) ? 'flex' : 'none';
            const expanded = new Set([...tray.querySelectorAll('.ocs-tray-card.ocs-tray-opened')]
                .map(el => el.dataset.key));
            tray.replaceChildren();
            trayItems.forEach(item => {
                const card = document.createElement('section');
                card.className = 'ocs-tray-card ' + (item.kind === 'failure' ? 'ocs-tray-failure' : 'ocs-tray-payment');
                card.dataset.key = item.key;
                if (expanded.has(item.key)) card.classList.add('ocs-tray-opened');
                card.title = item.kind === 'failure' ? 'Atendimento falhou — passe o mouse' : 'Pagamento recebido — passe o mouse';
                const symbol = document.createElement('span');
                symbol.className = 'ocs-tray-symbol';
                symbol.textContent = item.kind === 'failure' ? '!' : '$';
                card.appendChild(symbol);
                const content = document.createElement('div');
                content.className = 'ocs-tray-content';
                const title = document.createElement('div');
                title.className = 'ocs-tray-title';
                title.textContent = item.kind === 'failure' ? '⚠ Atendimento falhou' : '✓ Pagamento recebido' + (item.amount ? ' · ' + item.amount : '');
                content.appendChild(title);
                const meta = document.createElement('div');
                meta.className = 'ocs-tray-meta';
                meta.textContent = [item.identifier, item.timestamp].filter(Boolean).join(' · ');
                content.appendChild(meta);
                if (item.kind === 'payment') {
                    const customerLine = document.createElement('div');
                    customerLine.className = 'ocs-tray-customer';
                    customerLine.style.cssText = 'margin-top:8px;padding:8px 9px;background:#f0f8ef;border-left:3px solid #198b43;border-radius:4px;font-size:14px;line-height:1.4;color:#173d25;font-weight:700;white-space:normal;overflow-wrap:anywhere;';
                    customerLine.textContent = item.customerSource === 'razao-social-v1' && item.customer ? 'Razão social: ' + item.customer : 'Razão social: consultando cadastro…';
                    content.appendChild(customerLine);
                }
                const close = document.createElement('button');
                close.type = 'button'; close.className = 'ocs-tray-close'; close.textContent = '×';
                close.setAttribute('aria-label', 'Fechar esta notificação');
                close.addEventListener('click', () => {
                    trayItems = trayItems.filter(x => x.key !== item.key);
                    persistTray(); renderTray();
                });
                card.appendChild(close);
                const more = document.createElement('button');
                more.type = 'button'; more.className = 'ocs-tray-more';
                more.textContent = 'Ver mais informações';
                const details = document.createElement('div');
                details.className = 'ocs-tray-details'; details.hidden = true;
                const desc = document.createElement('div');
                desc.textContent = item.kind === 'failure' ? 'Situação: atendimento falhou.' : 'Situação: fatura paga.';
                details.appendChild(desc);
                if (item.customer) {
                    const customer = document.createElement('div');
                    customer.textContent = 'Razão social: ' + item.customer;
                    details.appendChild(customer);
                }
                if (item.amount) {
                    const amount = document.createElement('div');
                    amount.textContent = 'Valor: ' + item.amount;
                    details.appendChild(amount);
                }
                if (item.identifier) {
                    const id = document.createElement('div');
                    id.textContent = 'Referência: ' + item.identifier;
                    details.appendChild(id);
                }
                if (item.timestamp) {
                    const when = document.createElement('div');
                    when.textContent = 'Data: ' + item.timestamp;
                    details.appendChild(when);
                }
                const href = safeDestination(item.href);
                if (href) {
                    const open = document.createElement('a');
                    open.className = 'ocs-tray-open';
                    open.href = href;
                    open.textContent = 'Abrir no Caçambas Online';
                    details.appendChild(open);
                }
                function toggleDetails() {
                    details.hidden = !details.hidden;
                    more.textContent = details.hidden ? 'Ver mais informações' : 'Ocultar informações';
                }
                more.addEventListener('click', event => { event.stopPropagation(); toggleDetails(); });
                card.addEventListener('click', event => {
                    if (event.target.closest('button, a')) return;
                    toggleDetails();
                });
                card.style.cursor = 'pointer';
                card.addEventListener('click', event => {
                    if (event.target === symbol) card.classList.toggle('ocs-tray-opened');
                });
                content.appendChild(more);
                content.appendChild(details);
                card.appendChild(content);
                tray.appendChild(card);
            });
            if (trayItems.length) {
                const clearAll = document.createElement('button');
                clearAll.type = 'button';
                clearAll.className = 'ocs-tray-clear-all';
                clearAll.textContent = '×';
                clearAll.title = 'Fechar todas as notificações pendentes';
                clearAll.setAttribute('aria-label', 'Fechar todas as notificações pendentes');
                clearAll.addEventListener('click', () => {
                    trayItems = [];
                    persistTray();
                    renderTray();
                });
                tray.appendChild(clearAll);
            }
        }
        function addToTray(item) {
            if (trayItems.some(x => x.key === item.key) || trayItems.length >= 5) return;
            trayItems.push({...item});
            persistTray();
            renderTray();
            if (item.kind === 'payment') {
                resolveCustomerName(item).then(name => {
                    if (!name) return;
                    const existing = trayItems.find(x => x.key === item.key);
                    if (!existing) return;
                    existing.customer = name;
                    existing.customerSource = 'razao-social-v1';
                    persistTray();
                    renderTray();
                });
            }
        }
        renderTray();
        // Atualiza o nome de pagamentos já guardados em versões anteriores.
        trayItems.filter(item => item.kind === 'payment' && item.customerSource !== 'razao-social-v1').forEach(item => {
            resolveCustomerName(item).then(name => {
                if (!name) return;
                const existing = trayItems.find(x => x.key === item.key);
                if (!existing || existing.customerSource === 'razao-social-v1') return;
                existing.customer = name;
                    existing.customerSource = 'razao-social-v1';
                persistTray();
                renderTray();
            });
        });

        function showPayment(item) {
            if (!document.getElementById(STYLE_ID)) {
                const style = document.createElement('style');
                style.id = STYLE_ID;
                style.textContent = `
                    #${BANNER_ID}{position:fixed!important;top:0!important;left:0!important;right:0!important;
                      z-index:2147483647!important;background:#15803d!important;color:#fff!important;
                      padding:16px 52px 16px 24px!important;box-shadow:0 6px 22px #0004!important;
                      font:600 17px/1.45 Arial,sans-serif!important;text-align:center!important;
                      border-bottom:4px solid #86efac!important;box-sizing:border-box!important;cursor:pointer!important}
                    #${BANNER_ID} .ocs-payment-sub{font-size:13px;font-weight:400;color:#dcfce7}
                    #${BANNER_ID} button{position:absolute;right:18px;top:13px;background:transparent;
                      border:0;color:white;font-size:24px;cursor:pointer}
                    #${BANNER_ID} .ocs-payment-sound{right:56px;font-size:20px}
                `;
                style.textContent += `
                    #${BANNER_ID}.ocs-alert-failure{background:#b91c1c!important;border-bottom-color:#fca5a5!important}
                    #${BANNER_ID}.ocs-alert-failure .ocs-payment-sub{color:#fee2e2!important}
                `;
                document.head.appendChild(style);
            }
            if (!ocsSettings.enabled || !ocsSettings.top) return;
            let banner = document.getElementById(BANNER_ID);
            if (!banner) {
                banner = document.createElement('div');
                banner.id = BANNER_ID;
                banner.setAttribute('role', 'status');
                banner.setAttribute('aria-live', 'polite');
                banner.setAttribute('tabindex', '0');
                banner.setAttribute('title', 'Clique para abrir a notificação');
                banner.innerHTML = '<div class="ocs-payment-main"></div><div class="ocs-payment-sub"></div><button type="button" class="ocs-payment-sound" aria-label="Ativar ou silenciar som"></button><button type="button" class="ocs-payment-close" aria-label="Fechar">×</button>';
                banner.querySelector('.ocs-payment-sound').addEventListener('click', event => {
                    event.stopPropagation();
                    soundEnabled = !soundEnabled;
                    saveOCSSettings({sound:soundEnabled});
                    banner.querySelector('.ocs-payment-sound').textContent = soundEnabled ? '🔊' : '🔇';
                    if (soundEnabled) { unlockAudio(); if (banner.classList.contains('ocs-alert-failure')) playFailureSound(); else playCashRegister(); }
                });
                banner.querySelector('.ocs-payment-close').addEventListener('click', event => {
                    event.stopPropagation();
                    clearTimeout(hideTimer);
                    banner.remove();
                });
                const openPayment = () => {
                    const destination = banner.dataset.paymentHref;
                    if (!destination) return;
                    try {
                        const url = new URL(destination, location.origin);
                        if (url.origin === location.origin && url.pathname.startsWith('/partner_area/')) {
                            location.assign(url.href);
                        }
                    } catch (_) { /* endereço inválido */ }
                };
                banner.addEventListener('click', openPayment);
                banner.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPayment();
                    }
                });
                document.body.appendChild(banner);
            }
            banner.dataset.paymentHref = item.href || '';
            banner.classList.toggle('ocs-alert-failure', item.kind === 'failure');
            banner.querySelector('.ocs-payment-sound').textContent = soundEnabled ? '🔊' : '🔇';
            if (item.kind === 'failure') {
                playFailureSound();
                banner.querySelector('.ocs-payment-main').textContent = '⚠ ATENDIMENTO FALHOU!';
                banner.querySelector('.ocs-payment-sub').textContent =
                    [item.identifier, item.timestamp, 'Clique para abrir o atendimento'].filter(Boolean).join(' · ');
            } else {
                playCashRegister();
                banner.querySelector('.ocs-payment-main').textContent =
                    '✓ PAGAMENTO RECEBIDO! ' + (item.amount || 'Fatura paga');
                banner.querySelector('.ocs-payment-sub').textContent =
                    [item.identifier, item.timestamp, 'Clique para ver quem pagou'].filter(Boolean).join(' · ');
            }
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => banner.remove(), ocsSettings.duration * 1000);
            const currentKey = item.key;
            if (item.kind === 'payment') resolveCustomerName(item).then(name => {
                if (!name || !banner.isConnected || banner.dataset.paymentHref !== item.href) return;
                banner.querySelector('.ocs-payment-sub').textContent =
                    [name, item.identifier, item.timestamp, 'Clique para abrir a fatura'].filter(Boolean).join(' · ');
            });
        }

        function check() {
            const entries = getEntries();
            // Primeira leitura: notificações anteriores não devem ser anunciadas como novas.
            if (!initialized) {
                // Exibe avisos já presentes sem tocar sons ou mostrar faixas.
                // Respeita os cinco primeiros (mais antigos) encontrados.
                entries.slice().reverse().forEach(entry => {
                    seen.add(entry.key);
                    if (ocsSettings.enabled && ocsSettings.corner) addToTray(entry);
                });
                persist();
                initialized = true;
                return;
            }
            for (const entry of entries) {
                if (seen.has(entry.key)) continue;
                seen.add(entry.key);
                persist();
                if (ocsSettings.enabled && ocsSettings.corner) addToTray(entry);
                if (ocsSettings.enabled && ocsSettings.top) showPayment(entry);
            }
        }

        function schedule() {
            clearTimeout(checkTimer);
            checkTimer = setTimeout(check, 180);
        }
        check();
        new MutationObserver(schedule).observe(document.body, {childList:true,subtree:true,characterData:true});
        document.addEventListener('turbo:load', schedule);
        setInterval(check, 5000);
    }

    // Alertas de pagamentos em todas as telas do parceiro.
    initPaymentNotifications();
    // As melhorias financeiras continuam restritas à tela financeira.
    if (!location.pathname.startsWith('/partner_area/financial/transactions')) return;

    const $ = window.jQuery;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    let busy = false;
    let saving = false;
    let refreshQueued = false;
    let filtering = false;

    // =========================================================
    // UTILITÁRIOS
    // =========================================================

    function norm(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function money(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    function parseMoney(value) {
        const text = String(value ?? '');
        const match = text.match(/-?[\d.]+,\d{1,2}/);

        if (match) {
            return Number(
                match[0].replace(/\./g, '').replace(',', '.')
            );
        }

        const number = Number(text.replace(',', '.'));
        return Number.isFinite(number) ? number : null;
    }

    function parseDate(value) {
        const match = String(value ?? '')
            .match(/(\d{2})\/(\d{2})\/(\d{4})/);

        if (!match) return null;

        const date = new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
        );

        return (
            date.getDate() === Number(match[1]) &&
            date.getMonth() === Number(match[2]) - 1 &&
            date.getFullYear() === Number(match[3])
        ) ? date : null;
    }

    function formatDate(date) {
        if (!date) return '';

        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
    }

    function isoDate(date) {
        if (!date) return '';

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function dateNumber(date) {
        return (
            date.getFullYear() * 10000 +
            (date.getMonth() + 1) * 100 +
            date.getDate()
        );
    }

    function visible(element) {
        if (
            !element ||
            !element.isConnected ||
            !element.getClientRects().length
        ) {
            return false;
        }

        const style = getComputedStyle(element);

        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden'
        );
    }

    function meaningful(value) {
        const text = norm(value);

        return !!text && ![
            'selecione',
            'selecione...',
            'categoria',
            'recebido de',
            'pago para',
            'escolha',
            'nao informado'
        ].includes(text);
    }

    function isSNF(value) {
        return /(^|[^a-z0-9])snf(?=$|[^a-z0-9])/i
            .test(String(value || ''));
    }

    function setValue(element, value) {
        if (!element || element.disabled) return false;

        let text = String(value ?? '');

        if (element.type === 'date') {
            const match = text.match(
                /^(\d{2})\/(\d{2})\/(\d{4})$/
            );

            if (match) {
                text = `${match[3]}-${match[2]}-${match[1]}`;
            }
        }

        const prototype =
            element.tagName === 'TEXTAREA'
                ? HTMLTextAreaElement.prototype
                : element.tagName === 'SELECT'
                    ? HTMLSelectElement.prototype
                    : HTMLInputElement.prototype;

        const setter = Object.getOwnPropertyDescriptor(
            prototype,
            'value'
        )?.set;

        if (setter) setter.call(element, text);
        else element.value = text;

        element.dispatchEvent(
            new Event('input', { bubbles: true })
        );

        element.dispatchEvent(
            new Event('change', { bubbles: true })
        );

        return true;
    }

    async function waitFor(callback, timeout = 10000) {
        const started = Date.now();

        while (Date.now() - started < timeout) {
            const result = callback();

            if (result) return result;

            await sleep(150);
        }

        throw new Error('Tempo de espera excedido.');
    }

    function notifySelect(select) {
        if ($) {
            $(select).trigger('change');
        } else {
            select.dispatchEvent(
                new Event('change', { bubbles: true })
            );
        }
    }

    // =========================================================
    // ESTILOS
    // =========================================================

    const style = document.createElement('style');

    style.textContent = `
        .${PREFIX}-clip {
            border: 0;
            background: transparent;
            cursor: pointer;
            padding: 0 2px;
            margin: 0 1px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #087cf0;
        }

        .${PREFIX}-clip.snf {
            color: #e11d48 !important;
        }

        .${PREFIX}-clip i {
            font-size: 19px;
        }

        .${PREFIX}-clip:hover {
            transform: scale(1.12);
        }

        .${PREFIX}-menu-action {
            cursor: pointer;
        }

        .${PREFIX}-menu-action i {
            font-size: 18px;
            vertical-align: middle;
            margin-right: 7px;
        }

        #${PREFIX}-summary {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 9px;
            margin: 12px 0;
            width: 100%;
        }

        .${PREFIX}-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-left: 4px solid var(--color);
            border-radius: 6px;
            padding: 11px;
            min-width: 0;
            text-align: left;
            cursor: pointer;
        }

        .${PREFIX}-card:hover {
            box-shadow: 0 3px 12px #0002;
        }

        .${PREFIX}-card small {
            display: block;
            color: #555;
            font-size: 11px;
        }

        .${PREFIX}-card strong {
            display: block;
            color: var(--color);
            font-size: 16px;
            margin: 6px 0;
            overflow-wrap: anywhere;
        }

        .${PREFIX}-card span {
            font-size: 11px;
            color: #777;
        }

        #${PREFIX}-dialog {
            position: fixed;
            inset: 0;
            z-index: 2147483640;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            background: #0009;
        }

        #${PREFIX}-dialog .ocs-box {
            width: min(460px, 100%);
            max-height: 85vh;
            overflow-y: auto;
            background: white;
            border-radius: 9px;
            padding: 22px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            box-shadow: 0 10px 40px #0004;
        }

        #${PREFIX}-dialog h3 {
            margin: 0 0 14px;
            font-size: 19px;
        }

        #${PREFIX}-dialog .ocs-info {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 5px;
            white-space: pre-line;
            font-size: 13px;
            overflow-wrap: anywhere;
        }

        #${PREFIX}-dialog label {
            display: block;
            margin: 15px 0 6px;
            font-size: 13px;
            font-weight: bold;
        }

        #${PREFIX}-dialog input {
            width: 100%;
            padding: 11px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 19px;
            font-weight: bold;
        }

        #${PREFIX}-dialog p {
            font-size: 12px;
            line-height: 1.5;
            color: #666;
        }

        .${PREFIX}-actions {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            margin-top: 18px;
        }

        .${PREFIX}-actions button {
            border: 0;
            border-radius: 5px;
            padding: 10px 14px;
            cursor: pointer;
        }

        .${PREFIX}-primary {
            background: #b45309;
            color: white;
        }

        .${PREFIX}-actions button:disabled {
            opacity: .55;
            cursor: wait;
        }

        @media (max-width: 950px) {
            #${PREFIX}-summary {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        @media (max-width: 550px) {
            #${PREFIX}-summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }
    `;

    document.head.appendChild(style);

    // =========================================================
    // TRANSAÇÕES
    // =========================================================

    function rows() {
        return [
            ...document.querySelectorAll(
                '.result-item[id^="result-item-"]'
            )
        ];
    }

    function cells(row) {
        return [...row.querySelectorAll('.form-row > div')];
    }

    function cellText(element) {
        if (!element) return '';

        return String(
            element.getAttribute('data-original-title') ||
            element.getAttribute('title') ||
            element.innerText ||
            element.textContent ||
            ''
        ).trim();
    }

    function rowData(row) {
        const columns = cells(row);

        if (columns.length < 4) return null;

        const valueCell =
            columns.find(element =>
                element.classList.contains('font-weight-bold') &&
                /R\$\s*[\d.,]+/.test(cellText(element))
            ) ||
            columns.find(element =>
                /R\$\s*[\d.,]+/.test(cellText(element))
            );

        const paidIcon = row.querySelector(
            'form button i.material-icons'
        );

        const paid =
            paidIcon?.classList.contains('text-success')
                ? true
                : paidIcon?.classList.contains('text-muted')
                    ? false
                    : null;

        return {
            id: row.id.replace('result-item-', ''),
            description: cellText(columns[3]),
            due: parseDate(cellText(columns[0])),
            paidDate: parseDate(cellText(columns[1])),
            competence: parseDate(cellText(columns[2])),
            person: cellText(columns[4]),
            value: parseMoney(cellText(valueCell)),
            category: cellText(columns[6]),
            cost: cellText(columns[7]),
            method: cellText(columns[8]),
            paid,
            snf: isSNF(cellText(columns[3]))
        };
    }

    function editLink(row) {
        return row.querySelector(
            'a[href*="/transactions/"][href*="/edit"]'
        );
    }

    // =========================================================
    // EDIÇÃO ORIGINAL
    // =========================================================

    function findEditModal() {
        return [
            ...document.querySelectorAll(
                '#modal_details,' +
                '#turbo_modal,' +
                '.modal.show,' +
                '[role="dialog"],' +
                '.modal'
            )
        ].find(element => {
            if (!visible(element)) return false;

            const text = norm(element.innerText);

            return (
                text.includes('editando') &&
                (
                    text.includes('arquivos da transacao') ||
                    text.includes('data competencia')
                )
            );
        }) || null;
    }

    async function openEdit(row) {
        if (findEditModal()) {
            throw new Error(
                'Feche a edição que já está aberta.'
            );
        }

        const link = editLink(row);

        if (!link) {
            throw new Error(
                'Link de edição não encontrado.'
            );
        }

        if (!$?.ajax) {
            throw new Error(
                'O sistema não disponibilizou a edição.'
            );
        }

        await $.ajax({
            url: link.href,
            type: 'GET',
            dataType: 'script',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        return waitFor(findEditModal, 12000);
    }

    async function closeEdit(modal) {
        if (!visible(modal)) return;

        const controls = [
            ...modal.querySelectorAll('button,a')
        ].filter(visible);

        const cancel = controls.find(element =>
            norm(element.textContent) === 'cancelar'
        );

        const close = controls.find(element =>
            element.matches(
                '[data-dismiss="modal"],' +
                '[data-bs-dismiss="modal"],' +
                '.close,.btn-close'
            ) ||
            ['x', '×', 'close'].includes(
                norm(element.textContent)
            )
        );

        (cancel || close)?.click();

        try {
            await waitFor(() => !findEditModal(), 3000);
            return;
        } catch (_) {}

        if ($?.fn?.modal) {
            $(modal).modal('hide');
        }

        await waitFor(() => !findEditModal(), 5000);
    }

    // =========================================================
    // CAMPOS E SELECT2
    // =========================================================

    function findField(root, regex) {
        return [
            ...root.querySelectorAll(
                'input,select,textarea'
            )
        ].find(element =>
            regex.test(
                `${element.name} ${element.id} ` +
                `${element.placeholder || ''}`
            )
        ) || null;
    }

    function findSelect(root, regex) {
        return [
            ...root.querySelectorAll('select')
        ].find(element =>
            regex.test(`${element.name} ${element.id}`)
        ) || null;
    }

    function fieldByLabel(root, label) {
        const wanted = norm(label);

        const labels = [
            ...root.querySelectorAll('label,small,span,div')
        ]
            .filter(element =>
                norm(element.textContent) === wanted
            )
            .sort((a, b) =>
                a.querySelectorAll('*').length -
                b.querySelectorAll('*').length
            );

        for (const element of labels) {
            if (element.htmlFor) {
                const linked = document.getElementById(
                    element.htmlFor
                );

                if (linked && root.contains(linked)) {
                    return linked;
                }
            }

            let parent = element.parentElement;

            for (let i = 0; i < 3 && parent; i++) {
                const fields = [
                    ...parent.querySelectorAll(
                        'select,' +
                        'input:not([type="hidden"]),' +
                        'textarea'
                    )
                ];

                if (fields.length === 1) {
                    return fields[0];
                }

                parent = parent.parentElement;
            }
        }

        return null;
    }

    function targetSelect(root, regex, labels = []) {
        const direct = findSelect(root, regex);

        if (direct) return direct;

        for (const label of labels) {
            const field = fieldByLabel(root, label);

            if (field?.tagName === 'SELECT') {
                return field;
            }
        }

        return null;
    }

    function readSelect(select) {
        if (!select) return null;

        let data = null;

        if ($?.fn?.select2) {
            try {
                data = $(select).select2('data')?.[0];
            } catch (_) {}
        }

        return {
            id: String(
                data?.id ?? select.value ?? ''
            ).trim(),
            text: String(
                data?.text ||
                select.selectedOptions?.[0]?.textContent ||
                ''
            ).trim()
        };
    }

    function readLabel(root, label) {
        const element = fieldByLabel(root, label);

        if (!element) return null;

        if (element.tagName === 'SELECT') {
            return readSelect(element);
        }

        return {
            id: String(element.value || ''),
            text: String(element.value || '')
        };
    }

    function captureOriginal(modal, original) {
        const source = {
            selects: {},
            labels: {},
            inputs: {},
            row: original
        };

        for (const element of modal.querySelectorAll(
            'input,select,textarea'
        )) {
            const name = element.name || element.id;

            if (!name) continue;

            source.inputs[name] = {
                value: element.value,
                checked:
                    element.type === 'checkbox'
                        ? element.checked
                        : null
            };

            if (element.tagName === 'SELECT') {
                source.selects[name] = readSelect(element);
            }
        }

        const labels = {
            person: ['Recebido de', 'Pago para'],
            category: ['Categoria'],
            cost: ['Centro de custos'],
            method: ['Forma de pagamento'],
            account: ['Conta']
        };

        for (const [key, names] of Object.entries(labels)) {
            for (const name of names) {
                const selected = readLabel(modal, name);

                if (selected) {
                    source.labels[key] = selected;
                    break;
                }
            }
        }

        for (const [name, value] of Object.entries(
            source.selects
        )) {
            if (/person_id/i.test(name)) {
                source.labels.person = value;
            } else if (/category_id/i.test(name)) {
                source.labels.category = value;
            } else if (/cost_center_id/i.test(name)) {
                source.labels.cost = value;
            } else if (
                /payment_method|payment_type/i.test(name)
            ) {
                source.labels.method = value;
            } else if (
                /account_id|bank_account_id/i.test(name)
            ) {
                source.labels.account = value;
            }
        }

        return source;
    }

    function wantedSelection(source, key, fallback = '') {
        const selected = source.labels[key];

        if (
            selected &&
            (meaningful(selected.text) || selected.id)
        ) {
            return selected;
        }

        if (meaningful(fallback)) {
            return { id: '', text: fallback };
        }

        return null;
    }

    function cleanSelection(value) {
        return norm(value)
            .replace(/\s+(cliente|fornecedor)\s*$/i, '')
            .trim();
    }

    function namesMatch(a, b) {
        const first = cleanSelection(a);
        const second = cleanSelection(b);

        if (!meaningful(first) || !meaningful(second)) {
            return false;
        }

        if (first === second) return true;

        if (
            first.startsWith(second + ' ') ||
            second.startsWith(first + ' ')
        ) {
            return Math.min(
                first.length,
                second.length
            ) >= 12;
        }

        return false;
    }

    function selectedMatches(actual, wanted) {
        if (!actual || !wanted) return false;

        const actualID = String(actual.id ?? '').trim();
        const wantedID = String(wanted.id ?? '').trim();

        if (
            wantedID &&
            actualID &&
            wantedID === actualID
        ) {
            return true;
        }

        return namesMatch(actual.text, wanted.text);
    }

    function resultData(option) {
        if (!$) return null;

        try {
            return $(option).data('data') || null;
        } catch (_) {
            return null;
        }
    }

    function resultText(option) {
        const data = resultData(option);

        if (meaningful(data?.text)) {
            return String(data.text);
        }

        const clone = option.cloneNode(true);

        clone.querySelectorAll(
            '.text-muted,.text-secondary,small'
        ).forEach(element => element.remove());

        return clone.textContent || option.textContent || '';
    }

    function select2Results() {
        return [
            ...document.querySelectorAll(
                '.select2-container--open ' +
                '.select2-results__option[role="option"]'
            )
        ].filter(element =>
            visible(element) &&
            element.getAttribute('aria-disabled') !== 'true' &&
            !element.classList.contains(
                'select2-results__message'
            )
        );
    }

    function resultMatches(option, wanted) {
        const data = resultData(option);

        if (
            wanted.id &&
            data?.id != null &&
            String(data.id) === String(wanted.id)
        ) {
            return true;
        }

        return namesMatch(
            resultText(option),
            wanted.text
        );
    }

    async function verifySelection(
        select,
        wanted,
        timeout = 2000
    ) {
        const start = Date.now();

        while (Date.now() - start < timeout) {
            if (selectedMatches(readSelect(select), wanted)) {
                return true;
            }

            await sleep(150);
        }

        return false;
    }

    async function chooseOption(select, wanted, attempts = 2) {
        if (!select || !wanted) return false;

        if (selectedMatches(readSelect(select), wanted)) {
            return true;
        }

        const options = [...select.options];

        let nativeOption = options.find(element =>
            wanted.id &&
            String(element.value) === String(wanted.id)
        );

        if (!nativeOption && meaningful(wanted.text)) {
            const matches = options.filter(element =>
                namesMatch(
                    element.textContent,
                    wanted.text
                )
            );

            if (matches.length === 1) {
                nativeOption = matches[0];
            }
        }

        if (nativeOption) {
            select.value = nativeOption.value;
            notifySelect(select);

            if (
                await verifySelection(select, wanted, 1200)
            ) {
                return true;
            }
        }

        if (!$?.fn?.select2) return false;

        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                $(select).select2('open');

                const search = await waitFor(
                    () => [
                        ...document.querySelectorAll(
                            '.select2-container--open ' +
                            '.select2-search__field'
                        )
                    ].find(visible),
                    2000
                );

                setValue(search, wanted.text);

                search.dispatchEvent(
                    new KeyboardEvent('keyup', {
                        key: 'a',
                        bubbles: true
                    })
                );

                const started = Date.now();
                let match = null;

                while (Date.now() - started < 7000) {
                    const matches = select2Results()
                        .filter(option =>
                            resultMatches(option, wanted)
                        );

                    if (matches.length === 1) {
                        match = matches[0];
                        break;
                    }

                    if (matches.length > 1) break;

                    await sleep(180);
                }

                if (match) {
                    const data = resultData(match);

                    for (const type of [
                        'mouseover',
                        'mousedown',
                        'mouseup',
                        'click'
                    ]) {
                        match.dispatchEvent(
                            new MouseEvent(type, {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            })
                        );
                    }

                    if (
                        await verifySelection(
                            select,
                            wanted,
                            1500
                        )
                    ) {
                        return true;
                    }

                    if (
                        data?.id != null &&
                        String(data.id).trim()
                    ) {
                        const id = String(data.id);

                        let option = [
                            ...select.options
                        ].find(element =>
                            String(element.value) === id
                        );

                        if (!option) {
                            option = new Option(
                                String(
                                    data.text || wanted.text
                                ),
                                id,
                                true,
                                true
                            );

                            select.add(option);
                        }

                        select.value = id;
                        notifySelect(select);

                        $(select).trigger({
                            type: 'select2:select',
                            params: { data }
                        });

                        if (
                            await verifySelection(
                                select,
                                {
                                    id,
                                    text:
                                        data.text ||
                                        wanted.text
                                },
                                1500
                            )
                        ) {
                            return true;
                        }
                    }
                }

            } catch (error) {
                console.warn(
                    '[OCS] Tentativa Select2:',
                    error
                );

            } finally {
                try {
                    $(select).select2('close');
                } catch (_) {}
            }

            await sleep(300);
        }

        return false;
    }

    // =========================================================
    // NOVO LANÇAMENTO
    // =========================================================

    function financialSection() {
        const heading = [
            ...document.querySelectorAll(
                'h1,h2,h3,h4,h5,h6,.card-title'
            )
        ].find(element =>
            norm(element.textContent) ===
            'controle financeiro'
        );

        if (!heading) return null;

        let parent = heading;

        for (let i = 0; i < 9 && parent; i++) {
            if (
                parent.querySelector?.(
                    '.result-item[id^="result-item-"]'
                )
            ) {
                return parent;
            }

            parent = parent.parentElement;
        }

        return (
            heading.closest('.card') ||
            heading.parentElement
        );
    }

    function newLaunchButton() {
        const root = financialSection() || document;

        return [
            ...root.querySelectorAll(
                'button,a,div,span'
            )
        ]
            .filter(visible)
            .filter(element =>
                norm(element.textContent) ===
                'novo lancamento'
            )
            .sort((a, b) =>
                a.querySelectorAll('*').length -
                b.querySelectorAll('*').length
            )[0] || null;
    }

    function newLaunchForm() {
        const root = financialSection() || document;

        const forms = [
            ...root.querySelectorAll('form')
        ].filter(visible);

        const form = forms.find(element =>
            findField(
                element,
                /description|descricao/i
            ) &&
            findField(
                element,
                /amount|value|valor/i
            ) &&
            findField(
                element,
                /due_date|vencimento/i
            )
        );

        if (form) return form;

        return [
            ...root.querySelectorAll(
                '.form-row,' +
                '.result-item,' +
                '[class*="new-transaction"],' +
                '[id*="new-transaction"]'
            )
        ]
            .filter(visible)
            .find(element =>
                !element.matches(
                    '.result-item[id^="result-item-"]'
                ) &&
                findField(
                    element,
                    /description|descricao/i
                ) &&
                findField(
                    element,
                    /amount|value|valor/i
                )
            ) || null;
    }

    async function openNewLaunch() {
        if (newLaunchForm()) {
            throw new Error(
                'Já existe um novo lançamento aberto. ' +
                'Salve ou cancele antes de continuar.'
            );
        }

        const button = newLaunchButton();

        if (!button) {
            throw new Error(
                'NOVO LANÇAMENTO não encontrado.'
            );
        }

        button.click();

        return waitFor(newLaunchForm, 10000);
    }

    function formFields(form) {
        return {
            due:
                findField(
                    form,
                    /due_date|vencimento/i
                ) ||
                fieldByLabel(
                    form,
                    'Data Vencimento'
                ),

            description:
                findField(
                    form,
                    /description|descricao/i
                ) ||
                fieldByLabel(
                    form,
                    'Descrição'
                ),

            amount:
                findField(
                    form,
                    /amount|value|valor/i
                ) ||
                fieldByLabel(
                    form,
                    'Valor'
                ),

            person:
                targetSelect(
                    form,
                    /person_id/i,
                    ['Recebido de', 'Pago para']
                ),

            category:
                targetSelect(
                    form,
                    /category_id|categoria_id|category/i,
                    ['Categoria']
                ),

            cost:
                targetSelect(
                    form,
                    /cost_center_id|cost_center/i,
                    ['Centro de custos']
                ),

            method:
                targetSelect(
                    form,
                    /payment_method|payment_type/i,
                    ['Forma de pagamento']
                ),

            account:
                targetSelect(
                    form,
                    /account_id|bank_account_id/i,
                    ['Conta']
                ),

            paid:
                form.querySelector(
                    'input[type="checkbox"][name*="paid"],' +
                    'input[type="checkbox"][name*="pago"]'
                ) ||
                fieldByLabel(
                    form,
                    'Pago?'
                ),

            competence:
                findField(
                    form,
                    /competence|competencia/i
                ),

            paidDate:
                findField(
                    form,
                    /paid_at|payment_date|pago_em/i
                )
        };
    }

    function findSaveButton(form) {
        return [
            ...form.querySelectorAll(
                'button[type="submit"]'
            )
        ].find(button => {
            if (!visible(button) || button.disabled) {
                return false;
            }

            const icon = button.querySelector(
                'i.material-icons,' +
                'i.material-icons-outlined'
            );

            return norm(icon?.textContent) === 'save';
        }) || null;
    }

    function clearCategory(form) {
        const category = formFields(form).category;

        if (!category) return;

        const empty = [
            ...category.options
        ].find(option => option.value === '');

        if (empty) {
            category.value = '';
            notifySelect(category);
        }
    }

    function setPaidState(form, paid) {
        const checkbox = formFields(form).paid;

        if (
            !checkbox ||
            checkbox.type !== 'checkbox'
        ) {
            return false;
        }

        if (checkbox.checked !== paid) {
            checkbox.click();
        }

        return checkbox.checked === paid;
    }

    function validateForm(form, expectedAmount) {
        const fields = formFields(form);
        const missing = [];

        if (
            !fields.description ||
            !meaningful(fields.description.value)
        ) {
            missing.push('Descrição');
        }

        const actualAmount = fields.amount
            ? parseMoney(fields.amount.value)
            : null;

        if (
            !Number.isFinite(actualAmount) ||
            Math.abs(
                actualAmount - expectedAmount
            ) > 0.009
        ) {
            missing.push('Valor');
        }

        if (
            !fields.due ||
            !String(fields.due.value).trim()
        ) {
            missing.push('Vencimento');
        }

        if (
            !fields.person ||
            !String(fields.person.value).trim()
        ) {
            missing.push('Cliente/fornecedor');
        }

        const save = findSaveButton(form);

        if (!save) {
            missing.push('Botão Salvar');
        }

        if (missing.length) {
            throw new Error(
                'Campos não confirmados:\n' +
                missing.join('\n') +
                '\n\nO lançamento não foi salvo.'
            );
        }

        return save;
    }

    function clickNativeSave(form, amount) {
        if (saving) {
            throw new Error(
                'Já existe um salvamento em andamento.'
            );
        }

        const save = validateForm(form, amount);

        saving = true;

        try {
            save.click();

            console.info(
                `[OCS ${VERSION}] Salvamento acionado`
            );

        } finally {
            setTimeout(() => {
                saving = false;
            }, 12000);
        }
    }

    // =========================================================
    // CAPTURAR ORIGINAL E PREENCHER CÓPIA
    // =========================================================

    async function readOriginal(row) {
        const original = rowData(row);

        if (!original) {
            throw new Error(
                'Não foi possível ler o lançamento original.'
            );
        }

        const modal = await openEdit(row);

        let source;

        try {
            source = captureOriginal(modal, original);
        } finally {
            await closeEdit(modal);
        }

        await sleep(450);

        return { original, source };
    }

    async function fillLaunch(
        form,
        original,
        source,
        settings
    ) {
        let fields = formFields(form);

        if (
            !setValue(
                fields.description,
                settings.description
            )
        ) {
            throw new Error(
                'Descrição não encontrada.'
            );
        }

        if (
            !Number.isFinite(settings.amount) ||
            settings.amount <= 0
        ) {
            throw new Error(
                'Valor inválido.'
            );
        }

        if (
            !setValue(
                fields.amount,
                settings.amount
                    .toFixed(2)
                    .replace('.', ',')
            )
        ) {
            throw new Error(
                'Valor não encontrado.'
            );
        }

        if (
            !original.due ||
            !setValue(
                fields.due,
                formatDate(original.due)
            )
        ) {
            throw new Error(
                'Vencimento não encontrado.'
            );
        }

        const person = wantedSelection(
            source,
            'person',
            original.person
        );

        if (
            !await chooseOption(
                fields.person,
                person,
                2
            )
        ) {
            throw new Error(
                'Não foi possível selecionar o ' +
                'cliente/fornecedor.'
            );
        }

        await sleep(400);

        fields = formFields(form);

        if (settings.type === 'interest') {
            clearCategory(form);
        } else {
            const category = wantedSelection(
                source,
                'category',
                original.category
            );

            if (fields.category && category) {
                const ok = await chooseOption(
                    fields.category,
                    category,
                    2
                );

                if (!ok) {
                    console.warn(
                        '[OCS] Categoria não confirmada.'
                    );
                }
            }
        }

        fields = formFields(form);

        const cost = wantedSelection(
            source,
            'cost',
            original.cost
        );

        if (fields.cost && cost) {
            if (
                !await chooseOption(
                    fields.cost,
                    cost,
                    2
                )
            ) {
                console.warn(
                    '[OCS] Centro de custos não confirmado.'
                );
            }
        }

        fields = formFields(form);

        const method = wantedSelection(
            source,
            'method',
            original.method
        );

        if (fields.method && method) {
            if (
                !await chooseOption(
                    fields.method,
                    method,
                    2
                )
            ) {
                console.warn(
                    '[OCS] Forma de pagamento não confirmada.'
                );
            }
        }

        fields = formFields(form);

        const account = wantedSelection(
            source,
            'account'
        );

        if (fields.account && account) {
            await chooseOption(
                fields.account,
                account,
                1
            );
        }

        fields = formFields(form);

        if (fields.competence && original.competence) {
            setValue(
                fields.competence,
                formatDate(original.competence)
            );
        }

        if (settings.type === 'duplicate') {
            // Regra obrigatória: duplicata sempre pendente.
            if (!setPaidState(form, false)) {
                throw new Error(
                    'Não foi possível confirmar a situação ' +
                    'PENDENTE da duplicata. Nada foi salvo.'
                );
            }

            if (
                fields.paidDate &&
                !fields.paidDate.disabled
            ) {
                setValue(fields.paidDate, '');
            }

        } else if (original.paid !== null) {
            setPaidState(
                form,
                original.paid
            );

            if (
                original.paidDate &&
                fields.paidDate
            ) {
                setValue(
                    fields.paidDate,
                    formatDate(original.paidDate)
                );
            }
        }

        fields = formFields(form);

        if (
            !selectedMatches(
                readSelect(fields.person),
                person
            )
        ) {
            throw new Error(
                'O cliente não permaneceu selecionado.'
            );
        }

        if (settings.type === 'duplicate') {
            if (
                !fields.paid ||
                fields.paid.checked
            ) {
                throw new Error(
                    'A duplicata não está marcada como pendente.'
                );
            }

            if (
                !String(
                    fields.description?.value || ''
                ).startsWith('[DUPLICATA] ')
            ) {
                throw new Error(
                    'A identificação de duplicidade não foi aplicada.'
                );
            }
        } else {
            clearCategory(form);
        }

        validateForm(form, settings.amount);
    }

    // =========================================================
    // IDENTIFICAÇÃO DA DUPLICATA
    // =========================================================

    function duplicateDescription(original) {
        const base = original.description
            .replace(/^\[DUPLICATA\]\s*/i, '')
            .trim();

        return `[DUPLICATA] ${base}`;
    }

    function findNewDuplicate(
        description,
        previousIDs
    ) {
        const matching = rows().filter(row => {
            if (previousIDs.has(row.id)) {
                return false;
            }

            const data = rowData(row);

            return (
                data &&
                norm(data.description) === norm(description)
            );
        });

        return matching.length === 1
            ? matching[0]
            : null;
    }

    async function waitForDuplicate(
        description,
        previousIDs,
        timeout = 18000
    ) {
        return waitFor(
            () => findNewDuplicate(
                description,
                previousIDs
            ),
            timeout
        );
    }

    // =========================================================
    // DUPLICAR LANÇAMENTO
    // =========================================================

    async function duplicateTransaction(row) {
        if (busy || saving) return;

        busy = true;

        let stage = 'Iniciando duplicação';
        let saveRequested = false;

        try {
            stage = 'Lendo lançamento original';

            const { original, source } =
                await readOriginal(row);

            if (
                !Number.isFinite(original.value) ||
                original.value <= 0
            ) {
                throw new Error(
                    'Valor original inválido.'
                );
            }

            const description =
                duplicateDescription(original);

            const previousIDs = new Set(
                rows().map(item => item.id)
            );

            stage = 'Abrindo novo lançamento';

            const form = await openNewLaunch();

            stage = 'Copiando dados da duplicata';

            await fillLaunch(
                form,
                original,
                source,
                {
                    type: 'duplicate',
                    description,
                    amount: original.value
                }
            );

            stage = 'Salvando duplicata pendente';

            clickNativeSave(
                form,
                original.value
            );

            saveRequested = true;

            stage = 'Localizando duplicata salva';

            let duplicateRow;

            try {
                duplicateRow = await waitForDuplicate(
                    description,
                    previousIDs,
                    18000
                );
            } catch (_) {
                alert(
                    'O salvamento da duplicata foi solicitado.\n\n' +
                    'Não consegui localizar a nova linha na ' +
                    'lista atual para abrir sua edição.\n\n' +
                    'Procure pelo título:\n' +
                    description +
                    '\n\nVerifique se o lançamento foi salvo ' +
                    'antes de tentar duplicar novamente.'
                );

                return;
            }

            stage = 'Abrindo edição da duplicata';

            await openEdit(duplicateRow);

            console.info(
                `[OCS ${VERSION}] Edição da duplicata aberta`,
                {
                    originalId: original.id,
                    duplicateId:
                        duplicateRow.id.replace(
                            'result-item-',
                            ''
                        )
                }
            );

        } catch (error) {
            console.error(
                `[OCS ${VERSION}] ${stage}`,
                error
            );

            alert(
                'Não foi possível concluir a duplicação.\n\n' +
                `Etapa: ${stage}\n\n` +
                error.message +
                (
                    saveRequested
                        ? '\n\nO salvamento já foi solicitado. ' +
                          'Verifique a lista antes de repetir.'
                        : '\n\nNenhum salvamento foi solicitado ' +
                          'por esta operação.'
                )
            );

        } finally {
            busy = false;
        }
    }

    // =========================================================
    // JUROS
    // =========================================================

    async function prepareInterest(row, amount) {
        if (busy || saving) return;

        busy = true;

        let stage = 'Iniciando';

        try {
            stage = 'Lendo original';

            const { original, source } =
                await readOriginal(row);

            const description =
                /^juros\b/i.test(original.description)
                    ? original.description
                    : `Juros - ${original.description}`;

            stage = 'Abrindo novo lançamento';

            const form = await openNewLaunch();

            stage = 'Preenchendo juros';

            await fillLaunch(
                form,
                original,
                source,
                {
                    type: 'interest',
                    description,
                    amount
                }
            );

            stage = 'Salvando juros';

            clickNativeSave(form, amount);

        } catch (error) {
            console.error(
                `[OCS ${VERSION}] ${stage}`,
                error
            );

            alert(
                'Não foi possível concluir os juros.\n\n' +
                `Etapa: ${stage}\n\n` +
                error.message
            );

        } finally {
            busy = false;
        }
    }

    function showInterestDialog(row) {
        if (busy || saving) return;

        const original = rowData(row);

        if (!original) return;

        document.getElementById(
            `${PREFIX}-dialog`
        )?.remove();

        const overlay = document.createElement('div');
        overlay.id = `${PREFIX}-dialog`;

        const box = document.createElement('div');
        box.className = 'ocs-box';

        const title = document.createElement('h3');
        title.textContent = 'Adicionar juros';

        const info = document.createElement('div');
        info.className = 'ocs-info';

        info.textContent =
            `Lançamento: ${original.description}\n` +
            `Valor original: ${money(original.value)}\n` +
            `Situação: ${
                original.paid === true
                    ? 'Pago'
                    : original.paid === false
                        ? 'Em aberto'
                        : 'Não identificada'
            }`;

        const label = document.createElement('label');
        label.textContent = 'Valor dos juros (R$)';

        const input = document.createElement('input');

        input.type = 'text';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.placeholder = 'R$ 0,00';
        input.value = 'R$ 0,00';

        let amount = 0;

        input.addEventListener('input', () => {
            const digits = input.value.replace(/\D/g, '');

            amount = digits
                ? Number(digits) / 100
                : 0;

            input.value = money(amount);

            input.setSelectionRange(
                input.value.length,
                input.value.length
            );
        });

        input.addEventListener('focus', () => {
            input.setSelectionRange(
                input.value.length,
                input.value.length
            );
        });

        const note = document.createElement('p');

        note.textContent =
            'Digite apenas os números. ' +
            'Exemplo: 10000 = R$ 100,00. ' +
            'O lançamento será salvo pelo botão nativo.';

        const actions = document.createElement('div');
        actions.className = `${PREFIX}-actions`;

        const cancel = document.createElement('button');
        cancel.textContent = 'Cancelar';

        const confirm = document.createElement('button');
        confirm.textContent = 'Preparar lançamento';
        confirm.className = `${PREFIX}-primary`;

        cancel.onclick = () => overlay.remove();

        confirm.onclick = async () => {
            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                alert('Digite um valor válido de juros.');
                input.focus();
                return;
            }

            if (busy || saving) return;

            confirm.disabled = true;
            overlay.remove();

            await prepareInterest(row, amount);
        };

        input.onkeydown = event => {
            if (event.key === 'Enter') {
                confirm.click();
            }
        };

        actions.append(cancel, confirm);

        box.append(
            title,
            info,
            label,
            input,
            note,
            actions
        );

        overlay.appendChild(box);

        overlay.onclick = event => {
            if (event.target === overlay) {
                overlay.remove();
            }
        };

        document.body.appendChild(overlay);
        input.focus();
    }

    // =========================================================
    // ANEXOS
    // =========================================================

    async function openAttachment(row) {
        if (busy) return;

        busy = true;

        try {
            const modal = await openEdit(row);

            const tab = [
                ...modal.querySelectorAll(
                    'a,button,[role="tab"]'
                )
            ].find(element =>
                norm(element.textContent).includes(
                    'arquivos da transacao'
                )
            );

            if (!tab) {
                throw new Error(
                    'Aba ARQUIVOS DA TRANSAÇÃO não encontrada.'
                );
            }

            tab.click();

            const id = row.id.replace(
                'result-item-',
                ''
            );

            const clip = await waitFor(() => {
                const active = findEditModal();

                if (!active) return null;

                return [
                    ...active.querySelectorAll(
                        'a[href*="/attachment_lists/"]'
                    )
                ].find(element =>
                    element.href.includes(id) &&
                    norm(
                        element.querySelector('i')
                            ?.textContent
                    ) === 'attach_file'
                );
            }, 7000);

            clip.click();

            const file = await waitFor(
                () => findEditModal()?.querySelector(
                    'input[type="file"]'
                ),
                7000
            );

            file.click();

        } catch (error) {
            console.error('[OCS Anexos]', error);

            alert(
                'Não foi possível abrir os anexos.\n\n' +
                error.message
            );

        } finally {
            busy = false;
        }
    }

    // =========================================================
    // MENU DOS TRÊS PONTINHOS
    // =========================================================

    function rowDropdown(row) {
        return [
            ...row.querySelectorAll('.dropdown')
        ].find(dropdown =>
            dropdown.querySelector(
                '.dropdown-menu'
            ) &&
            [...dropdown.querySelectorAll(
                'i.material-icons-outlined'
            )].some(icon =>
                icon.textContent.trim() === 'more_vert'
            )
        ) || null;
    }

    function makeMenuAction(
        row,
        label,
        icon,
        className,
        handler
    ) {
        const item = document.createElement('a');

        item.href = '#';
        item.className =
            `dropdown-item ${PREFIX}-menu-action ${className}`;

        const symbol = document.createElement('i');
        symbol.className =
            'material-icons material-icons-outlined';
        symbol.textContent = icon;

        const text = document.createElement('span');
        text.textContent = label;

        item.append(symbol, text);

        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            const dropdown = rowDropdown(row);

            const toggle = dropdown?.querySelector(
                '[data-toggle="dropdown"]'
            );

            if (
                toggle &&
                dropdown.classList.contains('show')
            ) {
                toggle.click();
            }

            handler(row);
        });

        return item;
    }

    function addMenuActions(row) {
        if (!ocsSettings.enabled) return;
        const dropdown = rowDropdown(row);

        if (!dropdown) return;

        const menu = dropdown.querySelector(
            '.dropdown-menu'
        );

        if (!menu) return;

        // Remove opções antigas criadas por versões
        // anteriores, evitando duplicidade visual.
        menu.querySelectorAll(
            '[class*="ocs071"][class*="-interest-menu"],' +
            '[class*="ocs071"][class*="-duplicate-menu"]'
        ).forEach(element => element.remove());

        const edit = [
            ...menu.querySelectorAll('a,button')
        ].find(element =>
            norm(element.textContent).includes(
                'editar'
            )
        );

        if (!edit) return;

        const anchor = edit.closest(
            '.dropdown-item'
        ) || edit;

        let duplicate = menu.querySelector(
            `.${PREFIX}-duplicate-menu`
        );

        if (!duplicate && ocsSettings.duplicates) {
            duplicate = makeMenuAction(
                row,
                'Duplicar lançamento',
                'content_copy',
                `${PREFIX}-duplicate-menu`,
                duplicateTransaction
            );
        }

        let interest = menu.querySelector(
            `.${PREFIX}-interest-menu`
        );

        if (!interest && ocsSettings.interest) {
            interest = makeMenuAction(
                row,
                'Adicionar juros',
                'add_circle_outline',
                `${PREFIX}-interest-menu`,
                showInterestDialog
            );
        }

        // Ordem:
        // Editar
        // Duplicar lançamento
        // Adicionar juros
        // Deletar
        // Auditoria
        if (ocsSettings.duplicates && duplicate) anchor.insertAdjacentElement('afterend',duplicate);
        else duplicate?.remove();
        if (ocsSettings.interest && interest) (ocsSettings.duplicates && duplicate ? duplicate : anchor).insertAdjacentElement('afterend',interest);
        else interest?.remove();
    }

    // =========================================================
    // BOTÕES DE ANEXO
    // =========================================================

    function processRows() {
        if (!ocsSettings.enabled) return;
        for (const row of rows()) {
            const first = row.querySelector(
                '.form-row > .col-1'
            );

            const edit = editLink(row);

            if (!first || !edit?.parentElement) {
                continue;
            }

            row.querySelectorAll(
                '[class*="ocs071"][class*="-plus"]'
            ).forEach(element => element.remove());

            let clip = first.querySelector(
                `.${PREFIX}-clip`
            );

            if (!ocsSettings.attachments) { clip?.remove(); addMenuActions(row); continue; }
            if (!clip) {
                clip = document.createElement('button');
                clip.type = 'button';
                clip.className = `${PREFIX}-clip`;

                clip.innerHTML =
                    '<i class="material-icons material-icons-outlined">' +
                    'attach_file</i>';

                clip.onclick = event => {
                    event.preventDefault();
                    event.stopPropagation();
                    openAttachment(row);
                };

                edit.parentElement.insertBefore(
                    clip,
                    edit
                );
            }

            const snf = isSNF(
                rowData(row)?.description
            );

            clip.classList.toggle('snf', snf);

            clip.title = snf
                ? 'SNF - Adicionar anexo'
                : 'Adicionar anexo';

            addMenuActions(row);
        }
    }

    // =========================================================
    // INDICADORES
    // =========================================================

    function calculateSummary() {
        const today = dateNumber(new Date());

        const summary = Object.fromEntries(
            [
                'today',
                'overdue',
                'paid',
                'open',
                'snf'
            ].map(key => [
                key,
                { count: 0, value: 0 }
            ])
        );

        for (const row of rows()) {
            const data = rowData(row);

            if (
                !data ||
                !Number.isFinite(data.value)
            ) {
                continue;
            }

            const add = key => {
                summary[key].count++;
                summary[key].value += data.value;
            };

            if (data.snf) {
                add('snf');
            }

            if (data.paid === true) {
                add('paid');
            } else if (data.paid === false) {
                add('open');

                if (data.due) {
                    const due = dateNumber(data.due);

                    if (due === today) {
                        add('today');
                    } else if (due < today) {
                        add('overdue');
                    }
                }
            }
        }

        return summary;
    }

    function createSummary() {
        const section = financialSection();

        if (!section?.parentElement) return null;

        let panel = document.getElementById(
            `${PREFIX}-summary`
        );

        if (!panel) {
            panel = document.createElement('div');
            panel.id = `${PREFIX}-summary`;

            const definitions = [
                ['today', 'Vence hoje', '#d97706'],
                ['overdue', 'Vencidos', '#dc2626'],
                ['paid', 'Pagos', '#16a34a'],
                ['open', 'Em aberto', '#2563eb'],
                ['snf', 'Sem nota fiscal (SNF)', '#9333ea']
            ];

            for (const [key, title, color] of definitions) {
                const button = document.createElement(
                    'button'
                );

                button.type = 'button';
                button.className = `${PREFIX}-card`;

                button.style.setProperty(
                    '--color',
                    color
                );

                button.innerHTML = `
                    <small>${title}</small>
                    <strong data-value="${key}">R$ 0,00</strong>
                    <span data-count="${key}">0 lançamentos</span>
                `;

                button.onclick = () =>
                    applyNativeFilter(key);

                panel.appendChild(button);
            }
        }

        if (panel.nextElementSibling !== section) {
            section.parentElement.insertBefore(
                panel,
                section
            );
        }

        return panel;
    }

    function updateSummary() {
        if (!ocsSettings.enabled || !ocsSettings.summary) { document.getElementById(`${PREFIX}-summary`)?.remove(); return; }
        const panel = createSummary();

        if (!panel) return;

        const summary = calculateSummary();

        for (const [key, item] of Object.entries(summary)) {
            const value = panel.querySelector(
                `[data-value="${key}"]`
            );

            const count = panel.querySelector(
                `[data-count="${key}"]`
            );

            const formatted = money(item.value);

            if (
                value &&
                value.textContent !== formatted
            ) {
                value.textContent = formatted;
            }

            const countText =
                `${item.count} lançamento${
                    item.count === 1 ? '' : 's'
                }`;

            if (
                count &&
                count.textContent !== countText
            ) {
                count.textContent = countText;
            }
        }
    }

    // =========================================================
    // FILTROS NATIVOS
    // =========================================================

    function nativeFilterFields() {
        return {
            start: document.querySelector('#starts_at'),
            end: document.querySelector('#ends_at'),
            status: document.querySelector(
                '#transaction_status'
            )
        };
    }

    function findFilterButton() {
        const fields = nativeFilterFields();

        if (!fields.status) return null;

        let parent = fields.status.parentElement;

        for (let i = 0; i < 8 && parent; i++) {
            const buttons = [
                ...parent.querySelectorAll(
                    'button,input[type="submit"]'
                )
            ];

            const button = buttons.find(element =>
                norm(
                    element.textContent ||
                    element.value
                ) === 'filtrar'
            );

            if (button) return button;

            parent = parent.parentElement;
        }

        return null;
    }

    function findFilterToggle() {
        const root = financialSection() || document;

        return [
            ...root.querySelectorAll('button,a')
        ].find(element => {
            if (!visible(element)) return false;

            const icon = element.querySelector(
                'i.material-icons,' +
                'i.material-icons-outlined'
            );

            return /^(filter_list|filter_alt)$/.test(
                norm(icon?.textContent)
            );
        }) || null;
    }

    async function openNativeFilter() {
        const ready = () => {
            const fields = nativeFilterFields();

            return (
                fields.start &&
                fields.end &&
                fields.status &&
                findFilterButton()
            );
        };

        if (ready()) return nativeFilterFields();

        const toggle = findFilterToggle();

        if (!toggle) {
            throw new Error(
                'Botão nativo de filtros não encontrado.'
            );
        }

        toggle.click();

        await waitFor(ready, 5000);

        return nativeFilterFields();
    }

    function setNativeDate(input, date) {
        if (!input) {
            throw new Error(
                'Campo nativo de data não encontrado.'
            );
        }

        const value = date ? isoDate(date) : '';

        if (value) {
            if (input.min && value < input.min) {
                throw new Error(
                    'A data está fora do período permitido. ' +
                    'Selecione o mês correspondente.'
                );
            }

            if (input.max && value > input.max) {
                throw new Error(
                    'A data está fora do período permitido. ' +
                    'Selecione o mês correspondente.'
                );
            }
        }

        setValue(input, value);

        if (input.value !== value) {
            throw new Error(
                'O sistema não aceitou a data.'
            );
        }
    }

    function setNativeStatus(select, value) {
        if (!select) {
            throw new Error(
                'Campo de situação não encontrado.'
            );
        }

        if (
            ![...select.options].some(
                option => option.value === value
            )
        ) {
            throw new Error(
                'Situação não disponível.'
            );
        }

        setValue(select, value);

        if (select.value !== value) {
            throw new Error(
                'O sistema não aceitou a situação.'
            );
        }
    }

    function currentPeriod() {
        const params = new URLSearchParams(
            location.search
        );

        const month = Number(params.get('c_month'));
        const year = Number(params.get('c_year'));

        if (
            month >= 1 &&
            month <= 12 &&
            year >= 2000
        ) {
            return {
                start: new Date(year, month - 1, 1),
                end: new Date(year, month, 0)
            };
        }

        const startInput = document.querySelector(
            '#starts_at'
        );

        if (startInput?.min) {
            const parts = startInput.min.split('-');

            if (parts.length === 3) {
                const y = Number(parts[0]);
                const m = Number(parts[1]);

                return {
                    start: new Date(y, m - 1, 1),
                    end: new Date(y, m, 0)
                };
            }
        }

        return null;
    }

    function findSearchInput() {
        const root = financialSection() || document;

        return [
            ...root.querySelectorAll(
                'input[type="search"],' +
                'input[type="text"]'
            )
        ].filter(visible).find(element =>
            /pesquisar transac|pesquisar transa|search|query/i.test(
                `${element.placeholder || ''} ` +
                `${element.name || ''} ` +
                `${element.id || ''}`
            )
        ) || null;
    }

    async function searchSNF() {
        const input = findSearchInput();

        if (!input) {
            throw new Error(
                'Pesquisa nativa não encontrada.'
            );
        }

        setValue(input, 'snf');

        let parent = input.parentElement;
        let button = null;

        for (let i = 0; i < 5 && parent; i++) {
            button = [
                ...parent.querySelectorAll('button,a')
            ].find(element => {
                const icon = element.querySelector(
                    'i.material-icons,' +
                    'i.material-icons-outlined'
                );

                return norm(icon?.textContent) === 'search';
            });

            if (button) break;

            parent = parent.parentElement;
        }

        if (button) {
            button.click();
            return;
        }

        const form = input.closest('form');

        if (form?.requestSubmit) {
            form.requestSubmit();
            return;
        }

        input.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            })
        );

        input.dispatchEvent(
            new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            })
        );
    }

    async function applyNativeFilter(key) {
        if (!ocsSettings.enabled || !ocsSettings.filters) return;
        if (filtering) return;

        filtering = true;

        try {
            if (key === 'snf') {
                await searchSNF();
                return;
            }

            const fields = await openNativeFilter();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let start = null;
            let end = null;
            let status = '';

            switch (key) {
                case 'today':
                    start = today;
                    end = today;
                    status = 'pending';
                    break;

                case 'overdue': {
                    const yesterday = new Date(today);
                    yesterday.setDate(
                        yesterday.getDate() - 1
                    );

                    const period = currentPeriod();

                    start = period?.start || null;
                    end = yesterday;

                    if (
                        period?.end &&
                        dateNumber(period.end) <
                        dateNumber(end)
                    ) {
                        end = period.end;
                    }

                    if (
                        start &&
                        dateNumber(start) >
                        dateNumber(end)
                    ) {
                        throw new Error(
                            'Não existem datas vencidas ' +
                            'nesse período.'
                        );
                    }

                    status = 'pending';
                    break;
                }

                case 'paid':
                    status = 'paid';
                    break;

                case 'open':
                    status = 'pending';
                    break;

                default:
                    return;
            }

            setNativeDate(fields.start, start);
            setNativeDate(fields.end, end);
            setNativeStatus(fields.status, status);

            const button = findFilterButton();

            if (!button) {
                throw new Error(
                    'Botão FILTRAR não encontrado.'
                );
            }

            button.click();

        } catch (error) {
            console.error(
                `[OCS ${VERSION}] Filtro`,
                error
            );

            alert(
                'Não foi possível aplicar o filtro nativo.\n\n' +
                error.message
            );

        } finally {
            filtering = false;
        }
    }

    // =========================================================
    // ATUALIZAÇÃO
    // =========================================================

    function refresh() {
        if (!ocsSettings.enabled) return;
        processRows();
        updateSummary();
    }

    function queueRefresh() {
        if (refreshQueued) return;

        refreshQueued = true;

        setTimeout(() => {
            refreshQueued = false;
            refresh();
        }, 350);
    }

    refresh();

    new MutationObserver(
        queueRefresh
    ).observe(
        document.body,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );

    document.addEventListener(
        'turbo:load',
        queueRefresh
    );

    document.addEventListener(
        'turbo:frame-load',
        queueRefresh
    );

    setInterval(queueRefresh, 5000);

    console.info(
        `[OCS] Versão ${VERSION} carregada. Autor: Tarcisio.`
    );


})();



// OCS 0.7.59 — Exibir CTR e baixar comprovante do pedido.
(function ocsCTRViewer(){
  'use strict';
  if(window.__OCS_CTR_0759__)return;
  window.__OCS_CTR_0759__=true;
  if(!location.pathname.includes('/operational/order_jobs'))return;
  const ORDER_PATH=/\/partner_area\/operational\/orders\/[0-9a-f-]{30,}/i;
  const DOC_PATH=/\/partner_area\/operational\/environmental_documentations\/[0-9a-f-]{30,}/i;
  const SETTINGS_KEY='ocs-settings-v0749';
  const readSettings=()=>{try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch(_){return {}}};
  const enabled=key=>{const p=readSettings();return p.enabled!==false&&p[key]!==false};
  const absolute=(href,base=location.href)=>new URL(href,base).href;
  const orderLinks=row=>[...row.querySelectorAll('a[href]')].filter(a=>ORDER_PATH.test(a.getAttribute('href')||''));
  const docLinks=row=>[...row.querySelectorAll('a[href]')].filter(a=>DOC_PATH.test(a.getAttribute('href')||''));
  const selectedRows=()=>[...document.querySelectorAll('tr')].filter(row=>{
    const cb=row.querySelector('input[type="checkbox"]');
    return cb&&cb.checked&&!cb.disabled&&docLinks(row).length;
  });
  const style=document.createElement('style');style.id='ocs-ctr-0759-css';
  style.textContent=`
    .ocs-ctr-view-single{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;margin-left:4px!important;padding:2px!important;color:#ffbc00!important;background:transparent!important;border:0!important;border-radius:3px!important;cursor:pointer!important}
    .ocs-order-pdf{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;margin-left:4px!important;padding:2px!important;color:#1675d1!important;background:transparent!important;border:0!important;border-radius:3px!important;cursor:pointer!important}
    .ocs-order-pdf:hover{background:#e8f2ff!important}
    .ocs-order-pdf .material-icons{font-size:16px!important;line-height:1!important}
    .ocs-ctr-view-single:hover{background:#fff0c0!important;color:#a36a00!important}
    .ocs-ctr-view-single .material-icons{font-size:16px!important;line-height:1!important}
    .ocs-ctr-view-batch{color:#1680ed!important;cursor:pointer!important}
    #ocs-ctr-view-message{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483600;background:#2b1010;color:white;padding:11px 15px;border-radius:7px;box-shadow:0 3px 15px #0005;font:13px Arial,sans-serif;max-width:90vw}
  `;(document.head||document.documentElement).appendChild(style);
  function notice(text){
    let el=document.getElementById('ocs-ctr-view-message');
    if(!el){el=document.createElement('div');el.id='ocs-ctr-view-message';document.body.appendChild(el)}
    el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),9000);
  }
  // Usa a opção nativa "Exibir Documentação Externa", não a opção "Imprimir".
  async function getViewUrl(docHref){
    const source=absolute(docHref);
    const response=await fetch(source,{credentials:'same-origin',redirect:'follow'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const page=new DOMParser().parseFromString(await response.text(),'text/html');
    const link=[...page.querySelectorAll('a[href]')].find(a=>
      /exibir documenta[çc][ãa]o externa/i.test(
        (a.getAttribute('title')||'')+' '+(a.textContent||''))
    );
    if(!link)throw new Error('Opção Exibir Documentação Externa não encontrada');
    const url=absolute(link.getAttribute('href'),response.url||source);
    if(!/^https?:\/\//i.test(url))throw new Error('Endereço de documentação inválido');
    return url;
  }
  function reserveTab(){
    // Reserva a aba durante o clique do usuário para evitar bloqueio de popup
    const tab=window.open('about:blank','_blank');
    if(tab){try{tab.opener=null;tab.document.title='OCS — Abrindo CTR…'}catch(_){}}
    return tab;
  }
  async function viewOne(href,button){
    if(button)button.disabled=true;
    const tab=reserveTab();
    try{
      const url=await getViewUrl(href);
      if(tab&&!tab.closed)tab.location.replace(url);
      else {notice('O navegador bloqueou a aba. Permita pop-ups para exibir a CTR.');}
    }catch(err){if(tab&&!tab.closed)tab.close();notice('Não foi possível exibir a CTR: '+err.message)}
    finally{if(button)button.disabled=false}
  }
  async function findOrderPdf(orderHref){
    const source=absolute(orderHref);
    const response=await fetch(source,{credentials:'same-origin',redirect:'follow'});
    if(!response.ok)throw new Error('Pedido indisponível (HTTP '+response.status+')');
    const page=new DOMParser().parseFromString(await response.text(),'text/html');
    // Inspecionar: item nativo de Comprovante tem data-remote-download e link de template.
    const links=[...page.querySelectorAll('a[href]')];
    const candidate=links.find(a=>a.hasAttribute('data-remote-download')&&
      /comprovante|download/i.test((a.closest('li')?.textContent||'')+' '+(a.getAttribute('title')||'')))
      ||links.find(a=>a.hasAttribute('data-remote-download')&&/\/templates\//i.test(a.getAttribute('href')||''))
      ||links.find(a=>/comprovante/i.test(a.textContent||'')&&/\/templates\//i.test(a.getAttribute('href')||''));
    if(!candidate)throw new Error('Comando nativo de comprovante não encontrado neste pedido');
    const url=absolute(candidate.getAttribute('href'),response.url||source);
    if(new URL(url).origin!==location.origin)throw new Error('Endereço de download externo não permitido');
    return url;
  }
  async function downloadOrder(orderHref,button){
    if(button)button.disabled=true;
    // Usa o endpoint nativo do comprovante do pedido, sem usar Imprimir CTR.
    try{
      const url=await findOrderPdf(orderHref);
      const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';
      a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    }catch(err){notice('Não foi possível baixar o pedido: '+err.message)}
    finally{if(button)button.disabled=false}
  }
  function cleanDuplicates(){
    // Remove botões antigos e repetidos, inclusive se o site reconstruir linhas.
    document.querySelectorAll('.ocs-ctr-single').forEach(el=>el.remove());
    document.querySelectorAll('.ocs-ctr-batch').forEach(el=>el.remove());
    document.querySelectorAll('.ocs-order-pdf').forEach(el=>{if(!el.previousElementSibling||!DOC_PATH.test(el.previousElementSibling.getAttribute('href')||''))el.remove()});
    const seen=new Set();
    document.querySelectorAll('.ocs-ctr-view-single').forEach(el=>{
      const link=[...el.parentElement.querySelectorAll('a[href]')].find(a=>DOC_PATH.test(a.getAttribute('href')||''));
      if(!link||seen.has(link)){el.remove();return}
      seen.add(link);
    });
  }
  function addSingles(){
    if(!enabled('ctrSingle')){document.querySelectorAll('.ocs-ctr-view-single').forEach(el=>el.remove());return}
    for(const row of document.querySelectorAll('tr')){
      for(const link of docLinks(row)){
        if(link.parentElement?.querySelector('.ocs-ctr-view-single'))continue;
        const button=document.createElement('button');button.type='button';
        button.className='ocs-ctr-view-single';
        button.title='Exibir CTR deste atendimento';
        button.setAttribute('aria-label','Exibir CTR');
        button.innerHTML='<i class="material-icons" aria-hidden="true">open_in_new</i>';
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();viewOne(link.href,button)});
        link.insertAdjacentElement('afterend',button);
      }
    }
  }
  function addOrderButtons(){
    if(!enabled('orderPdf')){document.querySelectorAll('.ocs-order-pdf').forEach(el=>el.remove());return}
    for(const row of document.querySelectorAll('tr')){
      const order=orderLinks(row)[0];if(!order)continue;
      for(const link of docLinks(row)){
        // Dois atalhos OCS: um exibe a CTR, outro baixa o comprovante do pedido.
        if(link.nextElementSibling?.classList.contains('ocs-order-pdf')||
           link.parentElement?.querySelector('.ocs-order-pdf'))continue;
        const button=document.createElement('button');button.type='button';
        button.className='ocs-order-pdf';button.title='Baixar comprovante do pedido (PDF)';
        button.setAttribute('aria-label','Baixar comprovante do pedido');
        button.innerHTML='<i class="material-icons" aria-hidden="true">file_download</i>';
        button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();downloadOrder(order.href,button)});
        link.insertAdjacentElement('afterend',button);
      }
    }
  }
  function addBatch(){
    const existing=document.querySelector('.ocs-ctr-view-batch');
    if(!enabled('ctrBatch')){if(existing)existing.remove();return}
    const count=selectedRows().length;
    if(!count){if(existing)existing.remove();return}
    if(existing && existing.dataset.count===String(count))return;
    if(existing)existing.remove();
    const mtr=[...document.querySelectorAll('a,button')].find(el=>
      /gerar mtr/i.test(el.textContent||'')&&el.closest('.dropdown-menu'));
    if(!mtr)return;
    const item=document.createElement('a');item.href='#';
    item.className='dropdown-item ocs-ctr-view-batch';item.dataset.count=String(count);
    item.innerHTML='<i class="material-icons" style="font-size:15px;vertical-align:middle;margin-right:5px">open_in_new</i>Exibir CTRs selecionados ('+count+')';
    item.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation();
      const rows=selectedRows();
      if(!rows.length){notice('Selecione um ou mais atendimentos.');return}
      if(rows.length>8&&!confirm('Abrir '+rows.length+' CTRs em novas abas?'))return;
      // Abre abas imediatamente enquanto há ativação do usuário.
      const tasks=rows.map(row=>({href:docLinks(row)[0]?.href,tab:reserveTab()}));
      let success=0,errors=0,blocked=0;
      for(const task of tasks){
        if(!task.href){errors++;if(task.tab)task.tab.close();continue}
        try{
          const url=await getViewUrl(task.href);
          if(task.tab&&!task.tab.closed){task.tab.location.replace(url);success++}
          else blocked++;
        }catch(err){errors++;if(task.tab&&!task.tab.closed)task.tab.close()}
      }
      notice('CTRs: '+success+' aberta(s), '+errors+' indisponível(is)'+(blocked?', '+blocked+' aba(s) bloqueada(s)':'')+'.');
    });
    const li=mtr.closest('li');
    if(li&&li.parentElement)li.insertAdjacentElement('afterend',item);
    else mtr.insertAdjacentElement('afterend',item);
  }
  let scheduled=false;
  function refresh(){
    if(scheduled)return;scheduled=true;
    setTimeout(()=>{scheduled=false;try{cleanDuplicates();addSingles();addOrderButtons();addBatch()}catch(e){console.warn('[OCS CTR]',e)}},240);
  }
  document.addEventListener('change',e=>{if(e.target.matches('input[type="checkbox"]'))refresh()},true);
  document.addEventListener('click',refresh,true);
  document.addEventListener('ocs:settings-changed',refresh);
  new MutationObserver(refresh).observe(document.body||document.documentElement,{childList:true,subtree:true});
  refresh();
})();
