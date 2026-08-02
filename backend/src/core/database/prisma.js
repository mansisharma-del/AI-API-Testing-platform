import { PrismaClient } from '@prisma/client';
// import config from '../../core/config/index.js';

const prisma = new PrismaClient();

export { prisma };