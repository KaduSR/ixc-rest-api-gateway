"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdensServicoResource = void 0;
var base_1 = require("../base");
/**
 * Recurso para interagir com as Ordens de Serviço (su_oss_chamado) da API IXC.
 */
var OrdensServicoResource = /** @class */ (function (_super) {
    __extends(OrdensServicoResource, _super);
    function OrdensServicoResource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.resourceName = "su_oss_chamado";
        return _this;
    }
    /**
     * Lista ordens de serviço para um cliente específico.
     * @param idCliente ID do cliente.
     * @param page Página da requisição (string).
     * @param rp Resultados por página (string).
     * @param sortname Campo para ordenação.
     * @param sortorder Ordem de classificação ('asc' ou 'desc').
     * @returns Lista de Ordens de Serviço.
     */
    OrdensServicoResource.prototype.listarOrdensServico = function (idCliente_1) {
        return __awaiter(this, arguments, void 0, function (idCliente, page, rp, sortname, sortorder) {
            var query, response;
            if (page === void 0) { page = '1'; }
            if (rp === void 0) { rp = '1000'; }
            if (sortname === void 0) { sortname = 'su_oss_chamado.id'; }
            if (sortorder === void 0) { sortorder = 'desc'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            qtype: 'id_cliente',
                            query: idCliente.toString(),
                            oper: '=',
                            page: page,
                            rp: rp,
                            sortname: sortname,
                            sortorder: sortorder,
                        };
                        return [4 /*yield*/, this.request(this.resourceName, query)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.registros.map(function (registro) { return ({
                                id: registro.id,
                                tipo: registro.tipo,
                                id_filial: registro.id_filial,
                                status: registro.status,
                                id_cliente: registro.id_cliente,
                                id_assunto: registro.id_assunto,
                                mensagem: registro.mensagem,
                                protocolo: registro.protocolo,
                                data_abertura: registro.data_abertura,
                                data_inicio: registro.data_inicio,
                                data_final: registro.data_final,
                                data_fechamento: registro.data_fechamento,
                                mensagem_resposta: registro.mensagem_resposta,
                                id_contrato_kit: registro.id_contrato_kit,
                                id_login: registro.id_login,
                                endereco: registro.endereco,
                                bairro: registro.bairro,
                                cidade: registro.cidade,
                                latitude: registro.latitude,
                                longitude: registro.longitude,
                                ultima_atualizacao: registro.ultima_atualizacao,
                            }); })];
                }
            });
        });
    };
    return OrdensServicoResource;
}(base_1.QueryBase));
exports.OrdensServicoResource = OrdensServicoResource;
