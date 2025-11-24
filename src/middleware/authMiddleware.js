"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
var jwt = require("jsonwebtoken");
var verifyToken = function (req, res, next) {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de acesso ausente ou inválido' });
    }
    var token = authHeader.split(' ')[1];
    var secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET não está definido no ambiente.");
        return res.status(500).json({ error: "Erro de configuração do servidor." });
    }
    try {
        var decoded = jwt.verify(token, secret);
        // Adiciona o payload completo do usuário ao objeto de requisição
        req.user = decoded;
        // Validação específica para garantir que 'ids' seja um array
        if (!Array.isArray(decoded.ids)) {
            // Se não for um array, pode ser um token antigo ou malformado
            if (typeof decoded.id === 'number') {
                // Converte o formato antigo para o novo para manter compatibilidade
                req.user.ids = [decoded.id];
            }
            else {
                return res.status(403).json({ error: 'Formato de token inválido.' });
            }
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};
exports.verifyToken = verifyToken;
