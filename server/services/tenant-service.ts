import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { addDays } from 'date-fns';
import { Tenant } from '../models/Tenant';
import { PlatformAdmin } from '../models/PlatformAdmin';

interface CreateTenantDTO {
  company: {
    legalName: string;
    tradeName: string;
    cnpj: string;
  };
  admin: {
    email: string;
    name: string;
    phone?: string;
    password: string;
  };
  subdomain: string;
  initialEnvironment?: {
    webserviceBaseUrl?: string;
    authMode?: 'bearer' | 'basic';
  };
}

import { ConfigUser } from '../models/ConfigUser';

export class TenantService {
  /**
   * Sincroniza ambientes do ConfigUser (legado) para o Tenant.
   */
  static async syncLegacyConfig(tenantId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) throw new Error('Tenant não encontrado.');

      const admin = await PlatformAdmin.findOne({ tenantId: tenant._id }).session(session);
      if (!admin) throw new Error('Administrador do tenant não encontrado.');

      // Tenta encontrar ConfigUser pelo email do admin
      const configUser = await ConfigUser.findOne({ EMAIL: admin.email }).session(session);
      
      if (!configUser) {
          throw new Error(`Usuário de configuração legado não encontrado para o email ${admin.email}`);
      }

      if (!configUser.AMBIENTES || configUser.AMBIENTES.length === 0) {
          throw new Error('Usuário de configuração não possui ambientes para importar.');
      }

      // Mapear ambientes do ConfigUser para o formato do Tenant
      const newEnvironments = configUser.AMBIENTES.map((env: any) => ({
          name: env.NOMEDOAMBIENTE,
          enabled: true,
          webserviceBaseUrl: env.URLWS || "",
          restBaseUrl: "", // Não tem no legado
          authMode: 'bearer',
          modules: env.MODULOS || {},
          MOVIMENTOS_SOLICITACAO_COMPRAS: env.MOVIMENTOS_SOLICITACAO_COMPRAS || [],
          MOVIMENTOS_ORDEM_COMPRA: env.MOVIMENTOS_ORDEM_COMPRA || [],
          MOVIMENTOS_NOTA_FISCAL_PRODUTO: env.MOVIMENTOS_NOTA_FISCAL_PRODUTO || [],
          MOVIMENTOS_NOTA_FISCAL_SERVICO: env.MOVIMENTOS_NOTA_FISCAL_SERVICO || [],
          MOVIMENTOS_OUTRAS_MOVIMENTACOES: env.MOVIMENTOS_OUTRAS_MOVIMENTACOES || []
      }));

      // Mesclar ou substituir? Vamos adicionar os que não existem (pelo nome)
      let importedCount = 0;
      for (const newEnv of newEnvironments) {
          const exists = tenant.environments.some(e => e.name === newEnv.name);
          if (!exists) {
              tenant.environments.push(newEnv);
              importedCount++;
          }
      }

      await tenant.save({ session });
      await session.commitTransaction();

      return { 
          message: `Sincronização concluída. ${importedCount} ambientes importados.`,
          environments: tenant.environments 
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cria um novo tenant e seu usuário administrador.
   * Aplica regras de negócio como trial de 7 dias e estrutura inicial.
   */
  static async createTenant(data: CreateTenantDTO) {
    // Ensure collections and indexes exist before starting transaction
    // MongoDB does not allow creating collections inside a transaction
    await Tenant.init();
    await PlatformAdmin.init();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validações prévias (Unique checks)
      const existingTenant = await Tenant.findOne({ 
        $or: [
          { tenantKey: data.subdomain },
          { 'domains.tenantHost': `${data.subdomain}.portalrm.simpleit.app.br` }
        ]
      }).session(session);

      if (existingTenant) {
        throw new Error('Tenant já existe com este subdomínio.');
      }

      const existingAdmin = await PlatformAdmin.findOne({ email: data.admin.email }).session(session);
      if (existingAdmin) {
        throw new Error('Já existe um administrador com este email.');
      }

      // 2. Preparar dados do Tenant
      const now = new Date();
      const trialDays = 7;
      const trialEndsAt = addDays(now, trialDays);

      const tenantHost = `${data.subdomain}.portalrm.simpleit.app.br`;

      // Default Environment (Produção)
      const initialEnv = {
        name: "Produção",
        enabled: true,
        webserviceBaseUrl: data.initialEnvironment?.webserviceBaseUrl || "",
        authMode: data.initialEnvironment?.authMode || 'bearer',
        modules: {
            dashboard_principal: true,
            simpledfe: true,
            gestao_compras: true,
            gestao_financeira: true,
            gestao_contabil: true,
            gestao_fiscal: true,
            gestao_rh: true,
            assistentes_virtuais: true,
            parametros: true
        }
      };

      const newTenant = new Tenant({
        tenantKey: data.subdomain,
        status: 'trial',
        company: {
          legalName: data.company.legalName,
          tradeName: data.company.tradeName,
          cnpj: data.company.cnpj
        },
        domains: {
          tenantHost: tenantHost
        },
        environments: [initialEnv],
        trial: {
          startedAt: now,
          endsAt: trialEndsAt,
          days: trialDays
        },
        access: {
          blocked: false,
          blockedReason: null
        },
        audit: {
          createdAt: now,
          createdBy: 'self_signup'
        }
      });

      // Salva o Tenant
      const savedTenant = await newTenant.save({ session });

      // 3. Preparar dados do Admin
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.admin.password, saltRounds);

      const newAdmin = new PlatformAdmin({
        tenantId: savedTenant._id,
        email: data.admin.email,
        name: data.admin.name,
        phone: data.admin.phone || "",
        passwordHash: passwordHash,
        role: 'tenant_admin',
        createdAt: now
      });

      // Salva o Admin
      await newAdmin.save({ session });

      // Comita a transação
      await session.commitTransaction();
      
      return {
        tenant: savedTenant,
        admin: {
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        }
      };
    } catch (error) {
      // Aborta a transação em caso de erro
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    const existingTenant = await Tenant.findOne({ 
      tenantKey: subdomain 
    });
    return !existingTenant;
  }

  static async updateTenant(tenantId: string, data: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) throw new Error('Tenant não encontrado.');

      // Update Company
      if (data.company) {
        if (data.company.legalName) tenant.company.legalName = data.company.legalName;
        if (data.company.tradeName) tenant.company.tradeName = data.company.tradeName;
        if (data.company.cnpj) tenant.company.cnpj = data.company.cnpj;
      }

      // Update Environments
      if (data.environments && Array.isArray(data.environments)) {
          tenant.environments = data.environments;
      }

      await tenant.save({ session });

      // Update Admin
      if (data.admin) {
        const admin = await PlatformAdmin.findOne({ tenantId: tenant._id }).session(session);
        if (admin) {
            if (data.admin.name) admin.name = data.admin.name;
            if (data.admin.email) admin.email = data.admin.email; 
            if (data.admin.phone) admin.phone = data.admin.phone;
            
            if (data.admin.password) {
                admin.passwordHash = await bcrypt.hash(data.admin.password, 10);
            }
            await admin.save({ session });
        }
      }

      await session.commitTransaction();
      return tenant;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async addEnvironment(tenantId: string, envData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) throw new Error('Tenant não encontrado.');
      
      tenant.environments.push(envData);
      await tenant.save({ session });
      
      await session.commitTransaction();
      return tenant.environments[tenant.environments.length - 1];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateEnvironment(tenantId: string, envId: string, envData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) throw new Error('Tenant não encontrado.');
      
      const env = tenant.environments.id(envId);
      if (!env) throw new Error('Ambiente não encontrado.');
      
      if (envData.name) env.name = envData.name;
      if (typeof envData.enabled === 'boolean') env.enabled = envData.enabled;
      if (envData.webserviceBaseUrl !== undefined) env.webserviceBaseUrl = envData.webserviceBaseUrl;
      if (envData.restBaseUrl !== undefined) env.restBaseUrl = envData.restBaseUrl;
      if (envData.soapDataServerUrl !== undefined) env.soapDataServerUrl = envData.soapDataServerUrl;
      if (envData.authMode) env.authMode = envData.authMode;
      if (envData.tokenEndpoint !== undefined) env.tokenEndpoint = envData.tokenEndpoint;
      if (envData.modules) env.modules = envData.modules;
      
      // Arrays
      if (envData.MOVIMENTOS_SOLICITACAO_COMPRAS) env.MOVIMENTOS_SOLICITACAO_COMPRAS = envData.MOVIMENTOS_SOLICITACAO_COMPRAS;
      if (envData.MOVIMENTOS_ORDEM_COMPRA) env.MOVIMENTOS_ORDEM_COMPRA = envData.MOVIMENTOS_ORDEM_COMPRA;
      if (envData.MOVIMENTOS_NOTA_FISCAL_PRODUTO) env.MOVIMENTOS_NOTA_FISCAL_PRODUTO = envData.MOVIMENTOS_NOTA_FISCAL_PRODUTO;
      if (envData.MOVIMENTOS_NOTA_FISCAL_SERVICO) env.MOVIMENTOS_NOTA_FISCAL_SERVICO = envData.MOVIMENTOS_NOTA_FISCAL_SERVICO;
      if (envData.MOVIMENTOS_OUTRAS_MOVIMENTACOES) env.MOVIMENTOS_OUTRAS_MOVIMENTACOES = envData.MOVIMENTOS_OUTRAS_MOVIMENTACOES;

      await tenant.save({ session });
      
      await session.commitTransaction();
      return env;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async removeEnvironment(tenantId: string, envId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) throw new Error('Tenant não encontrado.');
      
      // @ts-ignore
      tenant.environments.pull({ _id: envId });
      await tenant.save({ session });
      
      await session.commitTransaction();
      return { message: 'Ambiente removido com sucesso' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
