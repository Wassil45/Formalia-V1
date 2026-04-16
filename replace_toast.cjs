const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/client/ClientDocuments.tsx',
  'src/pages/client/WizardPayment.tsx',
  'src/pages/client/DossierDetail.tsx',
  'src/pages/public/Auth.tsx',
  'src/pages/admin/AdminEmails.tsx',
  'src/pages/admin/AdminDossiers.tsx',
  'src/pages/admin/AdminSettings.tsx',
  'src/pages/admin/AdminUsers.tsx',
  'src/pages/admin/AdminFaq.tsx',
  'src/pages/admin/AdminProducts.tsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace import
  content = content.replace(/import\s+\{\s*useToast\s*\}\s+from\s+['"]\.\.\/\.\.\/components\/ui\/Toast['"];?/g, "import { toast } from 'sonner';");
  
  // Remove const { toast } = useToast();
  content = content.replace(/\s*const\s+\{\s*toast\s*\}\s*=\s*useToast\(\);?/g, '');
  
  // Replace toast calls
  // toast('error', 'Titre', 'Message') -> toast.error('Titre: Message')
  content = content.replace(/toast\(\s*['"](success|error|info)['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, (match, type, title, message) => {
    // Clean up title and message if they are strings
    let cleanTitle = title.trim();
    let cleanMessage = message.trim();
    
    if (cleanTitle.startsWith("'") && cleanTitle.endsWith("'")) {
      cleanTitle = cleanTitle.slice(1, -1);
    } else if (cleanTitle.startsWith('"') && cleanTitle.endsWith('"')) {
      cleanTitle = cleanTitle.slice(1, -1);
    } else {
      cleanTitle = `\${${cleanTitle}}`;
    }
    
    if (cleanMessage.startsWith("'") && cleanMessage.endsWith("'")) {
      cleanMessage = cleanMessage.slice(1, -1);
    } else if (cleanMessage.startsWith('"') && cleanMessage.endsWith('"')) {
      cleanMessage = cleanMessage.slice(1, -1);
    } else {
      cleanMessage = `\${${cleanMessage}}`;
    }
    
    return `toast.${type}(\`${cleanTitle}: ${cleanMessage}\`)`;
  });
  
  // Replace toast calls with only 2 arguments (if any)
  content = content.replace(/toast\(\s*['"](success|error|info)['"]\s*,\s*([^)]+)\s*\)/g, (match, type, message) => {
    let cleanMessage = message.trim();
    if (cleanMessage.startsWith("'") && cleanMessage.endsWith("'")) {
      cleanMessage = cleanMessage.slice(1, -1);
    } else if (cleanMessage.startsWith('"') && cleanMessage.endsWith('"')) {
      cleanMessage = cleanMessage.slice(1, -1);
    } else {
      cleanMessage = `\${${cleanMessage}}`;
    }
    return `toast.${type}(\`${cleanMessage}\`)`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done replacing toast');
