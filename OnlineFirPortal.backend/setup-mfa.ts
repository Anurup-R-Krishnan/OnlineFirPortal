import { prisma } from './src/lib/prisma';
import { generateTOTPSecret, generateRecoveryCodes } from './src/lib/totp-service';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function setupMFAForAllUsers() {
  console.log('🔐 Setting up MFA for all users...\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      where: {
        mfaEnabled: false
      }
    });
    
    console.log(`📊 Found ${users.length} users without MFA\n`);
    
    const mfaCredentials: any[] = [];
    
    for (const user of users) {
      // Generate TOTP secret
      const totpSetup = await generateTOTPSecret(user.email);
      
      // Update user with MFA secret
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaSecret: totpSetup.secret,
          mfaEnabled: true,
          mfaSetupAt: new Date()
        }
      });
      
      // Generate backup codes
      const backupCodes = generateRecoveryCodes();
      
      // Store backup codes
      for (const code of backupCodes) {
        await prisma.mFARecoveryCode.create({
          data: {
            codeHash: hashRecoveryCode(code),
            userId: user.id
          }
        });
      }
      
      mfaCredentials.push({
        name: user.name,
        email: user.email,
        role: user.role,
        secret: totpSetup.secret,
        qrCode: totpSetup.qrCode,
        manualKey: totpSetup.manualEntryKey,
        backupCodes: backupCodes
      });
      
      console.log(`✅ MFA setup completed for: ${user.name} (${user.role})`);
    }
    
    console.log('\n🔐 MFA SETUP CREDENTIALS:\n');
    console.log('='.repeat(100));
    
    mfaCredentials.forEach((cred, index) => {
      console.log(`\n${index + 1}. ${cred.role} - ${cred.name}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   TOTP Secret: ${cred.secret}`);
      console.log(`   Manual Entry Key: ${cred.manualKey}`);
      console.log(`   Backup Codes: ${cred.backupCodes.join(', ')}`);
      console.log(`   QR Code Data URL: ${cred.qrCode.substring(0, 50)}...`);
      console.log('');
    });
    
    console.log('='.repeat(100));
    console.log('\n📱 HOW TO SETUP MFA:');
    console.log('1. Install Google Authenticator or Authy app');
    console.log('2. Scan QR code OR enter manual key');
    console.log('3. Save backup codes securely');
    console.log('4. Use 6-digit code from app for login');
    console.log('\n🌐 Login at: http://localhost:4000/auth');
    
  } catch (error) {
    console.error('❌ Error setting up MFA:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMFAForAllUsers().catch(console.error);
