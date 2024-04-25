const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const authors = core.getInput('authors')
    const requiredAuthors = authors.split(',').map(author => author.trim())

    const requiredComments = core.getInput('keywords')
    const octokit = github.getOctokit(
      core.getInput('token') || process.env.GITHUB_TOKEN
    )

    const { data: comments } = await octokit.rest.pulls.getReviewComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number
    })

    const teamMembers = await Promise.all(
      requiredAuthors
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

    const flattenedTeamMembers = teamMembers.flat()
    const hasRequiredComment = comments.some(comment => {
      const author = comment.user.login
      const commentBody = comment.body
      return (
        (requiredAuthors.includes(author) ||
          flattenedTeamMembers.includes(author)) &&
        commentBody.includes(requiredComments)
      )
    })

    core.setOutput('found', hasRequiredComment)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
