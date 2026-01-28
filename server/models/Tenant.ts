import mongoose from 'mongoose';

// Schema para configuração de módulos (reutilizável)
const modulesSchema = new mongoose.Schema({
    dashboard_principal: { type: Boolean, default: true },
    simpledfe: { type: Boolean, default: true },
    gestao_compras: { type: Boolean, default: true },
    gestao_financeira: { type: Boolean, default: true },
    gestao_contabil: { type: Boolean, default: true },
    gestao_fiscal: { type: Boolean, default: true },
    gestao_rh: { type: Boolean, default: true },
    assistentes_virtuais: { type: Boolean, default: true },
    parametros: { type: Boolean, default: true }
}, { _id: false });

// Schema para Ambiente Individual
const environmentSchema = new mongoose.Schema({
  name: { type: String, default: "Novo Ambiente" }, // Ex: Produção, Homologação
  enabled: { type: Boolean, default: true },
  
  // Connection
  webserviceBaseUrl: { type: String, default: "" },
  restBaseUrl: { type: String, default: "" },
  soapDataServerUrl: { type: String, default: "" },
  authMode: { type: String, enum: ['basic', 'bearer'], default: 'bearer' },
  tokenEndpoint: { type: String, default: "" },

  // Módulos específicos deste ambiente
  modules: { type: modulesSchema, default: () => ({}) },

  // Parametrização de Movimentos
  MOVIMENTOS_SOLICITACAO_COMPRAS: { type: [String], default: [] },
  MOVIMENTOS_ORDEM_COMPRA: { type: [String], default: [] },
  MOVIMENTOS_NOTA_FISCAL_PRODUTO: { type: [String], default: [] },
  MOVIMENTOS_NOTA_FISCAL_SERVICO: { type: [String], default: [] },
  MOVIMENTOS_OUTRAS_MOVIMENTACOES: { type: [String], default: [] }
});

const tenantSchema = new mongoose.Schema({
  tenantKey: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'trial', 'blocked', 'cancelled'], 
    default: 'trial',
    required: true 
  },
  
  company: {
    legalName: { type: String, required: true },
    tradeName: { type: String, required: true },
    cnpj: { type: String, required: true }
  },

  domains: {
    tenantHost: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    }
  },

  // Nova estrutura de Ambientes (Array)
  environments: {
      type: [environmentSchema],
      default: []
  },

  trial: {
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    days: { type: Number, default: 7 }
  },

  access: {
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String, default: null }
  },

  audit: {
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'self_signup' }
  }
}, { 
  timestamps: true, 
  collection: 'tenants' 
});

// Garante a criação dos índices
tenantSchema.index({ tenantKey: 1 }, { unique: true });
tenantSchema.index({ 'domains.tenantHost': 1 }, { unique: true });

export const Tenant = mongoose.model('Tenant', tenantSchema);
