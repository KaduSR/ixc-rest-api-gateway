// src/services/ixc.js

// 🚨 CORREÇÃO CRÍTICA: Caminho relativo direto para o arquivo compilado
const { IxcOrm, Recurso } = require("../../ixc-orm/dist/index");
const md5 = require("md5");

// --- 1. Definição das Classes de Modelo (Mapeamento de Tabelas) ---

class Cliente extends IxcOrm {
  constructor() {
    super("cliente");
  }
}

class ClienteContrato extends IxcOrm {
  constructor() {
    super("cliente_contrato");
  }
}

class RadUsuarios extends IxcOrm {
  constructor() {
    super("radusuarios");
  }
}

class SuTicket extends IxcOrm {
  constructor() {
    super("su_ticket");
  }
}

// --- 2. Implementação da Lógica de Negócio usando o ORM ---

class IXCService {
  // =========================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =========================================================

  async authenticate(login, senha) {
    const clienteOrm = new Cliente();
    const res = await clienteOrm
      .where("hotsite_login")
      .exactly(login)
      .paginate(1, 1)
      .GET();

    const cliente = res.registros()?.[0];

if (res.fail() || !cliente) {
  return null;
}

// 2. Lógica de verificação de senha (mantida localmente)
let senhaCorreta = false;
if (cliente.hotsite_senha_md5 === "N") {
  senhaCorreta = cliente.hotsite_senha === md5(senha);
} else {
  // 🚨 CORREÇÃO FINAL: Limpar a senha do IXC com .trim()
  senhaCorreta = cliente.hotsite_senha.trim() === senha;
}
if (!senhaCorreta) {
  return null;
}

    return {
      id: cliente.id,
      nome: cliente.razao || cliente.fantasia || cliente.nome_razaosocial,
      email: cliente.hotsite_email,
      cpf_cnpj: cliente.cnpj_cpf,
    };
  }

  // =========================================================
  // MÉTODOS DE PERFIL E CADASTRO
  // =========================================================

  async getDadosCliente(idCliente) {
    const clienteOrm = new Cliente();
    const res = await clienteOrm.find(idCliente);
    return res.registros()?.[0] || null;
  }

  async getDadosCadastrais(idCliente) {
    // Reutiliza a busca do cliente e formata para o Controller
    const cliente = await this.getDadosCliente(idCliente);

    if (!cliente) {
      return null;
    }

    return {
      id: cliente.id,
      nome: cliente.razao || cliente.fantasia || cliente.nome_razaosocial,
      cpfCnpj: cliente.cnpj_cpf,
      rgIe: cliente.ie_identidade,
      dataNascimento: cliente.data_nascimento,

      contatos: {
        emailHotsite: cliente.hotsite_email,
        emailNotificacao: cliente.email_nfe,
        telefonePrincipal: cliente.telefone_celular || cliente.fone,
        telefoneComercial: cliente.telefone_comercial,
      },

      enderecoInstalacao: {
        cep: cliente.cep,
        logradouro: cliente.endereco,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        uf: cliente.estado,
        referencia: cliente.referencia,
      },
    };
  }

  async atualizarDadosCadastrais(idCliente, dados) {
    const clienteOrm = new Cliente();
    const payload = {
      id: idCliente,
      telefone_celular: dados.contatos?.telefonePrincipal,
      telefone_comercial: dados.contatos?.telefoneComercial,
      email_nfe: dados.contatos?.emailNotificacao,
      hotsite_email: dados.contatos?.emailHotsite,
      cep: dados.enderecoInstalacao?.cep,
      endereco: dados.enderecoInstalacao?.logradouro,
      numero: dados.enderecoInstalacao?.numero,
      complemento: dados.enderecoInstalacao?.complemento,
      bairro: dados.enderecoInstalacao?.bairro,
      cidade: dados.enderecoInstalacao?.cidade,
      estado: dados.enderecoInstalacao?.uf,
      referencia: dados.enderecoInstalacao?.referencia,
      data_ultima_alteracao: new Date().toISOString().split("T")[0],
    };

    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === null) &&
        delete payload[key]
    );

    const res = await clienteOrm.PUT(payload);

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return { success: true, idCliente: res.id() };
  }

  async alterarSenhaHotsite(idCliente, novaSenha) {
    const clienteOrm = new Cliente();
    const senhaMD5 = md5(novaSenha);

    const payload = {
      id: idCliente,
      hotsite_senha: senhaMD5,
      hotsite_senha_md5: "S",
    };

    const res = await clienteOrm.PUT(payload);

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return { success: true, message: "Senha alterada com sucesso!" };
  }

  // =========================================================
  // MÉTODOS DE CONTRATO E PLANO
  // =========================================================

  async getDetalhesContratoCompleto(idCliente) {
    const contratoOrm = new ClienteContrato();

    const resContrato = await contratoOrm
      .where("id_cliente")
      .exactly(idCliente)
      .where("status")
      .exactly("A")
      .orderBy("id", "desc")
      .paginate(1, 1)
      .GET();

    if (resContrato.fail()) {
      throw new Error(`IXC: ${resContrato.message()}`);
    }

    const contrato = resContrato.registros()?.[0];
    if (!contrato) {
      return null;
    }

    const loginData = await this.getLoginDoCliente(idCliente);

    return {
      ...contrato,
      plano: {
        id: contrato.id_vd_contrato_plano_venda,
        descricao: contrato.plano_descricao,
      },
      login: loginData
        ? {
            idLogin: loginData.id,
            login: loginData.login,
            online: loginData.online === "SS" ? "Online" : "Offline",
            ip: loginData.ip_online || "N/A",
          }
        : null,
    };
  }

  // =========================================================
  // MÉTODOS DE SUPORTE
  // =========================================================

  async getTickets(idCliente, status) {
    const ticketOrm = new SuTicket();
    ticketOrm.where("id_cliente").exactly(idCliente);

    if (status === "S") {
      ticketOrm.where("status").notExactly("F");
    }

    const res = await ticketOrm.orderBy("data_criacao", "desc").GET();

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return res.registros() || [];
  }

  async createTicket(ticketData, idCliente) {
    const ticketOrm = new SuTicket();

    const payload = {
      tipo: "C",
      id_cliente: idCliente,
      id_assunto: ticketData.idAssunto,
      id_contrato: ticketData.idContrato,
      titulo: ticketData.titulo,
      menssagem: ticketData.mensagem,
      id_ticket_origem: "I",
      prioridade: "M",
      status: "T",
      origem_cadastro: "P",
      cliente_email: ticketData.email,
    };

    const res = await ticketOrm.POST(payload);

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return {
      success: true,
      protocolo: res.registros()?.[0]?.protocolo || res.id(),
      idTicket: res.id(),
    };
  }

  // =========================================================
  // MÉTODOS TÉCNICOS
  // =========================================================

  async getLoginDoCliente(idCliente) {
    const radOrm = new RadUsuarios();

    const res = await radOrm
      .where("id_cliente")
      .exactly(idCliente)
      .where("ativo")
      .exactly("S")
      .paginate(1, 1)
      .GET();

    if (res.fail()) {
      return null;
    }

    return res.registros()?.[0] || null;
  }

  async executarTesteTecnico(idLogin, tipo = "ping") {
    const radOrm = new RadUsuarios();

    const res = await radOrm.PUT({
      id: idLogin,
      ping_traceroute: tipo,
    });

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return {
      success: true,
      resultadoRaw: res.registros()?.[0],
    };
  }

  async desbloqueioEmConfianca(idContrato) {
    const res = await Recurso.desbloqueioDeConfianca({
      id_contrato: idContrato,
    });

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    return {
      success: true,
      message: res.message(),
    };
  }

  // =========================================================
  // MÉTODOS DE WRAPPER CRUD (PARA crudController.js)
  // =========================================================

  async list(entity, params = {}) {
    const orm = new IxcOrm(entity);
    const res = await orm.paginate(params.page, params.rp).GET();
    if (res.fail()) throw new Error(res.message());
    return { registros: res.registros(), total: res.total() };
  }

  async post(entity, data = {}, action = "inserir") {
    const orm = new IxcOrm(entity);
    let res;

    if (action === "inserir") {
      res = await orm.POST(data);
    } else if (action === "editar") {
      res = await orm.PUT(data);
    } else {
      throw new Error(`Ação CRUD '${action}' não suportada.`);
    }

    if (res.fail()) {
      throw new Error(res.message());
    }
    return { id: res.id() };
  }

  async delete(entity, id) {
    const orm = new IxcOrm(entity);
    const res = await orm.DELETE({ id });
    if (res.fail()) throw new Error(res.message());
    return { id: id };
  }
}

module.exports = new IXCService();
