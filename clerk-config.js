// clerk-config.js - Clerk 인증 시스템 설정
export const clerkConfig = {
  // Clerk 대시보드에서 가져온 값들
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  
  // 인증 설정
  signInUrl: '/signin',
  signUpUrl: '/signup',
  afterSignInUrl: '/',
  afterSignUpUrl: '/',
  
  // 사용자 프로필 설정
  userProfile: {
    firstName: true,
    lastName: true,
    email: true,
    profileImage: true
  },
  
  // 소셜 로그인 제공자
  socialProviders: [
    'google',
    'github',
    'discord'
  ],
  
  // 보안 설정
  security: {
    passwordMinLength: 8,
    requireMFA: false,
    sessionTimeout: 24 * 60 * 60 // 24시간
  }
};

// 환경변수 검증
export function validateClerkConfig() {
  const required = ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Clerk environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}
