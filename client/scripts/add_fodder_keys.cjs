const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en', 'farmer.json');
const mrPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'mr', 'farmer.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const enFodder = {
  myPublishedListings: 'My Published Fodder Listings',
  myListingsSubtitle: 'Manage your listed fodder inventory, mark items as sold, edit, or deactivate listings.',
  emptyMyListingsTitle: "You Haven't Published Any Fodder Listings Yet",
  emptyMyListingsDesc: "Click 'Add New Listing' to list green/dry fodder, hay, or silage for neighboring farmers to purchase.",
  markSold: 'Mark Sold',
  reactivate: 'Re-activate',
  editListing: 'Edit Fodder Listing',
  postNewListing: 'Post New Fodder Listing',
  updateListing: 'Update Listing',
  publishListing: 'Publish Listing',
  noImageAttached: 'No Image Attached',
  pickupLocation: 'Pickup Location:',
  locationInfo: 'Location Information',
  seller: 'Seller:'
};

const mrFodder = {
  myPublishedListings: 'माझ्या चाऱ्याच्या नोंदी',
  myListingsSubtitle: 'तुमच्या चाऱ्याच्या नोंदी व्यवस्थापित करा, विकले म्हणून चिन्हांकित करा किंवा संपादित करा.',
  emptyMyListingsTitle: 'तुम्ही अद्याप चाऱ्याची कोणतीही नोंद केलेली नाही',
  emptyMyListingsDesc: "इतर शेतकऱ्यांसाठी हिरवा/सुका चारा किंवा मुरघास विक्रीसाठी 'नवीन नोंद जोडा' वर क्लिक करा.",
  markSold: 'विकले म्हणून नोंदवा',
  reactivate: 'पुन्हा सुरू करा',
  editListing: 'चाऱ्याची नोंद संपादित करा',
  postNewListing: 'नवीन चाऱ्याची नोंद करा',
  updateListing: 'नोंद अद्यतनित करा',
  publishListing: 'नोंद प्रसिद्ध करा',
  noImageAttached: 'कोणतीही प्रतिमा जोडलेली नाही',
  pickupLocation: 'चारा घेण्याचे ठिकाण:',
  locationInfo: 'स्थानाची माहिती',
  seller: 'विक्रेता:'
};

Object.assign(en.fodder, enFodder);
Object.assign(mr.fodder, mrFodder);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n', 'utf8');
console.log('Successfully added extra fodder keys in farmer locales.');
