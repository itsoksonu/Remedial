import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from './env';

export const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

export const groqClient = new Groq({ apiKey: env.GROQ_API_KEY });