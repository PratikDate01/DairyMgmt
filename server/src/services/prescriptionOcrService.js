import { createWorker } from 'tesseract.js';

/**
 * Validates image buffer using magic bytes to ensure real image content
 * and prevent spoofed MIME types or executable uploads.
 */
export const validateImageBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Invalid file data: buffer is missing or empty.');
  }

  // Enforce size boundaries: minimum 16 bytes, maximum 25 MB
  if (buffer.length < 16) {
    throw new Error('Image file is empty or too small to be a valid prescription image.');
  }
  const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error('Image exceeds 25 MB limit. Please upload an optimized image.');
  }

  // Validate magic bytes
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 (PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, mimeType: 'image/png' };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }

  // BMP: 42 4D (BM)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return { valid: true, mimeType: 'image/bmp' };
  }

  // PDF magic bytes %PDF
  if (buffer.slice(0, 4).toString('ascii') === '%PDF') {
    throw new Error(
      'PDF documents must be rasterized to an image (JPG/PNG) for OCR pixel scanning. Please upload a JPG or PNG.'
    );
  }

  throw new Error(
    'Unsupported file format. Please upload a valid JPG, PNG, WEBP, or BMP image.'
  );
};

/**
 * Decodes base64 data URL or raw base64 string to a Buffer and validates it.
 */
export const parseAndValidateBase64Image = (dataUriOrBase64) => {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
    throw new Error('Prescription image data is required.');
  }

  // Strip Data URL scheme (e.g. "data:image/jpeg;base64,")
  const base64Clean = dataUriOrBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
  if (!base64Clean) {
    throw new Error('Prescription base64 image data is empty.');
  }

  const buffer = Buffer.from(base64Clean, 'base64');
  const validation = validateImageBuffer(buffer);

  return {
    buffer,
    mimeType: validation.mimeType,
    byteLength: buffer.length
  };
};

/**
 * Extracts visible text from prescription image buffer using Tesseract.js.
 * Supports printed English text and Marathi text when available.
 */
export const extractTextFromImage = async (imageBuffer) => {
  let worker;
  try {
    // Attempt dual language recognition (English + Marathi)
    try {
      worker = await createWorker(['eng', 'mar']);
    } catch (langErr) {
      console.warn('Could not load marathi traineddata, falling back to English OCR:', langErr.message);
      worker = await createWorker('eng');
    }

    const ret = await worker.recognize(imageBuffer);
    const rawText = (ret.data?.text || '').trim();
    const confidence = ret.data?.confidence || 0;

    return {
      rawText,
      confidence
    };
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
};

/**
 * Header and noise stop-words to eliminate veterinary clinic headers,
 * doctor degrees, patient demographics, and form labels.
 */
const NON_MEDICINE_PATTERNS = [
  /^(?:dr|doctor|dr\.)\s+[a-z\s.]+/i,
  /^(?:veterinary|vet|clinic|hospital|dispensary|animal\s+care|gauseva)/i,
  /^(?:b\.?v\.?sc|m\.?v\.?sc|dvm|ph\.?d|reg(?:istration)?\.?\s*(?:no|num)?)/i,
  /^(?:date|dated|time|day|prescription|rx|medical\s+store)\b/i,
  /^(?:patient|owner|farmer|animal|cattle|cow|buffalo|bull|calf|breed|age|weight|temp|gender)\b/i,
  /^(?:symptoms|diagnosis|history|observation|complaint|notes?)\b/i,
  /^(?:signature|sign|seal|stamp|phone|mobile|tel|email|address|pin)\b/i
];

/**
 * Parses raw OCR text into structured prescription candidate medicine items.
 */
export const parsePrescriptionLines = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 1);

  const candidates = [];

  for (const line of lines) {
    // 1. Strip numbering and bullet prefixes (e.g. "1.", "2)", "•", "-", "*")
    let cleanLine = line.replace(/^\s*(?:\d+[\.\)\-:]+|[•*\->])\s*/, '').trim();
    if (!cleanLine || cleanLine.length < 2) continue;

    // 2. Skip obvious non-medicine clinic / header lines
    const isHeaderLine = NON_MEDICINE_PATTERNS.some(regex => regex.test(cleanLine));
    if (isHeaderLine) continue;

    // 3. Extract duration (e.g., "for 5 days", "3 days", "1 week")
    let duration = '';
    const durationMatch = cleanLine.match(/\b(for\s+\d+\s*(?:days?|weeks?|months?)|(?:\d+)\s*(?:days?|weeks?|months?))\b/i);
    if (durationMatch) {
      duration = durationMatch[0].trim();
    }
    cleanLine = cleanLine.replace(/\b(for\s+\d+\s*(?:days?|weeks?|months?)|(?:\d+)\s*(?:days?|weeks?|months?))\b/gi, ' ');

    // 4. Extract frequency (e.g., "OD", "BD", "BID", "TDS", "TID", "twice daily", "once daily")
    let frequency = '';
    const freqMatch = cleanLine.match(/\b(once\s+daily|twice\s+daily|thrice\s+daily|every\s+\d+\s*hours?|OD|BD|BID|TDS|TID|QID|SOS|PRN|daily|morning\s+and\s+evening)\b/i);
    if (freqMatch) {
      frequency = freqMatch[0].trim();
    }
    cleanLine = cleanLine.replace(/\b(once\s+daily|twice\s+daily|thrice\s+daily|every\s+\d+\s*hours?|OD|BD|BID|TDS|TID|QID|SOS|PRN|daily|morning\s+and\s+evening)\b/gi, ' ');

    // 5. Extract route of administration (e.g., "IM", "IV", "SC", "Oral", "Topical", "Intramammary")
    let route = '';
    const routeMatch = cleanLine.match(/\b(IM|IV|SC|Oral|Topical|Intramammary|Subcutaneous|Intramuscular|Intravenous|intra-mammary)\b/i);
    if (routeMatch) {
      route = routeMatch[0].trim();
    }
    cleanLine = cleanLine.replace(/\b(IM|IV|SC|Oral|Topical|Intramammary|Subcutaneous|Intramuscular|Intravenous|intra-mammary)\b/gi, ' ');

    // 6. Extract dosage instructions (e.g., "1 tube", "2 tabs", "2 tablets", "10ml", "1 bolus")
    let dosage = '';
    const dosageMatch = cleanLine.match(/\b(\d+(?:\.\d+)?\s*(?:tablet|tab|tabs|tablets|bolus|boluses|capsule|cap|caps|capsules|tube|tubes|vial|vials|bottle|bottles|drop|drops|ml|cc|spoon|spoons))\b/i);
    if (dosageMatch) {
      dosage = dosageMatch[0].trim();
    }
    cleanLine = cleanLine.replace(/\b(\d+(?:\.\d+)?\s*(?:tablet|tab|tabs|tablets|bolus|boluses|capsule|cap|caps|capsules|tube|tubes|vial|vials|bottle|bottles|drop|drops|ml|cc|spoon|spoons))\b/gi, ' ');

    // 7. Extract strength if present (e.g., "100mg", "500 mg", "100ml", "20%")
    let strength = '';
    const strengthMatch = cleanLine.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|gm?|IU|%|w\/v|w\/w))\b/i);
    if (strengthMatch) {
      strength = strengthMatch[0].trim();
    }
    cleanLine = cleanLine.replace(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|gm?|IU|%|w\/v|w\/w))\b/gi, ' ');

    // 8. Clean up remaining candidate name
    const candidateName = cleanLine
      .replace(/[-–—,:;()]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(?:apply|take|give|inject|administer|after\s+food|before\s+food|oral|topical)\b/gi, '')
      .trim();

    if (candidateName && candidateName.length >= 2) {
      candidates.push({
        rawLine: line,
        candidateName,
        strength,
        dosage,
        route,
        frequency,
        duration
      });
    }
  }

  return candidates;
};

/**
 * Computes Levenshtein edit distance between two strings.
 */
export const levenshteinDistance = (str1 = '', str2 = '') => {
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

/**
 * Computes normalized similarity ratio (0.0 to 1.0) between two strings.
 */
export const calculateSimilarity = (str1 = '', str2 = '') => {
  const a = str1.trim();
  const b = str2.trim();
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
};

/**
 * Normalizes medicine string for robust comparison by stripping punctuation,
 * dosage forms, and extra whitespace.
 */
export const normalizeMedicineName = (name = '') => {
  return name
    .toLowerCase()
    .replace(/(\d+(?:\.\d+)?\s*(?:mg|mcg|gm?|ml|iu|%|w\/v|w\/w))/gi, '')
    .replace(/\b(tablet|tab|tabs|tablets|capsule|cap|caps|capsules|syrup|injection|inj|cream|ointment|drops|powder|bolus|boluses|vial|vials)\b/gi, '')
    .replace(/[^a-z0-9\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Matches extracted prescription candidates to MongoDB inventory records.
 * Distinguishes Exact, Possible (Fuzzy / OCR tolerance), and Unmatched.
 */
export const matchCandidatesToInventory = (candidates = [], dbMedicines = []) => {
  const detectedMedicines = [];
  const matchingMedicines = [];
  const unmatchedMedicines = [];

  for (const candidate of candidates) {
    const rawCand = candidate.candidateName;
    const normCand = normalizeMedicineName(rawCand);
    const candTokens = normCand.split(/\s+/).filter(t => t.length > 2);

    let bestMatch = null;
    let highestScore = 0;
    let matchType = 'unmatched';
    let matchNote = '';

    for (const med of dbMedicines) {
      const medName = med.name || '';
      const medGeneric = med.genericName || '';
      const normMedName = normalizeMedicineName(medName);
      const normMedGeneric = normalizeMedicineName(medGeneric);
      const medTokens = normMedName.split(/\s+/).filter(t => t.length > 2);

      // 1. Exact match against Name or Generic Name
      if (
        rawCand.toLowerCase() === medName.toLowerCase() ||
        normCand === normMedName ||
        (normMedGeneric && normCand === normMedGeneric)
      ) {
        bestMatch = med;
        highestScore = 1.0;
        matchType = 'exact';
        matchNote = 'Exact match found in store catalog';
        break;
      }

      // 2. High-confidence Substring match
      if (
        (normMedName.length > 4 && normCand.includes(normMedName)) ||
        (normCand.length > 4 && normMedName.includes(normCand)) ||
        (normMedGeneric.length > 4 && normCand.includes(normMedGeneric))
      ) {
        if (highestScore < 0.92) {
          bestMatch = med;
          highestScore = 0.92;
          matchType = 'possible';
          matchNote = `Matched with stored catalog item: ${med.name}`;
        }
      }

      // 3. Significant Token Overlap with Fuzzy Per-Token Matching (for OCR typos)
      if (candTokens.length > 0 && medTokens.length > 0) {
        let matchedCount = 0;
        for (const ct of candTokens) {
          const hasMatch = medTokens.some(mt => {
            if (mt.includes(ct) || ct.includes(mt)) return true;
            // Token-level fuzzy tolerance (e.g. melox1cam vs meloxicam)
            if (ct.length >= 4 && mt.length >= 4 && calculateSimilarity(ct, mt) >= 0.8) return true;
            return false;
          });
          if (hasMatch) matchedCount++;
        }

        const tokenScore = matchedCount / Math.max(candTokens.length, medTokens.length);
        if (tokenScore >= 0.5 && tokenScore > highestScore) {
          bestMatch = med;
          highestScore = tokenScore;
          matchType = 'possible';
          matchNote = `Multi-token catalog match: ${med.name}`;
        }
      }

      // 4. Overall Fuzzy Levenshtein Distance for OCR Typos (e.g. Ointrnent -> Ointment)
      const simName = calculateSimilarity(rawCand, medName);
      const simNorm = calculateSimilarity(normCand, normMedName);
      const maxFuzzy = Math.max(simName, simNorm);

      if (maxFuzzy >= 0.78 && maxFuzzy > highestScore) {
        bestMatch = med;
        highestScore = maxFuzzy;
        matchType = 'possible';
        matchNote = `Fuzzy match (${Math.round(maxFuzzy * 100)}% similarity to ${med.name})`;
      }
    }

    if (bestMatch && highestScore >= 0.50) {
      const isAvailable =
        bestMatch.isActive !== false &&
        bestMatch.stockQuantity > 0 &&
        bestMatch.availability !== 'unavailable';

      const detectedItem = {
        candidateName: candidate.candidateName,
        rawLine: candidate.rawLine,
        strength: candidate.strength || '',
        dosage: candidate.dosage || '',
        route: candidate.route || '',
        frequency: candidate.frequency || '',
        duration: candidate.duration || '',
        matchStatus: matchType,
        confidence: Math.round(highestScore * 100),
        matchNote,
        matchedMedicine: {
          _id: bestMatch._id,
          name: bestMatch.name,
          genericName: bestMatch.genericName || '',
          category: bestMatch.category,
          price: bestMatch.price,
          unit: bestMatch.unit,
          stockQuantity: bestMatch.stockQuantity,
          availability: bestMatch.availability,
          isAvailable,
          medicalProvider: bestMatch.medicalProvider
        }
      };

      detectedMedicines.push(detectedItem);

      if (isAvailable && !matchingMedicines.some(m => m._id.toString() === bestMatch._id.toString())) {
        matchingMedicines.push(bestMatch);
      }
    } else {
      const unmatchedItem = {
        candidateName: candidate.candidateName,
        rawLine: candidate.rawLine,
        strength: candidate.strength || '',
        dosage: candidate.dosage || '',
        route: candidate.route || '',
        frequency: candidate.frequency || '',
        duration: candidate.duration || '',
        matchStatus: 'unmatched',
        confidence: 0,
        matchNote: 'Medicine not found in inventory',
        matchedMedicine: null
      };

      detectedMedicines.push(unmatchedItem);
      unmatchedMedicines.push(unmatchedItem);
    }
  }

  return {
    detectedMedicines,
    matchingMedicines,
    unmatchedMedicines
  };
};
