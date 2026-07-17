const L = require('lucide-react');
const names = [
  'ArrowLeft',
  'ShieldAlert',
  'Shield',
  'ShieldCheck',
  'Share2',
  'UserCheck',
  'PhoneCall',
  'MapPin',
  'Video',
  'AlertTriangle',
  'CheckCircle2',
];
let missing = 0;
for (const n of names) {
  if (typeof L[n] === 'undefined') {
    console.log('MISSING:', n);
    missing++;
  } else {
    console.log('ok:', n);
  }
}
console.log(missing === 0 ? 'ALL ICONS PRESENT' : `MISSING ${missing}`);
process.exit(missing === 0 ? 0 : 1);
