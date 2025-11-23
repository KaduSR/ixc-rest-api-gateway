// src/services/ixc.js
const { IxcOrm, Recurso } = require("ixc-orm"); 
const md5 = require("md5"); // Mantido para a verificação da senha hotsite

// --- 1. Definição das Classes de Modelo (Herança de IxcOrm) ---

/**
 * Representa a tabela 'cliente'.
 */
class Cliente extends IxcOrm {
  constructor() {
    super('cliente');
  }
}

/**
 * Representa a tabela 'cliente_contrato'.
 */
class ClienteContrato extends IxcOrm {
  constructor() {
    super('cliente_contrato');
  }
}

/**
 * Representa a tabela 'radusuarios' (Login PPPoE/Hotspot).
 */
class RadUsuarios extends IxcOrm {
  constructor() {
    super('radusuarios');
  }
}

/**
 * Representa a tabela 'su_ticket'.
 */
class SuTicket extends IxcOrm {
  constructor() {
    super('su_ticket');
  }
}

// --- 2. Serviço Principal que encapsula a lógica de negócio ---

class IXCService {
  
  // O constructor original não é mais necessário, pois o IXC-ORM
  // gerencia as credenciais via process.env.

  // =========================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // =========================================================

  /**
   * Tenta autenticar um cliente usando login e senha do hotsite.
   */
  async authenticate(login, senha) {
    const clienteOrm = new Cliente();

    // Busca o cliente pelo login do hotsite
    const res = await clienteOrm
      .where('hotsite_login')
      .exactly(login)
      .paginate(1, 1)
      .GET();

    const cliente = res.registros()?.[0];

    if (res.fail() || !cliente) {
      return null;
    }

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
  // MÉTODOS DE DADOS DO CLIENTE (PARA DASHBOARD E PERFIL)
  // =========================================================

  /**
   * Busca os dados completos do cliente.
   */
  async getDadosCliente(idCliente) {
    const clienteOrm = new Cliente();
    // find() é um atalho para buscar por ID
    const res = await clienteOrm.find(idCliente);
    return res.registros()?.[0] || null;
  }

  /**
   * Atualiza os dados cadastrais do cliente (apenas campos permitidos).
   */
  async atualizarDadosCadastrais(idCliente, dados) {
    const clienteOrm = new Cliente();

    const payload = {
      id: idCliente,
      // Contatos
      telefone_celular: dados.contatos?.telefonePrincipal,
      telefone_comercial: dados.contatos?.telefoneComercial,
      email_nfe: dados.contatos?.emailNotificacao,
      hotsite_email: dados.contatos?.emailHotsite,

      // Endereço (tabela 'cliente' do IXC)
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

    // Remove campos nulos/vazios/undefined antes de enviar
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

  /**
   * Altera a senha do hotsite do cliente.
   */
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

  /**
   * Busca o contrato ativo principal, detalhes do plano e login associado.
   */
  async getDetalhesContratoCompleto(idCliente) {
    const contratoOrm = new ClienteContrato();
    
    // 1. Busca o contrato ativo principal
    const resContrato = await contratoOrm
        .where('id_cliente')
        .exactly(idCliente)
        // Você pode precisar adicionar filtros adicionais, como status ativo (A)
        // .where('status').exactly('A') 
        .orderBy('id', 'desc')
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
    
    // 3. Busca detalhes do Plano (vd_contrato_plano_venda) - Exemplo simplificado
    // A busca real pelo plano exigiria outro ORM (vd_contrato_plano_venda)
    let plano = {};
    
    return {
      ...contrato,
      plano: {
        // Implementar busca do plano aqui, se necessário.
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

  /**
   * Busca os tickets do cliente na tabela su_ticket.
   */
  async getTickets(idCliente, status) {
    const ticketOrm = new SuTicket();
    ticketOrm.where('id_cliente').exactly(idCliente);

    // Se for 'abertos', adicionamos o filtro para status diferente de 'F' (Finalizado)
    if (status === "S") {
        ticketOrm.where('status').notExactly('F'); // Assumindo que 'F' é Finalizado
    }
    
    const res = await ticketOrm
        .orderBy('data_criacao', 'desc')
        .GET();

    if (res.fail()) {
        throw new Error(`IXC: ${res.message()}`);
    }

    return res.registros() || [];
  }

  /**
   * Cria um novo ticket de suporte.
   */
  async createTicket(ticketData, idCliente) {
    const ticketOrm = new SuTicket();

    const payload = {
      tipo: "C", // C - Cliente
      id_cliente: idCliente,
      id_assunto: ticketData.idAssunto,
      id_contrato: ticketData.idContrato,
      titulo: ticketData.titulo,
      menssagem: ticketData.mensagem, 
      id_ticket_origem: "I", // I - Internet
      prioridade: "M",
      status: "T", // T - Em Atendimento
      origem_cadastro: "P", // P - Painel/Portal
      cliente_email: ticketData.email,
    };

    const res = await ticketOrm.POST(payload);

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }

    // O IXC-ORM retorna o ID do registro criado no método id()
    return {
      success: true,
      protocolo: res.registros()?.[0]?.protocolo || res.id(),
      idTicket: res.id(),
    };
  }

  // =========================================================
  // MÉTODOS DE TESTE TÉCNICO E DADOS DE LOGIN
  // =========================================================

  /**
   * Busca o login do cliente na tabela radusuarios.
   */
  async getLoginDoCliente(idCliente) {
    const radOrm = new RadUsuarios();
    
    const res = await radOrm
        .where('id_cliente')
        .exactly(idCliente)
        .where('ativo')
        .exactly('S') // Filtra por login ativo
        .paginate(1, 1)
        .GET();
    
    if (res.fail()) {
        // Se falhar (ex: cliente não tem login), retorna null
        return null;
    }

    return res.registros()?.[0] || null;
  }

  /**
   * Executa um teste de Ping ou Traceroute no login do cliente.
   */
  async executarTesteTecnico(idLogin, tipo = "ping") {
    const radOrm = new RadUsuarios();
    
    // A ação de Ping/Traceroute é feita atualizando o campo 'ping_traceroute'
    const res = await radOrm.PUT({ 
        id: idLogin,
        ping_traceroute: tipo 
    });
    
    if (res.fail()) {
        throw new Error(`IXC: ${res.message()}`);
    }

    // O resultado detalhado é retornado no objeto de resposta do PUT
    return {
        success: true,
        resultadoRaw: res.registros()?.[0], 
    };
  }

  // =========================================================
  // MÉTODO DE LIBERAÇÃO EM CONFIANÇA (USANDO RECURSO)
  // =========================================================

  /**
   * Tenta desbloquear o cliente (Liberação em Confiança) usando o Recurso dedicado.
   */
  async desbloqueioEmConfianca(idContrato) {
    // Usamos o método especializado do Recurso do IXC-ORM
    const res = await Recurso.desbloqueioDeConfianca({ id_contrato: idContrato }); 

    if (res.fail()) {
      throw new Error(`IXC: ${res.message()}`);
    }
    
    return {
      success: true,
      message: res.message()
    };
  }
}

module.exports = new IXCService();