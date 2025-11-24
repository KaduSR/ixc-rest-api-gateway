/**
 * Configurações para autenticação e URL base da API.
 */
type Config = {
    token: string,
    baseUrl: string,
};

/**
 * Estrutura de resposta da API para listagens.
 * 
 * @template T - Tipo dos registros retornados.
 */
export declare type ResponseBody<T> = {
    page: string,
    total: number,
    registros: T[],
}

/**
 * Estrutura de consulta para requisições de listagem à API.
 */
export declare type QueryBody = {
    qtype: string,
    query: string,
    oper: '>' | '<' | '=' | 'like',
    page: number,
    rp?: number,
    sortname: string,
    sortorder: 'desc' | 'asc',
}

/**
 * Classe base para realizar requisições à API.
 */
export abstract class QueryBase {
    private apiKey: string;
    private baseUrl: string;
    private commonHeaders: Record<string, string>;

    constructor(config: Config) {
        this.apiKey = config.token;
        this.baseUrl = config.baseUrl;
        // FIX: Replaced Buffer with btoa for broader compatibility (available in modern Node.js and browsers)
        // and to resolve the type error in environments without explicit Node.js types.
        const token = `Basic ${btoa(this.apiKey)}`;
        this.commonHeaders = {
            'Content-Type': 'application/json',
            'Authorization': token,
        };
    }

    private async performRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        return fetch(url, options).then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'API Error') });
            }
            // Handle cases with empty response body
            return response.text().then(text => text ? JSON.parse(text) : {});
        });
    }

    public async request<T>(endpoint: string, query: QueryBody): Promise<T> {
        return this.performRequest<T>(endpoint, {
            method: "POST", // IXC uses POST for GET operations
            headers: { ...this.commonHeaders, 'ixcsoft': 'listar' },
            body: JSON.stringify(query),
        });
    }

    public async create<T, U>(endpoint: string, data: T): Promise<U> {
        return this.performRequest<U>(endpoint, {
            method: 'POST',
            headers: this.commonHeaders,
            body: JSON.stringify(data),
        });
    }

    public async update<T, U>(endpoint: string, id: number, data: T): Promise<U> {
        return this.performRequest<U>(`${endpoint}/${id}`, {
            method: 'PUT',
            headers: this.commonHeaders,
            body: JSON.stringify(data),
        });
    }
    
    public async remove<T>(endpoint: string, id: number): Promise<T> {
        return this.performRequest<T>(`${endpoint}/${id}`, {
            method: 'DELETE',
            headers: this.commonHeaders,
        });
    }
}