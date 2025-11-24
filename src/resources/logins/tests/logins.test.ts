import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { QueryBase } from "../../base";
import { Logins } from "..";

jest.mock('../../base');

describe('Logins', () => {
    let instance: Logins;
    let mockRequest: jest.SpyInstance;
    let mockUpdate: jest.SpyInstance;

    beforeEach(() => {
        instance = new Logins({
            token: 'fake-token',
            baseUrl: 'https://fake-url.com',
        });
        mockRequest = jest.spyOn(QueryBase.prototype, 'request').mockResolvedValue({ registros: [] });
        mockUpdate = jest.spyOn(QueryBase.prototype, 'update').mockResolvedValue({ success: true });
    });

    afterEach(() => {
        mockRequest.mockRestore();
        mockUpdate.mockRestore();
    });

    describe('listar', () => {
        it('deve chamar a API com os parâmetros corretos', async () => {
            await instance.listar({ id_cliente: 123 });

            expect(mockRequest).toHaveBeenCalledWith('v1/radusuarios', {
                qtype: 'radusuarios.id_cliente',
                query: '123',
                oper: '=',
                page: 1,
                sortname: 'radusuarios.id',
                sortorder: 'desc',
            });
        });
    });
    
    describe('limparMac', () => {
        it('deve chamar update com o payload correto para limpar MAC', async () => {
            const loginId = 1;
            await instance.limparMac(loginId);
            expect(mockUpdate).toHaveBeenCalledWith('v1/radusuarios', loginId, { mac: '' });
        });
    });

    describe('desconectarSessao', () => {
        it('deve chamar update com o payload de desconexão', async () => {
            const loginId = 1;
            await instance.desconectarSessao(loginId);
            expect(mockUpdate).toHaveBeenCalledWith('v1/radusuarios', loginId, { acao: 'desconectar' });
        });
    });

    describe('obterDiagnostico', () => {
        it('deve chamar request com query para o ID específico', async () => {
            const loginId = 1;
            const mockLogin = { id: 1, login: 'test' };
            mockRequest.mockResolvedValue({ registros: [mockLogin] });
            
            const result = await instance.obterDiagnostico(loginId);

            expect(mockRequest).toHaveBeenCalledWith('v1/radusuarios', {
                qtype: 'radusuarios.id',
                query: '1',
                oper: '=',
                page: 1,
                sortname: 'radusuarios.id',
                sortorder: 'asc'
            });
            expect(result).toEqual(mockLogin);
        });
    });
});
