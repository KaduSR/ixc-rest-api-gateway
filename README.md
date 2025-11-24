# IXC REST API Gateway

## Descrição do Projeto

Este projeto é um SDK e um gateway de API para integração com a API do ERP IXC. Ele facilita o acesso e a manipulação de dados do IXC através de endpoints REST, orquestrando um fluxo de dados completo que inclui autenticação de clientes, recuperação de dados cadastrais, contratos, logins e informações financeiras.

O backend atua como um intermediário seguro, utilizando um `IXC_ADMIN_TOKEN` para todas as chamadas à API do IXC, enquanto o frontend (ou cliente) se autentica localmente com email e senha do hotsite do cliente.

## Funcionalidades Principais

-   **Autenticação de Cliente**: Verifica credenciais de email e senha do hotsite contra os dados do IXC.
-   **Orquestração de Dados**: Agrega dados de múltiplos endpoints do IXC (clientes, contratos, logins, financeiro) em uma única resposta.
-   **Segurança**: Utiliza `IXC_ADMIN_TOKEN` para comunicação com o IXC e JWT para autenticação local do gateway.
-   **Estrutura Modular**: Recursos separados para cada tipo de dado do IXC.
-   **Deploy Facilitado**: Configuração para deploy na Vercel.

## Configuração do Ambiente

### Pré-requisitos

-   Node.js (versão 18 ou superior)
-   npm ou yarn

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/KaduSR/ixc-rest-api-gateway.git
    cd ixc-rest-api-gateway
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
IXC_API_URL=sua_url_base_da_api_ixc
IXC_ADMIN_TOKEN=seu_token_admin_ixc_base64_encodado
IXC_IXCSOFT_HEADER=listar
JWT_SECRET=seu_segredo_jwt_aqui
```

-   `IXC_API_URL`: A URL base da API do IXC (ex: `https://seu_dominio.com.br/webservice/v1`).
-   `IXC_ADMIN_TOKEN`: Seu token de administrador do IXC, **Base64 encodado**. Se seu token for `ID:TOKEN`, você deve encodá-lo (ex: `echo -n "ID:TOKEN" | base64`).
-   `IXC_IXCSOFT_HEADER`: O valor para o cabeçalho `ixcsoft` (geralmente `listar`).
-   `JWT_SECRET`: Uma string secreta forte para assinar os tokens JWT locais.

## Como Rodar o Projeto

### Modo de Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento (com `ts-node-dev` para hot-reloading):

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

### Modo de Produção

Para compilar e iniciar o servidor em modo de produção:

```bash
npm run build
npm start
```

## Endpoints da API

### `POST /api/full-data`

Este endpoint orquestra a busca de dados completos de um cliente.

-   **Método**: `POST`
-   **Corpo da Requisição**:
    ```json
    {
        "email": "email_do_cliente@exemplo.com",
        "password": "senha_do_hotsite"
    }
    ```
-   **Resposta**: Retorna um objeto contendo dados do cliente, contratos, faturas, logins e consumo (atualmente mockado).

### Outros Endpoints (Protegidos por JWT)

-   `POST /api/login`: Autentica o cliente e retorna um JWT.
-   `GET /api/dashboard`: Retorna dados do dashboard para o cliente autenticado.
-   `POST /api/trocar-senha`: Permite ao cliente autenticado trocar sua senha.
-   `POST /api/desbloqueio-confianca`: Permite ao cliente autenticado solicitar desbloqueio de confiança.
-   `GET /api/logins/:id/:action`: Realiza ações em logins específicos.

## Testes

Para rodar os testes unitários:

```bash
npm test
```

Para rodar os testes em modo `watch`:

```bash
npm run test:watch
```

Para gerar um relatório de cobertura de testes:

```bash
npm run test:coverage
```

## Deploy na Vercel

Este projeto está configurado para deploy na Vercel. O arquivo `vercel.json` na raiz do projeto contém as regras de `rewrites` necessárias para direcionar as requisições da API.

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

Certifique-se de configurar as variáveis de ambiente (`IXC_API_URL`, `IXC_ADMIN_TOKEN`, `IXC_IXCSOFT_HEADER`, `JWT_SECRET`) diretamente nas configurações do seu projeto Vercel.

## Contribuição

Sinta-se à vontade para contribuir com o projeto. Por favor, abra issues para bugs ou sugestões e envie pull requests com suas melhorias.

## Licença

Este projeto está licenciado sob a licença MIT.
