# 🎮 Fortnite Store - Desafio Técnico Full Stack (ASP.NET Core + SQLite)

![C#](https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=csharp&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core%208-.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Entity Framework](https://img.shields.io/badge/EF%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Bootstrap](https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white)
![SweetAlert2](https://img.shields.io/badge/SweetAlert2-%23fe5f5f.svg?style=for-the-badge&logo=sweetalert2&logoColor=white)

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Aplicação Web Full Stack desenvolvida com **ASP.NET Core**. O sistema simula uma loja virtual de cosméticos do Fortnite, consumindo dados reais da API pública e gerenciando compras, créditos (V-Bucks) e usuários de forma persistente.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API)
* **ASP.NET Core 8 (Web API):** Framework robusto para construção de endpoints RESTful.
* **Entity Framework Core:** ORM para abstração e manipulação do banco de dados.
* **SQLite:** Banco de dados relacional leve e portátil (arquivo `.db`), ideal para este desafio.
* **JWT (JSON Web Token):** Garantia de autenticação segura e stateless entre Front e Back.
* **AutoMapper:** Para conversão eficiente entre Entidades e DTOs (Data Transfer Objects).
* **Background Services (IHostedService):** Sincronização automática com a API do Fortnite em intervalos definidos.

### Frontend (Client)
* **JavaScript (ES6+):** Lógica assíncrona com `fetch` para comunicação com o ASP.NET.
* **Bootstrap 5:** UI responsiva e moderna.
* **SweetAlert2:** Experiência de usuário rica com modais de confirmação e alertas.

---

## 💡 Decisões Técnicas Relevantes

1.  **SQLite para Portabilidade:**
    * A escolha do SQLite permitiu que o projeto seja executado imediatamente após o clone, sem a necessidade de configurar servidores de banco de dados complexos ou containers pesados.

2.  **Arquitetura Limpa no ASP.NET:**
    * Uso de **Injeção de Dependência** nativa para desacoplar os serviços de lógica de negócio (`Services`) dos controladores (`Controllers`), facilitando a manutenção.

3.  **Sincronização de Loja (Cron Job):**
    * Como a loja do Fortnite muda diariamente, implementei um serviço em segundo plano no ASP.NET que atualiza o catálogo local, evitando que o usuário visualize itens expirados.

4.  **Segurança de Saldo:**
    * Toda transação de compra valida o saldo do usuário no lado do servidor (Backend) antes de persistir, evitando manipulações maliciosas via console do navegador.

---

## 💻 Como Rodar Localmente

### Pré-requisitos
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* IDE (VS Code ou Visual Studio 2022)

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/MBDomingues/FORTINITE_PROJECT_CSHARP.git](https://github.com/MBDomingues/FORTINITE_PROJECT_CSHARP.git)
    cd FORTINITE_PROJECT_CSHARP
    ```

2.  **Configurar o Banco de Dados:**
    As migrations criarão o arquivo SQLite automaticamente.
    ```bash
    dotnet ef database update
    ```

3.  **Executar o Backend:**
    ```bash
    dotnet run
    ```
    *A API estará disponível em: `http://localhost:5000`*

4.  **Acessar a Documentação:**
    Explore e teste os endpoints via **Swagger** em: `http://localhost:5000/swagger`

5.  **Abrir o Frontend:**
    Navegue até a pasta do frontend e abra o `index.html`. 
    > **Nota:** Certifique-se de que a URL da API no seu código JS aponta para o endereço correto do `localhost`.

---

## 🔌 Endpoints Principais

| Método | Rota | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Cadastro de novo usuário | Pública |
| `POST` | `/api/auth/login` | Login e retorno de Token | Pública |
| `GET` | `/api/cosmeticos` | Lista itens da loja sincronizada | Pública |
| `POST` | `/api/loja/comprar` | Realiza a troca de V-Bucks por item | **JWT** |
| `GET` | `/api/perfil/me` | Retorna dados e saldo do usuário | **JWT** |

---
