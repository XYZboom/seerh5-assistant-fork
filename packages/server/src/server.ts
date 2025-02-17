import fs from 'node:fs';
import path from 'node:path';

import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import ws from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';

import { envOptions } from './config.ts';

// middlewares for seerh5 client
import { createAppJsProxy } from './middlewares/appJsProxy.ts';
import { createAssetsProxy } from './middlewares/assetsProxy.ts';
import { loginProxy } from './middlewares/loginProxy.ts';

import { buildSEALContext } from './context.ts';
import { PetCache } from './data/PetCacheManager.ts';
import { fastifyLogRotate } from './logger/index.ts';
import { apiRouter } from './router/index.ts';

export async function createServer() {
    const server = fastify({
        logger: {
            level: 'trace',
            transport: {
                target: '@fastify/one-line-logger',
            },
        },
    });

    await server.register(fastifyEnv, envOptions);

    const root = server.config.APP_ROOT;
    const folders = ['mods', 'dist', 'config', 'logs'];
    folders.forEach((folder) => {
        if (!fs.statSync(path.resolve(root, folder)).isDirectory) {
            fs.mkdirSync(path.resolve(root, folder));
        }
    });

    await server.register(fastifyLogRotate);
    await server.register(fastifyMiddie);
    await server.register(cors, {
        origin: (origin, cb) => {
            if (!origin) {
                cb(null, true);
                return;
            }
            const hostname = new URL(origin).hostname;
            if (hostname === 'localhost' || hostname.startsWith('192.168.') || hostname === '127.0.0.1') {
                cb(null, true);
                return;
            }
            // Generate an error on other origins, disabling access
            cb(new Error('Not allowed'), false);
        },
    });

    void server.use('/seerh5.61.com/', createAssetsProxy(server.config.APP_ROOT));
    void server.use('/account-co.61.com/', loginProxy);
    void server.register(createAppJsProxy);

    PetCache.load(server.config.APP_ROOT);

    void server.register(fastifyStatic, {
        root: path.resolve(server.config.APP_ROOT, 'mods'),
        prefix: '/mods',
        extensions: ['js', 'json'],
        index: false,
        list: true,
    });

    void server.register(fastifyStatic, {
        root: path.resolve(server.config.APP_ROOT, 'dist'),
        prefix: '/',
        index: 'index.html',
        decorateReply: false,
    });

    void server.register(ws);
    void server.register(fastifyTRPCPlugin, {
        prefix: '/api',
        useWSS: true,
        trpcOptions: { router: apiRouter, createContext: buildSEALContext({ appRoot: server.config.APP_ROOT }) },
    });

    const stop = async () => {
        await server.close();
    };

    const start = async () => {
        const port = server.config.PORT;
        try {
            await server.listen({ port });
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };

    return { server, start, stop };
}
