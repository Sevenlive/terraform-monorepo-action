import { context, getOctokit } from '@actions/github'
import { getReasonPhrase } from 'http-status-codes'
import { getAllModules } from './allModules'
import { getModulePaths, getSha } from './utils'
import * as core from '@actions/core'


export async function getChangedModules(
  token: string,
  monitored: Array<string>,
): Promise<string[]> {
  const octokit = getOctokit(token)

  const { base, head } = await getSha(token)

  const response = await octokit.rest.repos.compareCommits({
    base,
    head,
    owner: context.repo.owner,
    repo: context.repo.repo,
  })

  if (response.status !== 200) {
    throw new Error(getReasonPhrase(response.status))
  }

  if (response.data.status === 'behind') {
    throw new Error(`HEAD ${response.data.status}`)
  }

  const changedModules = getModulePaths(
    response.data.files,
    'filename',
    monitored,
  )
  const allModules = await getAllModules(token, monitored)


  core.debug(`allModules: ${allModules}`)

  // filter to exclude deleted modules
  return changedModules.filter((module) => allModules.includes(module))
}
