import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { hash } from 'argon2';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Clean database
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.account.deleteMany();
    await prisma.userSpace.deleteMany();
    await prisma.space.deleteMany();
    await prisma.providerConnection.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: await hash('password123'),
        name: 'Test User',
      },
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/auth', () => {
    it('/auth/register (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          locale: 'en',
          timezone: 'UTC',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('/auth/login (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('/auth/me (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('/spaces', () => {
    let spaceId: string;

    it('/spaces (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Space',
          type: 'personal',
          currency: 'USD',
          timezone: 'UTC',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Space');
      spaceId = response.body.id;
    });

    it('/spaces (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/spaces')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('/spaces/:id (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/spaces/${spaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(spaceId);
      expect(response.body.name).toBe('Test Space');
    });
  });
});