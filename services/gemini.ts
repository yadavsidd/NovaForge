import { GoogleGenAI, Type } from "@google/genai";
import { AirdropMetadata, Organization } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAssetMetadata = async (orgName: Organization): Promise<AirdropMetadata> => {
  const metaResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Design a Web3 governance token, access badge, or protocol artifact for the decentralized collection "${orgName}". 
    
    If the collection matches one below, use the context. Otherwise, invent a plausible high-tech, crypto-native theme based on the name.
    
    Existing Contexts:
    - Obsidian Syndicate: Dark ops, stealth tech, elite access keys, anonymous voting.
    - Nexus Prime: Central governance, pure geometry, stabilization algorithms, utopian order.
    - Aegis Vanguard: Defense systems, shielding, immutable collateral, security audits.
    - Cipher Architects: Data complexity, encryption nodes, computation credits, AI logic.
    - Terraform Grid: Infrastructure, mining permits, energy connectors, planetary resources.
    
    Return JSON with name, ticker, description, and rarity.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          ticker: { type: Type.STRING },
          description: { type: Type.STRING },
          rarity: { type: Type.STRING, enum: ["Common", "Rare", "Epic", "Legendary"] },
        },
        required: ["name", "ticker", "description", "rarity"],
      }
    }
  });

  return JSON.parse(metaResponse.text || "{}") as AirdropMetadata;
};

export const generateAssetImage = async (metadata: AirdropMetadata, orgName: Organization): Promise<string | null> => {
  try {
    const imagePrompt = `A photorealistic, monochromatic 3D icon of a high-tech crypto artifact representing "${metadata.name}" for the collection "${orgName}".
    Style: Cyberpunk noir, pitch black background, liquid mercury, white neon accents, glass textures, floating geometry.
    Subject: Abstract representation of "${metadata.description}".
    Vibe: Secure, Immutable, Decentralized. No text.`;
    
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: imagePrompt }] },
    });

    for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }
  return null;
};