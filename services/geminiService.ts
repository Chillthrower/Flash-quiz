import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, ProcessedQuiz } from "../types";

const GENAI_API_KEY = process.env.API_KEY || '';

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the Data-URI prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parsePDFsToQuiz = async (files: File[]): Promise<ProcessedQuiz> => {
  if (!GENAI_API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: GENAI_API_KEY });

  // Process all files
  const fileParts = await Promise.all(files.map(fileToGenerativePart));

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A short title for the quiz generated from the documents."
      },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The question text." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 4 possible answers." 
            },
            correctAnswerIndex: { 
              type: Type.INTEGER, 
              description: "The zero-based index of the correct option (0, 1, 2, or 3)." 
            },
            explanation: { 
              type: Type.STRING, 
              description: "A brief explanation of why the answer is correct." 
            }
          },
          required: ["text", "options", "correctAnswerIndex", "explanation"]
        }
      }
    },
    required: ["title", "questions"]
  };

  try {
    // We use the flash-lite model as requested for low-latency responses
    const modelId = "gemini-flash-lite-latest"; 
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: [
          ...fileParts,
          {
            text: `Analyze the attached PDF documents which contain Multiple Choice Questions (MCQs). 
            Extract all valid MCQs found in the documents. 
            
            Rules:
            1. Extract the question text clearly.
            2. Extract exactly 4 options for each question.
            3. Identify the correct answer. If the document provides an answer key, use it. If not, solve the question yourself to find the correct answer.
            4. Provide a short explanation for the correct answer.
            5. Return the output in strict JSON format matching the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an intelligent educational assistant helping to convert PDF exam papers into interactive digital quizzes.",
        temperature: 0.2, // Low temperature for more deterministic extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response received from Gemini.");

    const data = JSON.parse(text) as { title: string; questions: Omit<Question, 'id'>[] };
    
    // Add IDs to questions
    const questionsWithIds: Question[] = data.questions.map((q, index) => ({
      ...q,
      id: `q-${Date.now()}-${index}`
    }));

    return {
      title: data.title || "Generated Quiz",
      questions: questionsWithIds
    };

  } catch (error) {
    console.error("Error parsing PDFs:", error);
    throw new Error("Failed to process the documents. Please try again with a clearer PDF or fewer files.");
  }
};
