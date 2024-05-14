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
    const failOnMissmatch = core.getBooleanInput('fail_on_mismatch')
    const includeReviewComments = core.getBooleanInput(
      'include_review_comments'
    )

    const octokit = github.getOctokit(core.getInput('token'))

    const { data: issueComments } = await octokit.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number || 726
    })

    const { data: reviews } = includeReviewComments
      ? await octokit.rest.pulls.listReviews({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: github.context.issue.number || 726
        })
      : { data: [] }

    const comments = [...issueComments, ...reviews]

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
    core.debug(`fail_on_mismatch: ${failOnMissmatch}`)

    core.setOutput('matching_authors', matchingAuthors)

    if (!keywordFoundInSomeComment) {
      const notFoundLog = 'No comment with the required keywords found.'
      if (failOnMissmatch) {
        core.setFailed(notFoundLog)
      } else {
        core.warning(notFoundLog)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
