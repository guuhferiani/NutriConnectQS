import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  if (!geminiApiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY não configurada no ambiente do servidor.',
    });
  }

  try {
    const { dados_paciente } = req.body || {};

    if (!dados_paciente) {
      return res.status(400).json({
        error: 'Dados do paciente não fornecidos no corpo da requisição.',
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Schema estruturado para retorno estrito do Gemini
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        plano_semanal: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia: {
                type: SchemaType.STRING,
                description: 'Dia da semana (ex: Segunda-feira, Terça-feira, etc.)',
              },
              refeicoes: {
                type: SchemaType.OBJECT,
                properties: {
                  cafe_da_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções ou itens para o café da manhã',
                  },
                  lanche_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções ou itens para o lanche da manhã',
                  },
                  almoco: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções ou itens para o almoço',
                  },
                  lanche_tarde: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções ou itens para o lanche da tarde',
                  },
                  jantar: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: '5 opções ou itens para o jantar',
                  },
                },
                required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
              },
            },
            required: ['dia', 'refeicoes'],
          },
        },
      },
      required: ['plano_semanal'],
    };

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    let result = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema as any,
            temperature: 0.7,
          },
        });
        result = await model.generateContent(prompt);
        if (result) break;
      } catch (mErr: any) {
        console.warn(`Tentativa com ${modelName} falhou:`, mErr.message);
        lastError = mErr;
      }
    }

    if (!result) {
      throw lastError || new Error('Todos os modelos de IA estão indisponíveis no momento.');
    }

    const text = result.response.text();

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch (parseErr) {
      console.error('Falha ao converter resposta da IA em JSON:', text, parseErr);
      return res.status(500).json({
        error: 'A IA gerou um formato inválido. Tente novamente.',
        rawText: text,
      });
    }

    return res.status(200).json(jsonResult);
  } catch (error: any) {
    console.error('Erro na geração com Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Falha ao processar a geração do plano alimentar com IA.',
    });
  }
}
