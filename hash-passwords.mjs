import bcrypt from 'bcryptjs';

async function hashPasswords() {
  const password1 = 'Q7!mV#2xLp$9Rw@Nc8^Jt4&Hz1*Bk5';
  const password2 = 'f8@Qm7#Vz2!Lp$Xr9^Nc4&Hy1*BwK6Ja';
  
  const hash1 = await bcrypt.hash(password1, 10);
  const hash2 = await bcrypt.hash(password2, 10);
  
  console.log('Hash 1 (rtbi2179@gmail.com):', hash1);
  console.log('Hash 2 (sahan.mallampati@gmail.com):', hash2);
}

hashPasswords().catch(console.error);
