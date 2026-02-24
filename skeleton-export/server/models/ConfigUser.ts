import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema({
  URLWS: { type: String, required: true },
  NOMEDOAMBIENTE: { type: String, required: true },
  MOVIMENTOS_SOLICITACAO_COMPRAS: { type: [String], default: [] },
  MOVIMENTOS_ORDEM_COMPRA: { type: [String], default: [] },
  MOVIMENTOS_NOTA_FISCAL_PRODUTO: { type: [String], default: [] },
  MOVIMENTOS_NOTA_FISCAL_SERVICO: { type: [String], default: [] },
  MOVIMENTOS_OUTRAS_MOVIMENTACOES: { type: [String], default: [] },
  MODULOS: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const configUserSchema = new mongoose.Schema({
  ID: { type: Number, required: false }, // Optional if using _id
  CODUSUARIO: { type: String, required: true, unique: true },
  SENHA: { type: String, required: true },
  CODCLIENTE: { type: String, required: false, trim: true },
  NOMECLIENTE: { type: String, required: true, trim: true },
  NOME_CONTATO: { type: String, required: true, trim: true },
  EMAIL: { type: String, required: true, trim: true, lowercase: true },
  TELEFONE: { type: String, required: true, trim: true },
  AMBIENTES: { type: [environmentSchema], default: [] }
}, { timestamps: true });

export const ConfigUser = mongoose.model('ConfigUser', configUserSchema);
