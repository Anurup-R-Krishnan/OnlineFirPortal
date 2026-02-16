import { prisma } from './src/lib/prisma';
import { hashPassword } from './src/lib/security';
import { randomBytes } from 'crypto';

function generateSecurePassword(length = 12): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

function generateUniqueMobile(base: string, suffix: string): string {
  return `9${base}${suffix}`;
}

async function createCredentials() {
  console.log('🚀 Creating police and station master credentials...\n');
  
  const credentials: any[] = [];
  
  try {
    // Check existing users
    const existingUsers = await prisma.user.findMany({
      select: { email: true, mobile: true, role: true }
    });
    
    console.log(`📊 Found ${existingUsers.length} existing users in database\n`);
    
    // 1. Create Super Admin if not exists
    const existingSuperAdmin = existingUsers.find(u => u.role === 'SUPER_ADMIN');
    if (!existingSuperAdmin) {
      const superAdminPassword = generateSecurePassword();
      const { hash: adminHash, salt: adminSalt } = await hashPassword(superAdminPassword);
      
      const superAdmin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'superadmin@firportal.gov.in',
          mobile: generateUniqueMobile('98765', '43210'),
          role: 'SUPER_ADMIN',
          passwordHash: adminHash,
          passwordSalt: adminSalt,
          accountStatus: 'ACTIVE'
        }
      });
      
      credentials.push({
        role: 'SUPER_ADMIN',
        name: 'System Administrator',
        email: 'superadmin@firportal.gov.in',
        mobile: generateUniqueMobile('98765', '43210'),
        password: superAdminPassword,
        policeStation: 'System Administration'
      });
      
      console.log('✅ Created Super Admin account');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }
    
    // 2. Create Admins
    const adminData = [
      { name: 'Regional Admin', email: 'regional.admin@firportal.gov.in', mobile: generateUniqueMobile('98765', '43211') },
      { name: 'District Admin', email: 'district.admin@firportal.gov.in', mobile: generateUniqueMobile('98765', '43212') }
    ];
    
    for (const admin of adminData) {
      const exists = existingUsers.find(u => u.email === admin.email || u.mobile === admin.mobile);
      if (!exists) {
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
        
        console.log(`✅ Created Admin: ${admin.name}`);
      } else {
        console.log(`ℹ️  Admin ${admin.name} already exists`);
      }
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
      const email = `sho${i+1}@firportal.gov.in`;
      const mobile = generateUniqueMobile('98765', `432${String(13 + i).padStart(2, '0')}`);
      
      const exists = existingUsers.find(u => u.email === email || u.mobile === mobile);
      if (!exists) {
        const password = generateSecurePassword();
        const { hash, salt } = await hashPassword(password);
        
        await prisma.user.create({
          data: {
            name: `SHO ${stations[i]}`,
            email: email,
            mobile: mobile,
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
          email: email,
          mobile: mobile,
          password: password,
          policeStation: stations[i],
          badgeNumber: `SHO${String(100 + i).padStart(3, '0')}`
        });
        
        console.log(`✅ Created SHO: ${stations[i]}`);
      } else {
        console.log(`ℹ️  SHO ${stations[i]} already exists`);
      }
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
      
      const email = `${officer.name.toLowerCase().replace(' ', '.')}@firportal.gov.in`;
      const mobile = generateUniqueMobile('98765', `433${String(i).padStart(2, '0')}`);
      
      const exists = existingUsers.find(u => u.email === email || u.mobile === mobile);
      if (!exists) {
        const password = generateSecurePassword();
        const { hash, salt } = await hashPassword(password);
        
        await prisma.user.create({
          data: {
            name: officer.name,
            email: email,
            mobile: mobile,
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
          email: email,
          mobile: mobile,
          password: password,
          policeStation: officer.station,
          badgeNumber: officer.badge,
          rank: 'Senior Police Officer'
        });
        
        console.log(`✅ Created Officer: ${officer.name}`);
      } else {
        console.log(`ℹ️  Officer ${officer.name} already exists`);
      }
    }
    
    console.log('\n✅ Credential creation process completed!\n');
    
    if (credentials.length > 0) {
      console.log('📋 NEWLY CREATED LOGIN CREDENTIALS:\n');
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
      console.log(`📊 Total New Accounts Created: ${credentials.length}`);
      console.log('🔐 Save these credentials securely!');
      console.log('🌐 Login at: http://localhost:4000/auth');
    } else {
      console.log('ℹ️  All accounts already exist. No new accounts created.');
    }
    
  } catch (error) {
    console.error('❌ Error creating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCredentials().catch(console.error);
