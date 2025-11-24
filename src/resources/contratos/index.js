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
exports.Contratos = void 0;
var base_1 = require("../base");
var resourceName = "cliente_contrato";
/**
 * Classe para gerenciar contratos.
 */
var Contratos = /** @class */ (function (_super) {
    __extends(Contratos, _super);
    function Contratos(config) {
        return _super.call(this, config) || this;
    }
    /**
     * Filtra contratos com base em um atributo.
     */
    Contratos.prototype.filtrarContratos = function (attr_1) {
        return __awaiter(this, arguments, void 0, function (attr, oper, page, sortAttr, sortorder) {
            var key, value, response;
            if (oper === void 0) { oper = '='; }
            if (page === void 0) { page = 1; }
            if (sortAttr === void 0) { sortAttr = 'id_cliente'; }
            if (sortorder === void 0) { sortorder = 'desc'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = Object.keys(attr)[0];
                        value = attr[key];
                        return [4 /*yield*/, this.request(resourceName, {
                                qtype: "contrato.".concat(key),
                                query: value,
                                oper: oper,
                                page: page.toString(),
                                sortname: "contrato.".concat(sortAttr),
                                sortorder: sortorder
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.registros];
                }
            });
        });
    };
    /**
     * Busca um contrato pelo seu id.
     */
    Contratos.prototype.buscarContratosPorId = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var query, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            qtype: 'cliente_contrato.id',
                            query: id.toString(),
                            oper: '=',
                            page: '1',
                            sortname: 'cliente_contrato.id',
                            sortorder: 'asc',
                        };
                        return [4 /*yield*/, this.request('v1/cliente_contrato', query)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.registros[0]];
                }
            });
        });
    };
    /**
     * Busca contratos por id de cliente.
     */
    Contratos.prototype.buscarContratosPorIdCliente = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var query, contratos;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {
                            qtype: 'cliente_contrato.id_cliente',
                            query: id.toString(),
                            oper: '=',
                            page: '1',
                            sortname: 'cliente_contrato.id',
                            sortorder: 'asc'
                        };
                        return [4 /*yield*/, this.request(resourceName, query)];
                    case 1:
                        contratos = _a.sent();
                        if (!contratos || !contratos.registros || contratos.registros.length === 0) {
                            return [2 /*return*/, []];
                        }
                        ;
                        return [2 /*return*/, contratos.registros];
                }
            });
        });
    };
    /**
     * Solicita o desbloqueio de confiança para um contrato.
     * @param id - O ID do contrato.
     */
    Contratos.prototype.desbloqueioConfianca = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // A API IXC para desbloqueio geralmente envolve um PUT com um campo específico.
                // Simulando a atualização do campo `desbloqueio_confianca` para 'S'.
                return [2 /*return*/, this.update(resourceName, id, { desbloqueio_confianca: 'S' })];
            });
        });
    };
    return Contratos;
}(base_1.QueryBase));
exports.Contratos = Contratos;
