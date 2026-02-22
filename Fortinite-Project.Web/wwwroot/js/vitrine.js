class VitrineJS {
    constructor(userToken) {
        this.user = userToken || null;
        this.API_BASE_URL = '/api'; 
        this.itens = []; 
        this.userData = null;
        this.todosOsItens = []; 
        this.todosOsItensCarregados = false;
        this.itensAdquiridosSet = new Set();
        this.carouselIndicators = null;
        this.itemModalElement = null;

        this.init();
    }

    _getTipoMapa(outputCase = 'lower') {
        const map = {
            'outfit': 'Traje', 'skin': 'Traje', 'traje': 'Traje',
            'backpack': 'Acessório para as Costas', 'mochila': 'Acessório para as Costas',
            'pickaxe': 'Picareta', 'picareta': 'Picareta',
            'glider': 'Asa-delta', 'asa-delta': 'Asa-delta',
            'emote': 'Gesto', 'gesto': 'Gesto',
            'wrap': 'Envelopamento', 'envelopamento': 'Envelopamento',
            'pet': 'Mascote', 'mascote': 'Mascote',
            'shoes': 'Sapatos', 'sapatos': 'Sapatos',
            'contrail': 'Rastro de Fumaça', 'rastro': 'Rastro de Fumaça',
            'banner': 'Estandarte', 'estandarte': 'Estandarte',
            'chassis': 'Chassi', 'chassi': 'Chassi',
            'wheel': 'Roda', 'roda': 'Roda',
            'decal': 'Decalque', 'decalque': 'Decalque',
            'music': 'Pacote de Música', 'musica': 'Pacote de Música',
            'loading': 'Tela de Carregamento'
        };

        if (outputCase === 'api') return map;
        return map;
    }

    async init() {
        this.pegaElementos();

        if (this.user) {
            await this.verificaUsuario();
        } else {
            this.renderizarBotoesLogin(); 
        }
        
        this.buscaItensDisponiveis();
    }

    renderizarBotoesLogin() {
        if (!this.navItens) return;
        
        this.navItens.innerHTML = `
            <a href="/Home/Login" class="btn-login me-3 text-decoration-none d-flex align-items-center">
                <i class="bi bi-box-arrow-in-right me-2"></i> Entrar
            </a>
            <a href="/Home/Cadastro" class="btn-signup text-decoration-none d-flex align-items-center">
                <i class="bi bi-person-plus me-2"></i> Criar Conta
            </a>
        `;
    }

    pegaElementos() {
        // 1. Elementos Básicos da Vitrine
        this.cosmeticosGrid = document.getElementById('shop-grid'); 
        this.carrouselItems = document.getElementById('carouselItems');
        this.navItens = document.getElementById('nav-itens');
        this.carouselIndicators = document.querySelector('#featuredCarousel .carousel-indicators');
        this.carouselControlsContainer = document.getElementById('carousel-external-controls');
        this.perfilModal = document.getElementById('userProfileModal');
        this.itemModalElement = document.getElementById('itemModal');
        
        // 2. Botões de Ação do Modal
        this.btnBuy = document.getElementById('btn-buy');
        this.btnDevolver = document.getElementById('btn-devolver');
        
        if (this.btnBuy) this.btnBuy.addEventListener('click', () => this.handleCompraClick());
        if (this.btnDevolver) this.btnDevolver.addEventListener('click', () => this.handleDevolucaoClick());
        
        // 3. Filtros da Loja (Prefix: shop)
        this.shopTypeFilter = document.getElementById('shop-typeFilter');
        this.shopRarityFilter = document.getElementById('shop-rarityFilter');
        this.shopSearchInput = document.getElementById('shop-searchInput');
        this.shopClearBtn = document.getElementById('shop-clearFilters');
        this.shopCheckNew = document.getElementById('shop-checkNew');
        this.shopCheckForSale = document.getElementById('shop-checkForSale');
        this.shopCheckPromo = document.getElementById('shop-checkPromo');
        this.shopDateStart = document.getElementById('shop-dateStart');
        this.shopDateEnd = document.getElementById('shop-dateEnd');

        const shopInputIds = ['shop-typeFilter', 'shop-rarityFilter', 'shop-searchInput', 'shop-checkNew', 'shop-checkForSale', 'shop-checkPromo'];
        shopInputIds.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener(el.type === 'text' ? 'input' : 'change', () => this.renderizaItens());
        });

        if(this.shopClearBtn) this.shopClearBtn.addEventListener('click', () => this.limparFiltrosLoja());
        
        // 4. Catálogo Completo (Prefix: all)
        // CORREÇÃO: Pegamos o botão da tab pelo data-attribute para garantir que o evento do Bootstrap dispare
        this.allItemsTab = document.querySelector('button[data-bs-target="#all-items-content"]');
        this.allItemsGrid = document.getElementById('all-items-grid');
        this.allTypeFilter = document.getElementById('all-typeFilter');
        this.allRarityFilter = document.getElementById('all-rarityFilter');
        this.allSearchInput = document.getElementById('all-searchInput');
        this.allClearBtn = document.getElementById('all-clearFilters');

        const allInputIds = ['all-typeFilter', 'all-rarityFilter', 'all-searchInput'];
        allInputIds.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                if (el.type === 'text') {
                    let timeout;
                    el.addEventListener('input', () => { 
                        clearTimeout(timeout); 
                        timeout = setTimeout(() => this.buscaTodosOsItens(), 500); 
                    });
                } else {
                    el.addEventListener('change', () => this.buscaTodosOsItens());
                }
            }
        });

        if(this.allClearBtn) this.allClearBtn.addEventListener('click', () => this.limparFiltrosTodos());

        // CORREÇÃO: Mudamos para 'shown.bs.tab' para garantir que a aba já esteja renderizada
        if (this.allItemsTab) {
            this.allItemsTab.addEventListener('shown.bs.tab', () => { 
                if (!this.todosOsItensCarregados) this.buscaTodosOsItens(); 
            });
        }

        // 5. Contêineres de Abas Restritas
        this.usersTabContainer = document.getElementById('users-tab-container');
        this.myItemsTabContainer = document.getElementById('my-items-tab-container');
    }

    async verificaUsuario() {
        if (this.user) {
            const userName = localStorage.getItem('user_name') || 'Usuário';
            if (this.myItemsTabContainer) this.myItemsTabContainer.style.display = 'block';
            if (this.usersTabContainer) this.usersTabContainer.style.display = 'block';
            this.navItens.innerHTML = `
                <span class="nav-creditos d-flex align-items-center me-3 text-light">
                    <i class="bi bi-person-circle me-2"></i> ${userName}
                </span>
                <button id="nav-logout" class="btn btn-sm btn-logout">
                    <i class="bi bi-box-arrow-right"></i> Sair
                </button>
            `;
            
            document.getElementById('nav-logout')?.addEventListener('click', () => {
                localStorageManager.removeToken();
                window.location.href = '/Home/Login';
            });
        }
    }

    async buscaItensDisponiveis() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/cosmeticos/loja`);
            const resultado = await response.json(); 
            
            if (!response.ok || (resultado.status && resultado.status !== 200)) {
                throw new Error(resultado.message || `Erro HTTP: ${response.status}`);
            }
            
            const itensDaApi = resultado.data;
            
            if (Array.isArray(itensDaApi)) {
                this.itens = itensDaApi.map(item => {
                    const isAdquirido = this.itensAdquiridosSet.has(item.id);
                    return new ValidadorItem(item, isAdquirido).validaDados();
                });
                
                this.renderizaItens(); 
                this.preencheCarrousel(); 
            }
        } catch (error) {
            console.error('Erro ao buscar itens da loja:', error);
            this.mostrarErro('Erro ao carregar itens da loja.', this.cosmeticosGrid);
        }
    }

    async buscaTodosOsItens() {
        if (!this.allItemsGrid) return;

        this.allItemsGrid.innerHTML = this.gerarSpinner();

        try {
            const url = new URL(`${window.location.origin}${this.API_BASE_URL}/cosmeticos`);
            
            // Forçamos o valor para string vazia caso o elemento não exista ou esteja nulo
            const busca = this.allSearchInput?.value?.trim() || '';
            const tipo = this.allTypeFilter?.value || '';
            const raridade = this.allRarityFilter?.value || '';

            if (busca) url.searchParams.append('nome', busca);
            
            // Só adiciona ao link se houver um valor selecionado real
            if (tipo && tipo !== "") {
                // Não use o _getTipoMapa aqui, pois o valor do select já está correto
                url.searchParams.append('tipo', tipo); 
            }
            
            if (raridade && raridade !== "") {
                url.searchParams.append('raridade', this.traduzirRaridadeParaAPI(raridade));
            }
            
            url.searchParams.append('page', '1'); 
            url.searchParams.append('pageSize', '100'); 

            const response = await fetch(url.toString());
            const resultado = await response.json();
            
            // Sua API C# retorna os itens dentro de data.data
            const listaItensRaw = resultado.data?.data || resultado.data || []; 

            this.todosOsItens = listaItensRaw.map(item => 
                new ValidadorItem(item, this.itensAdquiridosSet.has(item.id)).validaDados()
            );

            this.todosOsItensCarregados = true;
            this.renderizarTodosOsItens(); 

        } catch (error) {
            console.error('Erro no catálogo:', error);
            this.mostrarErro('Erro ao carregar catálogo.', this.allItemsGrid);
        }
    }

    traduzirRaridadeParaAPI(val) {
        const mapa = { 'legendary': 'Lendário', 'epic': 'Épico', 'rare': 'Raro', 'uncommon': 'Incomum', 'common': 'Comum' };
        return mapa[val] || val;
    }

    renderizaItens() {
        if (!this.cosmeticosGrid) return;
        
        const busca = this.shopSearchInput?.value.toLowerCase().trim();
        // Removemos o toLowerCase() aqui para bater com o valor exato do Banco/HTML
        const tipoSelecionado = this.shopTypeFilter?.value; 
        
        const dataInicio = this.shopDateStart && this.shopDateStart.value ? new Date(this.shopDateStart.value) : null;
        const dataFim = this.shopDateEnd && this.shopDateEnd.value ? new Date(this.shopDateEnd.value) : null;
        const apenasNovos = this.shopCheckNew ? this.shopCheckNew.checked : false;
        const apenasVenda = this.shopCheckForSale ? this.shopCheckForSale.checked : false;
        const apenasPromo = this.shopCheckPromo ? this.shopCheckPromo.checked : false;

        let itensFiltrados = this.itens.filter(item => {
            const matchNome = !busca || item.nome.toLowerCase().includes(busca);
            
            // CORREÇÃO: Comparação direta. Se não houver filtro, passa tudo. 
            // Se houver, compara o item.tipo vindo do C# com o value do HTML.
            const matchTipo = !tipoSelecionado || item.tipo === tipoSelecionado;
            
            if (apenasNovos && !item.isNew) return false;
            if (apenasVenda && (!item.isForSale)) return false;
            if (apenasPromo && !item.isForSale) return false;

            if (dataInicio || dataFim) {
                const dataItem = new Date(item.dataInclusao);
                if (dataInicio && dataItem < dataInicio) return false;
                if (dataFim) {
                    const fimDoDia = new Date(dataFim);
                    fimDoDia.setHours(23, 59, 59, 999);
                    if (dataItem > fimDoDia) return false;
                }
            }

            return matchNome && matchTipo;
        });

        this.cosmeticosGrid.innerHTML = '';
        if (itensFiltrados.length === 0) {
        this.cosmeticosGrid.innerHTML = this.gerarHTMLVazio('Nenhum item na loja com estes filtros.');
        return;
        }

        const fragmento = document.createDocumentFragment();
        for (const item of itensFiltrados) {
            fragmento.appendChild(this.criarCard(item));
        }
        this.cosmeticosGrid.appendChild(fragmento);
    }

    renderizarTodosOsItens() {
        if (!this.allItemsGrid) return;
        
        // Limpa o spinner ou resultados anteriores
        this.allItemsGrid.innerHTML = '';
        
        if (this.todosOsItens.length === 0) {
            this.allItemsGrid.innerHTML = this.gerarHTMLVazio('Nenhum item encontrado no catálogo.');
            return;
        }

        const fragmento = document.createDocumentFragment();
        for (const item of this.todosOsItens) {
            // O criarCard já recebe o item validado pelo ValidadorItem
            fragmento.appendChild(this.criarCard(item));
        }
        this.allItemsGrid.appendChild(fragmento);
    }

    gerarSpinner() {
        return `
        <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 400px;">
            <div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        </div>`;
    }

    gerarHTMLVazio(msg) {
        return `<div class="col-12 text-center py-5 text-muted"><p>${msg}</p></div>`;
    }

    mostrarErro(msg, el) {
        if(el) el.innerHTML = `<div class="col-12 text-center py-5 text-danger"><p>${msg}</p></div>`;
    }

    preencheCarrousel() {
        if (!this.carrouselItems) return;
        
        const destaques = this.itens.filter(i => i.preco > 1500 || i.raridade.toLowerCase() === 'lendário' || i.raridade.toLowerCase() === 'série').slice(0, 5);
        
        this.carrouselItems.innerHTML = ''; 
        if (this.carouselIndicators) this.carouselIndicators.innerHTML = ''; 

        if (destaques.length === 0) {
            this.alternarControlesCarrossel(false);
            return;
        }

        this.alternarControlesCarrossel(true);
        destaques.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            
            const corClass = `bg-rarity-${this.obterClasseRaridade(item.raridade)}`;
            
            div.innerHTML = `
                <div class="${corClass}" style="position: absolute; width:100%; height:100%; opacity: 0.6;"></div>
                
                <div style="position: absolute; width:100%; height:100%; display: flex; align-items: center; justify-content: center; z-index: 1;">
                    <img src="${item.urlImagem}" style="height: 50%; object-fit: contain; filter: drop-shadow(0 0 30px rgba(0,0,0,0.6)); transform: scale(1.1);">
                </div>

                <div class="carousel-caption d-flex flex-column justify-content-end p-5" style="z-index: 2; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                    <span class="badge bg-warning text-dark mb-2 align-self-start shadow-sm">DESTAQUE</span>
                    <h1 class="fw-bold display-4 text-uppercase" style="text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">${item.nome}</h1>
                    <p class="fs-4 text-white-50">${item.tipo} &bull; ${item.raridade}</p>
                    
                    <div class="d-flex align-items-center gap-3 mt-3">
                        <h2 class="m-0 text-warning fw-bold me-4" style="text-shadow: 0 0 10px rgba(255, 193, 7, 0.4);">
                            ${item.preco} <small style="font-size: 0.5em;">V-Bucks</small>
                        </h2>
                        <button class="btn btn-signup btn-lg px-4 shadow-lg btn-comprar-carrousel">
                            <i class="bi bi-cart-fill me-2"></i> Comprar
                        </button>
                    </div>
                </div>
            `;
            
            div.querySelector('.btn-comprar-carrousel')?.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.abrirModalItem(item);
            });

            this.carrouselItems.appendChild(div);
            
            if (this.carouselIndicators) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.bsTarget = '#featuredCarousel';
                btn.dataset.bsSlideTo = index;
                if (index === 0) btn.className = 'active';
                this.carouselIndicators.appendChild(btn);
            }
        });
    }

    alternarControlesCarrossel(show) {
        if(this.carouselControlsContainer) this.carouselControlsContainer.style.display = show ? 'flex' : 'none';
    }

    criarCard(item) {
        const col = document.createElement('div');
        col.className = 'col mb-4'; 
        
        const raridadeClass = `bg-rarity-${this.obterClasseRaridade(item.raridade)}`;
        
        // 1. Lógica Condicional para as Badges
        // Só exibe a badge "À VENDA" se o item estiver marcado como disponível para venda
        const forSaleBadge = (item.isForSale && !item.isAdquirido) 
            ? `<span style="background-color: #58cc24; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">À VENDA</span>` 
            : '';
            
        const adquiridoBadge = (this.user && item.isAdquirido) 
            ? `<span style="background-color: #6c757d; color: #fff; font-size: 0.75rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">ADQUIRIDO</span>` 
            : '';

        // 2. Lógica Condicional para o Preço
        // Se não estiver à venda e não for adquirido, ocultamos o valor e o ícone de V-Bucks
        const vbucksIcon = `<span style="display:inline-flex; align-items:center; justify-content:center; width: 22px; height: 22px; background: #55cdfc; color: #fff; border-radius: 50%; font-size: 14px; font-weight: 900; border: 2px solid #fff; margin-left: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">V</span>`;
        
        const precoHTML = (item.isForSale || item.isAdquirido) 
            ? `<span class="product-price d-flex align-items-center">${item.preco} ${vbucksIcon}</span>`
            : `<span class="text-muted opacity-50" style="font-size: 0.9rem; font-weight: 700;">INDISPONÍVEL</span>`;

        col.innerHTML = `
            <div class="product-card d-flex flex-column h-100">
                <div class="product-image ${raridadeClass}">
                    <img src="${item.urlImagem}" alt="${item.nome}" loading="lazy">
                    <div style="position: absolute; top: 12px; left: 12px; display: flex;">
                        ${forSaleBadge} ${adquiridoBadge}
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="product-name text-truncate" title="${item.nome}">${item.nome}</h5>
                    <p class="product-type mb-auto">${item.tipo}</p>
                    <div class="d-flex justify-content-between align-items-end mt-4 pt-3" style="border-top: 1px solid rgba(255,255,255,0.05);">
                        <span class="${raridadeClass}" style="color: #fff; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.4); letter-spacing: 0.5px;">
                            ${item.raridade.toUpperCase()}
                        </span>
                        ${precoHTML}
                    </div>
                </div>
            </div>
        `;
        
        col.addEventListener('click', () => this.abrirModalItem(item));
        return col;
    }

    abrirModalItem(item) {
        if(!this.itemModalElement) return;
        
        const vbucksIcon = `<span style="display:inline-block; width: 24px; height: 24px; background: #55cdfc; color: #fff; border-radius: 50%; text-align: center; line-height: 24px; font-size: 14px; font-weight: bold; border: 2px solid #fff; margin-left: 8px; box-shadow: 0 0 8px rgba(85,205,252,0.5);">V</span>`;

        document.getElementById('modal-item-name').textContent = item.nome;
        document.getElementById('modal-item-type').textContent = item.tipo;
        document.getElementById('modal-item-price').innerHTML = `${item.preco} ${vbucksIcon}`;
        document.getElementById('modal-item-description').textContent = item.descricao || "Sem descrição disponível.";
        
        document.getElementById('modal-detail-rarity').textContent = item.raridade;
        document.getElementById('modal-detail-category').textContent = item.tipo;
        document.getElementById('modal-detail-date').textContent = new Date(item.dataInclusao).toLocaleDateString();
        
        const imgContainer = document.getElementById('modal-item-image');
        imgContainer.className = 'item-modal-image'; 
        imgContainer.classList.add(`bg-rarity-${this.obterClasseRaridade(item.raridade)}`);
        
        imgContainer.innerHTML = `
            <img src="${item.urlImagem}" alt="${item.nome}">
            <div class="item-modal-badges">
                ${item.isNew ? '<span class="badge badge-new">Novo</span>' : ''}
            </div>
            <div class="item-modal-rarity">
                <span class="badge bg-dark border border-light">${item.raridade}</span>
            </div>
        `;

        const availabilityDiv = document.getElementById('modal-item-availability');
        const availTitle = document.getElementById('modal-availability-title');
        const availText = document.getElementById('modal-availability-text');
        const availIcon = availabilityDiv.querySelector('i');

        availabilityDiv.classList.remove('status-disponivel', 'status-adquirido', 'status-indisponivel');

        if (this.user && item.isAdquirido) {
            availabilityDiv.classList.add('status-adquirido');
            availIcon.className = 'bi bi-check-circle-fill';
            availTitle.textContent = 'Adquirido';
            availText.textContent = 'Este item já está na sua coleção.';
            document.getElementById('btn-buy').style.display = 'none';
            document.getElementById('btn-devolver').style.display = 'flex';
        } 
        else if (item.isForSale) {
            availabilityDiv.classList.add('status-disponivel');
            availIcon.className = 'bi bi-cart-check-fill';
            availTitle.textContent = 'Disponível';
            availText.textContent = 'Aproveite enquanto está na loja!';
            document.getElementById('btn-buy').style.display = 'flex';
            document.getElementById('btn-devolver').style.display = 'none';
        } 
        else {
            availabilityDiv.classList.add('status-indisponivel');
            availIcon.className = 'bi bi-lock-fill';
            availTitle.textContent = 'Indisponível';
            availText.textContent = 'Este item não pode ser comprado no momento.';
            document.getElementById('btn-buy').style.display = 'none';
            document.getElementById('btn-devolver').style.display = 'none';
        }

        const modal = new bootstrap.Modal(this.itemModalElement);
        modal.show();
    }

    handleCompraClick() {
        Swal.fire('Funcionalidade em desenvolvimento', 'A compra será implementada em breve!', 'info');
    }

    handleDevolucaoClick() {
        Swal.fire('Funcionalidade em desenvolvimento', 'A devolução será implementada em breve!', 'info');
    }

    obterClasseRaridade(raridade) {
        if(!raridade) return 'common';
        const r = raridade.toLowerCase();
        if (r.includes('lendário') || r.includes('legendary')) return 'legendary';
        if (r.includes('épico') || r.includes('epic')) return 'epic';
        if (r.includes('raro') || r.includes('rare')) return 'rare';
        if (r.includes('incomum') || r.includes('uncommon')) return 'uncommon';
        if (r.includes('série') || r.includes('marvel') || r.includes('star wars') || r.includes('icon') || r.includes('dc')) return 'serie';
        return 'common';
    }

    limparFiltrosLoja() {
        if(this.shopSearchInput) this.shopSearchInput.value = '';
        if(this.shopTypeFilter) this.shopTypeFilter.value = '';
        if(this.shopRarityFilter) this.shopRarityFilter.value = '';
        if(this.shopCheckNew) this.shopCheckNew.checked = false;
        if(this.shopCheckForSale) this.shopCheckForSale.checked = false;
        if(this.shopCheckPromo) this.shopCheckPromo.checked = false;
        if(this.shopDateStart) this.shopDateStart.value = '';
        if(this.shopDateEnd) this.shopDateEnd.value = '';
        
        this.renderizaItens();
    }

    limparFiltrosTodos() {
        if(this.allSearchInput) this.allSearchInput.value = '';
        if(this.allTypeFilter) this.allTypeFilter.value = '';
        if(this.allRarityFilter) this.allRarityFilter.value = '';
        this.buscaTodosOsItens();
    }
}

class ValidadorItem {
    constructor(apiData, isAdquirido) {
        this.raw = apiData;
        this.isAdquirido = isAdquirido;
    }

    validaDados() {
        // 1. Tratamento para nomes nulos ou strings "null" (visto no seu print)
        const nomeValido = (this.raw.name && this.raw.name !== "null") ? this.raw.name : 'Sem Nome';

        // 2. Lógica de Venda: O item só está à venda se a API enviar um preço maior que zero 
        // ou se a propriedade shopHistory/isForSale existir e for verdadeira
        const precoItem = this.raw.price || 0;
        const estaNaLoja = (this.raw.isForSale === true) || (precoItem > 0);

        return {
            id: this.raw.id || '',
            nome: nomeValido,
            descricao: this.raw.description || 'Sem descrição.',
            tipo: this.raw.type?.displayValue || 'Cosmético',
            raridade: this.raw.rarity?.displayValue || 'Comum',
            urlImagem: this.raw.images?.icon || this.raw.images?.small || this.raw.images?.large || '',
            preco: precoItem,
            dataInclusao: this.raw.added || new Date().toISOString(),
            isNew: this.raw.isNew || false, 
            
            // CORREÇÃO: Agora o valor depende da realidade do item, não é mais fixo
            isForSale: estaNaLoja, 
            
            isAdquirido: this.isAdquirido,
            isBundle: this.raw.isBundle || false,
            cores: this.raw.colors || []
        };
    }
}