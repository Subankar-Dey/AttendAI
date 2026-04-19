import OpenAI from 'openai';

let openai = null;

export const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  return openai;
};

// For backward compatibility
export default {
  chat: {
    completions: {
      create: async (params) => {
        return getOpenAI().chat.completions.create(params);
      }
    }
  }
};
