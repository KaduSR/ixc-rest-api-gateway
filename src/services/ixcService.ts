import { URLSearchParams } from 'url';
import { QueryBody } from '../resources/base';

export class IxcService {
    private token: string;
    private baseUrl: string;

    constructor(token: string, baseUrl: string) {
        this.token = token;
        this.baseUrl = baseUrl;
    }

    async request<T>(resource: string, body: QueryBody): Promise<T> {
        const url = `${this.baseUrl}/${resource}`;
        const headers = {
            'Content-Type': 'application/json',
            'ixcsoft': 'listar',
            'Authorization': `Basic ${Buffer.from(this.token).toString('base64')}`
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }
}
