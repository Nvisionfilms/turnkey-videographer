/**
 * NVision Serial Code Generator Utility
 * Use this to generate subscription codes for distribution
 */

import { generateSerialCode, generateBatchCodes } from '../services/serialCodeService';

/**
 * Generate a single code and log it to console
 */
export function generateSingleCode() {
  const code = generateSerialCode();
  console.log('Generated Code:', code);
  return code;
}

/**
 * Generate multiple codes
 * @param {number} count - Number of codes to generate
 */
export function generateCodes(count = 10) {
  const codes = generateBatchCodes(count);
  console.log(`Generated ${count} codes:`);
  console.table(codes.map((code, index) => ({ Index: index + 1, Code: code })));
  return codes;
}

/**
 * Generate codes and download as CSV
 * @param {number} count - Number of codes to generate
 */
export function downloadCodesAsCSV(count = 100) {
  const codes = generateBatchCodes(count);
  
  // Create CSV content
  const csvContent = [
    'Serial Code,Status,Generated Date',
    ...codes.map(code => `${code},unused,${new Date().toISOString()}`)
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `nvision-codes-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`Downloaded ${count} codes as CSV`);
  return codes;
}

/**
 * Test code validation
 * @param {string} code - Code to test
 */
export function testCode(code) {
  const { validateCodeFormat, verifyCodeChecksum } = require('../services/serialCodeService');
  
  const formatValid = validateCodeFormat(code);
  const checksumValid = verifyCodeChecksum(code);
  
  console.log('Code Test Results:');
  console.log('Code:', code);
  console.log('Format Valid:', formatValid);
  console.log('Checksum Valid:', checksumValid);
  console.log('Overall Valid:', formatValid && checksumValid);
  
  return formatValid && checksumValid;
}

// Make functions available in browser console for easy access
if (typeof window !== 'undefined') {
  window.NVisionCodeGen = {
    generateSingleCode,
    generateCodes,
    downloadCodesAsCSV,
    testCode
  };
  
  console.log('NVision Code Generator loaded. Use window.NVisionCodeGen to access functions:');
  console.log('- NVisionCodeGen.generateSingleCode()');
  console.log('- NVisionCodeGen.generateCodes(10)');
  console.log('- NVisionCodeGen.downloadCodesAsCSV(100)');
  console.log('- NVisionCodeGen.testCode("NV-XXXX-XXXX-XXXX-XXXX")');
}

export default {
  generateSingleCode,
  generateCodes,
  downloadCodesAsCSV,
  testCode
};
