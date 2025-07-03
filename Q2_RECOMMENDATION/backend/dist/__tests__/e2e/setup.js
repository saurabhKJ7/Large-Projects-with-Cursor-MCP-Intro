"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
const prisma = new client_1.PrismaClient();
beforeAll(async () => {
    await resetDatabase();
});
afterAll(async () => {
    await prisma.$disconnect();
});
async function resetDatabase() {
    try {
        (0, child_process_1.execSync)('npx prisma migrate reset --force', {
            stdio: 'inherit',
            env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: process.env.TEST_DATABASE_URL }),
        });
    }
    catch (error) {
        console.error('Error resetting database:', error);
        throw error;
    }
}
//# sourceMappingURL=setup.js.map