/**
 * Unstoppable Storage Service
 * Handles uploading metadata and images to IPFS via Pinata.
 */

// Provided Credentials
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4ZjU4ZjY5Ny02MmNjLTQyYTgtOGVhYi04NDM4YjRiZTdjMmMiLCJlbWFpbCI6InNpZGRkaGFudC4xMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiOTc1Mzc1NTg3ZjRhNGVjNzYzNmMiLCJzY29wZWRLZXlTZWNyZXQiOiJmZGMxM2M5Mzc5NDYxZjJkZTFjYmFlYzkxNmU3Yzc2YTlmMjNjMWM5N2JiYmFmMWRhMTlhZjg0M2VmOTE4YjE2IiwiZXhwIjoxNzk3MTk3OTMyfQ.V1tNJ1Qf9_4ye8zsb10Js-It-xHXljsp5HiRChopic0";

export const uploadToIPFS = async (data: any): Promise<string> => {
  console.log("Uploading to IPFS via Pinata...");

  try {
    let url;
    let body;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${PINATA_JWT}`
    };

    // Check if data is a Base64 Image String
    if (typeof data === 'string' && data.startsWith('data:')) {
      url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
      
      // Convert Base64 to Blob
      const blob = await (await fetch(data)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'artifact.png');
      
      // FormData handling: Do NOT set Content-Type header manually, browser does it with boundary
      body = formData;

    } else {
      // Assume JSON Metadata
      url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
      headers['Content-Type'] = 'application/json';
      
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      body = JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: jsonData.name ? `${jsonData.name}.json` : 'metadata.json'
        }
      });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body
    });

    if (!res.ok) {
      throw new Error(`Pinata Upload Failed: ${res.statusText}`);
    }

    const json = await res.json();
    console.log("Upload success:", json.IpfsHash);
    return `ipfs://${json.IpfsHash}`;

  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw error;
  }
};

/**
 * Helper to resolve IPFS URIs to a public gateway for display
 */
export const resolveIPFS = (uri: string | null): string | null => {
  if (!uri) return null;
  if (uri.startsWith('data:')) return uri; // It's base64 (dev mode/preview)
  if (uri.startsWith('http')) return uri;   // It's already http
  if (uri.startsWith('ipfs://')) {
    // Replace ipfs:// with a public gateway
    const hash = uri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`; 
  }
  return uri;
};