import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const getBase64FromContentResponse = (response: GenerateContentResponse): string => {
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image data found in the response.");
};

export const generateThumbnailFromText = async (apiKey: string, prompt: string, aspectRatio: string, numberOfImages: number): Promise<string[]> => {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please enter your key.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: numberOfImages,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
             throw new Error("The prompt was blocked for safety reasons. Please try rephrasing your request, focusing on objects and scenes rather than people or sensitive topics.");
        }

        const base64Images = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
        
        return base64Images;
    } catch (error: any) {
        console.error("Error generating thumbnail from text:", error);
         if (error.message && error.message.includes('Responsible AI practices')) {
            throw new Error("The prompt was blocked for safety reasons. Please try rephrasing your request, focusing on objects and scenes rather than people or sensitive topics.");
        }
        if (error.message.includes('blocked for safety reasons')) {
            throw error;
        }
        throw new Error("Failed to generate image from text. The prompt might be too complex or blocked.");
    }
};

export const refineThumbnailFromImage = async (
    apiKey: string,
    base64Image: string,
    mimeType: string,
    prompt: string,
    styleBase64Image?: string,
    styleMimeType?: string
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please enter your key.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const pureBase64 = base64Image.split(',')[1];
        
        const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [
            {
                inlineData: {
                    data: pureBase64,
                    mimeType: mimeType,
                },
            },
        ];

        if (styleBase64Image && styleMimeType) {
            const pureStyleBase64 = styleBase64Image.split(',')[1];
            parts.push({
                inlineData: {
                    data: pureStyleBase64,
                    mimeType: styleMimeType,
                },
            });
        }

        parts.push({ text: prompt });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const base64ImageResult = `data:image/png;base64,${getBase64FromContentResponse(response)}`;

        return base64ImageResult;
    } catch (error: any) {
        console.error("Error refining thumbnail:", error);
        if (error.message && error.message.includes('Responsible AI practices')) {
            throw new Error("The prompt or image was blocked for safety reasons. Please try a different image or prompt.");
        }
        throw new Error("Failed to refine image. The prompt or image might be too complex or blocked.");
    }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};