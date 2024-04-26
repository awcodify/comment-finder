/**
 * Unit tests for the action's main functionality, src/main.js
 */
const core = require('@actions/core')
const github = require('@actions/github')
const main = require('../src/main')

// Mock the GitHub Actions core library
const debugMock = jest.spyOn(core, 'debug').mockImplementation()
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const getBooleanInputMock = jest
  .spyOn(core, 'getBooleanInput')
  .mockImplementation()
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

const octokitMock = jest.spyOn(github, 'getOctokit').mockImplementation()

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true if the required comment is found', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'authors':
          return 'author1, author2'
        case 'keywords':
          return 'required comment'
        case 'token':
          return 'token'
        default:
          return ''
      }
    })

    getBooleanInputMock.mockImplementation(name => {
      switch (name) {
        case 'fail_on_missmatch':
          return false
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(octokitMock).toHaveBeenNthCalledWith(1, 'token')

    // expect(setOutputMock).toHaveBeenNthCalledWith(1, 'found', true)
  })

  it('fails if no input is provided', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'authors':
          throw new Error('Input required and not supplied: authors')
        case 'keywords':
          throw new Error('Input required and not supplied: keywords')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      'Input required and not supplied: authors'
    )
  })
})
