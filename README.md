# Comment Finder

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

This GitHub Action checks if a specific user or team member has commented on the
current PR with given keywords.

The action can be useful in various scenarios, such as:

- Enforcing code review policies by requiring specific users or team members to
  approve changes before merging.
- Automating deployment processes by ensuring that the necessary approvals have
  been obtained.
- Implementing custom workflows based on comment patterns or specific user
  interactions.

## Usage

```yaml
name: Comment Finder
on:
  pull_request:
    types: [opened, synchronize, reopened, closed]
    paths-ignore:
      - '**.md'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check for comments
        uses: awcodify/comment-finder@v1
        with:
          authors: 'username1,username2'
          keywords: 'approve,yes,LGTM'
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

- **authors**: GitHub usernames or team slugs separated by commas. This will be
  used to filter comments by the author. If the author is a team, use the format
  `team/{{team-name}}`.
- **keywords**: Comment keywords to search for (comma-separated). For instance:
  `approve,yes,LGTM`.
- **token**: GitHub token.
- **fail_on_mismatch**: Fail the action if the given keywords are not found in
  the comments

## Outputs

- **matching_authors**: This will show authors which commented using given
  keyword in the PR.
