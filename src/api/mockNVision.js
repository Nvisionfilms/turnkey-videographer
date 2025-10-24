// Mock implementations of NVision functionality

// Mock Core functions
const Core = {
  InvokeLLM: {
    create: async (params) => {
      console.warn('Using mock InvokeLLM - no actual API call will be made');
      return { 
        id: 'mock-llm-id',
        response: 'This is a mock LLM response',
        ...params
      };
    }
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
