import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const getOpenAIAPIResponse = async (message) => {
    console.log("User message:", message);
    console.log(
        "Gemini API key loaded:",
        process.env.GEMINI_API_KEY ? "YES" : "NO"
    );

    try {
        const response = await ai.models.generateContent({
            // CHANGE: Flash Lite is the fastest supported text model for this API key.
            model: "gemini-flash-lite-latest",
            contents: message
        });

        console.log("Gemini response:", response);

        return response.text;
    } catch (err) {
        console.error("Gemini API Error:", err);

        return "Gemini API error: " + err.message;
    }
};

export default getOpenAIAPIResponse;
