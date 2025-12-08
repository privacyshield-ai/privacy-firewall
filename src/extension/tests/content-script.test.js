/**
 * Test Suite for PrivacyWall Regex Patterns
 * Tests all sensitive data detection patterns used in content-script.js
 *
 * Run with: node content-script.test.js
 */

// Define the patterns to test
const PATTERNS = [
  {
    type: "email",
    regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/,
    desc: "Email Address",
  },
  {
    type: "phone_number",
    regex: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    desc: "Phone Number",
  },
  {
    type: "mac_address",
    regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/,
    desc: "MAC Address",
  },
  {
    type: "aws_key",
    regex: /AKIA[0-9A-Z]{16}/,
    desc: "AWS Access Key",
  },
  {
    type: "private_key",
    regex: /-----BEGIN (RSA )?PRIVATE KEY-----/,
    desc: "Private SSH/RSA Key",
  },
  {
    type: "ip_address",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    desc: "IP Address",
  },
  {
    type: "credit_card",
    regex: /\b(?:\d[ -]*?){13,16}\b/,
    desc: "Credit Card Number",
  },
  {
    type: "ssn",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    desc: "US Social Security Number",
  },
  {
    type: "api_key",
    regex: /\b[0-9a-fA-F]{32,64}\b/,
    desc: "Generic API Key / Hash",
  },
  {
    type: "jwt",
    regex: /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/,
    desc: "JWT Token",
  },
];

// Simple test framework for Node.js
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${description}`);
  } catch (error) {
    failedTests++;
    console.log(`  ✗ ${description}`);
    console.log(`    Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    }
  };
}

function describe(groupName, fn) {
  console.log(`\n${groupName}`);
  fn();
}

console.log('\n' + '='.repeat(70));
console.log('🛡️  PrivacyWall Regex Pattern Test Suite');
console.log('='.repeat(70));

// ============================================================================
// EMAIL ADDRESS TESTS
// ============================================================================
describe('Email Address Detection', () => {
  const emailPattern = PATTERNS.find(p => p.type === 'email');

  test('should detect standard email addresses', () => {
    expect(emailPattern.regex.test('user@example.com')).toBe(true);
    expect(emailPattern.regex.test('john.doe@company.org')).toBe(true);
    expect(emailPattern.regex.test('test_user+tag@domain.co.uk')).toBe(true);
  });

  test('should detect emails with numbers', () => {
    expect(emailPattern.regex.test('user123@test456.com')).toBe(true);
    expect(emailPattern.regex.test('123@456.789')).toBe(true);
  });

  test('should detect emails with special characters', () => {
    expect(emailPattern.regex.test('first.last@example.com')).toBe(true);
    expect(emailPattern.regex.test('user+tag@example.com')).toBe(true);
    expect(emailPattern.regex.test('user_name@example.com')).toBe(true);
  });

  test('should NOT detect invalid emails', () => {
    expect(emailPattern.regex.test('@example.com')).toBe(false);
    expect(emailPattern.regex.test('user@')).toBe(false);
    expect(emailPattern.regex.test('not an email')).toBe(false);
  });
});

// ============================================================================
// PHONE NUMBER TESTS
// ============================================================================
describe('Phone Number Detection', () => {
  const phonePattern = PATTERNS.find(p => p.type === 'phone_number');

  test('should detect US phone numbers with various formats', () => {
    expect(phonePattern.regex.test('555-123-4567')).toBe(true);
    expect(phonePattern.regex.test('(555) 123-4567')).toBe(true);
    expect(phonePattern.regex.test('555.123.4567')).toBe(true);
    expect(phonePattern.regex.test('5551234567')).toBe(true);
  });

  test('should detect international phone numbers', () => {
    expect(phonePattern.regex.test('+1-555-123-4567')).toBe(true);
    expect(phonePattern.regex.test('+44 555 123 4567')).toBe(true);
    expect(phonePattern.regex.test('+91-555-123-4567')).toBe(true);
  });

  test('should detect phone numbers with parentheses', () => {
    expect(phonePattern.regex.test('(555)123-4567')).toBe(true);
    expect(phonePattern.regex.test('(555) 123 4567')).toBe(true);
  });

  test('should NOT detect invalid phone numbers', () => {
    expect(phonePattern.regex.test('123-45')).toBe(false);
    expect(phonePattern.regex.test('abc-def-ghij')).toBe(false);
  });
});

// ============================================================================
// MAC ADDRESS TESTS
// ============================================================================
describe('MAC Address Detection', () => {
  const macPattern = PATTERNS.find(p => p.type === 'mac_address');

  test('should detect MAC addresses with colons', () => {
    expect(macPattern.regex.test('00:1A:2B:3C:4D:5E')).toBe(true);
    expect(macPattern.regex.test('ff:ff:ff:ff:ff:ff')).toBe(true);
    expect(macPattern.regex.test('AB:CD:EF:12:34:56')).toBe(true);
  });

  test('should detect MAC addresses with hyphens', () => {
    expect(macPattern.regex.test('00-1A-2B-3C-4D-5E')).toBe(true);
    expect(macPattern.regex.test('AA-BB-CC-DD-EE-FF')).toBe(true);
  });

  test('should detect lowercase MAC addresses', () => {
    expect(macPattern.regex.test('aa:bb:cc:dd:ee:ff')).toBe(true);
    expect(macPattern.regex.test('12:34:56:78:9a:bc')).toBe(true);
  });

  test('should NOT detect invalid MAC addresses', () => {
    expect(macPattern.regex.test('00:1A:2B:3C:4D')).toBe(false);
    expect(macPattern.regex.test('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ')).toBe(false);
  });
});

// ============================================================================
// AWS ACCESS KEY TESTS
// ============================================================================
describe('AWS Access Key Detection', () => {
  const awsPattern = PATTERNS.find(p => p.type === 'aws_key');

  test('should detect valid AWS access keys', () => {
    expect(awsPattern.regex.test('AKIAIOSFODNN7EXAMPLE')).toBe(true);
    expect(awsPattern.regex.test('AKIAI44QH8DHBEXAMPLE')).toBe(true);
    expect(awsPattern.regex.test('AKIA1234567890ABCDEF')).toBe(true);
  });

  test('should NOT detect invalid AWS keys', () => {
    expect(awsPattern.regex.test('AKIA123')).toBe(false);
    expect(awsPattern.regex.test('BKIAIOSFODNN7EXAMPLE')).toBe(false);
    expect(awsPattern.regex.test('akiaiosfodnn7example')).toBe(false);
  });
});

// ============================================================================
// PRIVATE KEY TESTS
// ============================================================================
describe('Private SSH/RSA Key Detection', () => {
  const keyPattern = PATTERNS.find(p => p.type === 'private_key');

  test('should detect RSA private key headers', () => {
    expect(keyPattern.regex.test('-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
    expect(keyPattern.regex.test('-----BEGIN PRIVATE KEY-----')).toBe(true);
  });

  test('should detect private keys in text', () => {
    const keyText = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...';
    expect(keyPattern.regex.test(keyText)).toBe(true);
  });

  test('should NOT detect public keys', () => {
    expect(keyPattern.regex.test('-----BEGIN PUBLIC KEY-----')).toBe(false);
    expect(keyPattern.regex.test('-----BEGIN RSA PUBLIC KEY-----')).toBe(false);
  });
});

// ============================================================================
// IP ADDRESS TESTS
// ============================================================================
describe('IP Address Detection', () => {
  const ipPattern = PATTERNS.find(p => p.type === 'ip_address');

  test('should detect valid IPv4 addresses', () => {
    expect(ipPattern.regex.test('192.168.1.1')).toBe(true);
    expect(ipPattern.regex.test('10.0.0.1')).toBe(true);
    expect(ipPattern.regex.test('255.255.255.255')).toBe(true);
    expect(ipPattern.regex.test('8.8.8.8')).toBe(true);
  });

  test('should detect private IP addresses', () => {
    expect(ipPattern.regex.test('192.168.0.1')).toBe(true);
    expect(ipPattern.regex.test('10.10.10.10')).toBe(true);
    expect(ipPattern.regex.test('172.16.0.1')).toBe(true);
  });

  test('should detect localhost', () => {
    expect(ipPattern.regex.test('127.0.0.1')).toBe(true);
  });

  test('should handle IPs in text', () => {
    expect(ipPattern.regex.test('Server IP is 192.168.1.100')).toBe(true);
  });
});

// ============================================================================
// CREDIT CARD TESTS
// ============================================================================
describe('Credit Card Number Detection', () => {
  const ccPattern = PATTERNS.find(p => p.type === 'credit_card');

  test('should detect 16-digit credit card numbers', () => {
    expect(ccPattern.regex.test('4532015112830366')).toBe(true);
    expect(ccPattern.regex.test('5425233430109903')).toBe(true);
  });

  test('should detect credit cards with spaces', () => {
    expect(ccPattern.regex.test('4532 0151 1283 0366')).toBe(true);
    expect(ccPattern.regex.test('5425 2334 3010 9903')).toBe(true);
  });

  test('should detect credit cards with hyphens', () => {
    expect(ccPattern.regex.test('4532-0151-1283-0366')).toBe(true);
    expect(ccPattern.regex.test('5425-2334-3010-9903')).toBe(true);
  });

  test('should detect 13-digit credit cards (Visa)', () => {
    expect(ccPattern.regex.test('4532151283036')).toBe(true);
  });

  test('should detect 15-digit credit cards (Amex)', () => {
    expect(ccPattern.regex.test('378282246310005')).toBe(true);
  });
});

// ============================================================================
// SSN TESTS
// ============================================================================
describe('US Social Security Number Detection', () => {
  const ssnPattern = PATTERNS.find(p => p.type === 'ssn');

  test('should detect valid SSN format', () => {
    expect(ssnPattern.regex.test('123-45-6789')).toBe(true);
    expect(ssnPattern.regex.test('987-65-4321')).toBe(true);
    expect(ssnPattern.regex.test('000-12-3456')).toBe(true);
  });

  test('should detect SSN in text', () => {
    expect(ssnPattern.regex.test('My SSN is 123-45-6789')).toBe(true);
  });

  test('should NOT detect SSN without hyphens', () => {
    expect(ssnPattern.regex.test('123456789')).toBe(false);
  });

  test('should NOT detect incorrectly formatted SSN', () => {
    expect(ssnPattern.regex.test('12-345-6789')).toBe(false);
    expect(ssnPattern.regex.test('1234-56-789')).toBe(false);
  });
});

// ============================================================================
// API KEY / HASH TESTS
// ============================================================================
describe('Generic API Key / Hash Detection', () => {
  const apiPattern = PATTERNS.find(p => p.type === 'api_key');

  test('should detect 32-character hex strings (MD5)', () => {
    expect(apiPattern.regex.test('5d41402abc4b2a76b9719d911017c592')).toBe(true);
    expect(apiPattern.regex.test('098f6bcd4621d373cade4e832627b4f6')).toBe(true);
  });

  test('should detect 40-character hex strings (SHA-1)', () => {
    expect(apiPattern.regex.test('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')).toBe(true);
  });

  test('should detect 64-character hex strings (SHA-256)', () => {
    expect(apiPattern.regex.test('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBe(true);
  });

  test('should detect API keys in text', () => {
    expect(apiPattern.regex.test('API Key: abc123def456789012345678901234567890')).toBe(true);
  });

  test('should NOT detect short strings', () => {
    expect(apiPattern.regex.test('abc123')).toBe(false);
  });
});

// ============================================================================
// JWT TOKEN TESTS
// ============================================================================
describe('JWT Token Detection', () => {
  const jwtPattern = PATTERNS.find(p => p.type === 'jwt');

  test('should detect valid JWT tokens', () => {
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(jwtPattern.regex.test(validJWT)).toBe(true);
  });

  test('should detect JWT in text', () => {
    const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoidGVzdCJ9.dGVzdHNpZ25hdHVyZQ';
    expect(jwtPattern.regex.test(text)).toBe(true);
  });

  test('should NOT detect incomplete JWT', () => {
    expect(jwtPattern.regex.test('eyJhbGciOiJIUzI1NiJ9.incomplete')).toBe(false);
    expect(jwtPattern.regex.test('eyJhbGciOiJIUzI1NiJ9')).toBe(false);
  });

  test('should NOT detect random base64 strings', () => {
    expect(jwtPattern.regex.test('SGVsbG9Xb3JsZA==')).toBe(false);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Multiple Pattern Detection', () => {
  test('should detect multiple types in single text', () => {
    const text = 'Contact me at user@example.com or call 555-123-4567. My IP is 192.168.1.1';

    const emailMatch = PATTERNS.find(p => p.type === 'email').regex.test(text);
    const phoneMatch = PATTERNS.find(p => p.type === 'phone_number').regex.test(text);
    const ipMatch = PATTERNS.find(p => p.type === 'ip_address').regex.test(text);

    expect(emailMatch).toBe(true);
    expect(phoneMatch).toBe(true);
    expect(ipMatch).toBe(true);
  });

  test('should not detect patterns in clean text', () => {
    const cleanText = 'This is a normal message without any sensitive data';
    const hasMatches = PATTERNS.some(pattern => pattern.regex.test(cleanText));
    expect(hasMatches).toBe(false);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================
describe('Edge Cases and Special Scenarios', () => {
  test('should handle empty strings', () => {
    const text = '';
    const hasMatches = PATTERNS.some(pattern => pattern.regex.test(text));
    expect(hasMatches).toBe(false);
  });

  test('should handle very long strings', () => {
    const longText = 'a'.repeat(10000) + ' user@example.com ' + 'b'.repeat(10000);
    const emailPattern = PATTERNS.find(p => p.type === 'email');
    expect(emailPattern.regex.test(longText)).toBe(true);
  });

  test('should handle special characters', () => {
    const text = 'Email: user@example.com\nPhone: 555-123-4567\tIP: 192.168.1.1';
    const emailMatch = PATTERNS.find(p => p.type === 'email').regex.test(text);
    const phoneMatch = PATTERNS.find(p => p.type === 'phone_number').regex.test(text);
    const ipMatch = PATTERNS.find(p => p.type === 'ip_address').regex.test(text);

    expect(emailMatch).toBe(true);
    expect(phoneMatch).toBe(true);
    expect(ipMatch).toBe(true);
  });
});

// ============================================================================
// RUN ALL TESTS AND PRINT SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests:  ${totalTests}`);
console.log(`✓ Passed:     ${passedTests}`);
console.log(`✗ Failed:     ${failedTests}`);
console.log('='.repeat(70));

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! ✓\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} test(s) failed\n`);
  process.exit(1);
}
