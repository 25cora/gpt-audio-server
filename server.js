require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

function logError(location, error) {
    console.error(`❌ [${location}] Error:`, error?.response?.data || error.message);
}

app.post('/get-audio', async (req, res) => {
    try {
        const { buttonId } = req.body;
        if (buttonId === undefined) {
            return res.status(400).json({ error: "buttonId is required" });
        }

        const prompts = {
            0: "Spiele den Character von SILENCE. gib den Spieler seine aufgabe aus den SILENCE karten und füge nach deinem eigenen belangen noch schnippische kommentare gegenüber des Spielers",
            1: "Der spieler muss zwischen 10 und 0 Feldern vor oder zurück. Wähle in diesem bereich eine zufällige zahl und teile diese dem Spieler mit. Du spielst den character des erzählers.",
            2: "Spiele den Character von SILENCE. gib den Spieler seine aufgabe aus den Minispiel karten und füge nach deinem eigenen belangen noch schnippische kommentare gegenüber des Spielers",
            3: "Ende mit überlebenden Spielern",
            4: "Ende mit 1 Überleben Spieler",
            5: "AlienEvent triggered",
            6: "Shot Alien",
            7: "Didn't shoot Alien",
            8: "Alien Ende",
            9: "Ende mit 2 überlebenden",
            10: "Ende mit 3 überlebenden",
            11: "Ebde mit 4 überlebenden"
        };

        const userPrompt = prompts[buttonId] || "Default response.";
        console.log("🔹 Prompt sent to OpenAI:", userPrompt);

        if (!process.env.OPENAI_API_KEY) {
            logError("Server", "❌ OpenAI API key is missing!");
            return res.status(500).json({ error: "Missing OpenAI API key" });
        }

        // ChatGPT API request
        let aiText = "Error: No response received.";
        try {
            const gptResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: "gpt-4-turbo",
                messages: [{ role: "system", content: userPrompt }]
            }, {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
            });

            aiText = gptResponse.data.choices?.[0]?.message?.content || "Error: No response from AI.";
        } catch (gptError) {
            logError("ChatGPT API", gptError);
            return res.status(500).json({ error: "Failed to generate AI response" });
        }

        // Use a text-to-speech API (e.g., OpenAI's or ElevenLabs) to convert text to audio
        try {
            const ttsResponse = await axios.post("https://api.openai.com/v1/audio/speech", {
                model: "tts-1",
                input: aiText
            }, {
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
                responseType: 'arraybuffer'
            });

            res.set({ 'Content-Type': 'audio/mpeg' });
            res.send(ttsResponse.data);
        } catch (ttsError) {
            logError("TTS API", ttsError);
            return res.status(500).json({ error: "Failed to generate audio response" });
        }

    } catch (error) {
        logError("General Server Error", error);
        res.status(500).json({ error: "Unexpected server error" });
    }
});

// Use `process.env.PORT` for deployment compatibility
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));