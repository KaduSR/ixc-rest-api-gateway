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
exports.NotasResource = void 0;
var base_1 = require("../base");
/**
 * Recurso para interagir com as Notas (imprimir_nota) da API IXC.
 */
var NotasResource = /** @class */ (function (_super) {
    __extends(NotasResource, _super);
    function NotasResource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.resourceName = "imprimir_nota";
        return _this;
    }
    /**
     * Imprime uma nota específica, retornando o documento em base64.
     * @param id ID da nota/venda.
     * @param base64 Se 'S', retorna o documento em base64.
     * @returns O documento da nota em base64.
     */
    NotasResource.prototype.imprimirNota = function (id_1) {
        return __awaiter(this, arguments, void 0, function (id, base64) {
            var query, response;
            var _a, _b;
            if (base64 === void 0) { base64 = 'S'; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        query = {
                            qtype: 'id', // Assumindo que o qtype para buscar por ID é 'id'
                            query: id.toString(),
                            oper: '=',
                            page: '1',
                            rp: '1', // Apenas um registro
                            sortname: 'id',
                            sortorder: 'desc',
                            // Adiciona o parâmetro base64 diretamente na query, se a API aceitar assim
                            // Ou pode ser um parâmetro de URL, dependendo da API
                            // Para este caso, vamos assumir que é um parâmetro de query
                            base64: base64, // IXC API expects this as a query parameter
                        };
                        return [4 /*yield*/, this.request(this.resourceName, query)];
                    case 1:
                        response = _c.sent();
                        // Assumindo que a API retorna o base64 diretamente no corpo ou em um campo específico
                        // Se a API retornar um objeto com um campo 'base64_document', ajuste aqui
                        return [2 /*return*/, { base64_document: response.base64_document || ((_b = (_a = response.registros) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.base64_document) || response.conteudo_base64 || response.conteudo }];
                }
            });
        });
    };
    return NotasResource;
}(base_1.QueryBase));
exports.NotasResource = NotasResource;
