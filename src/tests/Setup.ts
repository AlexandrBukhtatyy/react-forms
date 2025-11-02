import { cleanup } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/node.js'
import '@testing-library/jest-dom';

 
beforeAll(() => {
    server.listen()
});

afterAll(() => {
    server.close()
});

afterEach(() => {
    cleanup();
    server.resetHandlers();
})