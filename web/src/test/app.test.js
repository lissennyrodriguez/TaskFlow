import { describe, it, expect } from 'vitest'

describe('Pruebas de TaskFlow', () => {
  it('debe comprobar que TaskFlow está funcionando', () => {
    expect(1 + 1).toBe(2)
  })

  it('debe comprobar que el nombre del proyecto es correcto', () => {
    const projectName = 'TaskFlow'

    expect(projectName).toBe('TaskFlow')
  })
})