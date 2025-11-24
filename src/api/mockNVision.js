// Mock implementations of NVision functionality

// Mock Core functions
const Core = {
  InvokeLLM: async (params) => {
    console.log('Using mock InvokeLLM - returning industry-standard rates');
    
    // Return industry-standard rates that match the expected schema
    return {
      rates: [
        {
          role: "Camera op (no camera)",
          half_day_rate: 1200,
          full_day_rate: 2000
        },
        {
          role: "Camera op (with camera)",
          half_day_rate: 3000,
          full_day_rate: 5000
        },
        {
          role: "Director",
          half_day_rate: 1200,
          full_day_rate: 2000
        },
        {
          role: "Director of Photography",
          half_day_rate: 3000,
          full_day_rate: 5000
        },
        {
          role: "Line Editor (per 5 min)",
          half_day_rate: 400,
          full_day_rate: 800
        },
        {
          role: "Lead Editor (per 5 min)",
          half_day_rate: 500,
          full_day_rate: 1000
        },
        {
          role: "Revisions Per Request (basic edits)",
          half_day_rate: 50,
          full_day_rate: 100
        },
        {
          role: "Audio Pre & Post",
          half_day_rate: 750,
          full_day_rate: 2200
        }
      ]
    };
  },
  SendEmail: {
    create: async (params) => {
      console.warn('Using mock SendEmail - no actual email will be sent');
      return { 
        id: 'mock-email-id',
        status: 'sent',
        ...params
      };
    }
  },
  UploadFile: {
    create: async (params) => {
      console.warn('Using mock UploadFile - no actual file will be uploaded');
      return {
        id: 'mock-file-id',
        url: 'https://example.com/mock-upload',
        ...params
      };
    }
  },
  GenerateImage: {
    create: async (params) => {
      console.warn('Using mock GenerateImage - no actual image will be generated');
      return {
        id: 'mock-image-id',
        url: 'https://via.placeholder.com/512',
        ...params
      };
    }
  },
  ExtractDataFromUploadedFile: {
    create: async (params) => {
      console.warn('Using mock ExtractDataFromUploadedFile - no actual extraction will be performed');
      return {
        id: 'mock-extraction-id',
        data: 'Mock extracted data',
        ...params
      };
    }
  },
  CreateFileSignedUrl: {
    create: async (params) => {
      console.warn('Using mock CreateFileSignedUrl - no actual signed URL will be created');
      return {
        id: 'mock-signed-url-id',
        url: 'https://example.com/mock-signed-url',
        ...params
      };
    }
  },
  UploadPrivateFile: {
    create: async (params) => {
      console.warn('Using mock UploadPrivateFile - no actual file will be uploaded');
      return {
        id: 'mock-private-file-id',
        url: 'https://example.com/mock-private-upload',
        ...params
      };
    }
  }
};

export const nvision = {
  integrations: {
    Core
  }
};

export default nvision;
