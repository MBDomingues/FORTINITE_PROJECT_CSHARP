class VitrineJS {
    constructor(userToken) {
        this.user = userToken || null;
        
        this.API_BASE_URL = '/api'; 
        
        this.itens = []; 
        this.userData = null;
        this.todosOsItens = []; 
        this.todosOsItensCarregados = false;
        this.usuarios = [];
        this.usuariosCarregados = false;
        this.historico = [];
        this.historicoCarregado = false;
        this.itensAdquiridosSet = new Set();
        this.carouselIndicators = null;
        this.itemModalElement = null;
        this.currentItemInModal = null;

        this.coresPadraoRaridade = {
            'comum': '#b0b0b0', 'common': '#b0b0b0',
            'incomum': '#60aa3a', 'uncommon': '#60aa3a',
            'raro': '#4ec1f3', 'rare': '#4ec1f3',
            'épico': '#bf6ee0', 'epic': '#bf6ee0',
            'lendário': '#e9a748', 'legendary': '#e9a748'
        };

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
        this.cosmeticosGrid = document.getElementById('shop-grid'); 
        this.carrouselItems = document.getElementById('carouselItems');
        this.navItens = document.getElementById('nav-itens');
        this.carouselIndicators = document.querySelector('#featuredCarousel .carousel-indicators');
        this.carouselControlsContainer = document.getElementById('carousel-external-controls');

        this.perfilModal = document.getElementById('userProfileModal');
        this.itemModalElement = document.getElementById('itemModal');
        
        this.btnBuy = document.getElementById('btn-buy');
        if (this.btnBuy) this.btnBuy.addEventListener('click', () => this.handleCompraClick());
        
        this.btnDevolver = document.getElementById('btn-devolver');
        if (this.btnDevolver) this.btnDevolver.addEventListener('click', () => this.handleDevolucaoClick());
        
        // --- FILTROS LOJA ---
        this.shopTypeFilter = document.getElementById('shop-typeFilter');
        this.shopRarityFilter = document.getElementById('shop-rarityFilter');
        this.shopSearchInput = document.getElementById('shop-searchInput');
        this.shopClearBtn = document.getElementById('shop-clearFilters');
        // Inputs booleanos
        this.shopCheckNew = document.getElementById('shop-checkNew');
        this.shopCheckForSale = document.getElementById('shop-checkForSale');
        this.shopCheckPromo = document.getElementById('shop-checkPromo');
        this.shopDateStart = document.getElementById('shop-dateStart');
        this.shopDateEnd = document.getElementById('shop-dateEnd');

        const shopInputs = ['shop-typeFilter', 'shop-rarityFilter', 'shop-searchInput', 'shop-checkNew', 'shop-checkForSale', 'shop-checkPromo'];
        shopInputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener(el.type === 'text' ? 'input' : 'change', () => this.renderizaItens());
        });

        if(this.shopClearBtn) this.shopClearBtn.addEventListener('click', () => this.limparFiltrosLoja());
        
        this.allItemsTab = document.getElementById('all-items-tab');
        this.allItemsGrid = document.getElementById('all-items-grid');
        this.allTypeFilter = document.getElementById('all-typeFilter');
        this.allRarityFilter = document.getElementById('all-rarityFilter');
        this.allSearchInput = document.getElementById('all-searchInput');
        this.allClearBtn = document.getElementById('all-clearFilters');
        this.allCheckPromo = document.getElementById('all-checkPromo');
        this.allDateStart = document.getElementById('all-dateStart');
        this.allDateEnd = document.getElementById('all-dateEnd');

        const allInputs = ['all-typeFilter', 'all-rarityFilter', 'all-searchInput'];
        allInputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                if (el.type === 'text') {
                    let timeout;
                    el.addEventListener('input', () => { clearTimeout(timeout); timeout = setTimeout(() => this.buscaTodosOsItens(), 500); });
                } else {
                    el.addEventListener('change', () => this.buscaTodosOsItens());
                }
            }
        });

        if(this.allClearBtn) this.allClearBtn.addEventListener('click', () => this.limparFiltrosTodos());
        if (this.allItemsTab) this.allItemsTab.addEventListener('show.bs.tab', () => { if (!this.todosOsItensCarregados) this.buscaTodosOsItens(); });

        this.usersTabContainer = document.getElementById('users-tab-container');
        this.myItemsTabContainer = document.getElementById('my-items-tab-container');
    }

    async verificaUsuario() {
        if (this.user) {
            const userName = localStorage.getItem('user_name') || 'Usuário';
            
            if (this.myItemsTabContainer) this.myItemsTabContainer.style.display = 'block';
            
            this.navItens.innerHTML = `
                <span class="nav-creditos d-flex align-items-center me-3 text-light">
                    <i class="bi bi-person-circle me-2"></i> ${userName}
                </span>
                <button id="nav-logout" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-box-arrow-right"></i> Sair
                </button>
            `;
            
            document.getElementById('nav-logout')?.addEventListener('click', () => {
                localStorageManager.removeToken();
                window.location.href = '/Home/Login';
            });
        }
    }

    // ================================================================
    // BUSCA NA LOJA (Home) -> BaseResponse Adaptado
    // ================================================================
    async buscaItensDisponiveis() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/cosmeticos/loja`);
            const resultado = await response.json(); // Recebe BaseResponse
            
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

        const url = new URL(`${window.location.origin}${this.API_BASE_URL}/cosmeticos`);
        
        const busca = this.allSearchInput ? this.allSearchInput.value.trim() : '';
        const tipo = this.allTypeFilter ? this.allTypeFilter.value : '';
        const raridade = this.allRarityFilter ? this.allRarityFilter.value : '';

        if (busca) url.searchParams.append('nome', busca);
        if (tipo) url.searchParams.append('tipo', this._getTipoMapa('api')[tipo.toLowerCase()] || tipo);
        if (raridade) url.searchParams.append('raridade', this.traduzirRaridadeParaAPI(raridade));
        
        url.searchParams.append('page', '1'); 
        url.searchParams.append('pageSize', '100'); 

        try {
            this.allItemsGrid.innerHTML = this.gerarSpinner();
            
            const response = await fetch(url.toString());
            const resultado = await response.json(); // Recebe BaseResponse
            
            // Verifica status
            if (!response.ok || (resultado.status && resultado.status !== 200)) {
                throw new Error(resultado.message || `Erro HTTP: ${response.status}`);
            }
            
            // Desembrulha:
            // resultado.data = Objeto de Paginação (Total, Page, Data)
            // resultado.data.data = Lista real de itens
            const paginacao = resultado.data || {};
            const listaItensRaw = paginacao.data || []; 

            this.todosOsItens = listaItensRaw.map(item => {
                const isAdquirido = this.itensAdquiridosSet.has(item.id);
                return new ValidadorItem(item, isAdquirido).validaDados();
            });

            this.renderizarTodosOsItens(); 
        } catch (error) {
            console.error('Erro catalogo:', error);
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
        const tipo = this.shopTypeFilter?.value.toLowerCase();
        
        // Filtros adicionais locais (Data, Promo, etc)
        const dataInicio = this.shopDateStart && this.shopDateStart.value ? new Date(this.shopDateStart.value) : null;
        const dataFim = this.shopDateEnd && this.shopDateEnd.value ? new Date(this.shopDateEnd.value) : null;
        const apenasNovos = this.shopCheckNew ? this.shopCheckNew.checked : false;
        const apenasVenda = this.shopCheckForSale ? this.shopCheckForSale.checked : false;
        const apenasPromo = this.shopCheckPromo ? this.shopCheckPromo.checked : false;

        let itensFiltrados = this.itens.filter(item => {
            const matchNome = !busca || item.nome.toLowerCase().includes(busca);
            const matchTipo = !tipo || item.tipo.toLowerCase().includes(this._getTipoMapa()[tipo] || tipo);
            
            // Lógica de datas e flags
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
        this.allItemsGrid.innerHTML = '';
        
        if (this.todosOsItens.length === 0) {
            this.allItemsGrid.innerHTML = this.gerarHTMLVazio('Nenhum item encontrado no catálogo.');
            return;
        }

        const fragmento = document.createDocumentFragment();
        for (const item of this.todosOsItens) {
            fragmento.appendChild(this.criarCard(item));
        }
        this.allItemsGrid.appendChild(fragmento);
    }

    // --- UI HELPERS ---
    gerarSpinner() {
        return `<div class="col-12 text-center py-5"><div class="spinner-border text-light" role="status"></div></div>`;
    }

    gerarHTMLVazio(msg) {
        return `<div class="col-12 text-center py-5 text-muted"><p>${msg}</p></div>`;
    }

    mostrarErro(msg, el) {
        if(el) el.innerHTML = `<div class="col-12 text-center py-5 text-danger"><p>${msg}</p></div>`;
    }

    preencheCarrousel() {
        if (!this.carrouselItems) return;
        
        // Lógica de filtro mantida
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
            
            // Usa sua classe de gradiente
            const corClass = `bg-rarity-${this.obterClasseRaridade(item.raridade)}`;
            
            div.innerHTML = `
                <div class="${corClass}" style="position: absolute; width:100%; height:100%; opacity: 0.6;"></div>
                
                <div style="position: absolute; width:100%; height:100%; display: flex; align-items: center; justify-content: center; z-index: 1;">
                    <img src="${item.urlImagem}" style="height: 80%; object-fit: contain; filter: drop-shadow(0 0 30px rgba(0,0,0,0.6)); transform: scale(1.1);">
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
            
            // Evento no botão do carrossel
            div.querySelector('.btn-comprar-carrousel')?.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita bugs
                this.abrirModalItem(item);
            });

            this.carrouselItems.appendChild(div);
            
            // Indicadores
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

    // --- CRIAÇÃO DE CARDS E MODAIS ---
    criarCard(item) {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Pega a classe de raridade do seu CSS (ex: bg-rarity-legendary)
        const raridadeClass = `bg-rarity-${this.obterClasseRaridade(item.raridade)}`;
        
        // Badges HTML
        const newBadge = item.isNew ? `<span class="badge status-badge badge-new">Novo</span>` : '';
        const forSaleBadge = (item.isForSale && !item.isAdquirido) ? `<span class="badge status-badge badge-for-sale">À Venda</span>` : '';
        const adquiridoBadge = (this.user && item.isAdquirido) ? `<span class="badge status-badge badge-adquirido">Adquirido</span>` : '';
        const bundleBadge = item.isBundle ? `<span class="badge status-badge bg-primary">Pacote</span>` : '';

        col.innerHTML = `
            <div class="product-card h-100">
                <div class="product-image ${raridadeClass}">
                    <img src="${item.urlImagem}" alt="${item.nome}" loading="lazy">
                    
                    <div class="product-status-badges" style="position: absolute; top: 10px; left: 10px;">
                        ${bundleBadge} ${newBadge} ${forSaleBadge} ${adquiridoBadge}
                    </div>
                </div>

                <div class="card-body d-flex flex-column">
                    <h5 class="product-name text-truncate" title="${item.nome}">${item.nome}</h5>
                    <p class="product-type mb-auto">${item.tipo}</p>
                    
                    <div class="d-flex justify-content-between align-items-end mt-3">
                        <span class="badge bg-dark border border-secondary text-uppercase" style="font-size: 0.7rem; letter-spacing: 1px;">
                            ${item.raridade}
                        </span>
                        <span class="product-price">
                            ${item.preco} <img src="/images/vbuck.png" width="20" style="vertical-align: sub;" onerror="this.style.display='none'">
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        col.addEventListener('click', () => this.abrirModalItem(item));
        return col;
    }

    abrirModalItem(item) {
        if(!this.itemModalElement) return;
        
        // 1. Textos
        document.getElementById('modal-item-name').textContent = item.nome;
        document.getElementById('modal-item-type').textContent = item.tipo;
        document.getElementById('modal-item-price').textContent = item.preco;
        document.getElementById('modal-item-description').textContent = item.descricao || "Sem descrição disponível.";
        
        // Detalhes extras
        document.getElementById('modal-detail-rarity').textContent = item.raridade;
        document.getElementById('modal-detail-category').textContent = item.tipo;
        document.getElementById('modal-detail-date').textContent = new Date(item.dataInclusao).toLocaleDateString();
        
        // 2. Imagem e Fundo (Usando suas classes CSS)
        const imgContainer = document.getElementById('modal-item-image');
        // Remove classes antigas de raridade para não acumular
        imgContainer.className = 'item-modal-image'; 
        // Adiciona a nova classe de raridade
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

        // 3. Status de Disponibilidade (Ícone e Texto)
        const availabilityDiv = document.getElementById('modal-item-availability');
        const availTitle = document.getElementById('modal-availability-title');
        const availText = document.getElementById('modal-availability-text');
        const availIcon = availabilityDiv.querySelector('i');

        // Remove classes de status anteriores
        availabilityDiv.classList.remove('status-disponivel', 'status-adquirido', 'status-indisponivel');

        if (this.user && item.isAdquirido) {
            availabilityDiv.classList.add('status-adquirido');
            availIcon.className = 'bi bi-check-circle-fill';
            availTitle.textContent = 'Adquirido';
            availText.textContent = 'Este item já está na sua coleção.';
            document.getElementById('btn-buy').style.display = 'none';
            document.getElementById('btn-devolver').style.display = 'flex'; // Mostra botão devolver
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
        if (r.includes('série') || r.includes('marvel') || r.includes('star wars')) return 'serie';
        return 'common';
    }

    limparFiltrosLoja() {
        if(this.shopSearchInput) this.shopSearchInput.value = '';
        if(this.shopTypeFilter) this.shopTypeFilter.value = '';
        if(this.shopRarityFilter) this.shopRarityFilter.value = '';
        // Reseta checkboxes
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
        return {
            id: this.raw.id || '',
            nome: this.raw.name || 'Sem Nome',
            tipo: this.raw.type?.displayValue || 'Cosmético',
            raridade: this.raw.rarity?.displayValue || 'Comum',
            urlImagem: this.raw.images?.small || this.raw.images?.icon || this.raw.images?.large || '',
            preco: this.raw.price || 0,
            descricao: this.raw.description || '',
            dataInclusao: this.raw.added || new Date().toISOString(),
            

            isNew: false, 
            isForSale: true,
            isAdquirido: this.isAdquirido,
            isBundle: false,
            cores: []
        };
    }
}