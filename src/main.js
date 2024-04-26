const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const authors = core
      .getInput('authors')
      .split(',')
      .map(author => author.trim())
    const keywords = core.getInput('keywords').split(',')

    const octokit = github.getOctokit(
      core.getInput('token') || process.env.GITHUB_TOKEN
    )

    const { data: comments } = await octokit.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number
    })

    const teamMembers = await Promise.all(
      authors
        .filter(author => author.includes('/'))
        .map(async teamSlug => {
          const [, slug] = teamSlug.split('/')
          const { data: team } = await octokit.rest.teams.listMembersInOrg({
            org: github.context.repo.owner,
            team_slug: slug
          })
          return team.map(member => member.login)
        })
    )

    const matchingAuthors = []
    const flattenedTeamMembers = teamMembers.flat()
    const keywordFoundInSomeComment = comments.some(comment => {
      const commentAuthor = comment.user.login
      const commentBody = comment.body
      const containsKeywords = keywords.some(keyword =>
        commentBody.includes(keyword)
      )
      const isAuthorMatch =
        authors.includes(commentAuthor) ||
        flattenedTeamMembers.includes(commentAuthor)

      if (isAuthorMatch && containsKeywords) {
        matchingAuthors.push(commentAuthor)
      }
      return isAuthorMatch && containsKeywords
    })

    core.debug(`authors: ${authors}`)
    core.debug(`authors (team members): ${flattenedTeamMembers}`)
    core.debug(`keywords: ${keywords}`)

    if (keywordFoundInSomeComment) {
      core.setOutput('mathing_author', matchingAuthors)
    } else {
      core.setFailed(
        `One of the required authors or team members must comment with the required keywords.`
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
