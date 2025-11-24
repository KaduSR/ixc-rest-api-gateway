import { Cliente } from './src/resources/clientes/types';
import { Contrato } from './src/resources/contratos/types';
import { Financeiro } from './src/resources/financeiro/types';
import { Login } from './src/resources/logins/types';
import { Consumo } from './src/resources/consumo/types';
import { OrdemServico } from './src/resources/ordens_servico/types';
import { OntInfo } from './src/resources/ont/types';

export type DashboardData = {
    clientes: Cliente[];
    contratos: Contrato[];
    faturas: Financeiro[];
    logins: Login[];
    notas: any[]; // Manter como any[] por enquanto, pois não há um tipo de listagem de notas
    ordensServico: OrdemServico[];
    ontInfo: OntInfo[];
    consumo: Consumo;
};
