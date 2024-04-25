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
    const requiredComments = core.getInput('keywords').split(',')

    const octokit = github.getOctokit(
      core.getInput('token') || process.env.GITHUB_TOKEN
    )

    const { data: comments } = await octokit.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
    });

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
      const contains = requiredComments.some(requiredComment =>
        commentBody.includes(requiredComment)
      )

      return (isApprovedByAuthor || isApprovedByTeam) && contains
    })

    core.debug(`authors: ${requiredAuthors}`)
    core.debug(`authors (team members): ${flattenedTeamMembers}`)
    core.debug(`keywords: ${requiredComments}`)

    core.setOutput('found', hasRequiredComment)
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
