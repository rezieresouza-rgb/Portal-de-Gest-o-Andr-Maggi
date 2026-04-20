const fs = require('fs');

// Fix 1: Add default value to referrals in BuscaAtivaStudentProfile
const profilePath = 'c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/components/BuscaAtivaStudentProfile.tsx';
let profileContent = fs.readFileSync(profilePath, 'utf8');
profileContent = profileContent.replace(
  /const BuscaAtivaStudentProfile: React\.FC<BuscaAtivaStudentProfileProps> = \({ student, referrals, onClose }\) =>/g,
  'const BuscaAtivaStudentProfile: React.FC<BuscaAtivaStudentProfileProps> = ({ student, referrals = [], onClose }) =>'
);
fs.writeFileSync(profilePath, profileContent);
console.log('Fixed BuscaAtivaStudentProfile default props.');

// Fix 2: Pass referrals in BuscaAtivaDashboard
const dashboardPath = 'c:/Users/rezie/Downloads/portal-de-gestão-andré-maggi/components/BuscaAtivaDashboard.tsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// We need the referrals state in Dashboard
// It already has a local referralsData during fetch, but we need to store it in state
// Wait! Let's check if Dashboard has a referrals state.
// From view_file: it has stats but no referrals state.
// I need to add [referrals, setReferrals] = useState([]) to Dashboard.
