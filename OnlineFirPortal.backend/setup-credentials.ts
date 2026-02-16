import { prisma } from './src/lib/prisma';
import { hashPassword } from './src/lib/security';
import { randomBytes } from 'crypto';

function generateSecurePassword(length = 12): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

async function createCredentials() {
  console.log('🚀 Creating police and station master credentials...\n');
  
  const credentials: any[] = [];
  
  try {
    // 1. Create Super Admin
    const superAdminPassword = generateSecurePassword();
    const { hash: adminHash, salt: adminSalt } = await hashPassword(superAdminPassword);
    
    const superAdmin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@firportal.gov.in',
        mobile: '9876543210',
        role: 'SUPER_ADMIN',
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        accountStatus: 'ACTIVE'
      }
    });
    
    credentials.push({
      role: 'SUPER_ADMIN',
      name: 'System Administrator',
      email: 'admin@firportal.gov.in',
      mobile: '9876543210',
      password: superAdminPassword,
      policeStation: 'System Administration'
    });
    
    // 2. Create Admins
    const admins = [
      { name: 'Regional Admin', email: 'regional.admin@firportal.gov.in', mobile: '9876543211' },
      { name: 'District Admin', email: 'district.admin@firportal.gov.in', mobile: '9876543212' }
    ];
    
    for (const admin of admins) {
      const password = generateSecurePassword();
      const { hash, salt } = await hashPassword(password);
      
      await prisma.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: 'ADMIN',
          passwordHash: hash,
          passwordSalt: salt,
          accountStatus: 'ACTIVE'
        }
      });
      
      credentials.push({
        role: 'ADMIN',
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        password: password,
        policeStation: 'Administrative Office'
      });
    }
    
    // 3. Create Station House Officers (SHOs)
    const stations = [
      'Central Police Station',
      'North Police Station', 
      'South Police Station',
      'East Police Station',
      'West Police Station'
    ];
    
    for (let i = 0; i < stations.length; i++) {
      const password = generateSecurePassword();
      const { hash, salt } = await hashPassword(password);
      
      const sho = await prisma.user.create({
        data: {
          name: `SHO ${stations[i]}`,
          email: `sho${i+1}@firportal.gov.in`,
          mobile: `9876543${String(200 + i).padStart(3, '0')}`,
          role: 'SHO',
          policeStation: stations[i] || null,
          badgeNumber: `SHO${String(100 + i).padStart(3, '0')}`,
          passwordHash: hash,
          passwordSalt: salt,
          accountStatus: 'ACTIVE'
        }
      });
      
      credentials.push({
        role: 'SHO',
        name: `SHO ${stations[i]}`,
        email: `sho${i+1}@firportal.gov.in`,
        mobile: `9876543${String(200 + i).padStart(3, '0')}`,
        password: password,
        policeStation: stations[i],
        badgeNumber: `SHO${String(100 + i).padStart(3, '0')}`
      });
    }
    
    // 4. Create Police Officers
    const officers = [
      { name: 'Raj Kumar', station: 'Central Police Station', badge: 'OFF001' },
      { name: 'Priya Sharma', station: 'Central Police Station', badge: 'OFF002' },
      { name: 'Amit Singh', station: 'North Police Station', badge: 'OFF003' },
      { name: 'Sunita Devi', station: 'North Police Station', badge: 'OFF004' },
      { name: 'Vijay Kumar', station: 'South Police Station', badge: 'OFF005' },
      { name: 'Anjali Gupta', station: 'South Police Station', badge: 'OFF006' },
      { name: 'Rahul Verma', station: 'East Police Station', badge: 'OFF007' },
      { name: 'Meena Patel', station: 'East Police Station', badge: 'OFF008' },
      { name: 'Sanjay Kumar', station: 'West Police Station', badge: 'OFF009' },
      { name: 'Kavita Singh', station: 'West Police Station', badge: 'OFF010' }
    ];
    
    for (let i = 0; i < officers.length; i++) {
      const officer = officers[i];
      if (!officer) continue;
      
      const password = generateSecurePassword();
      const { hash, salt } = await hashPassword(password);
      
      await prisma.user.create({
        data: {
          name: officer.name,
          email: `${officer.name.toLowerCase().replace(' ', '.')}@firportal.gov.in`,
          mobile: `9876543${String(300 + i).padStart(3, '0')}`,
          role: 'OFFICER',
          policeStation: officer.station || null,
          badgeNumber: officer.badge,
          rank: 'Senior Police Officer',
          passwordHash: hash,
          passwordSalt: salt,
          accountStatus: 'ACTIVE'
        }
      });
      
      credentials.push({
        role: 'OFFICER',
        name: officer.name,
        email: `${officer.name.toLowerCase().replace(' ', '.')}@firportal.gov.in`,
        mobile: `9876543${String(300 + i).padStart(3, '0')}`,
        password: password,
        policeStation: officer.station,
        badgeNumber: officer.badge,
        rank: 'Senior Police Officer'
      });
    }
    
    console.log('✅ Credentials created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS SUMMARY:\n');
    console.log('='.repeat(80));
    
    credentials.forEach((cred, index) => {
      console.log(`${index + 1}. ${cred.role} - ${cred.name}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Mobile: ${cred.mobile}`);
      console.log(`   Password: ${cred.password}`);
      if (cred.policeStation) console.log(`   Station: ${cred.policeStation}`);
      if (cred.badgeNumber) console.log(`   Badge: ${cred.badgeNumber}`);
      if (cred.rank) console.log(`   Rank: ${cred.rank}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log(`📊 Total Accounts Created: ${credentials.length}`);
    console.log('🔐 Save these credentials securely!');
    console.log('🌐 Login at: http://localhost:4000/auth');
    
  } catch (error) {
    console.error('❌ Error creating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCredentials().catch(console.error);
