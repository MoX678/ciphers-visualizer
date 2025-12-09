// Test AES with simple inputs
console.log("Testing AES implementation:");

// Test 1: All zeros
console.log("\n=== Test 1: All zeros ===");
const plaintext1 = "0000000000000000"; // 16 zeros
const key1 = "0000000000000000"; // 16 zeros
console.log("Plaintext:", plaintext1);
console.log("Key:", key1);

// Test 2: Simple pattern
console.log("\n=== Test 2: Simple pattern ===");
const plaintext2 = "0123456789abcdef"; 
const key2 = "fedcba9876543210";
console.log("Plaintext:", plaintext2);
console.log("Key:", key2);

// We would test encryption and decryption here
console.log("\nRun this in the browser console to test the actual AES functions");