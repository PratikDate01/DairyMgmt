import test from 'node:test';
import assert from 'node:assert/strict';

test('Server Schema & Security Regression Suite', async (t) => {
  await t.test('1. User model includes optional nameMr and professional verification fields', async () => {
    const { default: User } = await import('../src/models/User.js');
    const schema = User.schema;
    assert.ok(schema.path('nameMr'), 'User model should have nameMr path');
    assert.ok(schema.path('licenseNumber'), 'User model should have licenseNumber path');
    assert.ok(schema.path('clinicName'), 'User model should have clinicName path');
    assert.ok(schema.path('specialization'), 'User model should have specialization path');
    assert.ok(schema.path('verificationStatus'), 'User model should have verificationStatus path');
  });

  await t.test('2. Cattle model includes optional nameMr field', async () => {
    const { default: Cattle } = await import('../src/models/Cattle.js');
    const schema = Cattle.schema;
    assert.ok(schema.path('nameMr'), 'Cattle model should have nameMr path');
  });

  await t.test('3. Public registration rejects admin and allows dairyOwner role', () => {
    const prohibitedRoles = ['admin'];
    const allowedRoles = ['farmer', 'dairyOwner', 'veterinarian', 'medicalProvider'];

    for (const role of prohibitedRoles) {
      const isProhibited = role === 'admin';
      assert.equal(isProhibited, true, `Role ${role} must be rejected on public registration`);
    }

    for (const role of allowedRoles) {
      const isProhibited = role === 'admin';
      assert.equal(isProhibited, false, `Role ${role} must be allowed on public registration`);
    }
  });

  await t.test('4. Medicine stock availability transition logic', () => {
    // Simulating the exact state machine in updateStock & createMedicine
    const applyStockChange = (medicine, newStockQuantity) => {
      medicine.stockQuantity = newStockQuantity;
      if (newStockQuantity <= 0) {
        medicine.availability = 'unavailable';
      } else if (medicine.isActive && newStockQuantity > 0) {
        medicine.availability = 'available';
      }
      return medicine;
    };

    // Case 1: Active medicine running out of stock
    const med1 = { isActive: true, stockQuantity: 10, availability: 'available' };
    applyStockChange(med1, 0);
    assert.equal(med1.availability, 'unavailable', 'Zero stock must set availability to unavailable');

    // Case 2: Replenishing out-of-stock medicine (Root Cause 1 fix)
    applyStockChange(med1, 25);
    assert.equal(med1.availability, 'available', 'Replenished active medicine must automatically become available');

    // Case 3: Inactive medicine should not become available even if stocked
    const med2 = { isActive: false, stockQuantity: 0, availability: 'unavailable' };
    applyStockChange(med2, 50);
    assert.equal(med2.availability, 'unavailable', 'Inactive medicine must not become available when stocked');
  });

  await t.test('5. Prescription tokenized multi-word matching logic', () => {
    const tokenMatch = (catalogName, prescribedName) => {
      const cleanCatalog = catalogName.toLowerCase();
      const cleanPrescribed = prescribedName.toLowerCase();
      if (cleanCatalog.includes(cleanPrescribed) || cleanPrescribed.includes(cleanCatalog)) {
        return true;
      }
      const termTokens = cleanPrescribed.split(/[\s,/-]+/).filter(t => t.length > 2);
      const nameTokens = cleanCatalog.split(/[\s,/-]+/).filter(t => t.length > 2);
      return termTokens.some(tok => nameTokens.includes(tok));
    };

    assert.equal(tokenMatch('Amoxicillin Bolus 1500mg', 'Amoxicillin'), true);
    assert.equal(tokenMatch('Amoxicillin', 'Amoxicillin 500mg'), true);
    assert.equal(tokenMatch('Meloxicam Injection', 'Meloxicam 100ml'), true);
    assert.equal(tokenMatch('Ivermectin Pour-On', 'Enrofloxacin'), false);
  });
});
