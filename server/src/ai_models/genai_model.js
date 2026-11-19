import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

const parse = new StringOutputParser();
let genaiModelInstance = null;

function getGenaiModel(maxOutputTokens = 250) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  if (maxOutputTokens !== 250) {
    return new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      apiKey: apiKey.trim(),
      temperature: 0.2,
      maxOutputTokens,
    });
  }
  if (!genaiModelInstance) {
    genaiModelInstance = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      apiKey: apiKey.trim(),
      temperature: 0,
      maxOutputTokens: 250,
    });
  }
  return genaiModelInstance;
}

export const call_Genai = async (prompt, options = {}) => {
  try {
    const model = getGenaiModel(options.maxOutputTokens || 250);
    if (!model) {
      return null;
    }
    const response = await model.invoke(prompt);
    return await parse.invoke(response);
  } catch (err) {
    console.log("Ai model ERROR", err?.message || err);
    return null;
  }
};
