import pdf from 'pdf-parse';
console.log('Type:', typeof pdf);
try {
    console.log('Props:', Object.keys(pdf));
} catch (e) {
    console.log('Error listing keys:', e.message);
}
