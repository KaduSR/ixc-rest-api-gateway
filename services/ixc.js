// src/services/ixc.js
const { IxcOrm, Recurso } = require("ixc-orm");
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

    // 1. Busca o cliente pelo login do hotsite
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
    if (cliente.hotsite_senha_md5 === "S") {
      senhaCorreta = cliente.hotsite_senha === md5(senha);
    } else {
      senhaCorreta = cliente.hotsite_senha === senha;
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
    const res = await clienteOrm.find(idCliente); // find é um atalho para buscar por ID
    return res.registros()?.[0] || null;
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

    // PUT é usado para edição (update)
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

    // 1. Busca o contrato ativo principal
    const resContrato = await contratoOrm
      .where("id_cliente")
      .exactly(idCliente)
      // Adicionando um filtro para contratos Ativos (A)
      // Isso deve ser ajustado conforme a regra de negócio do IXC
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

    // 2. Busca o login principal (radusuarios)
    const loginData = await this.getLoginDoCliente(idCliente);

    // Simplificando o retorno para a estrutura esperada pelo controller
    return {
      ...contrato,
      plano: {
        id: contrato.id_vd_contrato_plano_venda,
        descricao: contrato.plano_descricao,
      }, // Campos simplificados
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

    // Se for 'abertos', filtramos por status diferente de 'F' (Finalizado)
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

    // Retorna o ID e protocolo da API (se disponível)
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

    // Ação de teste via PUT (update) no campo 'ping_traceroute'
    const res = await radOrm.PUT({
      id: idLogin,
      ping_traceroute: tipo,
    });

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    // O resultado detalhado é esperado no objeto de resposta do PUT
    return {
      success: true,
      resultadoRaw: res.registros()?.[0],
    };
  }

  async ixcRequest(endpoint, method, data = {}, params = {}) {
    // MANTIDO SOMENTE PARA COMPATIBILIDADE COM O CRUD CONTROLLER
    // O CRUD Controller espera que este método exista.
    const crudOrm = new IxcOrm(endpoint);

    if (method === "get") {
      const res = await crudOrm.GET(params.page, params.rp);
      if (res.fail()) throw new Error(res.message());
      return { registros: res.registros(), total: res.total() };
    }
    // Outros métodos (POST, PUT, DELETE) devem ser implementados
    // ou o CrudController deve ser atualizado para usar os métodos diretos do ORM.
    throw new Error(
      "O método ixcRequest não é mais suportado diretamente. Use a classe CRUD do ORM."
    );
  }
}

// Exporta uma instância única (Singleton)
module.exports = new IXCService();
