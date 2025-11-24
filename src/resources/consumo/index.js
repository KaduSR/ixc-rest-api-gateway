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
exports.ConsumoResource = void 0;
var base_1 = require("../base");
/**
 * Recurso para interagir com os dados de consumo de internet (radusuarios) da API IXC.
 */
var ConsumoResource = /** @class */ (function (_super) {
    __extends(ConsumoResource, _super);
    function ConsumoResource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.resourceName = "radusuarios"; // Base para radusuarios_consumo_d, _m, etc.
        return _this;
    }
    /**
     * Busca o consumo diário para um login específico.
     * @param loginId ID do login (radusuario)
     * @param page Página da requisição (string)
     * @param rp Resultados por página (string)
     * @returns Lista de ConsumoDiario
     */
    ConsumoResource.prototype.buscarConsumoDiario = function (loginId_1) {
        return __awaiter(this, arguments, void 0, function (loginId, page, rp) {
            var query, response;
            if (page === void 0) { page = '1'; }
            if (rp === void 0) { rp = '100'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            qtype: 'radusuarios.id',
                            query: loginId.toString(),
                            oper: '=',
                            page: page,
                            rp: rp,
                            sortname: 'data',
                            sortorder: 'desc',
                        };
                        return [4 /*yield*/, this.request("".concat(this.resourceName, "_consumo_d"), query)];
                    case 1:
                        response = _a.sent();
                        // Assumindo que a API retorna um array de objetos com download_bytes, upload_bytes e data
                        return [2 /*return*/, response.registros.map(function (registro) { return ({
                                data: registro.data,
                                download_bytes: parseFloat(registro.download_bytes),
                                upload_bytes: parseFloat(registro.upload_bytes),
                            }); })];
                }
            });
        });
    };
    /**
     * Busca o consumo mensal para um login específico.
     * @param loginId ID do login (radusuario)
     * @param page Página da requisição (string)
     * @param rp Resultados por página (string)
     * @returns Lista de ConsumoMensal
     */
    ConsumoResource.prototype.buscarConsumoMensal = function (loginId_1) {
        return __awaiter(this, arguments, void 0, function (loginId, page, rp) {
            var query, response;
            if (page === void 0) { page = '1'; }
            if (rp === void 0) { rp = '100'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            qtype: 'radusuarios.id',
                            query: loginId.toString(),
                            oper: '=',
                            page: page,
                            rp: rp,
                            sortname: 'mes_ano',
                            sortorder: 'desc',
                        };
                        return [4 /*yield*/, this.request("".concat(this.resourceName, "_consumo_m"), query)];
                    case 1:
                        response = _a.sent();
                        // Assumindo que a API retorna um array de objetos com download_bytes, upload_bytes e mes_ano
                        return [2 /*return*/, response.registros.map(function (registro) { return ({
                                mes_ano: registro.mes_ano,
                                download_bytes: parseFloat(registro.download_bytes),
                                upload_bytes: parseFloat(registro.upload_bytes),
                            }); })];
                }
            });
        });
    };
    /**
     * Agrega todos os dados de consumo para um login específico.
     * @param loginData Objeto Login contendo id, upload_atual e download_atual.
     * @returns Objeto Consumo completo
     */
    ConsumoResource.prototype.getConsumoCompleto = function (loginData) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, diario, mensal, history;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.buscarConsumoDiario(loginData.id),
                            this.buscarConsumoMensal(loginData.id),
                        ])];
                    case 1:
                        _a = _b.sent(), diario = _a[0], mensal = _a[1];
                        history = {
                            daily: diario,
                            monthly: mensal,
                        };
                        return [2 /*return*/, {
                                total_download_bytes: parseFloat(loginData.download_atual || '0'),
                                total_upload_bytes: parseFloat(loginData.upload_atual || '0'),
                                history: history,
                            }];
                }
            });
        });
    };
    return ConsumoResource;
}(base_1.QueryBase));
exports.ConsumoResource = ConsumoResource;
