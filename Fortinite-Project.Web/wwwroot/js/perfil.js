/**
 * AuthManager
 * Gerencia Login e Cadastro conversando com a API C# (English DTOs)
 */
class AuthManager {
    constructor() {
        this.API_LOGIN = '/api/auth/login';
        this.API_REGISTER = '/api/auth/cadastro'; // Endpoint do AuthController
        
        // Elementos do DOM
        this.loginButton = document.getElementById('btn-login');
        this.registerButton = document.getElementById('btn-cadastro');
        this.errorElement = document.getElementById('error-message');
        this.alertErrorBox = document.getElementById('alert-error');

        this.initEvents();
    }

    initEvents() {
        // Evento de Login
        if (this.loginButton) {
            this.loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Evento de Cadastro
        if (this.registerButton) {
            this.registerButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    // --- LÓGICA DE CADASTRO ---
    async handleRegister() {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        const confirmPassInput = document.getElementById('confirm-password');
        const termsInput = document.getElementById('terms');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passInput.value.trim();
        const confirmPassword = confirmPassInput.value.trim();

        // Validação básica
        if (!name || !email || !password) {
            this.showError('Preencha todos os campos obrigatórios.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem.');
            return;
        }

        if (!termsInput.checked) {
            this.showError('Você precisa aceitar os termos.');
            return;
        }

        this.setLoading(true, this.registerButton);

        try {
            const payload = {
                Nome: name,      // Antes era 'name'
                Email: email,    // Antes era 'email'
                Senha: password  // Antes era 'password'
            };

            const response = await fetch(this.API_REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                // Se o backend retornar erro (ex: 400), a mensagem estará em result.message
                throw new Error(result.message || 'Erro ao realizar cadastro.');
            }

            // Sucesso (Status 201)
            // O C# retorna BaseResponse<T>, então os dados estão em result.data
            if (result.data && result.data.token) {
                localStorageManager.saveToken(result.data.token);
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Bem-vindo!',
                    text: 'Cadastro realizado com sucesso.',
                    timer: 2000,
                    showConfirmButton: false
                });

                window.location.href = '/Home/Index'; // Redireciona para Home
            }

        } catch (error) {
            console.error('Erro Cadastro:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false, this.registerButton, 'Criar Conta');
        }
    }

    // --- LÓGICA DE LOGIN ---
    async handleLogin() {
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');

        const email = emailInput.value.trim();
        const password = passInput.value.trim();

        if (!email || !password) {
            this.showError('Informe email e senha.');
            return;
        }

        this.setLoading(true, this.loginButton);

        try {
            // Payload em Inglês para bater com LoginDto do C#
            const payload = {
                email: email,
                password: password
            };

            const response = await fetch(this.API_LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Falha no login.');
            }

            // Sucesso (Status 200)
            if (result.data && result.data.token) {
                localStorageManager.saveToken(result.data.token);
                // Salva infos extras se quiser
                localStorage.setItem('user_name', result.data.name);
                
                window.location.href = '/Home/Index';
            } else {
                throw new Error('Token não recebido do servidor.');
            }

        } catch (error) {
            console.error('Erro Login:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false, this.loginButton, 'Entrar');
        }
    }

    // --- UTILITÁRIOS ---
    setLoading(isLoading, button, originalText) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processando...';
            this.hideError();
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    showError(msg) {
        if (this.errorElement && this.alertErrorBox) {
            this.errorElement.textContent = msg;
            this.alertErrorBox.classList.remove('d-none');
        } else {
            // Fallback se não tiver o elemento HTML na página
            Swal.fire({ icon: 'error', title: 'Erro', text: msg });
        }
    }

    hideError() {
        if (this.alertErrorBox) {
            this.alertErrorBox.classList.add('d-none');
        }
    }
}

// Gerenciador de LocalStorage (igual ao que você já tinha, apenas formatado)
class localStorageManager {
    static saveToken(token) {
        localStorage.setItem('jwt_token', token);
    }
    static getToken() {
        return localStorage.getItem('jwt_token');
    }
    static removeToken() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_name');
    }   
    static isLoggedIn() {
        return !!this.getToken();
    }
}