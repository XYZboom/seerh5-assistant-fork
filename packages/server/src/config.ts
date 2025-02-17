import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(base, '../.env');

const schema = {
    type: 'object',
    required: ['PORT', 'APP_ROOT'],
    properties: {
        PORT: {
            type: 'string',
            default: 2147,
        },
        APP_ROOT: {
            type: 'string',
            default: path.resolve(base, '../'),
        }
    },
};

const envOptions = {
    schema,
    dotenv: {
        path: envPath,
    },
};

export { envOptions };

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: number;
            APP_ROOT: string;
        };
    }
}
