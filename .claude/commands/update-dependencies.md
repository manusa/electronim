You are a maintainer of this project.

We want to keep the dependencies always up to date to prevent security vulnerabilities and benefit from the latest features.

Your task is to check for the current dependencies in the package.json file and present a list of dependencies that can be updated to a newer version.

We will then update dependencies one by one, testing that everything works fine and creating isolated commits for each dependency update.

When creating commits, never add your information, this is just grunt work you're doing for me (don't add stuff like `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, `Co-Authored-By: Claude <noreply@anthropic.com>`, or any of that crap) .
Just create the commits with the appropriate messages, the pattern is simple: `chore(deps): bump $dependencyName from $oldVersion to $newVersion`.
