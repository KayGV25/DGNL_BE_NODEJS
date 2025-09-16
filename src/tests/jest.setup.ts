// Silence noisy logs during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Prevent Jest from exiting when sql.ts calls process.exit
jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  throw new Error(`process.exit called with code ${code}`);
}) as never);
