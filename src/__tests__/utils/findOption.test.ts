import { Option } from '../../models/Option'
import { findOption } from '../../utils/findOption'

const verbose = new Option({ short: 'v', long: 'verbose' })
const output = new Option({ short: 'o', long: 'output' })
const options = [verbose, output]

describe('findOption', () => {
  it('finds an option by short flag', () => {
    expect(findOption('v', options)).toBe(verbose)
  })

  it('finds an option by long flag', () => {
    expect(findOption('verbose', options)).toBe(verbose)
  })

  it('finds the second option by short flag', () => {
    expect(findOption('o', options)).toBe(output)
  })

  it('finds the second option by long flag', () => {
    expect(findOption('output', options)).toBe(output)
  })

  it('returns undefined for an unknown flag', () => {
    expect(findOption('x', options)).toBeUndefined()
  })

  it('returns undefined from an empty options array', () => {
    expect(findOption('v', [])).toBeUndefined()
  })
})
