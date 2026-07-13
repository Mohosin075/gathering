import axios from 'axios';
import https from 'https';
import config from '../config';

interface AutocompletePrediction {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export const googlePlacesAutocomplete = async (
  input: string,
  sessionToken?: string,
): Promise<AutocompletePrediction[] | null> => {
  try {
    const agent = new https.Agent({ family: 4 });
    const API_KEY = config.server_map_api_key;

    const data: any = {
      input: input.trim(),
    };

    if (sessionToken) {
      data.sessionToken = sessionToken;
    }

    const response = await axios.post(
      'https://places.googleapis.com/v1/places:autocomplete',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
        },
        httpsAgent: agent,
      },
    );

    if (response.data && response.data.suggestions) {
      return response.data.suggestions
        .filter((suggestion: any) => suggestion.placePrediction)
        .map((suggestion: any) => {
          const prediction = suggestion.placePrediction;
          return {
            description: prediction.text?.text || '',
            placeId: prediction.placeId || '',
            mainText: prediction.structuredFormat?.mainText?.text || '',
            secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
          };
        });
    }

    return [];
  } catch (error: any) {
    console.error(
      'Google Places Autocomplete error:',
      error.response?.data || error.message || error,
    );
    return null;
  }
};
