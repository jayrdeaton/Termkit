import { Option } from '../../models/Option'

describe('Option defaults', () => {
  it('has correct default values', () => {
    const o = new Option()
    expect(o.short).toBeNull()
    expect(o.long).toBeNull()
    expect(o.info).toBeNull()
    expect(o.variables).toBeNull()
  })
})

describe('Option constructor', () => {
  it('applies short and long flags', () => {
    const o = new Option({ short: 'v', long: 'verbose' })
    expect(o.short).toBe('v')
    expect(o.long).toBe('verbose')
  })

  it('applies info string', () => {
    const o = new Option({ info: 'Enable verbose output' })
    expect(o.info).toBe('Enable verbose output')
  })

  it('parses a required variable string', () => {
    const o = new Option({ variables: '<port:number>' })
    expect(o.variables).toHaveLength(1)
    expect(o.variables![0].name).toBe('port')
    expect(o.variables![0].type).toBe('number')
    expect(o.variables![0].required).toBe(true)
  })

  it('parses an optional variable string', () => {
    const o = new Option({ variables: '[level]' })
    expect(o.variables).toHaveLength(1)
    expect(o.variables![0].name).toBe('level')
    expect(o.variables![0].required).toBe(false)
  })

  it('parses multiple variables', () => {
    const o = new Option({ variables: '<from> <to>' })
    expect(o.variables).toHaveLength(2)
  })

  it('leaves variables null when not provided', () => {
    const o = new Option({ short: 'b', long: 'boolean' })
    expect(o.variables).toBeNull()
  })

  it('leaves variables null for null variables', () => {
    const o = new Option({ variables: null })
    expect(o.variables).toBeNull()
  })
})

describe('Option.description()', () => {
  it('sets info and returns this for chaining', () => {
    const o = new Option()
    const result = o.description('A useful flag')
    expect(o.info).toBe('A useful flag')
    expect(result).toBe(o)
  })

  it('overwrites existing info', () => {
    const o = new Option({ info: 'old' })
    o.description('new')
    expect(o.info).toBe('new')
  })
})
