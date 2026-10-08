import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// https://vitejs.dev/config/ - NutriConnectQS
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'api-gerar-plano-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res, next) => {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Método não permitido.' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                if (!geminiApiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada no .env do servidor.' }));
                  return;
                }

                const parsedBody = body ? JSON.parse(body) : {};
                const dados_paciente = parsedBody.dados_paciente;

                if (!dados_paciente) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Dados do paciente não informados.' }));
                  return;
                }

                const genAI = new GoogleGenerativeAI(geminiApiKey);

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
                const jsonResult = JSON.parse(text);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(jsonResult));
              } catch (err: any) {
                console.error('Erro na API Dev Server:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Erro ao gerar plano alimentar.' }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});

