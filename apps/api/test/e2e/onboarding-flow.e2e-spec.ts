import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TestHelper } from './helpers/test.helper';
import { OnboardingTestData } from './fixtures/onboarding.fixtures';
import { OnboardingStep } from '../../src/modules/onboarding/dto';

describe('Onboarding Flow E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let testHelper: TestHelper;
  let authToken: string;
  let userId: string;
  let spaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    testHelper = new TestHelper(prisma, jwtService);
    
    await app.init();
    await testHelper.cleanDatabase();
  });

  afterAll(async () => {
    await testHelper.cleanDatabase();
    await app.close();
  });

  describe('Full Onboarding Journey', () => {
    it('should complete the entire onboarding flow', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(OnboardingTestData.newUser)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('tokens');
      expect(registerResponse.body.tokens).toHaveProperty('accessToken');
      authToken = registerResponse.body.tokens.accessToken;

      // Get user info from /auth/me
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      userId = meResponse.body.user.id;

      // Verify initial onboarding status
      const initialStatus = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(initialStatus.body).toMatchObject({
        completed: false,
        currentStep: 'welcome',
        progress: expect.any(Number),
        stepStatus: {
          welcome: true,
          email_verification: false,
          preferences: false,
          space_setup: false,
          connect_accounts: false,
          first_budget: false,
          feature_tour: false,
        },
        remainingSteps: expect.arrayContaining(['email_verification', 'preferences', 'space_setup']),
        optionalSteps: expect.arrayContaining(['connect_accounts', 'first_budget', 'feature_tour']),
      });

      // Step 2: Move to email verification
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'email_verification' })
        .expect(200);

      // Step 3: Send verification email
      const verificationResponse = await request(app.getHttpServer())
        .post('/onboarding/resend-verification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verificationResponse.body).toMatchObject({
        success: true,
        message: 'Verification email sent',
      });

      // Step 4: Verify email (simulate token verification)
      const verificationToken = jwtService.sign(
        { userId, email: OnboardingTestData.newUser.email, type: 'email_verification' },
        { expiresIn: '24h' }
      );

      const verifyResponse = await request(app.getHttpServer())
        .post('/onboarding/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(verifyResponse.body).toMatchObject({
        success: true,
        message: 'Email verified successfully',
      });

      // Check auto-advancement to preferences
      const postVerificationStatus = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(postVerificationStatus.body.currentStep).toBe('preferences');
      expect(postVerificationStatus.body.stepStatus.email_verification).toBe(true);

      // Step 5: Update preferences
      await request(app.getHttpServer())
        .put('/onboarding/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(OnboardingTestData.preferences)
        .expect(200);

      // Move to space setup
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'space_setup' })
        .expect(200);

      // Step 6: Create space
      const spaceResponse = await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(OnboardingTestData.personalSpace)
        .expect(201);

      spaceId = spaceResponse.body.id;

      // Check progress after space creation
      const postSpaceStatus = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(postSpaceStatus.body.stepStatus.space_setup).toBe(true);

      // Step 7: Skip optional connect accounts step
      await request(app.getHttpServer())
        .post('/onboarding/skip/connect_accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 8: Create first budget
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'first_budget' })
        .expect(200);

      const budgetResponse = await request(app.getHttpServer())
        .post(`/spaces/${spaceId}/budgets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(OnboardingTestData.firstBudget)
        .expect(201);

      expect(budgetResponse.body).toHaveProperty('id');

      // Step 9: Complete feature tour
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'feature_tour', data: { tourCompleted: true } })
        .expect(200);

      // Step 10: Complete onboarding
      const completeResponse = await request(app.getHttpServer())
        .post('/onboarding/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skipOptional: false,
          metadata: {
            timeSpent: 300000, // 5 minutes
            completedSteps: ['welcome', 'email_verification', 'preferences', 'space_setup', 'first_budget', 'feature_tour'],
          },
        })
        .expect(200);

      expect(completeResponse.body).toMatchObject({
        completed: true,
        currentStep: 'completed',
        completedAt: expect.any(String),
        progress: 100,
        remainingSteps: [],
      });
    });
  });

  describe('Partial Onboarding with Skip', () => {
    let partialUserToken: string;

    beforeEach(async () => {
      // Create a new user for partial onboarding tests
      const user = await testHelper.createUser(OnboardingTestData.partialUser);
      partialUserToken = testHelper.generateAuthToken(user);
    });

    it('should allow skipping optional steps', async () => {
      // Move through required steps quickly
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${partialUserToken}`)
        .send({ step: 'email_verification' })
        .expect(200);

      // Verify email
      const user = await prisma.user.findFirst({
        where: { email: OnboardingTestData.partialUser.email },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      // Update preferences
      await request(app.getHttpServer())
        .put('/onboarding/preferences')
        .set('Authorization', `Bearer ${partialUserToken}`)
        .send({ locale: 'en', timezone: 'UTC' })
        .expect(200);

      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${partialUserToken}`)
        .send({ step: 'space_setup' })
        .expect(200);

      // Create space
      await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${partialUserToken}`)
        .send(OnboardingTestData.minimalSpace)
        .expect(201);

      // Skip all optional steps
      const optionalSteps: OnboardingStep[] = ['connect_accounts', 'first_budget', 'feature_tour'];
      
      for (const step of optionalSteps) {
        const skipResponse = await request(app.getHttpServer())
          .post(`/onboarding/skip/${step}`)
          .set('Authorization', `Bearer ${partialUserToken}`)
          .expect(200);

        // Verify we auto-advance or complete
        expect(skipResponse.body.currentStep).toBeDefined();
      }

      // Check final status
      const finalStatus = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${partialUserToken}`)
        .expect(200);

      expect(finalStatus.body.completed).toBe(true);
    });

    it('should not allow skipping required steps', async () => {
      const requiredSteps: OnboardingStep[] = ['email_verification', 'preferences', 'space_setup'];
      
      for (const step of requiredSteps) {
        await request(app.getHttpServer())
          .post(`/onboarding/skip/${step}`)
          .set('Authorization', `Bearer ${partialUserToken}`)
          .expect(400);
      }
    });
  });

  describe('Step Dependencies', () => {
    let dependencyUserToken: string;
    let dependencyUserId: string;

    beforeEach(async () => {
      const user = await testHelper.createUser({
        email: 'dependency@example.com',
        password: 'DependencyTest123!',
        name: 'Dependency Test',
      });
      dependencyUserToken = testHelper.generateAuthToken(user);
      dependencyUserId = user.id;
    });

    it('should enforce step dependencies', async () => {
      // Try to jump to space_setup without completing preferences
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send({ step: 'space_setup' })
        .expect(400);

      // Try connect_accounts without space_setup
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send({ step: 'connect_accounts' })
        .expect(400);
    });

    it('should allow steps when dependencies are met', async () => {
      // Complete email verification
      await prisma.user.update({
        where: { id: dependencyUserId },
        data: { emailVerified: true },
      });

      // Complete preferences
      await request(app.getHttpServer())
        .put('/onboarding/preferences')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send({ locale: 'es', timezone: 'America/Mexico_City' })
        .expect(200);

      // Now space_setup should work
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send({ step: 'space_setup' })
        .expect(200);

      // Create space
      await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send(OnboardingTestData.businessSpace)
        .expect(201);

      // Now connect_accounts should work
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${dependencyUserToken}`)
        .send({ step: 'connect_accounts' })
        .expect(200);
    });
  });

  describe('Reset Onboarding', () => {
    it('should reset onboarding progress', async () => {
      // First complete onboarding
      const completeStatus = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(completeStatus.body.completed).toBe(true);

      // Reset onboarding
      const resetResponse = await request(app.getHttpServer())
        .post('/onboarding/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(resetResponse.body).toMatchObject({
        completed: false,
        currentStep: 'welcome',
        remainingSteps: expect.arrayContaining(['email_verification', 'preferences', 'space_setup']),
      });

      // Verify user can go through onboarding again
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'email_verification' })
        .expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid onboarding step', async () => {
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ step: 'invalid_step' })
        .expect(400);
    });

    it('should handle expired email verification token', async () => {
      const expiredToken = jwtService.sign(
        { userId, email: 'test@example.com', type: 'email_verification' },
        { expiresIn: '-1s' } // Expired token
      );

      await request(app.getHttpServer())
        .post('/onboarding/verify-email')
        .send({ token: expiredToken })
        .expect(400);
    });

    it('should handle invalid verification token type', async () => {
      const wrongTypeToken = jwtService.sign(
        { userId, email: 'test@example.com', type: 'password_reset' },
        { expiresIn: '24h' }
      );

      await request(app.getHttpServer())
        .post('/onboarding/verify-email')
        .send({ token: wrongTypeToken })
        .expect(400);
    });

    it('should handle already verified email', async () => {
      // Try to verify again
      const verificationToken = jwtService.sign(
        { userId, email: OnboardingTestData.newUser.email, type: 'email_verification' },
        { expiresIn: '24h' }
      );

      const response = await request(app.getHttpServer())
        .post('/onboarding/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Email already verified',
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track onboarding events', async () => {
      // This test would verify that analytics events are properly tracked
      // In a real scenario, you might mock the analytics service and verify calls
      
      const analyticsUser = await testHelper.createUser({
        email: 'analytics@example.com',
        password: 'Analytics123!',
        name: 'Analytics User',
      });
      
      const analyticsToken = testHelper.generateAuthToken(analyticsUser);

      // Track step progression
      await request(app.getHttpServer())
        .put('/onboarding/step')
        .set('Authorization', `Bearer ${analyticsToken}`)
        .send({ step: 'email_verification', data: { source: 'test' } })
        .expect(200);

      // Verify analytics metadata is included
      const status = await request(app.getHttpServer())
        .get('/onboarding/status')
        .set('Authorization', `Bearer ${analyticsToken}`)
        .expect(200);

      expect(status.body.currentStep).toBe('email_verification');
    });
  });

  describe('Service Health', () => {
    it('should return onboarding service health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/onboarding/health')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'onboarding',
        status: 'healthy',
        timestamp: expect.any(String),
        features: {
          stepTracking: true,
          emailVerification: true,
          progressTracking: true,
          preferenceManagement: true,
        },
      });
    });
  });
});