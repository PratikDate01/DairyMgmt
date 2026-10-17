import test from 'node:test';
import assert from 'node:assert/strict';
import i18n from '../src/i18n/index.js';
import {
  getStatusLabel,
  getRoleLabel,
  getSessionLabel,
  getPaymentMethodLabel,
  getGenderLabel
} from '../src/i18n/statusMap.js';

test('statusMap regression suite', async (t) => {
  // Ensure default language is English initially
  await i18n.changeLanguage('en');

  await t.test('1. Valid translation function (t) is handled correctly', () => {
    // Custom mock t function
    const mockT = (key) => {
      const dict = {
        'status.healthy': 'Mock Healthy',
        'status.under_observation': 'Mock Observation'
      };
      return dict[key] || key;
    };

    assert.equal(getStatusLabel('healthy', mockT), 'Mock Healthy');
    assert.equal(getStatusLabel('under_observation', mockT), 'Mock Observation');
  });

  await t.test('2. Supported status values produce expected translated labels in English', async () => {
    await i18n.changeLanguage('en');
    assert.equal(getStatusLabel('healthy', i18n.t), 'Healthy');
    assert.equal(getStatusLabel('sick', i18n.t), 'Sick');
    assert.equal(getStatusLabel('under_observation', i18n.t), 'Under Observation');
    assert.equal(getStatusLabel('treatment_ongoing', i18n.t), 'Treatment Ongoing');
    assert.equal(getStatusLabel('open', i18n.t), 'Open');
    assert.equal(getStatusLabel('in_progress', i18n.t), 'In Progress');
    assert.equal(getStatusLabel('resolved', i18n.t), 'Resolved');
    assert.equal(getStatusLabel('closed', i18n.t), 'Closed');
    assert.equal(getStatusLabel('pending_review', i18n.t), 'Pending Review');
    assert.equal(getStatusLabel('under_review', i18n.t), 'Under Review');
    assert.equal(getStatusLabel('review_completed', i18n.t), 'Review Completed');
  });

  await t.test('3. Supported status values produce expected translated labels in Marathi', async () => {
    await i18n.changeLanguage('mr');

    assert.equal(getStatusLabel('healthy', i18n.t), 'निरोगी');
    assert.equal(getStatusLabel('sick', i18n.t), 'आजारी');
    assert.equal(getStatusLabel('under_observation', i18n.t), 'निरीक्षणाखाली');
    assert.equal(getStatusLabel('treatment_ongoing', i18n.t), 'उपचार सुरू');
    assert.equal(getStatusLabel('open', i18n.t), 'खुले');
    assert.equal(getStatusLabel('in_progress', i18n.t), 'काम सुरू');
    assert.equal(getStatusLabel('resolved', i18n.t), 'निवारण झाले');
    assert.equal(getStatusLabel('closed', i18n.t), 'बंद केले');
    assert.equal(getStatusLabel('pending_review', i18n.t), 'तपासणी प्रलंबित');
    assert.equal(getStatusLabel('under_review', i18n.t), 'तपासणी सुरू');
    assert.equal(getStatusLabel('review_completed', i18n.t), 'तपासणी पूर्ण');

    // Restore English
    await i18n.changeLanguage('en');
  });

  await t.test('4. Missing translations fall back correctly to humanized English string', () => {
    // An obscure status not in common.json
    assert.equal(getStatusLabel('custom_non_existent_state', i18n.t), 'Custom Non Existent State');
    assert.equal(getStatusLabel('another_unmapped_status', () => 'status.another_unmapped_status'), 'Another Unmapped Status');
  });

  await t.test('5. Invalid, absent, or null translation function does NOT throw and falls back cleanly', async () => {
    await i18n.changeLanguage('en');

    // Calling with NO translation function at all (the exact condition that caused the white screen)
    assert.doesNotThrow(() => {
      const res = getStatusLabel('healthy');
      assert.equal(res, 'Healthy');
    });

    assert.doesNotThrow(() => {
      const res = getStatusLabel('under_observation');
      assert.equal(res, 'Under Observation');
    });

    // Calling with undefined, null, number, or object as t
    assert.doesNotThrow(() => {
      const res = getStatusLabel('sick', null);
      assert.equal(res, 'Sick');
    });

    assert.doesNotThrow(() => {
      const res = getStatusLabel('treatment_ongoing', 'not_a_function');
      assert.equal(res, 'Treatment Ongoing');
    });

    assert.doesNotThrow(() => {
      const res = getStatusLabel('resolved', {});
      assert.equal(res, 'Resolved');
    });
  });

  await t.test('6. Accidental argument inversion (t, status) is handled gracefully', async () => {
    await i18n.changeLanguage('en');
    assert.doesNotThrow(() => {
      const res = getStatusLabel(i18n.t, 'healthy');
      assert.equal(res, 'Healthy');
    });
  });

  await t.test('7. Empty, null, or undefined status values return empty string without error', () => {
    assert.equal(getStatusLabel(null, i18n.t), '');
    assert.equal(getStatusLabel(undefined, i18n.t), '');
    assert.equal(getStatusLabel('', i18n.t), '');
    assert.equal(getStatusLabel(123, i18n.t), '');
  });

  await t.test('8. Role label helper tests', async () => {
    await i18n.changeLanguage('en');
    assert.equal(getRoleLabel('farmer', i18n.t), 'Farmer');
    assert.equal(getRoleLabel('dairyOwner', i18n.t), 'Dairy Owner');
    assert.equal(getRoleLabel('veterinarian', i18n.t), 'Veterinarian');
    assert.equal(getRoleLabel('medicalProvider', i18n.t), 'Medical Store');
    assert.equal(getRoleLabel('admin', i18n.t), 'Administrator');

    // Without t (falls back to singleton i18n or default)
    assert.equal(getRoleLabel('farmer'), 'Farmer');
    assert.equal(getRoleLabel('admin'), 'Administrator');

    // Marathi
    await i18n.changeLanguage('mr');
    assert.equal(getRoleLabel('farmer', i18n.t), 'शेतकरी');
    assert.equal(getRoleLabel('dairyOwner', i18n.t), 'डेअरी चालक');
    assert.equal(getRoleLabel('veterinarian', i18n.t), 'पशुवैद्यक');
    assert.equal(getRoleLabel('medicalProvider', i18n.t), 'औषध केंद्र');
    assert.equal(getRoleLabel('admin', i18n.t), 'प्रशासक');

    await i18n.changeLanguage('en');
  });

  await t.test('9. Session, Payment Method, and Gender helpers in English and Marathi', async () => {
    await i18n.changeLanguage('en');
    assert.equal(getSessionLabel('morning', i18n.t), 'Morning');
    assert.equal(getSessionLabel('evening', i18n.t), 'Evening');
    assert.equal(getSessionLabel('morning'), 'Morning');

    assert.equal(getPaymentMethodLabel('cash', i18n.t), 'Cash');
    assert.equal(getPaymentMethodLabel('upi', i18n.t), 'UPI');
    assert.equal(getPaymentMethodLabel('cash'), 'Cash');

    assert.equal(getGenderLabel('male', i18n.t), 'Male');
    assert.equal(getGenderLabel('female', i18n.t), 'Female');
    assert.equal(getGenderLabel('male'), 'Male');

    // Marathi
    await i18n.changeLanguage('mr');
    assert.equal(getSessionLabel('morning', i18n.t), 'सकाळ');
    assert.equal(getSessionLabel('evening', i18n.t), 'संध्याकाळ');
    assert.equal(getGenderLabel('male', i18n.t), 'नर');
    assert.equal(getGenderLabel('female', i18n.t), 'मादी');

    await i18n.changeLanguage('en');
  });
});
