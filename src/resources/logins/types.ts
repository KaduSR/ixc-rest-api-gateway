import { ResponseBody } from "../base";

export declare type Login = {
    id: number;
    id_cliente: number;
    login: string;
    ativo: 'S' | 'N';
    online: 'S' | 'N'; // IXC usa 'S' ou 'SS' para online, 'N' para offline
    mac: string;
    ip: string;
    sinal_ultimo_atendimento: string;
    tempo_conectado: string;
    download_atual: string;
    upload_atual: string;
    id_contrato: number;
    [key: string]: any; // Permite outros campos
};

export declare type LoginResponse = ResponseBody<Login>;
export declare type LoginAttrs = keyof Login;
