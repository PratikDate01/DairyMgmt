import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateImageBuffer,
  parseAndValidateBase64Image,
  parsePrescriptionLines,
  levenshteinDistance,
  calculateSimilarity,
  normalizeMedicineName,
  matchCandidatesToInventory
} from '../src/services/prescriptionOcrService.js';

test('AI Prescription OCR & Inventory Matching Suite', async (t) => {
  // Mock DB medicines catalog representing MongoDB inventory
  const mockInventory = [
    {
      _id: 'med001',
      name: 'Mastitis Ointment',
      genericName: 'Cephapirin Sodium',
      category: 'Udder Care',
      price: 240.0,
      stockQuantity: 18,
      unit: 'tube',
      availability: 'available',
      isActive: true,
      medicalProvider: { _id: 'prov001', name: 'Kisan Medical Store', phone: '9876543210' }
    },
    {
      _id: 'med002',
      name: 'Vitamin B-Complex Injection',
      genericName: 'Thiamine + Riboflavin',
      category: 'Vitamins & Supplements',
      price: 180.0,
      stockQuantity: 40,
      unit: 'injection',
      availability: 'available',
      isActive: true,
      medicalProvider: { _id: 'prov001', name: 'Kisan Medical Store', phone: '9876543210' }
    },
    {
      _id: 'med003',
      name: 'Meloxicam Bolus',
      genericName: 'Meloxicam',
      category: 'Anti-inflammatory',
      price: 65.0,
      stockQuantity: 0,
      unit: 'bolus',
      availability: 'unavailable',
      isActive: true,
      medicalProvider: { _id: 'prov002', name: 'Gau Seva Medicals', phone: '9123456789' }
    },
    {
      _id: 'med004',
      name: 'Oxytetracycline 200mg Injection',
      genericName: 'Oxytetracycline',
      category: 'Antibiotics',
      price: 320.0,
      stockQuantity: 25,
      unit: 'injection',
      availability: 'available',
      isActive: true,
      medicalProvider: { _id: 'prov002', name: 'Gau Seva Medicals', phone: '9123456789' }
    }
  ];

  // Helper to create a valid uncompressed 24-bit BMP image buffer
  const createValidBmp = (width = 10, height = 10) => {
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;
    const buf = Buffer.alloc(fileSize, 0xff);
    buf.write('BM', 0);
    buf.writeUInt32LE(fileSize, 2);
    buf.writeUInt32LE(54, 10);
    buf.writeUInt32LE(40, 14);
    buf.writeInt32LE(width, 18);
    buf.writeInt32LE(height, 22);
    buf.writeUInt16LE(1, 26);
    buf.writeUInt16LE(24, 28);
    buf.writeUInt32LE(0, 30);
    buf.writeUInt32LE(pixelArraySize, 34);
    return buf;
  };

  await t.test('1. Validates magic bytes and rejects spoofed extensions or non-image files', () => {
    const validBmp = createValidBmp(10, 10);
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60]);
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);

    assert.equal(validateImageBuffer(validBmp).mimeType, 'image/bmp');
    assert.equal(validateImageBuffer(validJpeg).mimeType, 'image/jpeg');
    assert.equal(validateImageBuffer(validPng).mimeType, 'image/png');

    // Executable/text disguised as png
    const fakeFile = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');
    assert.throws(() => validateImageBuffer(fakeFile), /Unsupported file format/);

    // Empty buffer
    assert.throws(() => validateImageBuffer(Buffer.alloc(0)), /buffer is missing or empty/);
  });

  await t.test('2. Changing the filename never changes extracted results (Pixel-driven, not name-driven)', () => {
    const rawPrescriptionText = `
      Dr. V. Kulkarni, B.V.Sc & A.H.
      Date: 22/10/2026
      Patient: Cow Tag #1042

      Rx:
      1. Mastitis Ointment - 1 tube, apply twice daily for 5 days
      2. Vitamin B-Complex Injection - 10ml IM once daily for 3 days
    `;

    // Process with name "test123.png"
    const candidates1 = parsePrescriptionLines(rawPrescriptionText);
    const match1 = matchCandidatesToInventory(candidates1, mockInventory);

    // Process with name "medicine.jpg"
    const candidates2 = parsePrescriptionLines(rawPrescriptionText);
    const match2 = matchCandidatesToInventory(candidates2, mockInventory);

    // Extracted candidates must be 100% identical regardless of filename
    assert.deepEqual(
      candidates1.map(c => c.candidateName),
      candidates2.map(c => c.candidateName),
      'Extracted candidates must be identical regardless of filename'
    );
    assert.equal(match1.detectedMedicines.length, match2.detectedMedicines.length);
    assert.equal(match1.detectedMedicines[0].matchedMedicine.name, 'Mastitis Ointment');
    assert.equal(match1.detectedMedicines[1].matchedMedicine.name, 'Vitamin B-Complex Injection');
  });

  await t.test('3. Two different prescription contents produce results based on their own contents', () => {
    const rx1 = '1. Mastitis Ointment - 1 tube twice daily';
    const rx2 = '1. Oxytetracycline 200mg Injection - 20ml IM for 3 days';

    const cand1 = parsePrescriptionLines(rx1);
    const cand2 = parsePrescriptionLines(rx2);

    const res1 = matchCandidatesToInventory(cand1, mockInventory);
    const res2 = matchCandidatesToInventory(cand2, mockInventory);

    assert.equal(res1.detectedMedicines[0].matchedMedicine.name, 'Mastitis Ointment');
    assert.equal(res2.detectedMedicines[0].matchedMedicine.name, 'Oxytetracycline 200mg Injection');
    assert.notEqual(res1.detectedMedicines[0].matchedMedicine.name, res2.detectedMedicines[0].matchedMedicine.name);
  });

  await t.test('4. Uploading an image with in-stock medicine shows full database record', () => {
    const cand = parsePrescriptionLines('1. Mastitis Ointment - 1 tube');
    const result = matchCandidatesToInventory(cand, mockInventory);

    assert.equal(result.detectedMedicines.length, 1);
    const item = result.detectedMedicines[0];
    assert.equal(item.matchStatus, 'exact');
    assert.ok(item.matchedMedicine);
    assert.equal(item.matchedMedicine._id, 'med001');
    assert.equal(item.matchedMedicine.price, 240.0);
    assert.equal(item.matchedMedicine.stockQuantity, 18);
    assert.equal(item.matchedMedicine.isAvailable, true);
    assert.equal(result.matchingMedicines.length, 1);
  });

  await t.test('5. Out-of-stock or unavailable medicine is identified but marked unavailable', () => {
    const cand = parsePrescriptionLines('1. Meloxicam Bolus 100mg - 2 tabs OD');
    const result = matchCandidatesToInventory(cand, mockInventory);

    assert.equal(result.detectedMedicines.length, 1);
    const item = result.detectedMedicines[0];
    assert.equal(item.matchedMedicine.name, 'Meloxicam Bolus');
    assert.equal(item.matchedMedicine.isAvailable, false, 'Zero stock medicine must not be available');
    assert.equal(result.matchingMedicines.length, 0, 'Unavailable medicine must not be added to active ordering catalog');
  });

  await t.test('6. Unmatched medicine shows "Medicine not found in inventory"', () => {
    const cand = parsePrescriptionLines('1. Flunixin Meglumine - 10ml IV');
    const result = matchCandidatesToInventory(cand, mockInventory);

    assert.equal(result.detectedMedicines.length, 1);
    const item = result.detectedMedicines[0];
    assert.equal(item.matchStatus, 'unmatched');
    assert.equal(item.matchedMedicine, null);
    assert.equal(item.matchNote, 'Medicine not found in inventory');
    assert.equal(result.unmatchedMedicines.length, 1);
    assert.equal(result.unmatchedMedicines[0].candidateName, 'Flunixin Meglumine');
  });

  await t.test('7. Controlled OCR spelling error tolerance matches correct medicine', () => {
    // Typical OCR typos: "Ointrnent" for "Ointment", "Melox1cam" for "Meloxicam"
    const cand = parsePrescriptionLines('1. Mastitis Ointrnent - 1 tube\n2. Melox1cam Bolus - 2 tabs');
    const result = matchCandidatesToInventory(cand, mockInventory);

    assert.equal(result.detectedMedicines.length, 2);
    assert.ok(result.detectedMedicines[0].matchedMedicine, 'Mastitis Ointrnent should match Mastitis Ointment');
    assert.equal(result.detectedMedicines[0].matchedMedicine.name, 'Mastitis Ointment');
    assert.ok(result.detectedMedicines[1].matchedMedicine, 'Melox1cam Bolus should match Meloxicam Bolus');
    assert.equal(result.detectedMedicines[1].matchedMedicine.name, 'Meloxicam Bolus');
    assert.equal(result.detectedMedicines[0].matchStatus, 'possible');

    // Unrelated medicine should NEVER match via fuzzy tolerance
    const unrelatedCand = parsePrescriptionLines('1. Paracetamol 500mg');
    const unrelatedResult = matchCandidatesToInventory(unrelatedCand, mockInventory);
    assert.equal(unrelatedResult.detectedMedicines[0].matchStatus, 'unmatched');
  });

  await t.test('8. Blank or textless images produce empty results without fabricating data', () => {
    const blankText = '';
    const cand = parsePrescriptionLines(blankText);
    const result = matchCandidatesToInventory(cand, mockInventory);

    assert.equal(cand.length, 0);
    assert.equal(result.detectedMedicines.length, 0);
    assert.equal(result.matchingMedicines.length, 0);
    assert.equal(result.unmatchedMedicines.length, 0);
  });

  await t.test('9. Dynamic inventory matching: works for any new medicine added without hardcoded names', () => {
    const dynamicMedicine = {
      _id: 'med999',
      name: 'Gentamicin Sulfate Drop',
      genericName: 'Gentamicin',
      category: 'Ophthalmic',
      price: 95.0,
      stockQuantity: 12,
      unit: 'drops',
      availability: 'available',
      isActive: true,
      medicalProvider: { _id: 'prov003', name: 'Apex Vet Pharma', phone: '9988776655' }
    };

    const updatedCatalog = [...mockInventory, dynamicMedicine];
    const cand = parsePrescriptionLines('1. Gentamicin Sulfate Drop - 2 drops in eye daily');
    const result = matchCandidatesToInventory(cand, updatedCatalog);

    assert.equal(result.detectedMedicines.length, 1);
    assert.equal(result.detectedMedicines[0].matchedMedicine._id, 'med999');
    assert.equal(result.detectedMedicines[0].matchedMedicine.name, 'Gentamicin Sulfate Drop');
    assert.equal(result.matchingMedicines.length, 1);
  });

  await t.test('10. Base64 data URI decoding and validation handles data URL prefixes', () => {
    const validBmp = createValidBmp(5, 5);
    const base64DataUrl = `data:image/bmp;base64,${validBmp.toString('base64')}`;

    const parsed = parseAndValidateBase64Image(base64DataUrl);
    assert.equal(parsed.mimeType, 'image/bmp');
    assert.equal(parsed.byteLength, validBmp.length);
  });
});
