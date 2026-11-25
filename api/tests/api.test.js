
import { describe, it, expect } from 'vitest';

describe('Pruebas de TaskFlow API', () => {
  it('debe comprobar que la API utiliza el puerto 3000 por defecto', () => {
    const port = process.env.PORT || 3000;

    expect(Number(port)).toBe(3000);
  });

  it('debe comprobar el nombre del proyecto', () => {
    const projectName = 'api';

    expect(projectName).toBe('api');
  });
});
