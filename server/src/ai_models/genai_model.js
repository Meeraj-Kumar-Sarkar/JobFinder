import {ChatGoogleGenerativeAI} from '@langchain/google-genai'
import {StringOutputParser} from '@langchain/core/output_parsers'
import dotenv from 'dotenv'

dotenv.config()

const genai_model=new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
    maxOutputTokens: 250,
})

const parse=new StringOutputParser()
export const call_Genai=async(prompt)=>{
    try{
        const response=await genai_model.invoke(prompt)
        return await parse.invoke(response)
    }
    catch(err){
        console.log("Ai model ERROR",err)
    }
}