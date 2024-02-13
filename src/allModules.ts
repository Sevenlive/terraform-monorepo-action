import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { getReasonPhrase } from 'http-status-codes'
import { getModulePaths, getSha } from './utils'



function filterNonIgnoredFolders(  data: {
    path?: string | undefined
    mode?: string | undefined
    type?: string | undefined
    sha?: string | undefined
    size?: number | undefined
    url?: string | undefined
  }[],
):   {
    path?: string | undefined
    mode?: string | undefined
    type?: string | undefined
    sha?: string | undefined
    size?: number | undefined
    url?: string | undefined
}[] {
    // Extract unique folder names without unnecessary loops
    // @ts-ignore
    const uniqueFolders = Array.from(
        // @ts-ignore
        new Set(data.map(item => item.path.split("/")[0]))
    );

    // Filter paths belonging to valid folders
    return data.filter(item => {
        // @ts-ignore
        const folderName = item.path.split("/")[0];
        // @ts-ignore
        // @ts-ignore
        return (
            !uniqueFolders.includes(folderName) ||
            !data.some(innerItem =>
                    // @ts-ignore
                innerItem.path.startsWith(folderName + "/") &&
                // @ts-ignore
                innerItem.path.endsWith("/ignore.path")
            )
        );
    });
}

export async function getAllModules(
  token: string,
  monitored: Array<string>,
): Promise<string[]> {
  const octokit = getOctokit(token)

  const { head } = await getSha(token)

  const response = await octokit.rest.git.getTree({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tree_sha: head,
    recursive: 'true',
  })

  core.debug(`response: ${JSON.stringify(response.data.tree)}`)

  const filteredArray = filterNonIgnoredFolders(response.data.tree)

  core.debug(`Arrays: ${JSON.stringify(filteredArray)}`)

    if (response.status !== 200) {
    throw new Error(getReasonPhrase(response.status))
  }

  return getModulePaths(filteredArray, 'path', monitored)
}
