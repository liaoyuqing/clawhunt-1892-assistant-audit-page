import { setupWorker } from 'msw/browser';
import { handlers } from '@/mocks/handlers';
import { applyUrlOverrides } from '@/mocks/state';

applyUrlOverrides(window.location.search);

export const worker = setupWorker(...handlers);
